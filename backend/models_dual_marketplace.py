# backend/models_dual_marketplace.py
"""
Dual Marketplace Models - Products & Services
Separate models for Product Marketplace and Service Marketplace
"""
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


# ============ PRODUCT MARKETPLACE MODELS ============

class Product(BaseModel):
    """Product model for physical goods marketplace"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    seller_name: str
    title: str
    description: str
    price: float
    stock: int
    category: str
    images: List[str] = []
    rating: float = 0.0
    reviews_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProductCreate(BaseModel):
    title: str
    description: str
    price: float
    stock: int
    category: str
    images: List[str] = []


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    images: Optional[List[str]] = None


class CartItem(BaseModel):
    """Cart item model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    product_id: str
    quantity: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1


class ProductOrder(BaseModel):
    """Order model for products"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    buyer_name: str
    seller_id: str
    seller_name: str
    product_ids: List[str] = []
    products: List[Dict[str, Any]] = []  # Full product details
    total_amount: float
    status: str = "pending"  # pending, confirmed, shipped, delivered, cancelled
    payment_method: Optional[str] = "stripe"  # "stripe" or "cod"
    payment_status: Optional[str] = "pending"  # pending, paid, failed
    stripe_session_id: Optional[str] = None
    shipping_address: Optional[str] = None
    tracking_number: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============ SERVICE MARKETPLACE MODELS ============

class Service(BaseModel):
    """Service model for freelance services marketplace"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    seller_name: str
    title: str
    description: str
    category: str
    price: float
    delivery_days: int
    skills: List[str] = []
    experience_level: str = "intermediate"  # beginner, intermediate, expert
    rating: float = 0.0
    reviews_count: int = 0
    completed_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ServiceCreate(BaseModel):
    title: str
    description: str
    category: str
    price: float
    delivery_days: int
    skills: List[str] = []
    experience_level: str = "intermediate"


class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    delivery_days: Optional[int] = None
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None


class ServiceBooking(BaseModel):
    """Booking model for services"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    buyer_name: str
    seller_id: str
    seller_name: str
    service_id: str
    service_title: str
    status: str = "pending"  # pending, in-progress, completed, cancelled
    stripe_session_id: Optional[str] = None
    booked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None


class BookingCreate(BaseModel):
    service_id: str


class ServiceRequestBooking(BaseModel):
    """Booking model for service requests (when sellers book buyer's posted requests)"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request_id: str  # ID of the service request posted by buyer
    buyer_id: str  # Company/buyer who posted the request
    buyer_name: str
    seller_id: str  # Freelancer/seller who booked it
    seller_name: str
    title: str  # Title from service request
    description: str  # Description from service request
    category: str
    budget: float
    deadline: datetime
    status: str = "pending"  # pending, confirmed, in-progress, completed, cancelled
    booked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None


class ServiceRequestBookingCreate(BaseModel):
    """Request to book a service request"""
    request_id: str


# ============ UNIFIED CHECKOUT MODELS ============

class CheckoutItem(BaseModel):
    """Item in checkout (product or service)
    Make most fields optional so frontend can send minimal payload
    and server will enrich from DB.
    """
    model_config = ConfigDict(extra="allow")
    id: str
    type: Optional[str] = None  # "product" or "service"
    quantity: int = 1
    price: Optional[float] = None
    title: Optional[str] = None
    booking_data: Optional[Dict[str, Any]] = None  # For service bookings


class CheckoutSessionRequest(BaseModel):
    """Request to create Stripe checkout session"""
    items: List[CheckoutItem]
    type: str  # "product" or "service"


class CheckoutSessionResponse(BaseModel):
    """Response with Stripe checkout URL"""
    session_id: str
    url: str


