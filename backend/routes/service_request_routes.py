# backend/routes/service_request_routes.py - COMPLETE & FIXED
"""
Service Request Routes - Freelance/Project Board Feature
Allows buyers to post service requests and sellers to submit proposals
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from database import get_db
from utils.auth_utils import get_current_user
from models import User, ServiceRequest, ServiceRequestCreate, Proposal, FreelancerProfile
from models_dual_marketplace import ServiceRequestBooking, ServiceRequestBookingCreate
from services.notification_service import create_notification
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/service-requests", tags=["Service Requests"])


# ============ HELPER FUNCTIONS ============

async def calculate_match_score(db, freelancer_id: str, request_id: str) -> int:
    """Calculate AI match score between freelancer and service request"""
    
    # Get freelancer profile
    profile = await db.freelancer_profiles.find_one(
        {"user_id": freelancer_id},
        {"_id": 0}
    )
    
    # Get service request
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not profile or not request:
        return 0
    
    score = 0
    
    # 1. Skills Match (40 points)
    freelancer_skills = set(profile.get('skills', []))
    required_skills = set(request.get('skills_required', []))
    
    if required_skills:
        skill_match = len(freelancer_skills & required_skills) / len(required_skills)
        score += int(skill_match * 40)
    
    # 2. Experience Level Match (20 points)
    exp_mapping = {"beginner": 0, "intermediate": 1, "expert": 2}
    req_exp = exp_mapping.get(request.get('experience_level', 'intermediate'), 1)
    profile_exp = profile.get('experience_years', 0)
    
    if profile_exp >= req_exp * 2:
        score += 20
    elif profile_exp >= req_exp:
        score += 10
    
    # 3. Budget Compatibility (15 points)
    hourly_rate = profile.get('hourly_rate')
    budget = request.get('budget')
    
    if hourly_rate and budget:
        estimated_hours = budget / hourly_rate if hourly_rate > 0 else 0
        if 10 <= estimated_hours <= 100:  # Reasonable project size
            score += 15
        elif estimated_hours > 5:
            score += 8
    
    # 4. Success Rate (15 points)
    success_rate = profile.get('success_rate', 0)
    if success_rate >= 90:
        score += 15
    elif success_rate >= 70:
        score += 10
    elif success_rate >= 50:
        score += 5
    
    # 5. Category Match (10 points)
    if profile.get('categories'):
        if request.get('category') in profile.get('categories', []):
            score += 10
    
    return min(score, 100)


async def notify_matched_freelancers(db, request_id: str):
    """Notify freelancers with high match scores about new service request"""
    
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request:
        return
    
    # Get all freelancers
    freelancers = await db.users.find(
        {"role": "seller"},
        {"_id": 0}
    ).to_list(1000)
    
    # Calculate match scores and notify top matches
    for freelancer in freelancers:
        match_score = await calculate_match_score(db, freelancer['id'], request_id)
        
        # Notify if match score is high (>60%)
        if match_score >= 60:
            try:
                await create_notification(
                    user_id=freelancer['id'],
                    notification_type="new_opportunity",
                    title=f"New Project Match ({match_score}% fit) 🎯",
                    message=f"A new project matches your skills: {request['title']}",
                    link=f"/service-requests/{request_id}",
                    data={
                        "request_id": request_id,
                        "match_score": match_score
                    }
                )
            except Exception as e:
                print(f"Failed to notify freelancer {freelancer['id']}: {e}")


# ============ SERVICE REQUEST ROUTES ============

@router.post("", response_model=dict)
async def create_service_request(
    request_data: ServiceRequestCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new service request (buyers post work)"""
    logger.info(f"Creating service request for user {current_user.id} ({current_user.role})")
    logger.info(f"Request data: {request_data.model_dump()}")
    
    db = get_db()
    
    if current_user.role != "buyer":
        logger.warning(f"User {current_user.id} with role {current_user.role} attempted to create service request")
        raise HTTPException(status_code=403, detail="Only buyers can post service requests")
    
    # Parse deadline
    try:
        if request_data.deadline:
            deadline_dt = datetime.fromisoformat(request_data.deadline.replace('Z', '+00:00'))
        else:
            # Default to 30 days from now
            deadline_dt = datetime.now(timezone.utc) + timedelta(days=30)
    except (ValueError, AttributeError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid deadline format: {str(e)}")
    
    # Validate budget
    if request_data.budget <= 0:
        raise HTTPException(status_code=400, detail="Budget must be greater than 0")
    
    request = {
        "id": str(uuid.uuid4()),
        "client_id": current_user.id,
        "client_name": current_user.name,
        "title": request_data.title.strip(),
        "description": request_data.description.strip(),
        "category": request_data.category,
        "budget": float(request_data.budget),
        "deadline": deadline_dt.isoformat(),
        "skills_required": request_data.skills_required or [],
        "experience_level": request_data.experience_level or "intermediate",
        "status": "open",  # Always start as "open" so sellers can see it
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    logger.info(f"Creating service request with status: {request['status']}, id: {request['id']}")
    
    result = await db.service_requests.insert_one(request)
    
    # Convert MongoDB _id to string for JSON serialization
    request["_id"] = str(result.inserted_id)
    
    # Trigger AI matching for relevant freelancers
    try:
        await notify_matched_freelancers(db, request["id"])
    except Exception as e:
        logger.error(f"Failed to notify freelancers: {e}")
    
    # Return response without MongoDB ObjectId
    response_data = {
        "message": "Service request created successfully",
        "request_id": request["id"],
        "request": {k: v for k, v in request.items() if k != "_id"}
    }
    
    return response_data


@router.get("")
async def get_service_requests(
    category: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    experience_level: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Browse all service requests (for freelancers) or own requests (for buyers)"""
    db = get_db()
    
    query = {}
    
    # Buyers see only their own requests
    if current_user.role == "buyer":
        query["client_id"] = current_user.id
    else:
        # Sellers see open requests
        # NOTE: We keep requests as "open" even after booking so all sellers can see them
        # Also include requests without status field (default to "open")
        query["$or"] = [
            {"status": "open"},
            {"status": {"$exists": False}}  # Include requests without status field
        ]
    
    # Apply filters - need to handle $or properly
    base_filters = {}
    if category:
        base_filters["category"] = category
    if min_budget:
        base_filters["budget"] = {"$gte": min_budget}
    if max_budget:
        if "budget" in base_filters:
            base_filters["budget"]["$lte"] = max_budget
        else:
            base_filters["budget"] = {"$lte": max_budget}
    if experience_level:
        base_filters["experience_level"] = experience_level
    if status and current_user.role == "buyer":
        base_filters["status"] = status
    
    # Combine base filters with status query using $and
    if base_filters and "$or" in query:
        query = {"$and": [query, base_filters]}
    elif base_filters:
        query.update(base_filters)
    
    logger.info(f"Fetching service requests for {current_user.role} (user: {current_user.id})")
    logger.info(f"Query: {query}")
    
    # Debug: Check total requests and their statuses
    total_reqs = await db.service_requests.count_documents({})
    open_reqs = await db.service_requests.count_documents({"status": "open"})
    all_statuses = await db.service_requests.find({}, {"status": 1, "_id": 0}).to_list(1000)
    status_counts = {}
    for req in all_statuses:
        status = req.get("status", "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    logger.info(f"DEBUG: Total requests in DB: {total_reqs}, Open requests: {open_reqs}")
    logger.info(f"DEBUG: Status breakdown: {status_counts}")
    
    requests = await db.service_requests.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    logger.info(f"Found {len(requests)} service requests matching query")
    
    # Log sample of found requests for debugging
    if len(requests) > 0:
        logger.info(f"Sample request IDs: {[req.get('id', req.get('_id', 'N/A'))[:8] if isinstance(req.get('id', req.get('_id', 'N/A')), str) else 'N/A' for req in requests[:3]]}")
        logger.info(f"Sample request statuses: {[req.get('status', 'N/A') for req in requests[:3]]}")
    else:
        # Check if any requests exist at all
        total_count = await db.service_requests.count_documents({})
        open_count = await db.service_requests.count_documents({"status": "open"})
        logger.warning(f"⚠️ No matching requests found. Total requests in DB: {total_count}, Open requests: {open_count}")
        logger.warning(f"⚠️ User role: {current_user.role}, Query filter: {query}")
    
    # Add additional data for each request
    result = []
    for req in requests:
        # Ensure id field exists (use _id if id doesn't exist for backward compatibility)
        if "id" not in req and "_id" in req:
            req["id"] = str(req["_id"])
        
        # Count proposals
        proposal_count = await db.proposals.count_documents({
            "service_request_id": req.get("id") or req.get("_id")
        })
        
        req_dict = {
            **req,
            "proposal_count": proposal_count,
            "proposals_count": proposal_count  # Also add for backward compatibility
        }
        
        # Add AI match score for sellers
        if current_user.role == "seller":
            match_score = await calculate_match_score(db, current_user.id, req.get("id") or req.get("_id"))
            req_dict["ai_match_score"] = match_score
        
        result.append(req_dict)
    
    # Sort by match score if seller
    if current_user.role == "seller":
        result.sort(key=lambda x: x.get("ai_match_score", 0), reverse=True)
    
    return {"requests": result, "total": len(result)}


@router.get("/{request_id}")
async def get_service_request_details(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a service request"""
    db = get_db()
    
    # Try to find by id first, then _id for backward compatibility
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request:
        # Try MongoDB ObjectId if id doesn't work
        from bson import ObjectId
        try:
            request = await db.service_requests.find_one(
                {"_id": ObjectId(request_id)},
                {"_id": 0}
            )
            if request and "id" not in request:
                request["id"] = request_id  # Use the provided ID
        except:
            pass
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Ensure id field exists
    if "id" not in request:
        request["id"] = str(request.get("_id", request_id))
    
    # Count proposals - try multiple ID formats
    request_id_for_count = request.get("id") or request_id
    proposal_count = await db.proposals.count_documents({
        "$or": [
            {"service_request_id": request_id_for_count},
            {"service_request_id": request_id},
            {"service_request_id": str(request.get("_id", ""))}
        ]
    })
    
    request["proposal_count"] = proposal_count
    request["proposals_count"] = proposal_count  # Also add for backward compatibility
    
    # Add match score for sellers
    if current_user.role == "seller":
        match_score = await calculate_match_score(db, current_user.id, request_id)
        request["ai_match_score"] = match_score
        
        # Check if already applied
        existing_proposal = await db.proposals.find_one({
            "service_request_id": request_id,
            "freelancer_id": current_user.id
        }, {"_id": 0})
        
        request["has_applied"] = existing_proposal is not None
        if existing_proposal:
            request["my_proposal"] = existing_proposal
    
    return {"request": request}


@router.post("/{request_id}/proposals")
async def submit_proposal(
    request_id: str,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Submit a proposal for a service request (freelancers apply)"""
    # Extract from JSON body with fallback field names
    cover_letter = body.get("cover_letter", "")
    proposed_price = body.get("proposed_price") or body.get("proposed_budget")
    delivery_time_days = body.get("delivery_time_days") or body.get("delivery_time")
    
    if not cover_letter or proposed_price is None or delivery_time_days is None:
        raise HTTPException(status_code=400, detail="cover_letter, proposed_price, and delivery_time_days are required")
    db = get_db()
    
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can submit proposals")
    
    # Get service request - try by id first, then by _id for backward compatibility
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request:
        # Try MongoDB ObjectId if id doesn't work
        from bson import ObjectId
        try:
            request = await db.service_requests.find_one(
                {"_id": ObjectId(request_id)},
                {"_id": 0}
            )
            if request and "id" not in request:
                request["id"] = request_id
        except:
            pass
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Ensure id field exists
    if "id" not in request:
        request["id"] = str(request.get("_id", request_id))
    
    if request["status"] != "open":
        raise HTTPException(status_code=400, detail="This service request is no longer accepting proposals")
    
    # Check if already applied
    existing = await db.proposals.find_one({
        "service_request_id": request_id,
        "freelancer_id": current_user.id
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted a proposal for this request")
    
    # Calculate AI match score
    match_score = await calculate_match_score(db, current_user.id, request_id)
    
    # Use the request's actual ID for consistency
    request_actual_id = request.get("id") or request_id
    
    proposal = {
        "id": str(uuid.uuid4()),
        "service_request_id": request_actual_id,  # Use the actual request ID
        "freelancer_id": current_user.id,
        "freelancer_name": current_user.name,
        "cover_letter": cover_letter,
        "proposed_price": proposed_price,
        "delivery_time_days": delivery_time_days,
        "ai_match_score": match_score,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    logger.info(f"Submitting proposal for request_id: {request_id}, using service_request_id: {request_actual_id}")
    
    await db.proposals.insert_one(proposal)
    
    # Notify client
    try:
        await create_notification(
            user_id=request["client_id"],
            notification_type="new_proposal",
            title="New Proposal Received 📬",
            message=f"{current_user.name} submitted a proposal for '{request['title']}'",
            link=f"/service-requests/{request_id}/proposals",
            data={
                "request_id": request_id,
                "proposal_id": proposal["id"],
                "freelancer_id": current_user.id
            }
        )
    except Exception as e:
        print(f"Failed to notify client: {e}")
    
    return {
        "message": "Proposal submitted successfully",
        "proposal_id": proposal["id"],
        "proposal": proposal
    }


@router.get("/{request_id}/proposals")
async def get_proposals(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all proposals for a service request (client view)"""
    db = get_db()
    
    # Get service request - try by id first, then by _id
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request:
        # Try MongoDB ObjectId if id doesn't work
        from bson import ObjectId
        try:
            request = await db.service_requests.find_one(
                {"_id": ObjectId(request_id)},
                {"_id": 0}
            )
            if request and "id" not in request:
                request["id"] = request_id
        except:
            pass
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Ensure id field exists
    if "id" not in request:
        request["id"] = str(request.get("_id", request_id))
    
    # Only the client can view proposals
    if request["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the request creator can view proposals")
    
    # Get all proposals - try both with the request id and request_id format
    request_id_to_search = request.get("id") or request_id
    
    logger.info(f"Fetching proposals for request_id: {request_id}, request.id: {request.get('id')}")
    
    # Try multiple ID formats to find proposals
    proposals = await db.proposals.find(
        {"$or": [
            {"service_request_id": request_id_to_search},
            {"service_request_id": request_id},
            {"service_request_id": str(request.get("_id", ""))}
        ]},
        {"_id": 0}
    ).sort("ai_match_score", -1).to_list(100)
    
    logger.info(f"Found {len(proposals)} proposals for request {request_id}")
    
    # Enrich with freelancer data
    result = []
    for proposal in proposals:
        # Get freelancer info
        freelancer = await db.users.find_one(
            {"id": proposal["freelancer_id"]},
            {"_id": 0, "password": 0}
        )
        
        if not freelancer:
            continue
        
        # Get freelancer profile
        profile = await db.freelancer_profiles.find_one(
            {"user_id": proposal["freelancer_id"]},
            {"_id": 0}
        )
        
        proposal_data = {
            **proposal,
            "freelancer_name": freelancer.get("name", "Unknown"),
            "freelancer_email": freelancer.get("email"),
            "freelancer_title": profile.get("title") if profile else "Freelancer",
            "freelancer_rating": freelancer.get("rating", 0),
            "completed_projects": profile.get("completed_projects", 0) if profile else 0,
            "success_rate": profile.get("success_rate", 0) if profile else 0,
            "hourly_rate": profile.get("hourly_rate") if profile else None,
            "skills": profile.get("skills", []) if profile else []
        }
        
        result.append(proposal_data)
    
    return {
        "proposals": result,
        "total": len(result),
        "request": request
    }


@router.post("/{request_id}/proposals/{proposal_id}/accept")
async def accept_proposal(
    request_id: str,
    proposal_id: str,
    current_user: User = Depends(get_current_user)
):
    """Accept a proposal and start work"""
    db = get_db()
    
    # Get service request
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request or request["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Get proposal
    proposal = await db.proposals.find_one(
        {"id": proposal_id},
        {"_id": 0}
    )
    
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    # Update proposal status
    await db.proposals.update_one(
        {"id": proposal_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Update request status
    await db.service_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "in_progress", "accepted_proposal_id": proposal_id}}
    )
    
    # Reject other proposals
    await db.proposals.update_many(
        {
            "service_request_id": request_id,
            "id": {"$ne": proposal_id}
        },
        {"$set": {"status": "rejected"}}
    )
    
    # Notify accepted freelancer
    try:
        await create_notification(
            user_id=proposal["freelancer_id"],
            notification_type="proposal_accepted",
            title="Proposal Accepted! 🎉",
            message=f"Your proposal for '{request['title']}' has been accepted!",
            link="/seller-dashboard",
            data={
                "request_id": request_id,
                "proposal_id": proposal_id
            }
        )
    except Exception as e:
        print(f"Failed to notify freelancer: {e}")
    
    return {
        "message": "Proposal accepted successfully",
        "request": request
    }


@router.post("/{request_id}/complete")
async def complete_service_request(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark service request as completed"""
    db = get_db()
    
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Only client can mark as completed
    if request["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    await db.service_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify freelancer if there's an accepted proposal
    if request.get("accepted_proposal_id"):
        proposal = await db.proposals.find_one(
            {"id": request["accepted_proposal_id"]},
            {"_id": 0}
        )
        
        if proposal:
            try:
                await create_notification(
                    user_id=proposal["freelancer_id"],
                    notification_type="project_completed",
                    title="Project Completed ✅",
                    message=f"'{request['title']}' has been marked as completed",
                    link="/seller-dashboard",
                    data={"request_id": request_id}
                )
            except Exception as e:
                print(f"Failed to notify freelancer: {e}")
    
    return {"message": "Service request marked as completed"}


@router.delete("/{request_id}")
async def delete_service_request(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a service request (only if no accepted proposals)"""
    db = get_db()
    
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if request["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Allow deletion regardless of status - user owns the request
    actual_request_id = request.get("id") or request_id
    
    # Delete the request - try by id first, then _id
    delete_result = await db.service_requests.delete_one({"id": actual_request_id})
    
    if delete_result.deleted_count == 0:
        # Try with _id if id didn't work
        try:
            from bson import ObjectId
            await db.service_requests.delete_one({"_id": ObjectId(request_id)})
        except:
            pass
    
    # Delete all associated proposals - try multiple ID formats
    await db.proposals.delete_many({
        "$or": [
            {"service_request_id": actual_request_id},
            {"service_request_id": request_id}
        ]
    })
    
    logger.info(f"Service request {request_id} deleted by user {current_user.id}")
    
    return {"message": "Service request deleted successfully"}


# ============ SERVICE REQUEST BOOKING ROUTES ============

@router.post("/{request_id}/book")
async def book_service_request(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Book a service request (sellers/freelancers can book buyer's posted requests)"""
    db = get_db()
    
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can book service requests")
    
    # Get the service request
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Check if request is still open
    if request.get("status") != "open":
        raise HTTPException(
            status_code=400,
            detail=f"Service request is {request.get('status')} and cannot be booked"
        )
    
    # Check if seller already booked this request
    existing_booking = await db.service_request_bookings.find_one(
        {
            "request_id": request_id,
            "seller_id": current_user.id
        },
        {"_id": 0}
    )
    
    if existing_booking:
        raise HTTPException(
            status_code=400,
            detail="You have already booked this service request"
        )
    
    # Get buyer info
    buyer = await db.users.find_one(
        {"id": request.get("client_id")},
        {"_id": 0, "password": 0}
    )
    
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    
    # Parse deadline
    deadline_str = request.get("deadline")
    try:
        if isinstance(deadline_str, str):
            deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
        else:
            deadline = deadline_str
    except Exception:
        deadline = datetime.now(timezone.utc)
    
    # Create booking
    booking = ServiceRequestBooking(
        request_id=request_id,
        buyer_id=request.get("client_id"),
        buyer_name=buyer.get("name", "Unknown"),
        seller_id=current_user.id,
        seller_name=current_user.name,
        title=request.get("title", ""),
        description=request.get("description", ""),
        category=request.get("category", ""),
        budget=float(request.get("budget", 0)),
        deadline=deadline,
        status="pending"
    )
    
    booking_dict = booking.model_dump()
    booking_dict['timestamp'] = booking_dict.pop('booked_at').isoformat()
    if 'deadline' in booking_dict:
        booking_dict['deadline'] = booking_dict['deadline'].isoformat() if isinstance(booking_dict['deadline'], datetime) else booking_dict['deadline']
    
    await db.service_request_bookings.insert_one(booking_dict)
    
    # DON'T change status to in_progress when seller books - keep it "open" 
    # This allows other sellers to still see the request and potentially submit proposals
    # Status should only change to "in_progress" when buyer confirms/accepts the booking
    # Note: The booking is saved separately, so multiple sellers can book the same request
    logger.info(f"Booking created but keeping request {request_id} as 'open' so other sellers can see it")
    
    # Notify buyer
    try:
        await create_notification(
            user_id=request.get("client_id"),
            notification_type="service_request_booked",
            title="Service Request Booked",
            message=f"{current_user.name} has booked your service request: {request.get('title')}",
            link=f"/service-request/{request_id}"
        )
    except Exception as e:
        logger.warning(f"Failed to send notification: {e}")
    
    logger.info(f"✅ Service request {request_id} booked by seller {current_user.id}")
    
    return {
        "message": "Service request booked successfully",
        "booking_id": booking.id,
        "booking": booking
    }


@router.get("/bookings/my-bookings")
async def get_my_booked_requests(
    current_user: User = Depends(get_current_user)
):
    """Get all service requests booked by the current seller"""
    db = get_db()
    
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can view their bookings")
    
    bookings = await db.service_request_bookings.find(
        {"seller_id": current_user.id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    
    # Parse timestamps
    for booking in bookings:
        if isinstance(booking.get('timestamp'), str):
            booking['booked_at'] = datetime.fromisoformat(booking.pop('timestamp'))
        if isinstance(booking.get('deadline'), str):
            try:
                booking['deadline'] = datetime.fromisoformat(booking['deadline'])
            except:
                pass
    
    return {"bookings": bookings, "total": len(bookings)}


print("✅ Service Request routes loaded successfully!")