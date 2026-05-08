# Noctra — Collaborative Hub

A Gen-Z creator marketplace where Indian brands hire Instagram influencers, video editors, and social media managers.

**Stack**: React (CRA) + FastAPI + MongoDB + Tailwind + Framer Motion + Razorpay (escrow-style mock or live).

---

## Quick start (3 commands)

```bash
# 1. start MongoDB (Docker is easiest)
docker run -d -p 27017:27017 --name noctra-mongo mongo:7

# 2. backend
cd backend && python3 -m venv venv && source venv/bin/activate && \
  pip install -r requirements.txt && cp .env.example .env && \
  uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# 3. frontend (new terminal)
cd frontend && yarn install && cp .env.example .env && yarn start
```

Open **http://localhost:3000** in your browser.

The backend auto-seeds the database on first start: 25 creators, 8 editors, 6 brands, 15 deals, 30 reviews.

---

## 1. Prerequisites

- **Node.js** ≥ 18 + **yarn** ≥ 1.22 (`npm install -g yarn`)
- **Python** ≥ 3.10
- **MongoDB** running locally on `mongodb://localhost:27017`

Install MongoDB:
```bash
# macOS
brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community

# Ubuntu
sudo apt install -y mongodb && sudo systemctl start mongodb

# Or — Docker (recommended, works everywhere)
docker run -d -p 27017:27017 --name noctra-mongo mongo:7
```

---

## 2. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env                # edit MONGO_URL if you're using a remote DB
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend runs at **http://localhost:8001**. Health check: `GET /api/`.

### Razorpay (optional)
Payments run in **mock mode** unless you set these in `backend/.env`:
```
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```
In mock mode the UI still creates deals and marks them Confirmed — you just never see the real checkout modal.

---

## 3. Frontend setup

```bash
cd frontend
yarn install
cp .env.example .env                # REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

Opens at **http://localhost:3000**.

---

## 4. Routes

| Path | Description |
|------|-------------|
| `/` | Landing — hero, categories, featured creators |
| `/discover` | Creator search with niche / city / followers / engagement / price filters |
| `/creators/:id` | Creator profile — portfolio, reviews, pricing, **Book a deal** with Razorpay |
| `/services` | Editors / SMMs / Content strategists list |
| `/auth` | Role picker + signup (mock) — pick `brand`, `creator`, or `editor` |
| `/dashboard/brand` | Brand Kanban: Requested → Negotiating → Confirmed → Live → Completed |
| `/dashboard/creator` | Creator earnings + incoming deal requests |

---

## 5. Auth

Mock auth via `localStorage` — any email + name works. Roles: `brand`, `creator`, `editor`. Switch roles anytime from `/auth`.

---

## 6. Reseed database

```bash
curl -X POST http://localhost:8001/api/seed
```

Wipes and reseeds with fresh demo data.

---

## 7. API endpoints (FastAPI)

```
GET    /api/                          health check
POST   /api/seed                      wipe + reseed demo data
GET    /api/categories                list of niches
GET    /api/creators?...filters...    creators with filters
GET    /api/creators/:id              creator + reviews
GET    /api/editors?...filters...     editors / SMMs
GET    /api/editors/:id               single editor
GET    /api/brands                    list of brands
GET    /api/brands/:id                single brand
GET    /api/deals?brand_id=&creator_id=&status=
POST   /api/deals                     create a deal
PATCH  /api/deals/:id                 update deal status
GET    /api/reviews?creator_id=
POST   /api/reviews                   create a review
GET    /api/razorpay/config           returns key_id and live/mock flag
POST   /api/razorpay/create-order     create order (live or mock)
POST   /api/razorpay/verify           verify signature, marks deal Confirmed + escrow=true
```

---

## 8. Folder structure

```
/backend
  server.py                FastAPI app — all endpoints
  seed_data.py             demo data generator
  requirements.txt
  .env.example

/frontend
  /public
    /brand/logo.svg        Noctra logo asset
    index.html             includes Razorpay checkout.js
  /src
    App.js                 routes
    /pages                 Landing, Discover, CreatorProfile, Services, Auth,
                           BrandDashboard, CreatorDashboard
    /components
      /layout              Navbar, Footer, BottomNav
      /common              CreatorCard, TrustRing, Logo, IridescentWordmark, EmptyState
      /ui                  shadcn/ui primitives
    /lib                   api.js, mockAuth.js, format.js, utils.js
```

---

## 9. Tech highlights

- **Fraunces** variable font (SOFT axis) for the stretched curvy NOCTRA display
- **Iridescent 3D wordmark** on hero via layered text-shadows + animated gradient clip
- **Word-mask scroll reveals** on hero / manifesto
- **Kanban campaign pipeline** with Requested → Negotiating → Confirmed → Live → Completed
- **Trust score rings** with auto-calculated badges (Verified 80+ / High Engagement 60-79 / Rising Creator 40-59)
- **Mobile-first** — fixed bottom nav, slide-up filter drawer, 44px minimum touch targets
- **Razorpay** production-ready (signature verification + order creation), with automatic mock fallback

---

## 10. Common issues

| Problem | Fix |
|---------|-----|
| `pymongo.errors.ServerSelectionTimeoutError` | MongoDB not running. Start it (see step 1). |
| Frontend says "Network Error" | Check `REACT_APP_BACKEND_URL` in `frontend/.env` matches your backend port. |
| Razorpay popup doesn't open | Mock mode is on — set `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` to enable live mode. |
| Empty dashboard / Kanban | You're signed in as a fresh brand. Either reseed (`curl -X POST http://localhost:8001/api/seed`) and pick an existing brand at `/auth`, or create deals from `/discover` → creator → Book a deal. |

---

© 2026 Noctra · Built in India
