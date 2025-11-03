# backend/routes/reviews.py
"""
Review and Rating Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from database import get_db
from utils.auth_utils import get_current_user
from models import User
from models_reviews import Review, ReviewCreate, ReviewResponse
from datetime import datetime, timezone

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewResponse)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a review (buyer only)"""
    db = get_db()
    
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can create reviews")
    
    # Check if buyer has purchased/booked this item
    if review_data.item_type == "product":
        order = await db.orders.find_one({
            "buyer_id": current_user.id,
            "product_ids": review_data.item_id
        })
        if not order:
            raise HTTPException(status_code=403, detail="You can only review products you've purchased")
    else:  # service
        booking = await db.bookings.find_one({
            "buyer_id": current_user.id,
            "service_id": review_data.item_id,
            "status": "completed"
        })
        if not booking:
            raise HTTPException(status_code=403, detail="You can only review services you've completed")
    
    # Check if review already exists
    existing = await db.reviews.find_one({
        "buyer_id": current_user.id,
        "item_id": review_data.item_id,
        "item_type": review_data.item_type
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="You've already reviewed this item")
    
    review = Review(
        item_id=review_data.item_id,
        item_type=review_data.item_type,
        buyer_id=current_user.id,
        buyer_name=current_user.name,
        rating=review_data.rating,
        comment=review_data.comment
    )
    
    review_dict = review.model_dump()
    review_dict['timestamp'] = review_dict.pop('created_at').isoformat()
    
    await db.reviews.insert_one(review_dict)
    
    # Update item rating
    await update_item_rating(db, review_data.item_id, review_data.item_type)
    
    return ReviewResponse(**{**review_dict, "created_at": review.created_at})


async def update_item_rating(db, item_id: str, item_type: str):
    """Calculate and update average rating for product/service"""
    reviews = await db.reviews.find({
        "item_id": item_id,
        "item_type": item_type
    }, {"rating": 1}).to_list(100)
    
    if reviews:
        avg_rating = sum(r['rating'] for r in reviews) / len(reviews)
        reviews_count = len(reviews)
        
        if item_type == "product":
            await db.products.update_one(
                {"id": item_id},
                {"$set": {"rating": round(avg_rating, 1), "reviews_count": reviews_count}}
            )
        else:
            await db.services.update_one(
                {"id": item_id},
                {"$set": {"rating": round(avg_rating, 1), "reviews_count": reviews_count}}
            )


@router.get("", response_model=List[ReviewResponse])
async def get_reviews(
    item_id: str = Query(...),
    item_type: str = Query(..., regex="^(product|service)$")
):
    """Get reviews for a product or service"""
    db = get_db()
    
    reviews = await db.reviews.find({
        "item_id": item_id,
        "item_type": item_type
    }, {"_id": 0}).sort("timestamp", -1).to_list(100)
    
    result = []
    for r in reviews:
        if isinstance(r.get('timestamp'), str):
            r['created_at'] = datetime.fromisoformat(r.pop('timestamp'))
        result.append(ReviewResponse(**r))
    
    return result

