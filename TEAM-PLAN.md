# 🛡️ SportShield — Digital Content Protection System
## MVP Implementation Plan | Google Solution Challenge Hackathon

> **Team:** 3× MERN + GenAI/Scraping · 1× MERN + ML (model training)
> **Branch Strategy:** Feature-wise branches → merge to `main` after each phase
> **Stack:** MongoDB · Express · React · Node.js · Python (ML microservice) · Google Cloud

---

## 👥 Team Roles Reference

| Member | Skills | Alias |
|--------|--------|-------|
| Member 1 | MERN + GenAI + Scraping | **M1** |
| Member 2 | MERN + GenAI + Scraping | **M2** |
| Member 3 | MERN + GenAI + Scraping | **M3** |
| Member 4 | MERN + ML (model training) | **M4** |

---

## 🗂️ Repository Structure (agree on Day 0)

```
sportshield/
├── client/                  # React frontend (Vite)
├── server/                  # Express + Node.js backend
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   └── jobs/                # cron/scheduler jobs
├── ml-service/              # Python FastAPI microservice
│   ├── fingerprint/
│   ├── matching/
│   └── scraper/
├── docs/
└── docker-compose.yml
```

---

## ⚙️ Phase 0 — Project Bootstrap & Architecture Agreement
**Duration:** Day 1 | **Branch:** `chore/bootstrap-setup`

> 🎯 **Goal:** Everyone has a running local environment. No features yet, just wiring.

### Tasks (Everyone Together — ~3 hrs)

**M1 — Backend Init**
- [ ] Init Express app with folder structure above
- [ ] Add `.env.example` with all needed keys (MongoDB URI, JWT secret, port)
- [ ] Setup `server/app.js` with CORS, helmet, morgan
- [ ] Create `/api/health` route → returns `{ status: "ok", timestamp }` 

**M2 — Frontend Init**
- [ ] Init React + Vite app
- [ ] Install: `react-router-dom`, `axios`, `react-hot-toast`, `zustand` (state), `tailwindcss`
- [ ] Create basic layout shell: `Navbar`, `Sidebar` placeholder, `<Outlet />` for routes
- [ ] Setup Axios base instance pointing to backend

**M3 — ML Service Init**
- [ ] Init Python FastAPI app in `ml-service/`
- [ ] Add `requirements.txt`: `fastapi`, `uvicorn`, `Pillow`, `imagehash`, `videohash`, `opencv-python`, `pymongo`, `requests`
- [ ] Create `/health` endpoint in FastAPI
- [ ] Write `docker-compose.yml` to spin up Node server + FastAPI together

**M4 — Database + DevOps**
- [ ] Setup MongoDB Atlas free cluster, share connection string with team
- [ ] Create `docker-compose.yml` for local dev (MongoDB container fallback)
- [ ] Write `README.md` with setup steps for all 3 services
- [ ] Setup GitHub repo, branch protection rules (no direct push to `main`)

### ✅ Phase 0 Test (After merge)
```
1. cd server && npm run dev → GET /api/health returns 200 ✓
2. cd client && npm run dev → App shell loads without errors ✓  
3. cd ml-service && uvicorn main:app → GET /health returns 200 ✓
4. docker-compose up → all 3 services run together ✓
```

---

## 🔐 Phase 1 — Authentication & Organization Management
**Duration:** Days 2–3 | **Branches:** `feature/auth-backend` · `feature/auth-frontend`

> 🎯 **Goal:** A sports organization can register, login, and see a blank dashboard.

### M1 — Backend: Auth Routes
- [ ] `POST /api/auth/register` — org name, email, password (bcrypt hash)
- [ ] `POST /api/auth/login` — returns JWT (15min access + 7day refresh token)
- [ ] `POST /api/auth/refresh` — refresh token rotation
- [ ] `POST /api/auth/logout`
- [ ] Auth middleware `verifyToken.js` — protect all future routes

**MongoDB Models:**
```js
// Organization model
{
  orgName: String,
  email: { type: String, unique: true },
  passwordHash: String,
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  createdAt: Date,
  contentCount: { type: Number, default: 0 },
  alertCount: { type: Number, default: 0 }
}
```

### M2 — Frontend: Auth Pages
- [ ] `/register` page — org name, email, password, confirm password
- [ ] `/login` page
- [ ] Zustand `authStore` — store `{ user, accessToken, isLoggedIn }`
- [ ] Axios interceptor — auto-attach Bearer token to all requests
- [ ] Protected route wrapper `<PrivateRoute>`
- [ ] Auto-redirect to `/dashboard` on login, `/login` on 401

### M3 — Backend: Dashboard Stats Stub
- [ ] `GET /api/dashboard/stats` (protected) → returns mock data for now:
  ```json
  { "totalAssets": 0, "activeScans": 0, "violations": 0, "alertsSent": 0 }
  ```
- [ ] Setup basic Express error handler middleware

### M4 — DB Indexes + Security
- [ ] Add email index on Organization model
- [ ] Add rate limiter to auth routes (`express-rate-limit`: 10 req/15min)
- [ ] Add `helmet` and `express-mongo-sanitize`
- [ ] Test all auth routes with Postman, share collection with team

### ✅ Phase 1 Test (After merge)
```
1. Register a new org "Test FC" → success toast, redirect to dashboard ✓
2. Login with wrong password → 401 error message shown ✓
3. Access /dashboard without token → redirect to /login ✓
4. JWT expires simulation → refresh token rotates silently ✓
5. Dashboard loads with zeros (no data yet) ✓
```

---

## 📁 Phase 2 — Content Asset Upload & Registration
**Duration:** Days 4–6 | **Branches:** `feature/asset-upload-backend` · `feature/asset-upload-frontend` · `feature/fingerprint-engine`

> 🎯 **Goal:** An org can upload a video/image, it gets stored and fingerprinted. This fingerprint becomes the "DNA" of their content.

### M1 — Backend: Asset Upload API
- [ ] `POST /api/assets/upload` — multipart form (video or image)
  - Use `multer` + store on **Google Cloud Storage** (GCS)
  - After upload, call the ML service to generate fingerprint
  - Save asset record to MongoDB
- [ ] `GET /api/assets` — list all assets for logged-in org (paginated)
- [ ] `GET /api/assets/:id` — single asset detail
- [ ] `DELETE /api/assets/:id` — soft delete

**MongoDB Model:**
```js
// Asset model
{
  orgId: ObjectId (ref: Organization),
  title: String,
  type: { type: String, enum: ['video', 'image', 'highlight'] },
  gcsUrl: String,         // original file in GCS
  thumbnailUrl: String,
  fingerprint: {
    pHash: String,        // perceptual hash (64-bit hex)
    videoHash: String,    // for videos: videohash value
    colorHistogram: [Number], // extra signal for matching
  },
  duration: Number,       // seconds (video only)
  fileSize: Number,
  status: { type: String, enum: ['processing', 'active', 'deleted'], default: 'processing' },
  uploadedAt: Date,
  violationsFound: { type: Number, default: 0 }
}
```

### M2 — Frontend: Asset Upload UI
- [ ] `/dashboard/assets` page — asset library with grid/list toggle
- [ ] Upload modal — drag & drop zone + file picker
  - Accept: `video/mp4`, `video/mov`, `image/jpeg`, `image/png`
  - Show upload progress bar (Axios onUploadProgress)
  - Show "Processing fingerprint..." spinner after upload
- [ ] Asset card component — thumbnail, title, type badge, violation count
- [ ] Asset detail modal — show fingerprint hash (last 8 chars displayed), stats

### M3 — Frontend: Dashboard Overview
- [ ] `/dashboard` — stat cards: Total Assets, Active Scans, Violations, Alerts
- [ ] Recent activity feed (stubbed with empty state for now)
- [ ] Wire up `GET /api/dashboard/stats` (real data starts here)
- [ ] Responsive layout — works on mobile (judges may view on phone)

### M4 — ML Service: Fingerprint Engine
- [ ] `POST /ml/fingerprint` endpoint in FastAPI
  - Input: GCS URL of the file
  - For **images**: compute `imagehash.phash()` + color histogram (OpenCV)
  - For **videos**: extract keyframes every 2s, compute `videohash`, compute per-frame pHash
  - Return: `{ pHash, videoHash, colorHistogram, frameHashes[] }`
- [ ] Store fingerprints in MongoDB `fingerprints` collection (for fast lookup)
- [ ] Unit test: upload same image → same pHash every time ✓
- [ ] Unit test: upload cropped version → pHash differs by < 10 bits (Hamming) ✓

> 🧠 **Out-of-box Tip — Phase 2:**
> Most teams just store one hash. Instead, store a **"fingerprint bundle"** — pHash + color histogram + 3 keyframe hashes. This gives you 3 chances to match even if pirates crop, recolor, or trim the video. Think of it like facial recognition using eyes + nose + jawline separately, then voting. This hybrid multi-signal approach will genuinely impress judges.

### ✅ Phase 2 Test (After merge)
```
1. Upload a JPG → asset appears in library, status changes from "processing" → "active" ✓
2. Upload an MP4 → thumbnail auto-generated, fingerprint stored ✓
3. Fingerprint displayed on asset detail page ✓
4. Upload same file twice → both have identical pHash ✓
5. Try uploading .exe → blocked with validation error ✓
6. Dashboard stat "Total Assets" increments ✓
```

---

## 🕷️ Phase 3 — Web Scraper & Content Discovery Engine
**Duration:** Days 7–10 | **Branches:** `feature/scraper-engine` · `feature/scan-job-backend` · `feature/scan-ui`

> 🎯 **Goal:** The system can actively go out and look for content on the internet. This is the "Google for stolen content" part.

### M1 — Scraper: Social Media & Web Scanner (Python)
Build modular scrapers in `ml-service/scraper/`:

**Tier 1 — Publicly accessible (no login needed):**
- [ ] `twitter_scraper.py` — use `snscrape` or Twitter/X search URL scraping; search by hashtag + keywords (e.g. "Manchester City highlights")
- [ ] `youtube_scraper.py` — use YouTube Data API v3 (free, 10k units/day)
  - Search for video titles matching registered content
  - Grab video URLs, thumbnails, channel info
- [ ] `web_scraper.py` — use `requests` + `BeautifulSoup` on Google search results
  - Construct queries like `"<asset title>" site:- youtube.com` to find non-YT hosts
- [ ] `telegram_public_scraper.py` — scrape public Telegram channel posts via `t.me/<channel>/` web URLs (public channels only, no bot token needed)

**Scraped Result Model:**
```js
{
  scanJobId: ObjectId,
  sourceUrl: String,
  platform: String,      // 'youtube' | 'twitter' | 'telegram' | 'web'
  thumbnailUrl: String,  // scraped image to fingerprint
  videoUrl: String,      // if video found
  pageTitle: String,
  scrapedAt: Date,
  status: 'pending_match' | 'matched' | 'no_match'
}
```

### M2 — Backend: Scan Job Orchestrator
- [ ] `POST /api/scans/start` — create a scan job for an asset
  - Payload: `{ assetId, searchKeywords[], platforms[] }`
  - Calls ML service to kick off scraping
  - Returns `scanJobId`
- [ ] `GET /api/scans/:jobId/status` — poll scan status
- [ ] `GET /api/scans` — list all scans for org
- [ ] MongoDB `ScanJob` model:
  ```js
  {
    orgId: ObjectId,
    assetId: ObjectId,
    status: 'queued' | 'running' | 'completed' | 'failed',
    platforms: [String],
    keywords: [String],
    resultsCount: Number,
    violationsCount: Number,
    startedAt: Date,
    completedAt: Date
  }
  ```
- [ ] Setup `node-cron` for scheduled scans (every 6 hours per asset)

### M3 — Frontend: Scan Management UI
- [ ] `/dashboard/scans` — list scan jobs with status badges
- [ ] "Start New Scan" modal — select asset, enter keywords, pick platforms (checkboxes)
- [ ] Real-time scan progress — poll `GET /api/scans/:id/status` every 5s using `setInterval`
- [ ] Scan result page — table of found URLs with platform icons
- [ ] Status chips: 🟡 Scanning · 🟢 Complete · 🔴 Violations Found

### M4 — ML Service: Scan Coordinator
- [ ] `POST /ml/scan` endpoint — accept `{ assetId, keywords, platforms }`
  - Spawns async background task (use Python `asyncio` + `BackgroundTasks`)
  - Runs each enabled scraper in parallel (ThreadPoolExecutor)
  - For each scraped thumbnail/frame: download + compute pHash
  - Update job status in MongoDB directly
- [ ] Implement retry logic — if scraper fails, retry up to 3× with exponential backoff
- [ ] Rate limiting within scrapers — add `time.sleep(1)` between requests to avoid getting blocked

> 🧠 **Out-of-box Tip — Phase 3:**
> Instead of only text-keyword searching, also generate **"semantic search queries"** using a small LLM call (Google Gemini free tier). Feed it: "This is a 45-second clip from a Premier League match, June 2024, showing a penalty goal." → Gemini outputs 5 creative search queries a pirate might actually use. This dramatically improves discovery rate. No other hackathon team will think of this.

> 🧠 **Extra Edge:** Track scrape results over time. If the same URL was found last week AND this week, it's a **persistent violation** (harder to ignore). Flag these separately — they show the system doing ongoing monitoring, not just one-shot detection.

### ✅ Phase 3 Test (After merge)
```
1. Start a scan for an uploaded asset → scan job appears with "queued" status ✓
2. Scan transitions: queued → running → completed ✓
3. YouTube scraper returns at least 3–5 results for any keyword ✓
4. Results appear in scan results table with platform, URL, title ✓
5. Scheduled scan (cron) fires correctly (test with 1-min interval) ✓
6. Scan fails gracefully if network is down → status "failed", error saved ✓
```

---

## 🔍 Phase 4 — Fingerprint Matching & Violation Detection
**Duration:** Days 11–14 | **Branches:** `feature/matching-engine` · `feature/violation-backend` · `feature/violation-ui`

> 🎯 **Goal:** The system compares scraped content against registered fingerprints and flags real violations. This is the brain of the product.

### M4 — ML Service: Matching Engine (Core AI)
This is the most critical phase. M4 leads this entirely.

**Algorithm: Multi-Signal Matching Pipeline**
```
Input: scraped_url
↓
Step 1: Download thumbnail/frame from scraped URL
Step 2: Compute pHash of scraped content
Step 3: Query MongoDB fingerprints collection
         → Find all fingerprints where Hamming(scraped_pHash, stored_pHash) < threshold
Step 4: For candidates with distance < 15: run secondary checks
         → Color histogram cosine similarity > 0.85?
         → Any keyframe match within Hamming < 10?
Step 5: Compute confidence score (0–100)
         → < 30: no match
         → 30–70: suspicious (needs review)  
         → > 70: high-confidence violation
Step 6: Save to Violations collection
```

- [ ] `POST /ml/match` — takes `{ scrapedUrl, scrapedThumbnailUrl }`, returns match results
- [ ] Implement Hamming distance function (can use `imagehash` library's built-in `-` operator)
- [ ] **Robustness tests** — test matching survives:
  - [ ] 10% crop ✓
  - [ ] Brightness adjustment ✓
  - [ ] Added text overlay / watermark ✓
  - [ ] Compression artifacts (re-saved JPEG) ✓
  - [ ] Aspect ratio change ✓
- [ ] Tune threshold (start at Hamming ≤ 12 for images, experiment)

**MongoDB Model — Violation:**
```js
{
  orgId: ObjectId,
  assetId: ObjectId,
  scanJobId: ObjectId,
  sourceUrl: String,
  platform: String,
  screenshotUrl: String,   // auto-captured screenshot for evidence
  matchConfidence: Number, // 0-100
  matchType: String,       // 'exact' | 'near-duplicate' | 'partial'
  status: String,          // 'open' | 'reported' | 'resolved' | 'false_positive'
  evidenceBundle: {
    hammingDistance: Number,
    colorSimilarity: Number,
    frameMatchCount: Number,
  },
  detectedAt: Date,
  resolvedAt: Date
}
```

### M1 — Backend: Violation Management API
- [ ] `GET /api/violations` — list violations for org (filter by status, platform, date)
- [ ] `GET /api/violations/:id` — detail with evidence bundle
- [ ] `PATCH /api/violations/:id/status` — mark as reported/resolved/false positive
- [ ] `POST /api/violations/:id/screenshot` — trigger headless screenshot capture
  - Use `puppeteer` in Node.js to take a screenshot of the offending URL
  - Save to GCS as evidence
- [ ] Dashboard stats endpoint now returns real violation count

### M2 — Backend: Auto-Match Trigger
- [ ] After each scrape job completes, auto-trigger matching:
  - Scraper saves results → emits event → match job starts
  - Implement with simple EventEmitter (or Bull queue if time allows)
- [ ] Batch matching: process up to 50 scraped URLs per job
- [ ] Save violations + update asset's `violationsFound` count

### M3 — Frontend: Violations Dashboard
- [ ] `/dashboard/violations` — table with filters (platform, confidence, status, date)
- [ ] Violation card — shows: platform icon, source URL, confidence badge (color coded), screenshot preview, "View Evidence" button
- [ ] Evidence modal — side-by-side: original asset thumbnail vs. scraped thumbnail, match confidence, Hamming distance breakdown
- [ ] Status buttons — "Mark as Reported" / "False Positive" / "Resolved"
- [ ] Bulk action — select multiple violations → bulk report

> 🧠 **Out-of-box Tip — Phase 4:**
> Add a **"Confidence Explainability" panel** in the evidence modal. Show a small visual that breaks down WHY the system thinks it's a match:
> - Perceptual Hash: 94% similar 🟢
> - Color Profile: 87% similar 🟡
> - Keyframe 2/3 matched 🟢
> 
> This is inspired by how Shazam shows the "audio fingerprint match" process. Judges LOVE when AI explains its own reasoning. Most AI tools are black boxes — you'd stand out.

> 🧠 **Extra Edge:** Build a **"False Positive Learning"** loop. Every time a user marks something as False Positive, store that pair. After 5 false positives from the same source domain, auto-flag that domain as "known safe" and suppress future matches. This is how YouTube's ContentID actually works under the hood.

### ✅ Phase 4 Test (After merge)
```
1. Upload Image A → start scan → matching pipeline runs ✓
2. Upload a slightly cropped version as "scraped content" → system flags it ✓
3. Confidence score shown correctly (0–100) ✓
4. Screenshot captured and stored for evidence ✓
5. Mark violation as "reported" → status updates ✓
6. Completely different image → no false positive match ✓
7. Dashboard violation count updates in real-time ✓
```

---

## 🔔 Phase 5 — Real-Time Alerts & Notification System
**Duration:** Days 15–17 | **Branches:** `feature/alerts-backend` · `feature/alerts-frontend` · `feature/email-notifications`

> 🎯 **Goal:** Organization immediately knows when their content is stolen. Alerts are actionable.

### M2 — Backend: Alert Engine
- [ ] Create `Alert` model:
  ```js
  {
    orgId: ObjectId,
    violationId: ObjectId,
    type: String,          // 'new_violation' | 'high_confidence' | 'platform_surge'
    severity: String,      // 'low' | 'medium' | 'high' | 'critical'
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    channels: [String],    // ['in-app', 'email']
    createdAt: Date
  }
  ```
- [ ] Alert trigger logic — fire when:
  - New violation with confidence > 70 → `high_confidence` alert
  - 5+ violations from same platform in 1hr → `platform_surge` alert
  - New violation found → `new_violation` alert
- [ ] `GET /api/alerts` — unread count + list
- [ ] `PATCH /api/alerts/:id/read` · `PATCH /api/alerts/read-all`

### M1 — Backend: Email Notifications
- [ ] Integrate **Nodemailer** + Gmail OAuth2 (or SendGrid free tier)
- [ ] Email template for new violation alert:
  - Subject: `⚠️ Your content was found on [Platform]`
  - Body: asset thumbnail, violating URL, confidence score, "View Details" link
- [ ] Email template for weekly digest
- [ ] Notification preference endpoint: `PATCH /api/orgs/notification-prefs`
  ```js
  { emailOnHighConfidence: Boolean, emailDigest: Boolean, inAppAlerts: Boolean }
  ```

### M3 — Backend + Frontend: WebSocket Real-time Push
- [ ] Add `socket.io` to Express server
- [ ] Server emits `new_alert` event to org's private room on violation detection
- [ ] Frontend: connect to Socket.io on dashboard load
  - Show toast notification on `new_alert` event
  - Update unread alert badge in navbar without page refresh
  - Play notification sound (optional)
- [ ] Alert center page `/dashboard/alerts` — list of all alerts, filter by severity

### M4 — Alert Intelligence
- [ ] **Platform surge detection** — if same content appears on >3 URLs in <1hr, escalate severity to CRITICAL
- [ ] **Geo clustering** (bonus) — if violations cluster by country (scraped IP region), flag regional piracy ring
- [ ] Weekly digest job (cron every Monday 9 AM) — aggregate last 7 days, send email

> 🧠 **Out-of-box Tip — Phase 5:**
> Build a **"Piracy Heat Map"** alert type. When multiple violations are found on the same piracy platform within a short window, instead of sending 10 separate alerts, send 1 "Surge Alert" with a mini-timeline: "Your content appeared on Telegram 7 times in the last 2 hours." This reduces alert fatigue — a real UX problem that enterprise clients pay millions to solve.

### ✅ Phase 5 Test (After merge)
```
1. Trigger a violation manually → in-app alert appears in <2s via WebSocket ✓
2. Alert badge shows unread count, clears on "read all" ✓
3. Email received for high-confidence violation ✓
4. 5 violations in 1hr → "platform_surge" alert generated ✓
5. Notification preferences respected (disable email → no email) ✓
6. Alert page lists all alerts with severity color coding ✓
```

---

## 📊 Phase 6 — Analytics Dashboard & Reports
**Duration:** Days 18–20 | **Branches:** `feature/analytics-backend` · `feature/analytics-frontend` · `feature/pdf-report`

> 🎯 **Goal:** Turn raw violation data into actionable intelligence. This is what makes it a product, not just a tool.

### M3 — Backend: Analytics API
- [ ] `GET /api/analytics/overview` — returns:
  ```json
  {
    "violationsLast7Days": [...daily counts],
    "platformBreakdown": { "youtube": 12, "telegram": 8, "web": 3 },
    "topViolatedAssets": [...top 5 assets by violation count],
    "avgConfidenceScore": 84.2,
    "resolutionRate": 0.67
  }
  ```
- [ ] `GET /api/analytics/timeline?range=30d` — violations per day over period
- [ ] `GET /api/analytics/platforms` — pie chart data by platform

### M2 — Frontend: Charts & Analytics UI
- [ ] Install `recharts` (or Chart.js)
- [ ] Analytics page `/dashboard/analytics`:
  - Line chart: Violations over time (7d / 30d toggle)
  - Pie chart: Platform distribution
  - Bar chart: Top 5 most violated assets
  - Stat cards: Total violations, Resolved %, Avg confidence
- [ ] Date range picker for filtering

### M1 — PDF Report Generator
- [ ] `POST /api/reports/generate` — generate PDF report for a date range
- [ ] Use `puppeteer` to render an HTML report page → PDF
- [ ] Report includes: org name, date range, violations summary, top violations table, platform breakdown chart
- [ ] `GET /api/reports` — list generated reports
- [ ] Frontend: "Generate Report" button on analytics page → download link

### M4 — ML Analytics: Trend Prediction (Bonus if time)
- [ ] Simple trend analysis: if violations increased 50% week-over-week, flag "Rising Piracy Activity"
- [ ] `GET /api/analytics/trends` — returns trend indicators per asset
- [ ] ML microservice: compute 7-day moving average of violation counts per asset

> 🧠 **Out-of-box Tip — Phase 6:**
> Add a **"Revenue Impact Estimator"** on the analytics page. Ask orgs to input their average video view value (e.g., ₹0.10 per view for ad revenue). Multiply by estimated pirate view count (use the platform's public engagement metrics from scraping). Show: "Estimated revenue lost this week: ₹12,400". This reframes the tool from "security" to "business ROI" — which is how enterprise deals get signed. Hackathon judges from Google love business-aware thinking.

### ✅ Phase 6 Test (After merge)
```
1. Analytics page loads with real data from DB ✓
2. Charts render correctly (no empty states with data present) ✓
3. Date range filter changes chart data ✓
4. Generate Report button produces downloadable PDF ✓
5. PDF contains correct org name, dates, and violation counts ✓
```

---

## 🌐 Phase 7 — Google Integration & Cloud Features
**Duration:** Days 21–23 | **Branches:** `feature/google-cloud-integration`

> 🎯 **Goal:** Leverage Google Cloud for extra credibility and performance. This is the "Solution Challenge" alignment phase.

### M4 — Google Vision API Integration
- [ ] Replace basic pHash-only matching with **Google Cloud Vision API** as a secondary verifier
  - For suspected violations with confidence 40–70% (gray zone), call Vision API to get image labels and objects
  - If labels overlap significantly (e.g., both have "soccer ball", "stadium", "crowd"), boost confidence
- [ ] This catches cases where pHash is fooled by heavy cropping but semantic content is same

### M1 — Google Cloud Storage (already used, now formalize)
- [ ] Evidence screenshots stored in GCS bucket
- [ ] Signed URLs for time-limited access to private assets
- [ ] Lifecycle policy: auto-delete resolved violation screenshots after 90 days

### M2 — Google Gemini Integration (GenAI Feature)
- [ ] **Smart Keyword Generator** — org uploads asset, Gemini analyzes thumbnail and auto-suggests 10 search keywords for scanning
  - Endpoint: `POST /api/assets/:id/suggest-keywords`
  - Gemini prompt: "Given this sports media thumbnail, generate 10 search queries a pirate might use to share this content on social media"
- [ ] Show keyword suggestions in "Start Scan" modal with checkboxes
- [ ] **Violation Report Writer** — use Gemini to auto-generate a formal DMCA takedown notice draft
  - Endpoint: `POST /api/violations/:id/draft-dmca`
  - One-click export to PDF

### M3 — Google Translate for Multi-language Scraping
- [ ] When scanning, translate keywords into top 5 languages (Spanish, Arabic, Hindi, Portuguese, French) using Google Translate API
- [ ] Search for pirated content in non-English spaces (hugely underserved by competitors)
- [ ] `POST /api/scans/start` now accepts `multiLanguage: Boolean` flag

> 🧠 **Out-of-box Tip — Phase 7:**
> The **DMCA auto-draft feature** using Gemini is a killer differentiator. Currently, rights holders spend hours writing takedown notices. Your tool does it in one click. Add a "Copy to clipboard" button and a direct mailto link prefilled with the offending platform's abuse email. This turns detection → action in under 60 seconds. That's a real product feature, not a demo trick.

### ✅ Phase 7 Test (After merge)
```
1. Keyword suggestion returns 10 relevant keywords for a sports video ✓
2. Multi-language scan returns results in Spanish/Arabic ✓
3. Google Vision API correctly boosts a borderline match ✓
4. DMCA notice draft generated with correct violation details ✓
5. GCS signed URLs expire after set time ✓
```

---

## 🎨 Phase 8 — UI Polish, Edge Cases & Demo Prep
**Duration:** Days 24–26 | **Branches:** `feature/ui-polish` · `feature/demo-data`

> 🎯 **Goal:** App looks polished, handles errors gracefully, and is demo-ready.

### All Members (split among yourselves)

**M1 — Error Handling & Loading States**
- [ ] Add proper loading skeletons to all data-heavy pages
- [ ] Global error boundary in React
- [ ] Empty states with helpful CTAs ("Upload your first asset →")
- [ ] All API errors show user-friendly messages via toast

**M2 — Demo Data Seeder**
- [ ] Write `server/scripts/seed.js` — populates DB with:
  - 1 demo org account (`demo@sportshield.com` / `demo1234`)
  - 5 pre-uploaded assets (use royalty-free sports images/clips)
  - 20 pre-seeded violations across platforms
  - Historical scan jobs
- [ ] `npm run seed` command in package.json
- [ ] This ensures demo runs even if live scraping is slow

**M3 — Mobile Responsiveness**
- [ ] Test all pages on mobile viewport (375px)
- [ ] Sidebar collapses to hamburger menu on mobile
- [ ] Tables switch to card layout on mobile
- [ ] Modals full-screen on mobile

**M4 — Performance + Final QA**
- [ ] MongoDB indexes on: `orgId`, `assetId`, `violationStatus`, `createdAt` on all major collections
- [ ] Add API response caching (simple in-memory or Redis) for analytics endpoints
- [ ] Final end-to-end test: upload → scan → match → alert → report
- [ ] Deploy to **Google Cloud Run** (ML service) + **Railway/Render** (Node) + **Vercel** (React)

### ✅ Phase 8 Final System Test
```
FULL DEMO FLOW (run this before every presentation):
1. Login with demo account ✓
2. Dashboard shows populated stats ✓
3. Go to Assets → upload a new image ✓
4. Click "Start Scan" on the new asset ✓
5. Watch scan run → violations appear ✓
6. WebSocket alert fires in navbar ✓
7. Click violation → see evidence comparison modal ✓
8. Click "Draft DMCA" → Gemini generates notice ✓
9. Go to Analytics → charts show real data ✓
10. Generate PDF report → downloads ✓
```

---

## 🌿 Git Branch Workflow

```
main
├── Phase 0: chore/bootstrap-setup
├── Phase 1: feature/auth-backend + feature/auth-frontend
├── Phase 2: feature/asset-upload-backend + feature/asset-upload-frontend + feature/fingerprint-engine
├── Phase 3: feature/scraper-engine + feature/scan-job-backend + feature/scan-ui
├── Phase 4: feature/matching-engine + feature/violation-backend + feature/violation-ui
├── Phase 5: feature/alerts-backend + feature/alerts-frontend + feature/email-notifications
├── Phase 6: feature/analytics-backend + feature/analytics-frontend + feature/pdf-report
├── Phase 7: feature/google-cloud-integration
└── Phase 8: feature/ui-polish + feature/demo-data
```

**Rules:**
- Never push directly to `main`
- Always open a PR, get at least 1 teammate to review
- Run local tests before PR
- Merge only when phase test checklist passes
- Commit message format: `feat(scope): what you did`

---

## 🛠️ Full Tech Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite + Tailwind | Fast dev, clean UI |
| State | Zustand | Simpler than Redux |
| Backend | Express + Node.js | MERN comfort zone |
| Database | MongoDB Atlas | Flexible schema for assets |
| ML Service | FastAPI (Python) | Perfect for ML + async |
| Fingerprinting | imagehash, videohash, OpenCV | Battle-tested, open source |
| Scraping | requests, BeautifulSoup, yt-dlp | Reliable scraping stack |
| Real-time | Socket.io | Easy WebSocket layer |
| Email | Nodemailer / SendGrid | Free tier sufficient |
| File Storage | Google Cloud Storage | Required for GCP alignment |
| AI | Google Gemini API + Vision API | Free tier, Google alignment |
| PDF | Puppeteer | Reliable HTML→PDF |
| Deployment | Cloud Run + Vercel | Free tier, fast CI/CD |

---

## 💡 Standout Ideas to Explore (Pick 1–2 if time allows)

1. **Browser Extension** — A Chrome extension that shows a badge on any page where it detects content matching the org's fingerprint database. Install it, visit the pirated page, it glows red. Mind-blowing demo moment.

2. **Content DNA Timeline** — Show a visual "family tree" of how content spread. Original post → shared to Telegram → reposted to 3 websites. Like a virus spread map. Use D3.js force graph.

3. **Piracy Leaderboard (Internal)** — Show which piracy platforms are the worst offenders for each sport (Football / Cricket / Basketball). Give it a name like "Piracy Index". Publishable data that sports orgs would pay for.

4. **One-Click Reporting** — Integrate directly with YouTube's Content ID API (they have a reporting endpoint) so violations on YouTube can be reported in 1 click from your dashboard.

5. **Webhook Integrations** — Let orgs connect Slack/Discord. When a violation is found, a message appears in their #anti-piracy channel. Very 2025, very enterprise-ready.

---

## ⏱️ Timeline Summary

| Phase | What | Days | Status |
|-------|------|------|--------|
| 0 | Bootstrap | 1 | ⬜ |
| 1 | Auth | 2–3 | ⬜ |
| 2 | Upload + Fingerprint | 4–6 | ⬜ |
| 3 | Scraper + Scanner | 7–10 | ⬜ |
| 4 | Matching + Violations | 11–14 | ⬜ |
| 5 | Alerts + Notifications | 15–17 | ⬜ |
| 6 | Analytics + Reports | 18–20 | ⬜ |
| 7 | Google Cloud Integration | 21–23 | ⬜ |
| 8 | Polish + Demo Prep | 24–26 | ⬜ |

**Buffer:** Keep Days 27–28 for bugs, rehearsing the demo, and submission.

---

*Built for Google Solution Challenge · SportShield MVP v1.0*
*"Your content, tracked everywhere, protected always."*
