from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
import urllib.parse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import string
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import hmac
import hashlib

import razorpay
import requests as http
from passlib.context import CryptContext
from jose import JWTError, jwt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Noctra API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- Razorpay ----------
RZP_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RZP_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
rzp_client = None
if RZP_KEY_ID and RZP_KEY_SECRET:
    try:
        rzp_client = razorpay.Client(auth=(RZP_KEY_ID, RZP_KEY_SECRET))
    except Exception:
        rzp_client = None

# ---------- Resend (email) ----------
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM    = os.environ.get("RESEND_FROM", "Noctra <onboarding@resend.dev>")

def send_otp_email(to_email: str, otp: str) -> bool:
    if not RESEND_API_KEY:
        logger.info(f"[OTP] No RESEND_API_KEY — OTP for {to_email}: {otp}")
        return True
    try:
        import resend as _resend
        _resend.api_key = RESEND_API_KEY
        _resend.Emails.send({
            "from": RESEND_FROM,
            "to": [to_email],
            "subject": "Your Noctra verification code",
            "html": f"""
<div style="font-family:monospace;max-width:480px;margin:0 auto;padding:40px 24px;background:#efe8d8;color:#0a0a0a">
  <div style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#e63946;margin-bottom:24px">§ Noctra</div>
  <h1 style="font-size:40px;font-weight:900;margin:0 0 16px">Verify your<br/><span style="font-style:italic;color:#e63946">email</span>.</h1>
  <p style="margin:0 0 24px;color:#7a7466;font-size:14px">Use this code to complete your registration. Valid for 10 minutes.</p>
  <div style="font-size:36px;font-weight:900;letter-spacing:0.2em;border:2px solid #0a0a0a;padding:20px;text-align:center;background:#fff">{otp}</div>
  <p style="margin:24px 0 0;font-size:11px;color:#7a7466">If you didn't sign up for Noctra, ignore this email.</p>
</div>""",
        })
        logger.info(f"OTP sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Resend error: {e}")
        return False


# ---------- Google OAuth ----------
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
try:
    from google.oauth2 import id_token as _g_id_token
    from google.auth.transport import requests as _g_requests
    _GOOGLE_AUTH_OK = True
except ImportError:
    _GOOGLE_AUTH_OK = False


# ---------- Phyllo ----------
PHYLLO_CLIENT_ID = os.environ.get("PHYLLO_CLIENT_ID", "")
PHYLLO_CLIENT_SECRET = os.environ.get("PHYLLO_CLIENT_SECRET", "")
PHYLLO_BASE_URL = os.environ.get("PHYLLO_BASE_URL", "https://api.getphyllo.com")
INSTAGRAM_WORK_PLATFORM_ID = "9bb8913b-ddd9-430b-a66a-d74d846e6c66"


def phyllo_post(path: str, body: dict) -> dict:
    r = http.post(
        f"{PHYLLO_BASE_URL}{path}",
        json=body,
        auth=(PHYLLO_CLIENT_ID, PHYLLO_CLIENT_SECRET),
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


def phyllo_get(path: str, params: dict = None) -> dict:
    r = http.get(
        f"{PHYLLO_BASE_URL}{path}",
        params=params or {},
        auth=(PHYLLO_CLIENT_ID, PHYLLO_CLIENT_SECRET),
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


# ---------- JWT ----------
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "10080"))  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)


# ---------- Models ----------
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str  # "brand" | "creator" | "editor"
    instagram_username: Optional[str] = None
    niche: Optional[str] = None
    industry: Optional[str] = None
    gst_number: Optional[str] = None


class OnboardingCreator(BaseModel):
    bio: Optional[str] = None
    deal_types: List[str] = []   # "paid_promotion" | "barter" | "affiliate"
    min_rate: Optional[int] = None
    city: Optional[str] = None


class OnboardingBrand(BaseModel):
    description: Optional[str] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    target_audience: Optional[str] = None
    whatsapp: Optional[str] = None


class CampaignCreate(BaseModel):
    name: str
    description: str
    target_niche: str
    platform: str = "Instagram"
    deliverables: str
    concepts: List[dict] = []
    budget_min: int
    budget_max: int
    application_deadline: str
    content_deadline: str
    requirements: Optional[str] = None


class ApplicationCreate(BaseModel):
    campaign_id: str
    pitch_note: Optional[str] = None


class ApplicationReview(BaseModel):
    action: str  # "accept" | "decline"


class ContentSubmit(BaseModel):
    content_link: str


class RevisionRequest(BaseModel):
    note: str


class DealRoomStatusUpdate(BaseModel):
    status: str
    instagram_post_url: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class OTPRequest(BaseModel):
    email: str


class OTPVerify(BaseModel):
    email: str
    otp: str


class GoogleAuth(BaseModel):
    credential: str
    role: Optional[str] = None


class DealCreate(BaseModel):
    brand_id: str
    brand_name: str
    brand_logo_color: str = "#00d4c8"
    creator_id: str
    creator_name: str
    creator_avatar: str = ""
    deliverable: str
    amount: int
    deadline: Optional[str] = None
    status: str = "Requested"


class DealStatusUpdate(BaseModel):
    status: str


class ReviewCreate(BaseModel):
    creator_id: str
    brand_id: str
    brand_name: str
    brand_logo_color: str = "#00d4c8"
    rating: int
    comment: str


class OrderCreate(BaseModel):
    amount: int  # in paise
    deal_id: Optional[str] = None
    currency: str = "INR"


class VerifyPayload(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    deal_id: Optional[str] = None


# ---------- Auth helpers ----------
def create_access_token(data: dict) -> str:
    payload = {**data, "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------- Auth routes ----------
@api_router.post("/auth/register")
async def register(payload: UserCreate):
    if await db.users.find_one({"email": payload.email}):
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    user = {
        "id": user_id,
        "name": payload.name,
        "email": payload.email,
        "role": payload.role,
        "password_hash": pwd_context.hash(payload.password),
        "created_at": now,
    }
    if payload.instagram_username:
        user["instagram_username"] = payload.instagram_username
    if payload.niche:
        user["niche"] = payload.niche
    if payload.industry:
        user["industry"] = payload.industry
    if payload.gst_number:
        user["gst_number"] = payload.gst_number
    user["onboarding_complete"] = False
    user["email_verified"] = False

    await db.users.insert_one(dict(user))

    # Send OTP immediately after registration
    otp = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.otps.delete_many({"email": payload.email})
    await db.otps.insert_one({"email": payload.email, "otp": otp, "expires_at": expires_at})
    send_otp_email(payload.email, otp)

    # Auto-create a profile in the matching collection so they show up on the platform
    if payload.role == "creator":
        handle = (payload.instagram_username or "").lstrip("@")
        await db.creators.insert_one({
            "id": user_id,
            "user_id": user_id,
            "name": payload.name,
            "niche": payload.niche or "",
            "city": "",
            "bio": "",
            "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_id}&backgroundColor=00d4c8",
            "cover": "",
            "followers": 0,
            "avg_likes": 0,
            "avg_comments": 0,
            "engagement_rate": 0.0,
            "completeness": 20,
            "trust_score": 0,
            "pricing": {"story": 0, "post": 0, "reel": 0},
            "portfolio": [],
            "brands_worked_with": [],
            "instagram_handle": f"@{handle}" if handle else "",
            "created_at": now,
        })
    elif payload.role == "brand":
        await db.brands.insert_one({
            "id": user_id,
            "user_id": user_id,
            "name": payload.name,
            "industry": payload.industry or "",
            "budget_range": "",
            "tagline": "",
            "logo_color": "#00d4c8",
            "logo_initial": payload.name[0].upper() if payload.name else "B",
            "created_at": now,
        })

    user_out = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    token = create_access_token({"sub": user_id, "email": user["email"], "role": user["role"]})
    return {"access_token": token, "token_type": "bearer", "user": user_out}


@api_router.post("/auth/login")
async def login(payload: UserLogin):
    user = await db.users.find_one({"email": payload.email})
    if not user or not pwd_context.verify(payload.password, user.get("password_hash", "")):
        raise HTTPException(401, "Invalid email or password")
    user_out = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
    return {"access_token": token, "token_type": "bearer", "user": user_out}


@api_router.get("/auth/me")
async def me(current_user: dict = Depends(get_current_user)):
    return current_user


@api_router.post("/auth/send-otp")
async def send_otp(payload: OTPRequest):
    user = await db.users.find_one({"email": payload.email})
    if not user:
        raise HTTPException(404, "No account with that email")
    if user.get("email_verified"):
        return {"message": "Already verified"}
    otp = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.otps.delete_many({"email": payload.email})
    await db.otps.insert_one({"email": payload.email, "otp": otp, "expires_at": expires_at})
    send_otp_email(payload.email, otp)
    return {"message": "OTP sent"}


@api_router.post("/auth/verify-otp")
async def verify_otp(payload: OTPVerify):
    record = await db.otps.find_one({"email": payload.email, "otp": payload.otp})
    if not record:
        raise HTTPException(400, "Invalid or expired OTP")
    if datetime.now(timezone.utc) > record["expires_at"].replace(tzinfo=timezone.utc):
        raise HTTPException(400, "OTP has expired — request a new one")
    await db.users.update_one({"email": payload.email}, {"$set": {"email_verified": True}})
    await db.otps.delete_many({"email": payload.email})
    user = await db.users.find_one({"email": payload.email}, {"_id": 0, "password_hash": 0})
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
    return {"access_token": token, "token_type": "bearer", "user": user}


@api_router.delete("/auth/me")
async def delete_account(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    email = current_user.get("email", "")
    await db.users.delete_one({"id": uid})
    await db.creators.delete_one({"user_id": uid})
    await db.brands.delete_one({"user_id": uid})
    await db.otps.delete_many({"email": email})
    return {"message": "Account deleted"}


@api_router.post("/auth/google")
async def google_auth(payload: GoogleAuth):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(503, "Google Sign-In not configured")
    if not _GOOGLE_AUTH_OK:
        raise HTTPException(503, "google-auth package not installed")
    try:
        idinfo = _g_id_token.verify_oauth2_token(
            payload.credential, _g_requests.Request(), GOOGLE_CLIENT_ID
        )
    except Exception as e:
        logger.error(f"Google token verify failed: {e}")
        raise HTTPException(401, "Invalid Google credential")

    email = idinfo.get("email")
    name = idinfo.get("name") or (email.split("@")[0] if email else "User")
    google_id = idinfo.get("sub")
    if not email:
        raise HTTPException(400, "Google account has no email")

    existing = await db.users.find_one({"email": email})
    if existing:
        user_out = {k: v for k, v in existing.items() if k not in ("password_hash", "_id")}
        token = create_access_token({"sub": existing["id"], "email": existing["email"], "role": existing["role"]})
        return {"access_token": token, "token_type": "bearer", "user": user_out, "is_new": False}

    if not payload.role:
        raise HTTPException(400, "account_not_found")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    new_user = {
        "id": user_id, "name": name, "email": email,
        "role": payload.role, "google_id": google_id,
        "email_verified": True, "onboarding_complete": False, "created_at": now,
    }
    await db.users.insert_one(dict(new_user))

    if payload.role == "creator":
        await db.creators.insert_one({
            "id": user_id, "user_id": user_id, "name": name,
            "niche": "", "city": "", "bio": "",
            "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_id}&backgroundColor=00d4c8",
            "cover": "", "followers": 0, "avg_likes": 0, "avg_comments": 0,
            "engagement_rate": 0.0, "completeness": 20, "trust_score": 0,
            "pricing": {"story": 0, "post": 0, "reel": 0},
            "portfolio": [], "brands_worked_with": [], "instagram_handle": "", "created_at": now,
        })
    elif payload.role == "brand":
        await db.brands.insert_one({
            "id": user_id, "user_id": user_id, "name": name,
            "industry": "", "budget_range": "", "tagline": "",
            "logo_color": "#00d4c8",
            "logo_initial": name[0].upper() if name else "B", "created_at": now,
        })

    user_out = {k: v for k, v in new_user.items() if k != "_id"}
    token = create_access_token({"sub": user_id, "email": email, "role": payload.role})
    return {"access_token": token, "token_type": "bearer", "user": user_out, "is_new": True}


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"app": "Noctra", "status": "ok"}


@api_router.get("/categories")
async def get_categories():
    items = await db.categories.find({}, {"_id": 0}).to_list(100)
    return items


@api_router.get("/creators")
async def get_creators(
    niche: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    followers_min: Optional[int] = Query(None),
    followers_max: Optional[int] = Query(None),
    engagement_min: Optional[float] = Query(None),
    price_min: Optional[int] = Query(None),
    price_max: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100),
):
    query = {}
    if niche:
        niches = [n.strip() for n in niche.split(",") if n.strip()]
        if niches:
            query["niche"] = {"$in": niches}
    if city:
        cities = [c.strip() for c in city.split(",") if c.strip()]
        if cities:
            query["city"] = {"$in": cities}
    if followers_min is not None or followers_max is not None:
        f_query = {}
        if followers_min is not None:
            f_query["$gte"] = followers_min
        if followers_max is not None:
            f_query["$lte"] = followers_max
        query["followers"] = f_query
    if engagement_min is not None:
        query["engagement_rate"] = {"$gte": engagement_min}
    if price_min is not None or price_max is not None:
        p_query = {}
        if price_min is not None:
            p_query["$gte"] = price_min
        if price_max is not None:
            p_query["$lte"] = price_max
        query["pricing.reel"] = p_query
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"bio": {"$regex": search, "$options": "i"}},
            {"niche": {"$regex": search, "$options": "i"}},
        ]
    items = await db.creators.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return items


@api_router.get("/creators/{creator_id}")
async def get_creator(creator_id: str):
    creator = await db.creators.find_one({"id": creator_id}, {"_id": 0})
    if not creator:
        raise HTTPException(404, "Creator not found")
    reviews = await db.reviews.find({"creator_id": creator_id}, {"_id": 0}).to_list(100)
    creator["reviews"] = reviews
    return creator


@api_router.get("/editors")
async def get_editors(
    role: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    price_min: Optional[int] = Query(None),
    price_max: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
):
    query = {}
    if role:
        roles = [r.strip() for r in role.split(",") if r.strip()]
        if roles:
            query["role"] = {"$in": roles}
    if city:
        cities = [c.strip() for c in city.split(",") if c.strip()]
        if cities:
            query["city"] = {"$in": cities}
    if price_min is not None or price_max is not None:
        p_query = {}
        if price_min is not None:
            p_query["$gte"] = price_min
        if price_max is not None:
            p_query["$lte"] = price_max
        query["price_per_project"] = p_query
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"bio": {"$regex": search, "$options": "i"}},
        ]
    items = await db.editors.find(query, {"_id": 0}).to_list(200)
    return items


@api_router.get("/editors/{editor_id}")
async def get_editor(editor_id: str):
    e = await db.editors.find_one({"id": editor_id}, {"_id": 0})
    if not e:
        raise HTTPException(404, "Editor not found")
    return e


@api_router.get("/brands")
async def get_brands():
    items = await db.brands.find({}, {"_id": 0}).to_list(100)
    return items


@api_router.get("/brands/{brand_id}")
async def get_brand(brand_id: str):
    b = await db.brands.find_one({"id": brand_id}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Brand not found")
    return b


@api_router.get("/deals")
async def get_deals(
    brand_id: Optional[str] = Query(None),
    creator_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    query = {}
    if brand_id:
        query["brand_id"] = brand_id
    if creator_id:
        query["creator_id"] = creator_id
    if status:
        query["status"] = status
    items = await db.deals.find(query, {"_id": 0}).to_list(500)
    return items


@api_router.post("/deals")
async def create_deal(payload: DealCreate, current_user: dict = Depends(get_current_user)):
    deal = payload.model_dump()
    deal["id"] = str(uuid.uuid4())
    deal["created_at"] = datetime.now(timezone.utc).isoformat()
    deal["escrow"] = False
    await db.deals.insert_one(dict(deal))
    deal.pop("_id", None)
    return deal


@api_router.patch("/deals/{deal_id}")
async def update_deal(deal_id: str, payload: DealStatusUpdate, current_user: dict = Depends(get_current_user)):
    result = await db.deals.update_one({"id": deal_id}, {"$set": {"status": payload.status}})
    if result.matched_count == 0:
        raise HTTPException(404, "Deal not found")
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    return deal


@api_router.get("/reviews")
async def get_reviews(creator_id: Optional[str] = Query(None)):
    query = {}
    if creator_id:
        query["creator_id"] = creator_id
    items = await db.reviews.find(query, {"_id": 0}).to_list(300)
    return items


@api_router.post("/reviews")
async def create_review(payload: ReviewCreate, current_user: dict = Depends(get_current_user)):
    review = payload.model_dump()
    review["id"] = str(uuid.uuid4())
    review["date"] = datetime.now(timezone.utc).isoformat()
    await db.reviews.insert_one(dict(review))
    review.pop("_id", None)
    return review


# ---------- Razorpay ----------
@api_router.get("/razorpay/config")
async def razorpay_config():
    return {"key_id": RZP_KEY_ID, "enabled": bool(rzp_client)}


@api_router.post("/razorpay/create-order")
async def create_order(payload: OrderCreate, current_user: dict = Depends(get_current_user)):
    if rzp_client:
        order = rzp_client.order.create({
            "amount": payload.amount,
            "currency": payload.currency,
            "payment_capture": 1,
        })
        await db.payments.insert_one({
            "order_id": order["id"],
            "deal_id": payload.deal_id,
            "amount": payload.amount,
            "status": "created",
            "mode": "live",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"], "key_id": RZP_KEY_ID, "mode": "live"}
    mock_order_id = f"order_mock_{uuid.uuid4().hex[:16]}"
    await db.payments.insert_one({
        "order_id": mock_order_id,
        "deal_id": payload.deal_id,
        "amount": payload.amount,
        "status": "created",
        "mode": "mock",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"order_id": mock_order_id, "amount": payload.amount, "currency": payload.currency, "key_id": "", "mode": "mock"}


@api_router.post("/razorpay/verify")
async def verify_payment(payload: VerifyPayload, current_user: dict = Depends(get_current_user)):
    if rzp_client and not payload.razorpay_order_id.startswith("order_mock_"):
        body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
        expected = hmac.new(
            RZP_KEY_SECRET.encode("utf-8"),
            body.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        if expected != payload.razorpay_signature:
            raise HTTPException(400, "Invalid signature")

    await db.payments.update_one(
        {"order_id": payload.razorpay_order_id},
        {"$set": {"status": "paid", "payment_id": payload.razorpay_payment_id, "paid_at": datetime.now(timezone.utc).isoformat()}},
    )
    if payload.deal_id:
        await db.deals.update_one({"id": payload.deal_id}, {"$set": {"status": "Confirmed", "escrow": True}})
    return {"ok": True, "status": "paid"}


# ---------- Onboarding ----------
@api_router.patch("/onboarding/creator")
async def onboard_creator(payload: OnboardingCreator, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None and v != []}
    updates["onboarding_complete"] = True
    await db.users.update_one({"id": current_user["id"]}, {"$set": updates})
    await db.creators.update_one({"user_id": current_user["id"]}, {"$set": updates})
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password_hash": 0})
    return user


@api_router.patch("/onboarding/brand")
async def onboard_brand(payload: OnboardingBrand, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if payload.budget_min and payload.budget_max:
        updates["budget_range"] = f"₹{payload.budget_min//1000}K–₹{payload.budget_max//1000}K"
    updates["onboarding_complete"] = True
    await db.users.update_one({"id": current_user["id"]}, {"$set": updates})
    await db.brands.update_one({"user_id": current_user["id"]}, {"$set": updates})
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password_hash": 0})
    return user


# ---------- Campaigns ----------
@api_router.post("/campaigns")
async def create_campaign(payload: CampaignCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "brand":
        raise HTTPException(403, "Only brands can create campaigns")
    brand = await db.brands.find_one({"user_id": current_user["id"]}, {"_id": 0})
    campaign = payload.model_dump()
    campaign["id"] = str(uuid.uuid4())
    campaign["brand_id"] = current_user["id"]
    campaign["brand_name"] = brand["name"] if brand else current_user["name"]
    campaign["brand_logo_color"] = brand["logo_color"] if brand else "#00d4c8"
    campaign["status"] = "open"
    campaign["applicant_count"] = 0
    campaign["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.campaigns.insert_one(dict(campaign))
    campaign.pop("_id", None)
    return campaign


@api_router.get("/campaigns")
async def get_campaigns(
    niche: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    brand_id: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=200),
    sort: Optional[str] = Query(None),
):
    query = {}
    if niche:
        query["target_niche"] = {"$in": [n.strip() for n in niche.split(",")]}
    if platform:
        query["platform"] = platform
    if status:
        query["status"] = status
    else:
        query["status"] = "open"
    if brand_id:
        query["brand_id"] = brand_id
        query.pop("status", None)
    items = await db.campaigns.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return items


@api_router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str):
    c = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Campaign not found")
    return c


@api_router.patch("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    campaign = await db.campaigns.find_one({"id": campaign_id})
    if not campaign or campaign["brand_id"] != current_user["id"]:
        raise HTTPException(403, "Not your campaign")
    await db.campaigns.update_one({"id": campaign_id}, {"$set": payload})
    return await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})


# ---------- Applications ----------
@api_router.post("/applications")
async def apply_to_campaign(payload: ApplicationCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "creator":
        raise HTTPException(403, "Only creators can apply")
    existing = await db.applications.find_one({"campaign_id": payload.campaign_id, "creator_id": current_user["id"]})
    if existing:
        raise HTTPException(400, "Already applied to this campaign")
    creator = await db.creators.find_one({"user_id": current_user["id"]}, {"_id": 0})
    campaign = await db.campaigns.find_one({"id": payload.campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    application = {
        "id": str(uuid.uuid4()),
        "campaign_id": payload.campaign_id,
        "campaign_name": campaign["name"],
        "brand_id": campaign["brand_id"],
        "brand_name": campaign["brand_name"],
        "creator_id": current_user["id"],
        "creator_name": current_user["name"],
        "creator_niche": creator["niche"] if creator else current_user.get("niche", ""),
        "creator_instagram": creator["instagram_handle"] if creator else current_user.get("instagram_username", ""),
        "creator_avatar": creator["avatar"] if creator else "",
        "pitch_note": payload.pitch_note,
        "status": "pending",   # pending | accepted | declined
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.applications.insert_one(dict(application))
    await db.campaigns.update_one({"id": payload.campaign_id}, {"$inc": {"applicant_count": 1}})
    application.pop("_id", None)
    return application


@api_router.get("/applications")
async def get_applications(
    campaign_id: Optional[str] = Query(None),
    creator_id: Optional[str] = Query(None),
    brand_id: Optional[str] = Query(None),
):
    query = {}
    if campaign_id:
        query["campaign_id"] = campaign_id
    if creator_id:
        query["creator_id"] = creator_id
    if brand_id:
        query["brand_id"] = brand_id
    items = await db.applications.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api_router.patch("/applications/{application_id}")
async def review_application(application_id: str, payload: ApplicationReview, current_user: dict = Depends(get_current_user)):
    app = await db.applications.find_one({"id": application_id})
    if not app or app["brand_id"] != current_user["id"]:
        raise HTTPException(403, "Not your application to review")
    if payload.action not in ("accept", "decline"):
        raise HTTPException(400, "Action must be accept or decline")

    new_status = "accepted" if payload.action == "accept" else "declined"
    await db.applications.update_one({"id": application_id}, {"$set": {"status": new_status}})

    deal_room = None
    if payload.action == "accept":
        brand = await db.brands.find_one({"user_id": current_user["id"]}, {"_id": 0})
        campaign = await db.campaigns.find_one({"id": app["campaign_id"]}, {"_id": 0})
        deal_room = {
            "id": str(uuid.uuid4()),
            "application_id": application_id,
            "campaign_id": app["campaign_id"],
            "campaign_name": app["campaign_name"],
            "brand_id": current_user["id"],
            "brand_name": app["brand_name"],
            "brand_logo_color": brand["logo_color"] if brand else "#00d4c8",
            "brand_whatsapp": brand.get("whatsapp", "") if brand else "",
            "creator_id": app["creator_id"],
            "creator_name": app["creator_name"],
            "creator_avatar": app["creator_avatar"],
            "deliverables": campaign["deliverables"] if campaign else "",
            "content_deadline": campaign["content_deadline"] if campaign else "",
            "concepts": campaign.get("concepts", []) if campaign else [],
            "requirements": campaign.get("requirements", "") if campaign else "",
            "content_link": None,
            "instagram_post_url": None,
            "revisions": [],
            "revision_count": 0,
            "status": "Matched",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.deal_rooms.insert_one(dict(deal_room))
        deal_room.pop("_id", None)

    app_out = await db.applications.find_one({"id": application_id}, {"_id": 0})
    return {"application": app_out, "deal_room": deal_room}


# ---------- Deal Rooms ----------
@api_router.get("/deal-rooms")
async def get_deal_rooms(current_user: dict = Depends(get_current_user)):
    query = {"brand_id": current_user["id"]} if current_user["role"] == "brand" else {"creator_id": current_user["id"]}
    items = await db.deal_rooms.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api_router.get("/deal-rooms/{room_id}")
async def get_deal_room(room_id: str, current_user: dict = Depends(get_current_user)):
    room = await db.deal_rooms.find_one({"id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(404, "Deal room not found")
    if room["brand_id"] != current_user["id"] and room["creator_id"] != current_user["id"]:
        raise HTTPException(403, "Access denied")
    return room


@api_router.patch("/deal-rooms/{room_id}/submit")
async def submit_content(room_id: str, payload: ContentSubmit, current_user: dict = Depends(get_current_user)):
    room = await db.deal_rooms.find_one({"id": room_id})
    if not room or room["creator_id"] != current_user["id"]:
        raise HTTPException(403, "Not your deal room")
    await db.deal_rooms.update_one(
        {"id": room_id},
        {"$set": {"content_link": payload.content_link, "status": "Content Submitted", "submitted_at": datetime.now(timezone.utc).isoformat()}}
    )
    return await db.deal_rooms.find_one({"id": room_id}, {"_id": 0})


@api_router.patch("/deal-rooms/{room_id}/review")
async def review_content(room_id: str, payload: RevisionRequest, current_user: dict = Depends(get_current_user)):
    room = await db.deal_rooms.find_one({"id": room_id})
    if not room or room["brand_id"] != current_user["id"]:
        raise HTTPException(403, "Not your deal room")
    if payload.note.lower() == "approve":
        await db.deal_rooms.update_one({"id": room_id}, {"$set": {"status": "Approved"}})
    else:
        if room.get("revision_count", 0) >= 2:
            await db.deal_rooms.update_one({"id": room_id}, {"$set": {"status": "Flagged — Admin Review"}})
        else:
            revision = {"note": payload.note, "at": datetime.now(timezone.utc).isoformat()}
            await db.deal_rooms.update_one(
                {"id": room_id},
                {"$set": {"status": "Under Review"}, "$push": {"revisions": revision}, "$inc": {"revision_count": 1}}
            )
    return await db.deal_rooms.find_one({"id": room_id}, {"_id": 0})


@api_router.patch("/deal-rooms/{room_id}/status")
async def update_deal_room_status(room_id: str, payload: DealRoomStatusUpdate, current_user: dict = Depends(get_current_user)):
    room = await db.deal_rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(404, "Deal room not found")
    if room["brand_id"] != current_user["id"] and room["creator_id"] != current_user["id"]:
        raise HTTPException(403, "Access denied")
    updates = {"status": payload.status}
    if payload.instagram_post_url:
        updates["instagram_post_url"] = payload.instagram_post_url
    await db.deal_rooms.update_one({"id": room_id}, {"$set": updates})
    return await db.deal_rooms.find_one({"id": room_id}, {"_id": 0})


# ---------- Phyllo routes ----------
class PhylloFetchProfile(BaseModel):
    account_id: str


@api_router.post("/phyllo/create-user")
async def phyllo_create_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "creator":
        raise HTTPException(403, "Only creators can connect Instagram")
    if not PHYLLO_CLIENT_ID:
        raise HTTPException(503, "Phyllo not configured")

    creator = await db.creators.find_one({"user_id": current_user["id"]}, {"_id": 0})
    phyllo_user_id = creator.get("phyllo_user_id") if creator else None

    # Create Phyllo user if not already created
    if not phyllo_user_id:
        try:
            user_data = phyllo_post("/v1/users", {
                "name": current_user["name"],
                "external_id": current_user["id"],
            })
            phyllo_user_id = user_data["id"]
            await db.creators.update_one(
                {"user_id": current_user["id"]},
                {"$set": {"phyllo_user_id": phyllo_user_id}},
            )
        except Exception as e:
            logger.error(f"Phyllo create user failed: {e}")
            raise HTTPException(502, "Failed to register with Phyllo")

    # Create SDK token
    try:
        token_data = phyllo_post("/v1/sdk-tokens", {
            "user_id": phyllo_user_id,
            "products": ["IDENTITY", "ENGAGEMENT"],
        })
        return {"sdk_token": token_data["sdk_token"], "phyllo_user_id": phyllo_user_id}
    except Exception as e:
        logger.error(f"Phyllo SDK token failed: {e}")
        raise HTTPException(502, "Failed to get Phyllo token")


@api_router.post("/phyllo/fetch-profile")
async def phyllo_fetch_profile(
    payload: PhylloFetchProfile,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "creator":
        raise HTTPException(403, "Only creators can fetch Instagram profile")
    creator = await db.creators.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not creator:
        raise HTTPException(404, "Creator profile not found")

    phyllo_user_id = creator.get("phyllo_user_id")
    if not phyllo_user_id:
        raise HTTPException(400, "No Phyllo user found — connect Instagram first")

    try:
        profile_data = phyllo_get("/v1/profiles", {
            "account_id": payload.account_id,
            "user_id": phyllo_user_id,
        })
        profiles = profile_data.get("data", [])
        if not profiles:
            raise HTTPException(404, "No profile data returned from Phyllo")

        profile = profiles[0]
        handle = profile.get("username", "")
        followers = profile.get("follower_count", 0)
        media_count = profile.get("content_count", 0)

        updates = {
            "instagram_handle": f"@{handle}" if handle and not handle.startswith("@") else handle,
            "instagram_verified": True,
            "phyllo_account_id": payload.account_id,
            "followers": followers,
        }
        if media_count:
            updates["media_count"] = media_count

        await db.creators.update_one({"user_id": current_user["id"]}, {"$set": updates})
        return await db.creators.find_one({"user_id": current_user["id"]}, {"_id": 0})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Phyllo fetch profile failed: {e}")
        raise HTTPException(502, "Failed to fetch profile from Phyllo")


# ---------- Instagram ----------
# NOTE: RapidAPI scraper logic commented out — re-enable when paid plan is active.
#
# RAPIDAPI_KEY  = os.environ.get("RAPIDAPI_KEY", "")
# RAPIDAPI_HOST = os.environ.get("RAPIDAPI_HOST", "instagram-scraper-stable-api.p.rapidapi.com")
#
# _IG_HEADERS = lambda: {
#     "x-rapidapi-key": RAPIDAPI_KEY,
#     "x-rapidapi-host": RAPIDAPI_HOST,
# }
#
# def _rapidapi_call(username: str) -> dict:
#     """Fetch public profile from instagram-scraper-stable-api.p.rapidapi.com."""
#     r = http.get(
#         f"https://{RAPIDAPI_HOST}/ig_get_fb_profile_hover.php",
#         params={"username_or_url": username},
#         headers=_IG_HEADERS(),
#         timeout=15,
#     )
#     logger.info(f"RapidAPI profile status {r.status_code} for @{username}")
#     if not r.ok:
#         logger.error(f"RapidAPI error: {r.text[:500]}")
#         if r.status_code == 404:
#             raise HTTPException(404, "Instagram account not found")
#         if r.status_code == 429:
#             raise HTTPException(429, "Rate limit reached — try again in a moment")
#         raise HTTPException(502, f"Instagram API returned {r.status_code}")
#     data = r.json()
#     user = (
#         data.get("user_data")
#         or data.get("data", {}).get("user")
#         or data.get("user")
#         or data.get("data")
#     )
#     if not user or not isinstance(user, dict):
#         logger.error(f"No user object in response: {str(data)[:400]}")
#         raise HTTPException(404, "Instagram account not found")
#     return user
#
# def _parse_rapidapi_user(user: dict, username: str) -> dict:
#     hd_info = user.get("hd_profile_pic_url_info") or {}
#     pic = (hd_info.get("url", "") if isinstance(hd_info, dict) else "") or user.get("profile_pic_url", "")
#     return {
#         "username": user.get("username", username),
#         "full_name": user.get("full_name", ""),
#         "profile_pic": pic,
#         "followers": user.get("follower_count", 0),
#         "following": user.get("following_count", 0),
#         "posts": user.get("media_count", 0),
#         "is_verified": user.get("is_verified", False),
#         "is_private": user.get("is_private", False),
#         "bio": user.get("biography", ""),
#     }


class InstagramFetchRequest(BaseModel):
    username: str


class InstagramConfirmRequest(BaseModel):
    username: str


@api_router.get("/instagram/pic")
async def instagram_pic_proxy(url: str = Query(...)):
    """Proxy Instagram CDN images — browsers can't load them directly due to CORS."""
    if "cdninstagram.com" not in url and "fbcdn.net" not in url:
        raise HTTPException(400, "Only Instagram CDN URLs are allowed")
    try:
        r = http.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Referer": "https://www.instagram.com/",
                "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            },
            timeout=10,
            stream=True,
        )
        if not r.ok:
            raise HTTPException(404, "Image not found")
        content_type = r.headers.get("content-type", "image/jpeg")
        return StreamingResponse(r.iter_content(chunk_size=8192), media_type=content_type)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image proxy error: {e}")
        raise HTTPException(502, "Failed to fetch image")


@api_router.post("/instagram/lookup")
async def instagram_lookup(payload: InstagramFetchRequest):
    """Validate and return the username so the frontend can show a preview link."""
    username = payload.username.lstrip("@").strip()
    if not username:
        raise HTTPException(400, "Username is required")
    # NOTE: API fetch disabled — just return the handle for direct linking
    return {"username": username, "profile_url": f"https://www.instagram.com/{username}/"}


# NOTE: Media fetch + debug endpoint commented out — re-enable with paid RapidAPI plan.
#
# def _rapidapi_media(endpoint: str, username: str, amount: int = 12) -> list:
#     try:
#         r = http.post(
#             f"https://{RAPIDAPI_HOST}/{endpoint}",
#             data={"username_or_url": username, "pagination_token": "", "amount": str(amount)},
#             headers={**_IG_HEADERS(), "Content-Type": "application/x-www-form-urlencoded"},
#             timeout=15,
#         )
#         if not r.ok:
#             return []
#         body = r.json()
#         items = (
#             body.get("data", {}).get("items")
#             or body.get("data")
#             or body.get("items")
#             or []
#         )
#         return items if isinstance(items, list) else []
#     except Exception as e:
#         logger.warning(f"Media fetch /{endpoint} error for @{username}: {e}")
#         return []
#
# def _parse_media_item(item: dict, media_type: str) -> dict:
#     code = item.get("shortcode") or item.get("code") or ""
#     caption_raw = item.get("caption") or ""
#     caption = (caption_raw.get("text", "") if isinstance(caption_raw, dict) else str(caption_raw))[:200]
#     return {
#         "url": f"https://www.instagram.com/p/{code}/" if code else "",
#         "type": media_type,
#         "likes": item.get("likes", 0) or item.get("like_count", 0) or 0,
#         "comments": item.get("comments", 0) or item.get("comment_count", 0) or 0,
#         "views": item.get("video_views", 0) or 0,
#         "caption": caption,
#         "thumbnail": (item.get("thumbnail_resources") or [{}])[-1].get("src", "") or item.get("display_url", ""),
#         "timestamp": item.get("taken_at_timestamp", "") or item.get("taken_at", ""),
#     }
#
# @api_router.get("/instagram/debug-media")
# async def debug_instagram_media(username: str):
#     ...  # POST to get_ig_user_posts.php / get_ig_user_reels.php


@api_router.post("/instagram/connect")
async def instagram_connect(
    payload: InstagramConfirmRequest,
    current_user: dict = Depends(get_current_user),
):
    """Save creator's Instagram handle — insights fetch disabled until paid API plan is active."""
    if current_user.get("role") != "creator":
        raise HTTPException(403, "Only creators can connect Instagram")

    username = payload.username.lstrip("@").strip()
    if not username:
        raise HTTPException(400, "Username is required")

    updates = {
        "instagram_handle": f"@{username}",
        "instagram_verified": True,
    }
    await db.creators.update_one({"user_id": current_user["id"]}, {"$set": updates})
    updated = await db.creators.find_one({"user_id": current_user["id"]}, {"_id": 0})
    logger.info(f"Instagram handle saved for {current_user['id']}: @{username}")
    return updated


# ---------- Avatar upload ----------
class AvatarUpload(BaseModel):
    avatar: str  # base64 data URL: "data:image/jpeg;base64,..."


@api_router.post("/creators/avatar")
async def upload_avatar(payload: AvatarUpload, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "creator":
        raise HTTPException(403, "Only creators can upload an avatar")
    data = payload.avatar
    if not data.startswith("data:image/"):
        raise HTTPException(400, "Invalid image format")
    # Rough size check: base64 of 1MB image ≈ 1.37MB string
    if len(data) > 1_500_000:
        raise HTTPException(400, "Image too large — keep it under 1 MB")
    await db.creators.update_one({"user_id": current_user["id"]}, {"$set": {"avatar": data}})
    return {"ok": True}


# ---------- Careers ----------
class CareersApplication(BaseModel):
    position: str
    name: str
    email: str
    phone: Optional[str] = None
    why: str
    links: Optional[str] = None


@api_router.post("/careers/apply")
async def careers_apply(payload: CareersApplication):
    if not RESEND_API_KEY:
        logger.info(f"[Careers] No RESEND_API_KEY — application from {payload.email}")
        return {"ok": True}
    try:
        import resend as _resend
        _resend.api_key = RESEND_API_KEY
        links_html = f"<p><strong>Links:</strong> {payload.links}</p>" if payload.links else ""
        phone_html = f"<p><strong>Phone:</strong> {payload.phone}</p>" if payload.phone else ""
        _resend.Emails.send({
            "from": RESEND_FROM,
            "to": ["social@noctra.co.in"],
            "reply_to": payload.email,
            "subject": f"[Careers] {payload.position} — {payload.name}",
            "html": f"""
<div style="font-family:monospace;max-width:600px;margin:0 auto;padding:40px 24px;background:#efe8d8;color:#0a0a0a">
  <div style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#e63946;margin-bottom:16px">§ Noctra Careers</div>
  <h1 style="font-size:28px;font-weight:900;margin:0 0 24px">New application: {payload.position}</h1>
  <div style="border:1px solid #0a0a0a;padding:20px;margin-bottom:20px">
    <p style="margin:0 0 8px"><strong>Name:</strong> {payload.name}</p>
    <p style="margin:0 0 8px"><strong>Email:</strong> <a href="mailto:{payload.email}" style="color:#e63946">{payload.email}</a></p>
    {phone_html}
    {links_html}
  </div>
  <div style="border:1px solid #0a0a0a;padding:20px">
    <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#7a7466">Why Noctra?</p>
    <p style="margin:0;white-space:pre-wrap">{payload.why}</p>
  </div>
</div>""",
        })
        logger.info(f"Careers application from {payload.email} sent to social@noctra.co.in")
        return {"ok": True}
    except Exception as e:
        logger.error(f"Careers email failed: {e}")
        raise HTTPException(502, "Failed to send application — please email social@noctra.co.in directly")


# ---------- App wiring ----------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

CATEGORIES = [
    {"name": "Fitness",                "slug": "fitness",       "color": "#ff8c42", "icon": "Dumbbell"},
    {"name": "Fashion",                "slug": "fashion",       "color": "#f472b6", "icon": "Shirt"},
    {"name": "Food",                   "slug": "food",          "color": "#fbbf24", "icon": "UtensilsCrossed"},
    {"name": "Tech",                   "slug": "tech",          "color": "#4f8ef7", "icon": "Cpu"},
    {"name": "Lifestyle",              "slug": "lifestyle",     "color": "#00d4c8", "icon": "Coffee"},
    {"name": "Travel",                 "slug": "travel",        "color": "#a78bfa", "icon": "Plane"},
    {"name": "Beauty",                 "slug": "beauty",        "color": "#f97316", "icon": "Sparkles"},
    {"name": "Gaming",                 "slug": "gaming",        "color": "#22c55e", "icon": "Gamepad"},
    {"name": "Video Editors",          "slug": "video-editors", "color": "#ef4444", "icon": "Clapperboard"},
    {"name": "Social Media Managers",  "slug": "smm",           "color": "#10b981", "icon": "Megaphone"},
]


@app.on_event("startup")
async def seed_categories():
    count = await db.categories.count_documents({})
    if count == 0:
        await db.categories.insert_many([{"id": str(uuid.uuid4()), **c} for c in CATEGORIES])
        logger.info("Seeded %d categories", len(CATEGORIES))


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
