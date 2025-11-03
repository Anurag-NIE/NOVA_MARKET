# backend/routes/products.py - FIXED VERSION
"""
Product Marketplace Routes - COMPLETE & FIXED
Handles: Products, Cart, Orders for physical goods
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timezone
from database import get_db
from utils.auth_utils import get_current_user
from models import User
from models_dual_marketplace import (
    Product, ProductCreate, ProductUpdate,
    CartItem, CartItemAdd, ProductOrder
)
from config import settings
import uuid
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["Products"])


def normalize_image_urls(images: List[str]) -> List[str]:
    """
    Normalize image URLs to ensure they are full URLs.
    If an image is a relative path or filename, convert it to a full URL.
    For full URLs (http:// or https://), use as-is - perfect for browser-pasted URLs.
    """
    if not images:
        return []
    
    normalized = []
    base_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    
    for img_url in images:
        if not img_url or not isinstance(img_url, str):
            continue
        
        # Strip whitespace
        img_url = img_url.strip()
        if not img_url:
            continue
            
        # If already a full URL (starts with http:// or https://), use as is
        # This handles browser-pasted URLs perfectly!
        if img_url.startswith(("http://", "https://")):
            normalized.append(img_url)
            logger.debug(f"✅ Using full URL as-is: {img_url}")
        # If it's a relative path, prepend base URL
        elif img_url.startswith("/"):
            normalized.append(f"{base_url}{img_url}")
            logger.debug(f"✅ Converted relative path: {img_url} -> {base_url}{img_url}")
        else:
            # Assume it's a filename in the uploads directory
            normalized.append(f"{base_url}/uploads/{img_url}")
            logger.debug(f"✅ Converted filename: {img_url} -> {base_url}/uploads/{img_url}")
    
    logger.info(f"📸 Normalized {len(images)} images to {len(normalized)} valid URLs")
    return normalized


# ============ PRODUCT ROUTES ============

@router.post("/add", response_model=Product)
async def add_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user)
):
    """Add a new product (seller only)"""
    db = get_db()
    
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can add products")
    
    # Log images being saved
    images_input = product_data.images if product_data.images else []
    logger.info(f"📸 Product images received (raw): {images_input}, type: {type(images_input)}")
    
    # Normalize images before saving - this preserves full URLs from browser
    normalized_images = []
    if images_input and isinstance(images_input, list) and len(images_input) > 0:
        normalized_images = normalize_image_urls(images_input)
    
    logger.info(f"📸 Product images normalized: {normalized_images}")
    logger.info(f"📸 Number of images: {len(normalized_images)}")
    
    # Create product with normalized images
    product_data_dict = product_data.model_dump()
    product_data_dict['images'] = normalized_images  # Use normalized images
    
    # Double-check images are in the dict
    logger.info(f"📸 Product dict images before Product creation: {product_data_dict.get('images')}")
    
    product = Product(
        seller_id=current_user.id,
        seller_name=current_user.name,
        **product_data_dict
    )
    
    product_dict = product.model_dump()
    product_dict['timestamp'] = product_dict.pop('created_at').isoformat()
    
    # Verify images are in the dict before saving
    logger.info(f"📸 Product dict to save - images: {product_dict.get('images')}")
    logger.info(f"📸 Product dict to save - images type: {type(product_dict.get('images'))}")
    logger.info(f"📸 Product dict to save - images length: {len(product_dict.get('images', []))}")
    
    await db.products.insert_one(product_dict)
    logger.info(f"✅ Product created: {product.id} with {len(normalized_images)} images")
    
    # Verify what we're returning
    return_product = product.model_dump()
    logger.info(f"📸 Returning product images: {return_product.get('images')}")
    
    # Return product with normalized images
    return Product(**return_product)


@router.get("", response_model=List[Product])
async def get_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    limit: int = Query(50, ge=1, le=100)
):
    """Get all products with filters (public)"""
    db = get_db()
    
    query = {}
    
    if category:
        query['category'] = category
    
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]
    
    if min_price is not None or max_price is not None:
        query['price'] = {}
        if min_price is not None:
            query['price']['$gte'] = min_price
        if max_price is not None:
            query['price']['$lte'] = max_price
    
    # Only filter by stock > 0, don't filter by images (allow products without images)
    query['stock'] = {'$gt': 0}
    
    try:
        listings = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
        
        for p in listings:
            if isinstance(p.get('timestamp'), str):
                p['created_at'] = datetime.fromisoformat(p.pop('timestamp'))
            
            # Normalize image URLs - handle all cases
            images_raw = p.get('images', [])
            logger.debug(f"📸 Raw images for product {p.get('id')}: {images_raw}, type: {type(images_raw)}")
            if not images_raw or not isinstance(images_raw, list):
                p['images'] = []
                logger.debug(f"📸 No valid images list for product {p.get('id')}")
            elif len(images_raw) == 0:
                p['images'] = []
                logger.debug(f"📸 Empty images array for product {p.get('id')}")
            else:
                # Filter out empty strings and None values
                valid_images = [img for img in images_raw if img and isinstance(img, str) and img.strip()]
                if valid_images:
                    p['images'] = normalize_image_urls(valid_images)
                    logger.info(f"📸 Product {p.get('id', 'unknown')}: Normalized {len(valid_images)} images to: {p['images']}")
                else:
                    p['images'] = []
                    logger.debug(f"📸 No valid image strings for product {p.get('id')}")
        
        # Convert to Product models and ensure images are included
        result = []
        for p in listings:
            try:
                # Ensure images field exists and is a list before creating Product model
                if 'images' not in p or not isinstance(p.get('images'), list):
                    p['images'] = []
                
                product_model = Product(**p)
                product_dict = product_model.model_dump()
                
                # Double-check images are included
                if 'images' not in product_dict:
                    product_dict['images'] = p.get('images', [])
                
                # Log images for first few products for debugging
                if len(result) < 3:
                    logger.info(f"📸 Product {p.get('id')} - Final images in response: {product_dict.get('images')}, count: {len(product_dict.get('images', []))}")
                
                result.append(Product(**product_dict))
            except Exception as e:
                logger.error(f"❌ Error creating Product model for {p.get('id')}: {e}")
                import traceback
                logger.error(traceback.format_exc())
                # Fallback: ensure images field exists even in error case
                if 'images' not in p:
                    p['images'] = []
                result.append(p)
        
        logger.info(f"📦 Returning {len(result)} products")
        # Log sample of first product's images
        if result and len(result) > 0:
            first_product = result[0]
            if hasattr(first_product, 'images'):
                logger.info(f"📸 Sample: First product has {len(first_product.images)} images: {first_product.images[:1] if first_product.images else []}")
        
        return result
    except Exception as e:
        logger.error(f"❌ Error fetching products: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch products")


# ============ CART ROUTES - FIXED ============
# NOTE: Cart routes MUST come before /{product_id} route to avoid path conflicts

@router.post("/cart/add")
async def add_to_cart(
    item: CartItemAdd,
    current_user: User = Depends(get_current_user)
):
    """Add product to cart (buyer only)"""
    db = get_db()
    
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can add to cart")
    
    # Check if product exists
    product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product['stock'] < item.quantity:
        raise HTTPException(status_code=400, detail=f"Only {product['stock']} items available")
    
    # Check if item already in cart
    existing = await db.cart.find_one({
        "buyer_id": current_user.id,
        "product_id": item.product_id
    }, {"_id": 0})
    
    if existing:
        # Update quantity
        new_quantity = existing['quantity'] + item.quantity
        if new_quantity > product['stock']:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot add {item.quantity} more. Only {product['stock']} in stock."
            )
        
        await db.cart.update_one(
            {"id": existing['id']},
            {"$set": {"quantity": new_quantity}}
        )
        logger.info(f"✅ Cart updated for user {current_user.id}")
        return {"message": "Cart updated", "cart_item_id": existing['id']}
    else:
        # Create new cart item
        cart_item = CartItem(
            buyer_id=current_user.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        
        cart_dict = cart_item.model_dump()
        cart_dict['timestamp'] = cart_dict.pop('created_at').isoformat()
        
        await db.cart.insert_one(cart_dict)
        logger.info(f"✅ Item added to cart for user {current_user.id}")
        return {"message": "Added to cart", "cart_item_id": cart_item.id}


@router.get("/cart")
async def get_cart(current_user: User = Depends(get_current_user)):
    """Get user's cart with product details (buyer only)"""
    db = get_db()
    
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can view cart")
    
    try:
        cart_items = await db.cart.find(
            {"buyer_id": current_user.id},
            {"_id": 0}
        ).to_list(100)
        
        logger.info(f"📦 Found {len(cart_items)} cart items for user {current_user.id}")
        
        # Enrich with product details (robust, no strict model conversion)
        result = []
        for item in cart_items:
            try:
                product_id = item.get('product_id')
                if not product_id:
                    continue

                product = await db.products.find_one({"id": product_id}, {"_id": 0})
                if not product:
                    # Product deleted - remove from cart
                    await db.cart.delete_one({"id": item.get('id')})
                    continue

                # Normalize fields and timestamps safely
                if isinstance(product.get('timestamp'), str):
                    try:
                        product['created_at'] = datetime.fromisoformat(product.pop('timestamp'))
                    except Exception:
                        product['created_at'] = datetime.now(timezone.utc)
                elif 'created_at' not in product:
                    product['created_at'] = datetime.now(timezone.utc)

                if 'id' not in product:
                    product['id'] = product_id

                # Normalize image URLs for cart items - handle all cases
                images_raw = product.get('images', [])
                if not images_raw or not isinstance(images_raw, list):
                    product['images'] = []
                elif len(images_raw) == 0:
                    product['images'] = []
                else:
                    # Filter out empty strings and None values
                    valid_images = [img for img in images_raw if img and isinstance(img, str) and img.strip()]
                    if valid_images:
                        product['images'] = normalize_image_urls(valid_images)
                    else:
                        product['images'] = []

                quantity = int(item.get('quantity', 1) or 1)
                # Robust price parsing: accept numeric or string with symbols
                raw_price = product.get('price', 0)
                if isinstance(raw_price, (int, float)):
                    price = float(raw_price)
                else:
                    import re
                    cleaned = re.sub(r"[^0-9.]", "", str(raw_price))
                    price = float(cleaned or 0)

                # Append without Pydantic conversion to avoid validation errors
                result.append({
                    "id": item.get('id', str(uuid.uuid4())),
                    "product": product,
                    "quantity": quantity,
                    "subtotal": price * quantity
                })
            except Exception as e:
                logger.error(f"Error building cart item for product_id={item.get('product_id')}: {e}")
                continue
        
        # Ensure numeric total
        try:
            total = sum(float(r.get('subtotal', 0) or 0) for r in result)
        except Exception:
            total = 0.0
        
        logger.info(f"✅ Returning {len(result)} cart items, total: ${total}")
        
        return {
            "items": result,
            "total": total,
            "item_count": len(result)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching cart: {e}")
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"❌ Cart fetch traceback:\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch cart: {str(e)}")


@router.delete("/cart/{item_id}")
async def remove_from_cart(
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove item from cart"""
    db = get_db()
    
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can modify cart")
    
    result = await db.cart.delete_one({
        "id": item_id,
        "buyer_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    logger.info(f"✅ Item removed from cart: {item_id}")
    return {"message": "Item removed from cart"}


# ============ PRODUCT DETAIL ROUTE ============
# Must come AFTER cart routes to avoid path conflicts

@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get a single product by ID"""
    db = get_db()
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product.get('timestamp'), str):
        product['created_at'] = datetime.fromisoformat(product.pop('timestamp'))
    
    # Normalize image URLs - handle all cases
    images_raw = product.get('images', [])
    if not images_raw or not isinstance(images_raw, list):
        product['images'] = []
    elif len(images_raw) == 0:
        product['images'] = []
    else:
        # Filter out empty strings and None values
        valid_images = [img for img in images_raw if img and isinstance(img, str) and img.strip()]
        if valid_images:
            product['images'] = normalize_image_urls(valid_images)
            logger.info(f"📸 Product {product.get('id', 'unknown')}: Normalized {len(valid_images)} images: {product['images']}")
        else:
            product['images'] = []
    
    # Create Product model and ensure images are included
    try:
        product_model = Product(**product)
        product_dict = product_model.model_dump()
        # Double-check images are included
        if 'images' not in product_dict:
            product_dict['images'] = product.get('images', [])
        logger.info(f"📸 Returning product {product.get('id')} with images: {product_dict.get('images')}")
        return Product(**product_dict)
    except Exception as e:
        logger.error(f"❌ Error creating Product model: {e}")
        # Fallback: return as dict
        return product


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a product (seller only, own products)"""
    db = get_db()
    
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can delete products")
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product['seller_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")
    
    result = await db.products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    logger.info(f"✅ Product deleted: {product_id} by seller {current_user.id}")
    return {"message": "Product deleted successfully"}


# ============ ORDER ROUTES - FIXED ============

@router.get("/orders")
async def get_orders(current_user: User = Depends(get_current_user)):
    """Get user's orders (buyer sees purchases, seller sees sales)"""
    db = get_db()
    
    try:
        if current_user.role == "buyer":
            query = {"buyer_id": current_user.id}
        else:
            query = {"seller_id": current_user.id}
        
        logger.info(f"📦 Fetching orders for {current_user.role} {current_user.id}")
        
        orders = await db.orders.find(query, {"_id": 0}).sort("timestamp", -1).to_list(100)
        
        result = []
        for o in orders:
            if isinstance(o.get('timestamp'), str):
                o['created_at'] = datetime.fromisoformat(o.pop('timestamp'))
            result.append(o)
        
        logger.info(f"✅ Returning {len(result)} orders")
        
        return {"orders": result, "total": len(result)}
    
    except Exception as e:
        logger.error(f"❌ Error fetching orders: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch orders: {str(e)}")


@router.post("/orders/create")
async def create_order(
    product_ids: List[str],
    current_user: User = Depends(get_current_user)
):
    """Create order from cart items"""
    db = get_db()
    
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can create orders")
    
    try:
        # Get cart items
        cart_items = await db.cart.find({
            "buyer_id": current_user.id,
            "product_id": {"$in": product_ids}
        }, {"_id": 0}).to_list(100)
        
        if not cart_items:
            raise HTTPException(status_code=404, detail="No cart items found")
        
        # Create order (simplified - you can enhance this)
        order_id = str(uuid.uuid4())
        
        total_amount = 0
        products = []
        
        for item in cart_items:
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            if product:
                subtotal = product['price'] * item['quantity']
                total_amount += subtotal
                products.append({
                    **product,
                    "quantity": item["quantity"],
                    "subtotal": subtotal
                })
        
        order = {
            "id": order_id,
            "buyer_id": current_user.id,
            "buyer_name": current_user.name,
            "product_ids": product_ids,
            "products": products,
            "total_amount": total_amount,
            "status": "pending",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await db.orders.insert_one(order)
        
        # Clear cart
        await db.cart.delete_many({
            "buyer_id": current_user.id,
            "product_id": {"$in": product_ids}
        })
        
        logger.info(f"✅ Order created: {order_id}")
        
        return {"message": "Order created", "order_id": order_id, "order": order}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating order: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


logger.info("✅ Products routes module loaded successfully!")