from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import hmac
import hashlib

import razorpay

from seed_data import build_seed


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Zync API")
api_router = APIRouter(prefix="/api")

# Razorpay client (optional - works in mock mode if keys missing)
RZP_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RZP_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
rzp_client = None
if RZP_KEY_ID and RZP_KEY_SECRET:
    try:
        rzp_client = razorpay.Client(auth=(RZP_KEY_ID, RZP_KEY_SECRET))
    except Exception:
        rzp_client = None


# ---------- Models ----------
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


# ---------- Helpers ----------
async def ensure_seeded():
    count = await db.creators.count_documents({})
    if count == 0:
        data = build_seed()
        await db.creators.insert_many(data["creators"])
        await db.editors.insert_many(data["editors"])
        await db.brands.insert_many(data["brands"])
        await db.deals.insert_many(data["deals"])
        await db.reviews.insert_many(data["reviews"])
        await db.categories.insert_many(data["categories"])
        logger.info(f"Seeded DB: {len(data['creators'])} creators, {len(data['brands'])} brands, {len(data['deals'])} deals")


async def wipe_and_seed():
    for coll in ["creators", "editors", "brands", "deals", "reviews", "categories"]:
        await db[coll].delete_many({})
    data = build_seed()
    await db.creators.insert_many(data["creators"])
    await db.editors.insert_many(data["editors"])
    await db.brands.insert_many(data["brands"])
    await db.deals.insert_many(data["deals"])
    await db.reviews.insert_many(data["reviews"])
    await db.categories.insert_many(data["categories"])


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"app": "Zync", "status": "ok"}


@api_router.post("/seed")
async def reseed():
    await wipe_and_seed()
    return {"ok": True, "message": "Database reseeded"}


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
async def create_deal(payload: DealCreate):
    deal = payload.model_dump()
    deal["id"] = str(uuid.uuid4())
    deal["created_at"] = datetime.now(timezone.utc).isoformat()
    deal["escrow"] = False
    await db.deals.insert_one(dict(deal))
    deal.pop("_id", None)
    return deal


@api_router.patch("/deals/{deal_id}")
async def update_deal(deal_id: str, payload: DealStatusUpdate):
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
async def create_review(payload: ReviewCreate):
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
async def create_order(payload: OrderCreate):
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
    # Mock mode
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
async def verify_payment(payload: VerifyPayload):
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


# ---------- App wiring ----------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    await ensure_seeded()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
