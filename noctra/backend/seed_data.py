"""Seed data for Zync marketplace."""
import uuid
import random
from datetime import datetime, timezone, timedelta

NICHES = ["Fashion", "Fitness", "Food", "Tech", "Lifestyle", "Travel", "Beauty", "Gaming"]
CITIES = ["Mumbai", "Delhi NCR", "Bangalore", "Pune", "Hyderabad", "Chennai", "Jaipur", "Kolkata", "Ahmedabad", "Chandigarh"]

CREATOR_PROFILES = [
    ("Aanya Kapoor", "Fashion", "Mumbai", "Fashion storyteller · reels on streetwear & thrift finds"),
    ("Vihaan Malhotra", "Tech", "Bangalore", "Reviewing gadgets that actually matter. No fluff."),
    ("Ishita Reddy", "Food", "Hyderabad", "Biryani chronicles and late night chai runs."),
    ("Arjun Nair", "Fitness", "Delhi NCR", "Home workouts that don't require a gym or ego."),
    ("Meera Iyer", "Travel", "Bangalore", "Solo female travel across India · budget itineraries."),
    ("Rohan Gupta", "Lifestyle", "Mumbai", "Mornings, coffee and minimal routines."),
    ("Diya Sharma", "Beauty", "Delhi NCR", "K-beauty meets desi skin. Honest routines only."),
    ("Kabir Singh", "Gaming", "Pune", "Valorant clips, setup tours, budget builds."),
    ("Tanvi Joshi", "Fashion", "Pune", "Saree styling for Gen-Z. Heirlooms reimagined."),
    ("Aryan Patel", "Food", "Ahmedabad", "Street food crawls across Gujarat."),
    ("Saanvi Menon", "Fitness", "Chennai", "Yoga, mobility and not hating your body."),
    ("Dev Khanna", "Tech", "Mumbai", "AI tools, productivity stacks, indie apps."),
    ("Nisha Bansal", "Travel", "Jaipur", "Heritage stays and hidden havelis."),
    ("Aditya Rao", "Lifestyle", "Bangalore", "Design, journaling, slow living."),
    ("Pari Shah", "Beauty", "Mumbai", "Melanin-first makeup looks."),
    ("Yash Verma", "Gaming", "Delhi NCR", "BGMI grinds and esports takes."),
    ("Riya Das", "Fashion", "Kolkata", "Kolkata street style · indie labels."),
    ("Kunal Bhatia", "Food", "Mumbai", "Bombay food spots under ₹300."),
    ("Anushka Pillai", "Fitness", "Chennai", "Strength training for women."),
    ("Shaurya Sinha", "Tech", "Hyderabad", "Self-hosting, linux, home lab tours."),
    ("Mahira Chopra", "Travel", "Chandigarh", "Himalayan road trips · Enfield diaries."),
    ("Neel Mehta", "Lifestyle", "Ahmedabad", "Bookstagram · indie reads · chai."),
    ("Zara Ahmed", "Beauty", "Delhi NCR", "Fragrance reviews · niche perfumery."),
    ("Veer Chatterjee", "Gaming", "Kolkata", "FIFA, football takes, jersey hauls."),
    ("Avni Desai", "Fashion", "Mumbai", "Thrift flips and couture dupes."),
]

CATEGORIES = [
    {"name": "Fitness", "slug": "fitness", "color": "#ff8c42", "icon": "Dumbbell"},
    {"name": "Fashion", "slug": "fashion", "color": "#f472b6", "icon": "Shirt"},
    {"name": "Food", "slug": "food", "color": "#fbbf24", "icon": "UtensilsCrossed"},
    {"name": "Tech", "slug": "tech", "color": "#4f8ef7", "icon": "Cpu"},
    {"name": "Lifestyle", "slug": "lifestyle", "color": "#00d4c8", "icon": "Coffee"},
    {"name": "Travel", "slug": "travel", "color": "#a78bfa", "icon": "Plane"},
    {"name": "Video Editors", "slug": "video-editors", "color": "#ef4444", "icon": "Clapperboard"},
    {"name": "Social Media Managers", "slug": "smm", "color": "#10b981", "icon": "Megaphone"},
]

BRANDS_SEED = [
    {"name": "Kaapi Lab", "industry": "Café", "budget": "50K-2L", "tagline": "Third wave coffee, second home.", "logo_color": "#ff8c42"},
    {"name": "Skinfolk", "industry": "D2C Skincare", "budget": "1L-5L", "tagline": "For every melanin story.", "logo_color": "#00d4c8"},
    {"name": "Rep Fitness", "industry": "Fitness", "budget": "2L-8L", "tagline": "Build the body you earn.", "logo_color": "#4f8ef7"},
    {"name": "Oblique", "industry": "Tech Startup", "budget": "3L-10L", "tagline": "AI for indie builders.", "logo_color": "#a78bfa"},
    {"name": "Gulaabo", "industry": "Fashion Label", "budget": "1L-6L", "tagline": "Desi, loud, unapologetic.", "logo_color": "#f472b6"},
    {"name": "Bento Story", "industry": "Restaurant", "budget": "40K-1.5L", "tagline": "Japanese soul food in Bombay.", "logo_color": "#fbbf24"},
]

EDITORS_SEED = [
    ("Farhan Qureshi", "Video Editor", "Mumbai", ["Premiere Pro", "After Effects", "DaVinci Resolve"], ["Short-form reels", "Motion graphics", "Color grading"], 8000),
    ("Sneha Kulkarni", "Video Editor", "Pune", ["CapCut", "Premiere Pro"], ["YouTube long-form", "Podcast editing"], 12000),
    ("Ramesh Kumar", "Reel Editor", "Bangalore", ["CapCut", "InShot"], ["Trending reels", "Transitions"], 4500),
    ("Priya Menon", "Social Media Manager", "Chennai", ["Notion", "Canva", "Later"], ["Content calendars", "Community mgmt"], 35000),
    ("Ankit Jain", "Content Strategist", "Delhi NCR", ["Airtable", "Figma"], ["Brand strategy", "Funnel design"], 60000),
    ("Ira Thomas", "Video Editor", "Kolkata", ["Final Cut Pro", "Motion"], ["Documentary cuts", "Travel films"], 15000),
    ("Maanav Oberoi", "Social Media Manager", "Mumbai", ["Buffer", "Canva", "Notion"], ["Instagram growth", "Copywriting"], 40000),
    ("Tara Iyengar", "Reel Editor", "Hyderabad", ["CapCut"], ["Fashion reels", "Food reels"], 5500),
]

REVIEW_COMMENTS = [
    "Delivered ahead of schedule. The reel got 200K+ views organically.",
    "Super professional. Came prepared, asked the right questions.",
    "Honestly surprised by the quality. Will book again.",
    "Communication was 10/10. Felt like a teammate, not a vendor.",
    "The aesthetic was exactly what our launch needed.",
    "Slight delay but the output more than made up for it.",
    "Really understood our brand tone. Minimal back-and-forth.",
    "Loved the rough cuts. Final edit was chef's kiss.",
    "Engaged audience was noticeably higher than past campaigns.",
    "Professional, warm, and actually fun to work with.",
]

DEAL_DELIVERABLES = ["1 Reel + 2 Stories", "3 Posts + 1 Reel", "Dedicated Reel", "2 Stories + 1 Post", "Full Campaign (5 assets)"]
DEAL_STATUSES = ["Requested", "Negotiating", "Confirmed", "Live", "Completed"]

PORTFOLIO_THUMBS = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
    "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&q=80",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80",
    "https://images.unsplash.com/photo-1506634572416-48cdfe530110?w=600&q=80",
    "https://images.unsplash.com/photo-1485872299712-c1b8b1e9b0e0?w=600&q=80",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
    "https://images.unsplash.com/photo-1542124948-dc391252a940?w=600&q=80",
    "https://images.unsplash.com/photo-1528116141514-ed7b676e0a3b?w=600&q=80",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
]

COVER_IMAGES = [
    "https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=80",
    "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=1600&q=80",
    "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=1600&q=80",
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80",
]


def avatar_url(name: str, seed: str) -> str:
    # DiceBear avatars - neutral, fun, Indian-friendly
    return f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed}&backgroundColor=00d4c8,4f8ef7,ff8c42,f472b6,a78bfa,fbbf24"


def real_avatar_url(seed_idx: int) -> str:
    # Rotate through unsplash portraits seeded by idx
    portraits = [
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
        "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&q=80",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
        "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80",
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80",
        "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&q=80",
        "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80",
        "https://images.unsplash.com/photo-1545996124-0501ebae84d0?w=400&q=80",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
        "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&q=80",
    ]
    return portraits[seed_idx % len(portraits)]


def calc_trust_score(engagement: float, followers: int, completeness: int, reviews_avg: float, deals_count: int) -> int:
    eng_score = min(engagement * 10, 40)  # 40% weight, cap at 4% engagement = 40pts
    completeness_score = (completeness / 100) * 20
    deals_score = min(deals_count * 4, 20)
    reviews_score = (reviews_avg / 5) * 20
    return int(eng_score + completeness_score + deals_score + reviews_score)


def build_seed():
    random.seed(42)
    creators = []
    for idx, (name, niche, city, bio) in enumerate(CREATOR_PROFILES):
        followers = random.choice([8500, 12400, 24500, 42100, 68900, 95400, 125000, 180000, 245000, 320000, 450000])
        avg_likes = int(followers * random.uniform(0.02, 0.08))
        avg_comments = int(avg_likes * random.uniform(0.02, 0.12))
        engagement = round((avg_likes + avg_comments) / followers * 100, 2)
        completeness = random.randint(70, 100)
        deals_count = random.randint(2, 18)
        reviews_avg = round(random.uniform(4.1, 5.0), 1)
        trust_score = calc_trust_score(engagement, followers, completeness, reviews_avg, deals_count)

        story_price = int(followers / 1000 * random.uniform(8, 20))
        post_price = story_price * 3
        reel_price = story_price * 5

        portfolio = random.sample(PORTFOLIO_THUMBS, 6)
        cover = random.choice(COVER_IMAGES)

        creators.append({
            "id": str(uuid.uuid4()),
            "role": "Influencer",
            "name": name,
            "niche": niche,
            "city": city,
            "bio": bio,
            "avatar": real_avatar_url(idx),
            "cover": cover,
            "followers": followers,
            "avg_likes": avg_likes,
            "avg_comments": avg_comments,
            "engagement_rate": engagement,
            "completeness": completeness,
            "trust_score": trust_score,
            "pricing": {
                "story": story_price,
                "post": post_price,
                "reel": reel_price,
            },
            "portfolio": [{"thumb": p, "campaign": random.choice(["Launch reel", "Festive campaign", "Product drop", "Brand story", "Collab teaser"]), "brand": random.choice([b["name"] for b in BRANDS_SEED])} for p in portfolio],
            "brands_worked_with": random.sample([b["name"] for b in BRANDS_SEED], k=random.randint(2, 5)),
            "instagram_handle": "@" + name.lower().replace(" ", "_"),
            "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(30, 700))).isoformat(),
        })

    editors = []
    for idx, (name, role, city, tools, skills, price) in enumerate(EDITORS_SEED):
        editors.append({
            "id": str(uuid.uuid4()),
            "role": role,
            "name": name,
            "city": city,
            "bio": f"{role} · {', '.join(skills)}",
            "avatar": real_avatar_url(idx + 15),
            "cover": random.choice(COVER_IMAGES),
            "skills": skills,
            "tools": tools,
            "price_per_project": price,
            "rating": round(random.uniform(4.2, 5.0), 1),
            "projects_done": random.randint(15, 200),
            "portfolio": [{"thumb": p, "campaign": "Sample work", "brand": random.choice([b["name"] for b in BRANDS_SEED])} for p in random.sample(PORTFOLIO_THUMBS, 4)],
            "instagram_handle": "@" + name.lower().replace(" ", "_"),
            "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(30, 500))).isoformat(),
        })

    brands = []
    for b in BRANDS_SEED:
        brands.append({
            "id": str(uuid.uuid4()),
            "name": b["name"],
            "industry": b["industry"],
            "budget_range": b["budget"],
            "tagline": b["tagline"],
            "logo_color": b["logo_color"],
            "logo_initial": b["name"][0],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    deals = []
    for _ in range(15):
        creator = random.choice(creators)
        brand = random.choice(brands)
        status = random.choice(DEAL_STATUSES)
        amount = random.choice([8000, 15000, 25000, 45000, 65000, 120000, 180000])
        deliverable = random.choice(DEAL_DELIVERABLES)
        deadline = (datetime.now(timezone.utc) + timedelta(days=random.randint(3, 30))).isoformat()
        deals.append({
            "id": str(uuid.uuid4()),
            "brand_id": brand["id"],
            "brand_name": brand["name"],
            "brand_logo_color": brand["logo_color"],
            "creator_id": creator["id"],
            "creator_name": creator["name"],
            "creator_avatar": creator["avatar"],
            "deliverable": deliverable,
            "amount": amount,
            "status": status,
            "deadline": deadline,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))).isoformat(),
            "escrow": status in ["Confirmed", "Live"],
        })

    reviews = []
    for _ in range(30):
        creator = random.choice(creators)
        brand = random.choice(brands)
        reviews.append({
            "id": str(uuid.uuid4()),
            "creator_id": creator["id"],
            "brand_id": brand["id"],
            "brand_name": brand["name"],
            "brand_logo_color": brand["logo_color"],
            "rating": random.randint(4, 5),
            "comment": random.choice(REVIEW_COMMENTS),
            "date": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 200))).isoformat(),
        })

    return {
        "creators": creators,
        "editors": editors,
        "brands": brands,
        "deals": deals,
        "reviews": reviews,
        "categories": CATEGORIES,
    }
