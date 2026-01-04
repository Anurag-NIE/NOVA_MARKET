# backend/routes/checkout.py
"""
Unified Checkout Routes
Handle Stripe checkout for both products and services
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from database import get_db
from utils.auth_utils import get_current_user
from models import User
from models_dual_marketplace import (
    CheckoutSessionRequest, CheckoutSessionResponse,
    ProductOrder, ServiceBooking
)
from config import settings
import stripe
from datetime import datetime, timezone
import logging
from typing import Dict, Any
import re

# Initialize Stripe
if settings.STRIPE_API_KEY:
    stripe.api_key = settings.STRIPE_API_KEY
else:
    logger = logging.getLogger(__name__)
    logger.warning("⚠️ STRIPE_API_KEY not set. Stripe features will not work.")

router = APIRouter(prefix="/checkout", tags=["Checkout"])
logger = logging.getLogger(__name__)

# Stripe exception compatibility (handles different stripe-python versions)
try:
    from stripe.error import StripeError as StripeErrorCompat  # stripe<5 style
except Exception:
    try:
        from stripe.errors import StripeError as StripeErrorCompat  # alternate location
    except Exception:
        class StripeErrorCompat(Exception):  # fallback to generic Exception
            pass


@router.post("/create-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    payload: CheckoutSessionRequest,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Create Stripe checkout session for products or services"""
    
    try:
        logger.info(f"🔵 ===== CHECKOUT SESSION REQUEST =====")
        logger.info(f"🔵 User: {current_user.id} ({current_user.role})")
        logger.info(f"🔵 Payload type: {type(payload)}")
        logger.info(f"🔵 Payload: {payload.model_dump() if hasattr(payload, 'model_dump') else str(payload)}")
        
        db = get_db()
        
        if current_user.role != "buyer":
            raise HTTPException(status_code=403, detail="Only buyers can checkout")
        
        if not payload.items or len(payload.items) == 0:
            logger.error("❌ No items provided in payload")
            raise HTTPException(status_code=400, detail="No items provided")
        
        logger.info(f"🔵 Creating checkout session for user {current_user.id}, type: {payload.type}, items: {len(payload.items)}")
        
        # Validate payload type
        if payload.type not in ["product", "service"]:
            logger.error(f"❌ Invalid type: {payload.type}")
            raise HTTPException(status_code=400, detail=f"Invalid type: {payload.type}. Must be 'product' or 'service'")
        
        # Get frontend URL from settings or construct from request
        frontend_url = getattr(settings, 'FRONTEND_URL', None) or str(request.base_url).replace(':8000', ':3000').replace('/api', '')
        if frontend_url.endswith('/'):
            frontend_url = frontend_url[:-1]
        success_url = f"{frontend_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{frontend_url}/cart" if payload.type == "product" else f"{frontend_url}/services"
        
        # Development fallback: if Stripe is not configured, short-circuit and return success URL
        if not settings.STRIPE_API_KEY:
            logger.warning("⚠️ STRIPE_API_KEY not configured - using development checkout fallback")
            try:
                # Best-effort: clear cart so UX matches a real checkout
                db = get_db()
                await db.cart.delete_many({"buyer_id": current_user.id})
            except Exception:
                pass
            dev_url = success_url.replace("{CHECKOUT_SESSION_ID}", "dev_mock")
            return CheckoutSessionResponse(session_id="dev_mock", url=dev_url)
        
        line_items = []
        metadata_items = []
        total_amount = 0
        
        if payload.type == "product":
            # Product checkout - from cart
            for item in payload.items:
                item_id = item.id if hasattr(item, 'id') else item.get('id') if isinstance(item, dict) else None
                item_quantity = item.quantity if hasattr(item, 'quantity') else item.get('quantity', 1) if isinstance(item, dict) else 1
                
                if not item_id:
                    raise HTTPException(status_code=400, detail="Invalid item: missing id")
                
                product = await db.products.find_one({"id": item_id}, {"_id": 0})
                if not product:
                    raise HTTPException(status_code=404, detail=f"Product {item_id} not found")
                
                if product.get('stock', 0) < item_quantity:
                    raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.get('title', 'product')}")
                
                # Robust price parsing: accept strings like "$900", "900.00", etc.
                raw_price = product.get('price', 0)
                if isinstance(raw_price, (int, float)):
                    product_price = float(raw_price)
                else:
                    try:
                        # keep digits and dots only
                        cleaned = re.sub(r"[^0-9.]", "", str(raw_price))
                        product_price = float(cleaned or 0)
                    except Exception:
                        product_price = 0.0
                if product_price <= 0:
                    raise HTTPException(status_code=400, detail=f"Invalid product price: ${product_price}")
                
                line_items.append({
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': product.get('title', 'Product'),
                            'description': (product.get('description', '')[:100] if len(product.get('description', '')) > 100 else product.get('description', '')) or 'Product',
                            'images': product.get('images', [])[:1] if product.get('images') else []
                        },
                        'unit_amount': int(product_price * 100),
                    },
                    'quantity': item_quantity,
                })
                
                metadata_items.append({
                    'product_id': item_id,
                    'quantity': item_quantity,
                    'price': product_price
                })
                
                total_amount += product_price * item_quantity
        
        else:  # service
            # Service checkout
            for item in payload.items:
                logger.info(f"🔵 Processing service item: {item}")
                item_id = item.id if hasattr(item, 'id') else item.get('id') if isinstance(item, dict) else None
                
                if not item_id:
                    logger.error(f"❌ Invalid item structure: {item}")
                    raise HTTPException(status_code=400, detail="Invalid item: missing id")
                
                logger.info(f"🔵 Looking for service with ID: {item_id}")
                
                # Try multiple ID formats
                service = None
                from bson import ObjectId
                
                # First try with 'id' field
                service = await db.services.find_one({"id": item_id}, {"_id": 0})
                
                # If not found, try with _id
                if not service:
                    try:
                        service = await db.services.find_one({"_id": ObjectId(item_id)}, {"_id": 0})
                        if service and 'id' not in service:
                            service['id'] = item_id
                    except Exception as e:
                        logger.warning(f"⚠️ Could not parse ObjectId: {e}")
                
                # If still not found, try as string match on _id field
                if not service:
                    all_services = await db.services.find({}, {"_id": 1, "id": 1, "title": 1}).to_list(100)
                    for s in all_services:
                        s_id = s.get('id') or str(s.get('_id', ''))
                        if s_id == item_id:
                            service = await db.services.find_one({"_id": s.get('_id')}, {"_id": 0})
                            if service and 'id' not in service:
                                service['id'] = item_id
                            break
                
                if not service:
                    logger.error(f"❌ Service {item_id} not found in database")
                    # Log all available service IDs for debugging
                    all_ids = await db.services.find({}, {"id": 1, "_id": 1, "title": 1}).to_list(10)
                    logger.error(f"Available services: {[(s.get('id') or str(s.get('_id', '')), s.get('title', 'Unknown')) for s in all_ids]}")
                    raise HTTPException(status_code=404, detail=f"Service {item_id} not found")
                
                # Ensure service has 'id' field
                if 'id' not in service:
                    service['id'] = item_id
                
                logger.info(f"✅ Found service: {service.get('title', 'Unknown')}, price: {service.get('price')}, id: {service.get('id')}")
                
                # Extract booking data if provided (from CheckoutItem model)
                booking_data = item.booking_data if hasattr(item, 'booking_data') and item.booking_data else {}
                if booking_data and not isinstance(booking_data, dict):
                    booking_data = {}
                
                # Robust price parsing: accept numeric or string with symbols
                raw_price = service.get('price', 0)
                if isinstance(raw_price, (int, float)):
                    service_price = float(raw_price)
                else:
                    try:
                        # Remove currency symbols and keep only digits/dots
                        cleaned = re.sub(r"[^0-9.]", "", str(raw_price))
                        service_price = float(cleaned or 0)
                    except Exception:
                        service_price = 0.0
                
                if service_price <= 0:
                    raise HTTPException(status_code=400, detail=f"Invalid service price: ${service_price}")
                
                line_items.append({
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': service.get('title', 'Service'),
                            'description': f"Service: {(service.get('description', '')[:100] if len(service.get('description', '')) > 100 else service.get('description', '')) or 'Service'}"
                        },
                        'unit_amount': int(service_price * 100),
                    },
                    'quantity': 1,
                })
                
                service_metadata = {
                    'service_id': item_id,
                    'price': service_price
                }
                
                # Add booking data to metadata if present
                if booking_data:
                    if 'date' in booking_data:
                        service_metadata['booking_date'] = str(booking_data.get('date', ''))
                    if 'time' in booking_data:
                        service_metadata['booking_time'] = str(booking_data.get('time', ''))
                    if 'duration_minutes' in booking_data:
                        service_metadata['duration_minutes'] = str(booking_data.get('duration_minutes', ''))
                    if 'notes' in booking_data:
                        service_metadata['booking_notes'] = str(booking_data.get('notes', ''))[:500]
                
                metadata_items.append(service_metadata)
                
                total_amount += service_price
        
        if not line_items or len(line_items) == 0:
            raise HTTPException(status_code=400, detail="No valid items to checkout")
        
        if total_amount <= 0:
            raise HTTPException(status_code=400, detail="Total amount must be greater than 0")
        
        logger.info(f"Creating Stripe session with {len(line_items)} line items, total: ${total_amount}")
        logger.info(f"Success URL: {success_url}")
        logger.info(f"Cancel URL: {cancel_url}")
        
        # Validate line items before sending to Stripe
        for idx, item in enumerate(line_items):
            price_data = item.get('price_data', {}) if isinstance(item, dict) else {}
            unit_amount = price_data.get('unit_amount', 0)
            if not isinstance(unit_amount, (int, float)) or unit_amount <= 0:
                logger.error(f"❌ Invalid unit_amount for item {idx + 1}: {unit_amount}, item: {item}")
                raise HTTPException(status_code=400, detail=f"Invalid price for item {idx + 1}")
            if item.get('quantity', 0) <= 0:
                raise HTTPException(status_code=400, detail=f"Invalid quantity for item {idx + 1}")
        
        try:
            # Ensure Stripe is initialized
            if not stripe.api_key:
                raise HTTPException(status_code=500, detail="Stripe API key not configured")
            
            checkout_session = stripe.checkout.Session.create(
                line_items=line_items,
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'type': payload.type,
                    'buyer_id': current_user.id,
                    'items': str(metadata_items)[:500],  # Limit metadata size
                    'total_amount': str(total_amount)
                },
                customer_email=current_user.email
            )
            
            logger.info(f"✅ Stripe session created: {checkout_session.id}")
            
            # Store session info in database
            session_data = {
                "session_id": checkout_session.id,
                "buyer_id": current_user.id,
                "type": payload.type,
                "items": metadata_items,
                "total_amount": total_amount,
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.checkout_sessions.insert_one(session_data)
            
            return CheckoutSessionResponse(
                session_id=checkout_session.id,
                url=checkout_session.url
            )
        
        except StripeErrorCompat as e:
            logger.error(f"❌ Stripe error: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500, 
                detail=f"Payment processing error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"❌ Unexpected error creating checkout session: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to create checkout session: {str(e)}"
            )
    
    except HTTPException as he:
        logger.error(f"❌ HTTPException in create_checkout_session: {he.status_code} - {he.detail}")
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"❌ UNEXPECTED ERROR in create_checkout_session: {str(e)}")
        logger.error(f"❌ Traceback: {error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook for payment confirmation"""
    db = get_db()
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        session_id = session['id']
        payment_status = session['payment_status']
        
        if payment_status == "paid":
            # Get session data from database
            session_data = await db.checkout_sessions.find_one(
                {"session_id": session_id},
                {"_id": 0}
            )
            
            if not session_data:
                return {"status": "error", "message": "Session not found"}
            
            buyer_id = session_data['buyer_id']
            checkout_type = session_data['type']
            
            # Get buyer info
            buyer = await db.users.find_one({"id": buyer_id}, {"_id": 0, "password": 0})
            if not buyer:
                return {"status": "error", "message": "Buyer not found"}
            
            if checkout_type == "product":
                # Create order for products
                items_data = session_data.get('items', [])
                product_ids = []
                products = []
                total_amount = 0
                
                for item in items_data:
                    product_id = item.get('product_id')
                    quantity = item.get('quantity', 1)
                    price = item.get('price', 0)
                    
                    product = await db.products.find_one({"id": product_id}, {"_id": 0})
                    if product:
                        product_ids.append(product_id)
                        products.append({
                            **product,
                            "quantity": quantity,
                            "subtotal": price * quantity
                        })
                        total_amount += price * quantity
                        
                        # Update stock
                        await db.products.update_one(
                            {"id": product_id},
                            {"$inc": {"stock": -quantity}}
                        )
                
                if products:
                    # Get seller info (assuming single seller for simplicity, or handle multiple)
                    seller_id = products[0]['seller_id']
                    seller = await db.users.find_one({"id": seller_id}, {"_id": 0, "password": 0})
                    
                    order = ProductOrder(
                        buyer_id=buyer_id,
                        buyer_name=buyer.get('name', ''),
                        seller_id=seller_id,
                        seller_name=seller.get('name', '') if seller else '',
                        product_ids=product_ids,
                        products=products,
                        total_amount=total_amount,
                        status="confirmed",
                        payment_method="stripe",
                        payment_status="paid",
                        stripe_session_id=session_id
                    )
                    
                    order_dict = order.model_dump()
                    order_dict['timestamp'] = order_dict.pop('created_at').isoformat()
                    
                    await db.orders.insert_one(order_dict)
                    
                    # Clear cart
                    await db.cart.delete_many({"buyer_id": buyer_id})
            
            else:  # service
                # Create booking for service
                items_data = session_data.get('items', [])
                
                for item in items_data:
                    service_id = item.get('service_id')
                    service = await db.services.find_one({"id": service_id}, {"_id": 0})
                    
                    if service:
                        booking = ServiceBooking(
                            buyer_id=buyer_id,
                            buyer_name=buyer.get('name', ''),
                            seller_id=service['seller_id'],
                            seller_name=service['seller_name'],
                            service_id=service_id,
                            service_title=service['title'],
                            status="pending",
                            stripe_session_id=session_id
                        )
                        
                        booking_dict = booking.model_dump()
                        booking_dict['timestamp'] = booking_dict.pop('booked_at').isoformat()
                        
                        await db.bookings.insert_one(booking_dict)
            
            # Update session status
            await db.checkout_sessions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "completed"}}
            )
    
    return {"status": "success"}


@router.post("/create-cod-order")
async def create_cod_order(
    payload: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user)
):
    """Create Cash on Delivery order for products"""
    db = get_db()
    
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can create orders")
    
    if not payload.items or len(payload.items) == 0:
        raise HTTPException(status_code=400, detail="No items provided")
    
    if payload.type != "product":
        raise HTTPException(status_code=400, detail="COD is only available for products")
    
    try:
        product_ids = []
        products = []
        total_amount = 0
        
        # Process each item
        for item in payload.items:
            # CheckoutItem is a Pydantic model, access attributes directly
            product_id = item.id
            quantity = item.quantity  # Default is 1 in the model
            
            # Get product details
            product = await db.products.find_one({"id": product_id}, {"_id": 0})
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
            
            # Check stock
            if product.get('stock', 0) < quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.get('title', 'product')}. Available: {product.get('stock', 0)}"
                )
            
            price = product.get('price', 0)
            subtotal = price * quantity
            total_amount += subtotal
            
            product_ids.append(product_id)
            
            # Create product dict for order (already clean since we used {"_id": 0})
            products.append({
                **product,
                "quantity": quantity,
                "subtotal": subtotal
            })
            
            # Update stock
            await db.products.update_one(
                {"id": product_id},
                {"$inc": {"stock": -quantity}}
            )
        
        if not products:
            raise HTTPException(status_code=400, detail="No valid products found")
        
        # Get seller info (assuming single seller for simplicity)
        seller_id = products[0]['seller_id']
        seller = await db.users.find_one({"id": seller_id}, {"_id": 0, "password": 0})
        
        # Create order with COD payment method
        order = ProductOrder(
            buyer_id=current_user.id,
            buyer_name=current_user.name,
            seller_id=seller_id,
            seller_name=seller.get('name', '') if seller else '',
            product_ids=product_ids,
            products=products,
            total_amount=total_amount,
            status="pending",  # Pending until delivery confirmation
            payment_method="cod",
            payment_status="pending"  # Will be marked as paid on delivery
        )
        
        order_dict = order.model_dump()
        order_dict['timestamp'] = order_dict.pop('created_at').isoformat()
        
        await db.orders.insert_one(order_dict)
        
        # Clear cart
        await db.cart.delete_many({"buyer_id": current_user.id})
        
        logger.info(f"✅ COD Order created: {order_dict.get('id')} for user {current_user.id}")
        
        # Clean order_dict for JSON serialization - remove any ObjectIds that might have been added
        from bson import ObjectId
        
        def clean_for_json(obj):
            """Recursively clean ObjectIds and other non-serializable objects"""
            if isinstance(obj, ObjectId):
                return str(obj)
            elif isinstance(obj, dict):
                # Remove _id and clean nested objects
                cleaned = {}
                for k, v in obj.items():
                    if k == '_id':
                        continue
                    cleaned[k] = clean_for_json(v)
                return cleaned
            elif isinstance(obj, list):
                return [clean_for_json(item) for item in obj]
            elif isinstance(obj, datetime):
                return obj.isoformat()
            else:
                return obj
        
        # Clean the order dict before returning
        clean_order = clean_for_json(order_dict)
        
        return {
            "message": "Order placed successfully",
            "order_id": order_dict.get('id'),
            "order": clean_order,
            "payment_method": "cod"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating COD order: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create order: {str(e)}"
        )