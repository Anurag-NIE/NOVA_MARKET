# backend/models_reviews.py
"""
Review and Rating Models
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class Review(BaseModel):
    """Review model for products and services"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_id: str  # product_id or service_id
    item_type: str  # "product" or "service"
    buyer_id: str
    buyer_name: str
    rating: int = Field(ge=1, le=5)  # 1-5 stars
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReviewCreate(BaseModel):
    item_id: str
    item_type: str  # "product" or "service"
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    buyer_name: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime

