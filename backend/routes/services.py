# backend/routes/services.py
"""
Service Marketplace Routes
Handle all service-related operations
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Optional
from datetime import datetime, timezone
from database import get_db
from utils.auth_utils import get_current_user
from models import User
from models_dual_marketplace import (
    Service, ServiceCreate, ServiceUpdate,
    ServiceBooking, BookingCreate
)
import uuid

router = APIRouter(prefix="/services", tags=["Services"])


# ============ SERVICE ROUTES ============

@router.post("/add", response_model=Service)
async def add_service(
    service_data: ServiceCreate,
    current_user: User = Depends(get_current_user)
):
    """Add a new service (seller only)"""
    try:
        db = get_db()
        
        if current_user.role != "seller":
            raise HTTPException(status_code=403, detail="Only sellers can add services")
        
        # Validate service data
        if not service_data.title or not service_data.title.strip():
            raise HTTPException(status_code=400, detail="Service title is required")
        
        if not service_data.description or not service_data.description.strip():
            raise HTTPException(status_code=400, detail="Service description is required")
        
        if service_data.price <= 0:
            raise HTTPException(status_code=400, detail="Price must be greater than 0")
        
        if service_data.delivery_days < 1:
            raise HTTPException(status_code=400, detail="Delivery days must be at least 1")
        
        if not service_data.skills or len(service_data.skills) == 0:
            raise HTTPException(status_code=400, detail="At least one skill is required")
        
        service = Service(
            seller_id=current_user.id,
            seller_name=current_user.name,
            **service_data.model_dump()
        )
        
        service_dict = service.model_dump()
        service_dict['timestamp'] = service_dict.pop('created_at').isoformat()
        
        # Insert service
        result = await db.services.insert_one(service_dict)
        
        # Fetch created service
        created = await db.services.find_one({"_id": result.inserted_id}, {"_id": 0})
        if created:
            if isinstance(created.get('timestamp'), str):
                created['created_at'] = datetime.fromisoformat(created.pop('timestamp'))
            if 'id' not in created:
                created['id'] = str(result.inserted_id)
        
        return Service(**created) if created else service
        
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error adding service: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error adding service: {str(e)}")


@router.get("", response_model=List[Service])
async def get_services(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skills: Optional[str] = Query(None),  # Comma-separated
    experience_level: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    max_delivery_days: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=100)
):
    """Get all services with filters (public)"""
    db = get_db()
    
    query = {}
    
    if category:
        query['category'] = category
    
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]
    
    if skills:
        skill_list = [s.strip() for s in skills.split(",")]
        query['skills'] = {'$in': skill_list}
    
    if experience_level:
        query['experience_level'] = experience_level
    
    if min_price is not None or max_price is not None:
        query['price'] = {}
        if min_price is not None:
            query['price']['$gte'] = min_price
        if max_price is not None:
            query['price']['$lte'] = max_price
    
    if max_delivery_days:
        query['delivery_days'] = {'$lte': max_delivery_days}
    
    services = await db.services.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    result = []
    for s in services:
        # Handle both timestamp and created_at formats
        if isinstance(s.get('timestamp'), str):
            s['created_at'] = datetime.fromisoformat(s.pop('timestamp'))
        elif 'created_at' not in s and '_id' in s:
            # Fallback for documents without timestamp
            s['created_at'] = datetime.now(timezone.utc)
        
        # Ensure id field exists
        if 'id' not in s:
            if '_id' in s:
                s['id'] = str(s['_id'])
            else:
                s['id'] = str(uuid.uuid4())
        
        try:
            result.append(Service(**s))
        except Exception as e:
            # Skip invalid services and log error
            import logging
            logging.error(f"Error parsing service {s.get('id', 'unknown')}: {e}")
            continue
    
    return result


@router.get("/{service_id}", response_model=Service)
async def get_service(service_id: str):
    """Get a single service by ID (public)"""
    db = get_db()
    
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if isinstance(service.get('timestamp'), str):
        service['created_at'] = datetime.fromisoformat(service.pop('timestamp'))
    
    return Service(**service)


@router.put("/{service_id}", response_model=Service)
async def update_service(
    service_id: str,
    service_data: ServiceUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a service (seller only, own services)"""
    db = get_db()
    
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can update services")
    
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if service['seller_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this service")
    
    update_data = {k: v for k, v in service_data.model_dump().items() if v is not None}
    await db.services.update_one({"id": service_id}, {"$set": update_data})
    
    updated = await db.services.find_one({"id": service_id}, {"_id": 0})
    if isinstance(updated.get('timestamp'), str):
        updated['created_at'] = datetime.fromisoformat(updated.pop('timestamp'))
    
    return Service(**updated)


@router.delete("/{service_id}")
async def delete_service(
    service_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a service (seller only, own services)"""
    db = get_db()
    
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can delete services")
    
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if service['seller_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.services.delete_one({"id": service_id})
    return {"message": "Service deleted successfully"}


# ============ BOOKING ROUTES ============

@router.post("/bookings/create")
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a booking for a service (buyer only)"""
    db = get_db()
    
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can create bookings")
    
    # Get service details
    service = await db.services.find_one({"id": booking_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Create booking
    booking = ServiceBooking(
        buyer_id=current_user.id,
        buyer_name=current_user.name,
        seller_id=service['seller_id'],
        seller_name=service['seller_name'],
        service_id=booking_data.service_id,
        service_title=service['title']
    )
    
    booking_dict = booking.model_dump()
    booking_dict['timestamp'] = booking_dict.pop('booked_at').isoformat()
    
    await db.bookings.insert_one(booking_dict)
    
    return {
        "message": "Booking created successfully",
        "booking_id": booking.id,
        "booking": booking_dict
    }


@router.get("/bookings/my-bookings")
async def get_my_bookings(current_user: User = Depends(get_current_user)):
    """Get user's bookings (buyer sees bookings, seller sees orders)"""
    db = get_db()
    
    if current_user.role == "buyer":
        query = {"buyer_id": current_user.id}
    else:
        query = {"seller_id": current_user.id}
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("timestamp", -1).to_list(100)
    
    # Enrich with service details
    result = []
    for booking in bookings:
        service = await db.services.find_one({"id": booking['service_id']}, {"_id": 0})
        if service:
            if isinstance(service.get('timestamp'), str):
                service['created_at'] = datetime.fromisoformat(service.pop('timestamp'))
        
        booking_data = {
            **booking,
            "service": Service(**service).model_dump() if service else None
        }
        
        if isinstance(booking_data.get('timestamp'), str):
            booking_data['booked_at'] = datetime.fromisoformat(booking_data.pop('timestamp'))
        
        result.append(booking_data)
    
    return {"bookings": result, "total": len(result)}


@router.put("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status: str = Query(None),
    current_user: User = Depends(get_current_user),
    body: dict = Body(None)
):
    """Update booking status (seller can mark in-progress, completed)"""
    # Accept status from query param or body
    if body and body.get("status"):
        status = body.get("status")
    
    if not status:
        raise HTTPException(status_code=400, detail="status parameter is required")
    db = get_db()
    
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can update booking status")
    
    valid_statuses = ["pending", "in-progress", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['seller_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")
    
    update_data = {"status": status}
    if status == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.bookings.update_one({"id": booking_id}, {"$set": update_data})
    
    # Update service completed_count if completed
    if status == "completed":
        await db.services.update_one(
            {"id": booking['service_id']},
            {"$inc": {"completed_count": 1}}
        )
    
    return {"message": f"Booking status updated to {status}"}

