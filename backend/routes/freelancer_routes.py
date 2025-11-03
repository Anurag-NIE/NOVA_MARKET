# backend/routes/freelancer_routes.py - COMPLETE VERSION

"""
Freelancer Routes - Complete Backend API
Handles: Profiles, Service Requests, Proposals
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from bson import ObjectId
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()
logger = logging.getLogger(__name__)

# Database connection - Use centralized config
from config import settings

MONGODB_URL = settings.MONGO_URL
DB_NAME = settings.DB_NAME  # This will be 'MarketPlace' by default

# Create database connection
client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
db = client[DB_NAME]

logger.info(f"✅ Freelancer routes connected to database: {DB_NAME}")
logger.info(f"✅ MongoDB URL: {MONGODB_URL}")

# ==================== MODELS ====================

class FreelancerProfileCreate(BaseModel):
    title: str
    bio: str
    skills: List[str]
    categories: List[str] = []
    experience_years: int
    hourly_rate: float
    portfolio_url: Optional[str] = None
    education: Optional[List[dict]] = []
    certifications: Optional[List[dict]] = []
    portfolio: Optional[List[dict]] = []
    languages: Optional[List[str]] = ["English"]
    location: Optional[str] = None
    website: Optional[str] = None
    availability: Optional[str] = "available"

class ServiceRequestCreate(BaseModel):
    title: str
    description: str
    category: str
    budget: float
    deadline: Optional[str] = None
    skills_required: List[str]
    experience_level: str = "intermediate"
    attachments: Optional[List[str]] = []

class ProposalCreate(BaseModel):
    request_id: str
    cover_letter: str
    proposed_budget: float
    delivery_time: int
    milestones: Optional[List[dict]] = []

# ==================== AUTH HELPER ====================

# Import proper auth utility
try:
    from utils.auth_utils import get_current_user as auth_get_current_user
    from models import User
    
    async def get_current_user(authorization: str = Header(None)) -> dict:
        """Extract user from Authorization header using proper JWT verification"""
        # Use the proper auth utility
        user = await auth_get_current_user(authorization)
        # Convert User model to dict for compatibility
        return {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.name
        }
except ImportError:
    # Fallback if auth_utils is not available
    from fastapi import Header
    
    async def get_current_user(authorization: str = Header(None)):
        """Fallback auth - extract user from Authorization header"""
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header missing")
        
        try:
            token = authorization.replace("Bearer ", "")
            # Try to find user by token in database
            user = await db.users.find_one({"token": token})
            if not user:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            return {
                "id": str(user.get("_id", "")),
                "email": user.get("email", ""),
                "role": user.get("role", "seller"),
                "name": user.get("name", "")
            }
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid authentication: {str(e)}")

# ==================== FREELANCER PROFILE ROUTES ====================

@router.options("/freelancer/profile")
async def options_profile():
    """Handle OPTIONS request for CORS preflight"""
    return {"message": "OK"}

@router.post("/freelancer/profile")
async def create_or_update_profile(
    profile: FreelancerProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create or update freelancer profile"""
    try:
        # Validate current_user
        if not current_user or "id" not in current_user:
            logger.error("Invalid user authentication - current_user missing or invalid")
            raise HTTPException(status_code=401, detail="Invalid user authentication")
        
        logger.info(f"Saving profile for user: {current_user.get('id')}, role: {current_user.get('role')}")
        
        # Convert Pydantic model to dict, handling all fields
        profile_data = profile.model_dump(exclude_none=True)
        logger.info(f"Profile data received: {list(profile_data.keys())}")
        
        # Ensure required fields exist
        if not profile_data.get("title"):
            raise HTTPException(status_code=400, detail="Professional title is required")
        if not profile_data.get("bio"):
            raise HTTPException(status_code=400, detail="Bio is required")
        if not profile_data.get("skills") or len(profile_data.get("skills", [])) == 0:
            raise HTTPException(status_code=400, detail="At least one skill is required")
        if not profile_data.get("hourly_rate") or profile_data.get("hourly_rate", 0) <= 0:
            raise HTTPException(status_code=400, detail="Valid hourly rate is required")
        
        profile_data["user_id"] = current_user["id"]
        profile_data["updated_at"] = datetime.now(timezone.utc)
        
        # Ensure arrays are properly formatted
        if "skills" in profile_data and not isinstance(profile_data["skills"], list):
            profile_data["skills"] = []
        if "categories" in profile_data and not isinstance(profile_data["categories"], list):
            profile_data["categories"] = []
        if "languages" in profile_data and not isinstance(profile_data["languages"], list):
            profile_data["languages"] = ["English"]
        
        # Convert datetime objects to ISO strings for MongoDB storage
        if isinstance(profile_data.get("updated_at"), datetime):
            profile_data["updated_at"] = profile_data["updated_at"].isoformat()
        
        existing = await db.freelancer_profiles.find_one({
            "user_id": current_user["id"]
        })
        
        if existing:
            logger.info(f"Updating existing profile for user: {current_user['id']}")
            # Update existing profile - preserve created_at and stats
            update_data = {**profile_data}
            # Don't overwrite stats unless explicitly provided
            if "rating" not in update_data:
                update_data.pop("rating", None)
            if "total_jobs" not in update_data:
                update_data.pop("total_jobs", None)
            if "total_earnings" not in update_data:
                update_data.pop("total_earnings", None)
            # Preserve created_at
            if "created_at" in existing:
                update_data.pop("created_at", None)
            
            logger.info(f"Updating profile with data keys: {list(update_data.keys())}")
            
            result = await db.freelancer_profiles.update_one(
                {"user_id": current_user["id"]},
                {"$set": update_data}
            )
            
            logger.info(f"✅ Update result: matched={result.matched_count}, modified={result.modified_count}")
            
            if result.matched_count == 0:
                logger.warning(f"⚠️ No profile found to update for user: {current_user['id']}")
                raise HTTPException(status_code=404, detail="Profile not found for update")
            
            # Fetch updated profile
            updated = await db.freelancer_profiles.find_one({
                "user_id": current_user["id"]
            })
            if updated:
                updated["id"] = str(updated["_id"])
                # Convert ObjectId to string for JSON serialization
                if "_id" in updated:
                    updated["_id"] = str(updated["_id"])
            
            logger.info(f"✅ Profile successfully updated in database")
            return {
                "message": "Profile updated successfully",
                "profile_id": str(updated["_id"]) if updated else None,
                "profile": updated
            }
        else:
            logger.info(f"Creating new profile for user: {current_user['id']}")
            profile_data["created_at"] = datetime.now(timezone.utc).isoformat()
            profile_data["rating"] = 0.0
            profile_data["total_jobs"] = 0
            profile_data["total_earnings"] = 0.0
            
            logger.info(f"Inserting profile with data keys: {list(profile_data.keys())}")
            logger.info(f"Skills count: {len(profile_data.get('skills', []))}")
            logger.info(f"Categories count: {len(profile_data.get('categories', []))}")
            logger.info(f"Database: {DB_NAME}, Collection: freelancer_profiles")
            
            # Verify database connection before insert
            try:
                await client.admin.command('ping')
                logger.info("✅ Database connection verified")
            except Exception as ping_err:
                logger.error(f"❌ Database connection failed: {ping_err}")
                raise HTTPException(status_code=500, detail=f"Database connection failed: {str(ping_err)}")
            
            # Insert profile
            try:
                result = await db.freelancer_profiles.insert_one(profile_data)
                logger.info(f"✅ Insert operation completed, inserted_id: {result.inserted_id}")
                
                if not result.inserted_id:
                    raise HTTPException(status_code=500, detail="Failed to insert profile into database - no ID returned")
                
                # Verify the insert by fetching the document
                created = await db.freelancer_profiles.find_one({"_id": result.inserted_id})
                if not created:
                    raise HTTPException(status_code=500, detail="Profile was inserted but could not be retrieved")
                
                # Count total profiles in collection to verify
                total_count = await db.freelancer_profiles.count_documents({})
                logger.info(f"✅ Total profiles in collection after insert: {total_count}")
                
                # Convert ObjectId to string for JSON serialization
                created["id"] = str(created["_id"])
                created["_id"] = str(created["_id"])
                
                logger.info(f"✅ Profile successfully saved to database {DB_NAME} with ID: {created['id']}")
                return {
                    "message": "Profile created successfully",
                    "profile_id": str(result.inserted_id),
                    "profile": created
                }
            except Exception as insert_err:
                logger.error(f"❌ Database insert error: {insert_err}")
                import traceback
                logger.error(traceback.format_exc())
                raise HTTPException(status_code=500, detail=f"Database insert failed: {str(insert_err)}")
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"❌ Error saving profile: {str(e)}")
        logger.error(f"Traceback: {error_trace}")
        print(f"❌ Error saving profile: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Error saving profile: {str(e)}"
        )

@router.get("/freelancer/profile")
async def get_own_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's freelancer profile"""
    try:
        profile = await db.freelancer_profiles.find_one({
            "user_id": current_user["id"]
        })
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Ensure id field exists
        if "_id" in profile:
            profile["id"] = str(profile["_id"])
            profile["_id"] = str(profile["_id"])
        elif "id" not in profile:
            profile["id"] = str(profile.get("_id", ""))
        
        return {"profile": profile}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")

@router.get("/freelancer/profile/{user_id}")
async def get_freelancer_profile(user_id: str):
    """Get specific freelancer profile by user_id"""
    try:
        profile = await db.freelancer_profiles.find_one({"user_id": user_id})
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Ensure id field exists
        if "_id" in profile:
            profile["id"] = str(profile["_id"])
            profile["_id"] = str(profile["_id"])
        elif "id" not in profile:
            profile["id"] = str(profile.get("_id", ""))
        
        return {"profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")

@router.get("/freelancers")
async def get_all_freelancers(
    category: Optional[str] = None,
    skills: Optional[str] = None,
    min_rate: Optional[float] = None,
    max_rate: Optional[float] = None,
    limit: int = 50
):
    """Get all freelancers with optional filters"""
    try:
        query = {}
        
        if category:
            query["categories"] = category
        if skills:
            skill_list = [s.strip() for s in skills.split(",")]
            query["skills"] = {"$in": skill_list}
        if min_rate is not None or max_rate is not None:
            query["hourly_rate"] = {}
            if min_rate is not None:
                query["hourly_rate"]["$gte"] = min_rate
            if max_rate is not None:
                query["hourly_rate"]["$lte"] = max_rate
        
        cursor = db.freelancer_profiles.find(query).limit(limit)
        profiles = await cursor.to_list(length=limit)
        
        for profile in profiles:
            profile["_id"] = str(profile["_id"])
        
        return {"freelancers": profiles, "count": len(profiles)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching freelancers: {str(e)}")

@router.delete("/freelancer/profile")
async def delete_profile(current_user: dict = Depends(get_current_user)):
    """Delete own freelancer profile"""
    try:
        result = await db.freelancer_profiles.delete_one({
            "user_id": current_user["id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {"message": "Profile deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting profile: {str(e)}")

# ==================== SERVICE REQUEST ROUTES ====================

@router.post("/service-requests")
async def create_service_request(
    request: ServiceRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new service request (buyer posts work)"""
    try:
        request_data = request.model_dump()
        request_data["buyer_id"] = current_user["id"]
        request_data["buyer_email"] = current_user.get("email", "")
        request_data["status"] = "open"
        request_data["created_at"] = datetime.now(timezone.utc)
        request_data["proposals_count"] = 0
        
        result = await db.service_requests.insert_one(request_data)
        
        return {
            "message": "Service request posted successfully",
            "request_id": str(result.inserted_id),
            "request": request_data
        }
    
    except Exception as e:
        print(f"Error creating request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating request: {str(e)}")

@router.get("/service-requests")
async def get_service_requests(
    category: Optional[str] = None,
    skills: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    status: str = "open",
    limit: int = 50
):
    """Get all service requests with filters"""
    try:
        query = {"status": status}
        
        if category:
            query["category"] = category
        if skills:
            skill_list = [s.strip() for s in skills.split(",")]
            query["skills_required"] = {"$in": skill_list}
        if min_budget is not None or max_budget is not None:
            query["budget"] = {}
            if min_budget is not None:
                query["budget"]["$gte"] = min_budget
            if max_budget is not None:
                query["budget"]["$lte"] = max_budget
        
        cursor = db.service_requests.find(query).sort("created_at", -1).limit(limit)
        requests = await cursor.to_list(length=limit)
        
        for req in requests:
            req["_id"] = str(req["_id"])
        
        return {"requests": requests, "count": len(requests)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching requests: {str(e)}")

@router.get("/service-requests/{request_id}")
async def get_service_request(request_id: str):
    """Get specific service request by ID"""
    try:
        if not ObjectId.is_valid(request_id):
            raise HTTPException(status_code=400, detail="Invalid request ID format")
        
        request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
        
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request["_id"] = str(request["_id"])
        return request
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching request: {str(e)}")

@router.get("/my-service-requests")
async def get_my_requests(current_user: dict = Depends(get_current_user)):
    """Get current user's service requests"""
    try:
        cursor = db.service_requests.find({
            "buyer_id": current_user["id"]
        }).sort("created_at", -1)
        
        requests = await cursor.to_list(length=100)
        
        for req in requests:
            req["_id"] = str(req["_id"])
        
        return {"requests": requests, "count": len(requests)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching requests: {str(e)}")

@router.delete("/service-requests/{request_id}")
async def delete_service_request(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a service request (only by owner)"""
    try:
        if not ObjectId.is_valid(request_id):
            raise HTTPException(status_code=400, detail="Invalid request ID")
        
        request = await db.service_requests.find_one({
            "_id": ObjectId(request_id),
            "buyer_id": current_user["id"]
        })
        
        if not request:
            raise HTTPException(status_code=404, detail="Request not found or unauthorized")
        
        await db.service_requests.delete_one({"_id": ObjectId(request_id)})
        return {"message": "Request deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting request: {str(e)}")

# ==================== PROPOSAL ROUTES ====================

@router.post("/proposals")
async def submit_proposal(
    proposal: ProposalCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit a proposal for a service request"""
    try:
        print(f"📝 Received proposal data: {proposal.model_dump()}")
        print(f"👤 User: {current_user}")
        
        if not ObjectId.is_valid(proposal.request_id):
            print(f"❌ Invalid request ID: {proposal.request_id}")
            raise HTTPException(status_code=400, detail="Invalid request ID format")
        
        request = await db.service_requests.find_one({
            "_id": ObjectId(proposal.request_id)
        })
        
        if not request:
            print(f"❌ Request not found: {proposal.request_id}")
            raise HTTPException(status_code=404, detail="Service request not found")
        
        print(f"✅ Found request: {request.get('title')}")
        
        if request["status"] != "open":
            raise HTTPException(status_code=400, detail="Request is no longer open")
        
        existing = await db.proposals.find_one({
            "request_id": proposal.request_id,
            "freelancer_id": current_user["id"]
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="You already submitted a proposal for this request")
        
        proposal_data = proposal.model_dump()
        proposal_data["freelancer_id"] = current_user["id"]
        proposal_data["freelancer_email"] = current_user.get("email", "")
        proposal_data["status"] = "pending"
        proposal_data["created_at"] = datetime.now(timezone.utc)
        
        print(f"💾 Saving proposal: {proposal_data}")
        
        result = await db.proposals.insert_one(proposal_data)
        
        await db.service_requests.update_one(
            {"_id": ObjectId(proposal.request_id)},
            {"$inc": {"proposals_count": 1}}
        )
        
        print(f"✅ Proposal saved successfully: {result.inserted_id}")
        
        return {
            "message": "Proposal submitted successfully",
            "proposal_id": str(result.inserted_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error submitting proposal: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error submitting proposal: {str(e)}")


@router.get("/proposals/request/{request_id}")
async def get_request_proposals(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all proposals for a service request (buyer only)"""
    try:
        if not ObjectId.is_valid(request_id):
            raise HTTPException(status_code=400, detail="Invalid request ID")
        
        request = await db.service_requests.find_one({
            "_id": ObjectId(request_id),
            "buyer_id": current_user["id"]
        })
        
        if not request:
            raise HTTPException(status_code=403, detail="Not authorized to view proposals")
        
        cursor = db.proposals.find({"request_id": request_id}).sort("created_at", -1)
        proposals = await cursor.to_list(length=100)
        
        for proposal in proposals:
            proposal["_id"] = str(proposal["_id"])
            
            # Fetch freelancer details
            freelancer = await db.freelancer_profiles.find_one({
                "user_id": proposal["freelancer_id"]
            })
            if freelancer:
                proposal["freelancer_details"] = {
                    "title": freelancer.get("title", ""),
                    "rating": freelancer.get("rating", 0),
                    "total_jobs": freelancer.get("total_jobs", 0)
                }
        
        return {"proposals": proposals, "count": len(proposals)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching proposals: {str(e)}")

@router.get("/my-proposals")
async def get_my_proposals(current_user: dict = Depends(get_current_user)):
    """Get current user's submitted proposals"""
    try:
        cursor = db.proposals.find({
            "freelancer_id": current_user["id"]
        }).sort("created_at", -1)
        
        proposals = await cursor.to_list(length=100)
        
        for proposal in proposals:
            proposal["_id"] = str(proposal["_id"])
            
            # Fetch request details
            if ObjectId.is_valid(proposal["request_id"]):
                request = await db.service_requests.find_one({
                    "_id": ObjectId(proposal["request_id"])
                })
                if request:
                    proposal["request_details"] = {
                        "title": request.get("title", ""),
                        "budget": request.get("budget", 0),
                        "status": request.get("status", "")
                    }
        
        return {"proposals": proposals, "count": len(proposals)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching proposals: {str(e)}")

@router.put("/proposals/{proposal_id}/accept")
async def accept_proposal(
    proposal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Accept a proposal (buyer only)"""
    try:
        if not ObjectId.is_valid(proposal_id):
            raise HTTPException(status_code=400, detail="Invalid proposal ID")
        
        proposal = await db.proposals.find_one({"_id": ObjectId(proposal_id)})
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        if not ObjectId.is_valid(proposal["request_id"]):
            raise HTTPException(status_code=400, detail="Invalid request ID in proposal")
        
        request = await db.service_requests.find_one({
            "_id": ObjectId(proposal["request_id"]),
            "buyer_id": current_user["id"]
        })
        
        if not request:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        await db.proposals.update_one(
            {"_id": ObjectId(proposal_id)},
            {"$set": {"status": "accepted", "accepted_at": datetime.now(timezone.utc)}}
        )
        
        await db.service_requests.update_one(
            {"_id": ObjectId(proposal["request_id"])},
            {"$set": {
                "status": "in_progress",
                "assigned_to": proposal["freelancer_id"],
                "accepted_at": datetime.now(timezone.utc)
            }}
        )
        
        await db.proposals.update_many(
            {
                "request_id": proposal["request_id"],
                "_id": {"$ne": ObjectId(proposal_id)}
            },
            {"$set": {"status": "rejected"}}
        )
        
        return {"message": "Proposal accepted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error accepting proposal: {str(e)}")

@router.put("/proposals/{proposal_id}/reject")
async def reject_proposal(
    proposal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Reject a proposal (buyer only)"""
    try:
        if not ObjectId.is_valid(proposal_id):
            raise HTTPException(status_code=400, detail="Invalid proposal ID")
        
        proposal = await db.proposals.find_one({"_id": ObjectId(proposal_id)})
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        if not ObjectId.is_valid(proposal["request_id"]):
            raise HTTPException(status_code=400, detail="Invalid request ID")
        
        request = await db.service_requests.find_one({
            "_id": ObjectId(proposal["request_id"]),
            "buyer_id": current_user["id"]
        })
        
        if not request:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        await db.proposals.update_one(
            {"_id": ObjectId(proposal_id)},
            {"$set": {"status": "rejected", "rejected_at": datetime.now(timezone.utc)}}
        )
        
        return {"message": "Proposal rejected"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rejecting proposal: {str(e)}")
    

# **Save this as:** `backend/routes/freelancer_routes.py`
































# # backend/routes/freelancer_routes.py - NEW FILE
# """
# Freelancer Profile Routes
# Manage freelancer profiles, skills, and portfolio
# """

# from fastapi import APIRouter, Depends, HTTPException
# from typing import List, Optional
# from datetime import datetime, timezone
# from database import get_db
# from utils.auth_utils import get_current_user
# from models import User, FreelancerProfile
# import uuid

# router = APIRouter(prefix="/freelancer", tags=["Freelancer"])


# @router.post("/profile")
# async def create_or_update_profile(
#     title: Optional[str] = None,
#     bio: Optional[str] = None,
#     skills: List[str] = [],
#     experience_years: int = 0,
#     hourly_rate: Optional[float] = None,
#     portfolio_url: Optional[str] = None,
#     certifications: List[str] = [],
#     categories: List[str] = [],
#     current_user: User = Depends(get_current_user)
# ):
#     """Create or update freelancer profile"""
#     db = get_db()
    
#     if current_user.role != "seller":
#         raise HTTPException(status_code=403, detail="Only sellers can create freelancer profiles")
    
#     # Check if profile exists
#     existing = await db.freelancer_profiles.find_one(
#         {"user_id": current_user.id},
#         {"_id": 0}
#     )
    
#     profile_data = {
#         "user_id": current_user.id,
#         "title": title,
#         "bio": bio,
#         "skills": skills,
#         "experience_years": experience_years,
#         "hourly_rate": hourly_rate,
#         "portfolio_url": portfolio_url,
#         "certifications": certifications,
#         "categories": categories,
#         "updated_at": datetime.now(timezone.utc).isoformat()
#     }
    
#     if existing:
#         # Update existing profile
#         await db.freelancer_profiles.update_one(
#             {"user_id": current_user.id},
#             {"$set": profile_data}
#         )
#         message = "Profile updated successfully"
#     else:
#         # Create new profile
#         profile_data["id"] = str(uuid.uuid4())
#         profile_data["completed_projects"] = 0
#         profile_data["success_rate"] = 0.0
#         profile_data["created_at"] = datetime.now(timezone.utc).isoformat()
        
#         await db.freelancer_profiles.insert_one(profile_data)
#         message = "Profile created successfully"
    
#     return {
#         "message": message,
#         "profile": profile_data
#     }


# @router.get("/profile")
# async def get_my_profile(
#     current_user: User = Depends(get_current_user)
# ):
#     """Get current user's freelancer profile"""
#     db = get_db()
    
#     profile = await db.freelancer_profiles.find_one(
#         {"user_id": current_user.id},
#         {"_id": 0}
#     )
    
#     if not profile:
#         return {
#             "profile": None,
#             "message": "No profile found. Create one to get started!"
#         }
    
#     return {"profile": profile}


# @router.get("/profile/{user_id}")
# async def get_freelancer_profile(
#     user_id: str,
#     current_user: User = Depends(get_current_user)
# ):
#     """Get any freelancer's public profile"""
#     db = get_db()
    
#     # Get user info
#     user = await db.users.find_one(
#         {"id": user_id},
#         {"_id": 0, "password": 0}
#     )
    
#     if not user or user["role"] != "seller":
#         raise HTTPException(status_code=404, detail="Freelancer not found")
    
#     # Get profile
#     profile = await db.freelancer_profiles.find_one(
#         {"user_id": user_id},
#         {"_id": 0}
#     )
    
#     # Get statistics
#     completed_count = await db.service_requests.count_documents({
#         "accepted_proposal_id": {"$exists": True},
#         "status": "completed"
#     })
    
#     # Get reviews/ratings
#     reviews = await db.reviews.find(
#         {"listing.seller_id": user_id},
#         {"_id": 0, "rating": 1}
#     ).to_list(1000)
    
#     avg_rating = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0
    
#     return {
#         "user": {
#             "id": user["id"],
#             "name": user["name"],
#             "email": user["email"],
#             "avatar": user.get("avatar"),
#             "created_at": user.get("created_at")
#         },
#         "profile": profile,
#         "stats": {
#             "completed_projects": completed_count,
#             "avg_rating": round(avg_rating, 1),
#             "total_reviews": len(reviews)
#         }
#     }


# @router.get("/search")
# async def search_freelancers(
#     skills: Optional[List[str]] = None,
#     category: Optional[str] = None,
#     min_hourly_rate: Optional[float] = None,
#     max_hourly_rate: Optional[float] = None,
#     min_experience: Optional[int] = None,
#     limit: int = 50,
#     current_user: User = Depends(get_current_user)
# ):
#     """Search for freelancers by skills, category, rate, etc."""
#     db = get_db()
    
#     query = {}
    
#     if skills:
#         query["skills"] = {"$in": skills}
    
#     if category:
#         query["categories"] = category
    
#     if min_hourly_rate or max_hourly_rate:
#         rate_query = {}
#         if min_hourly_rate:
#             rate_query["$gte"] = min_hourly_rate
#         if max_hourly_rate:
#             rate_query["$lte"] = max_hourly_rate
#         query["hourly_rate"] = rate_query
    
#     if min_experience:
#         query["experience_years"] = {"$gte": min_experience}
    
#     profiles = await db.freelancer_profiles.find(
#         query,
#         {"_id": 0}
#     ).limit(limit).to_list(limit)
    
#     # Enrich with user data
#     result = []
#     for profile in profiles:
#         user = await db.users.find_one(
#             {"id": profile["user_id"]},
#             {"_id": 0, "password": 0}
#         )
        
#         if user:
#             result.append({
#                 "user_id": user["id"],
#                 "name": user["name"],
#                 "avatar": user.get("avatar"),
#                 **profile
#             })
    
#     return {
#         "freelancers": result,
#         "total": len(result)
#     }


# print("✅ Freelancer routes loaded successfully!")