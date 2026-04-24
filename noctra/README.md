# Noctra — Collaborative Hub

A Gen-Z creator marketplace where Indian brands hire Instagram influencers, video editors, and social media managers.

**Stack**: React (CRA) + FastAPI + MongoDB + Tailwind + Framer Motion + Razorpay.

---

## 1. Prerequisites

- **Node.js** ≥ 18 + **yarn** ≥ 1.22
- **Python** ≥ 3.10
- **MongoDB** running locally on `mongodb://localhost:27017` (or a remote URI you can set)

Install MongoDB on macOS:
```
brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community
```
On Ubuntu:
```
sudo apt install -y mongodb && sudo systemctl start mongodb
```
Or run via Docker: `docker run -d -p 27017:27017 --name mongo mongo:7`

---

## 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # edit MONGO_URL if needed
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

The database auto-seeds on first start (25 creators, 8 editors, 6 brands, 15 deals, 30 reviews).

Backend runs at **http://localhost:8001**. Health check: `GET /api/`.

### Razorpay (optional)
Payments run in **mock mode** unless you set these in `backend/.env`:
```
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```
In mock mode the UI still creates deals and marks them Confirmed — you just never see the real checkout modal.

---

## 3. Frontend

```bash
cd frontend
yarn install
cp .env.example .env             # REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

Opens at **http://localhost:3000**.

---

## 4. Routes

- `/` — Landing
- `/discover` — Creator search + filters
- `/creators/:id` — Creator profile
- `/services` — Editors / SMMs
- `/auth` — Role picker + signup (mock)
- `/dashboard/brand` — Brand Kanban
- `/dashboard/creator` — Creator earnings + incoming requests

## 5. Auth

Mock auth via `localStorage` — any email + name works. Roles: `brand`, `creator`, `editor`. You can switch roles anytime from `/auth`.

## 6. Reseed database

```
curl -X POST http://localhost:8001/api/seed
```

## 7. Folder structure

```
/backend        FastAPI app (server.py, seed_data.py)
/frontend       React app
  /public/brand/noctra-logo.png   logo asset
  /src
    /pages          Landing, Discover, CreatorProfile, Services, Auth, BrandDashboard, CreatorDashboard
    /components     layout/ (Navbar, Footer, BottomNav), common/ (CreatorCard, TrustRing, Logo, IridescentWordmark, RevealText, EmptyState)
    /lib            api.js, mockAuth.js, format.js
```

## 8. Tech highlights

- **Fraunces** variable font (SOFT axis) for the stretched curvy NOCTRA display
- **Iridescent 3D wordmark** on hero via layered text-shadows + animated gradient clip
- **Word-mask scroll reveals** on hero / manifesto
- **Kanban campaign pipeline** with Requested → Negotiating → Confirmed → Live → Completed
- **Trust score rings** with auto-calculated badges (Verified 80+ / High Engagement 60-79 / Rising Creator 40-59)
- **Mobile-first** — fixed bottom nav, slide-up filter drawer, 44px minimum touch targets
- **Razorpay** production-ready (signature verification + webhook handler), with automatic mock fallback

---

© 2026 Noctra · Built in India
