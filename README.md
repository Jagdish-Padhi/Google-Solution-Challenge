<div align="center">

# **SportShield : AI-Powered Rights Protection & Intelligence**

### **Transforming reactive piracy monitoring into proactive, AI-driven legal enforcement.**

Designed for sports broadcasters, leagues, and digital creators to detect, verify, and resolve media copyright infringements in seconds.

<p>
  <img src="https://img.shields.io/badge/License-MIT-black?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Google_Cloud-Run-4285F4?style=flat-square&logo=googlecloud&logoColor=white" alt="Google Cloud Run" />
</p>

[Overview](#-overview) • [Why SportShield](#-why-sportshield) • [Features](#-features) • [Quick Start](#-quick-start) • [Environment Variables](#-environment-variables) • [Contributing](#-contributing) • [License](#-license)

</div>

---

## 🧭 Overview

Digital piracy costs live sports broadcasters and premium content creators billions of dollars annually. When matches are streamed live on platforms like Telegram, Twitch, or Kick, every minute of delay in taking them down leads to irreversible revenue loss. Traditional methods of finding these streams are fragmented, enforcement (DMCA notices) is slow and manual, and rights holders struggle to collect verifiable evidence.

**SportShield** replaces that scattered flow with an intelligent, end-to-end asset protection engine. It generates unique digital video fingerprints (Content DNA), continuously monitors six major platforms in real-time, validates matches using a hybrid ML pipeline, and automates legal DMCA filing in seconds. 

---

## ⚡ Why SportShield

SportShield transitions piracy monitoring from a reactive, manual effort into an automated, proactive system:

- **6-Platform Aggregated Scan Feed** — Stops rights holders from manual checking; scans YouTube, X (Twitter), Telegram, the open web, Twitch, and Kick.com simultaneously.
- **Accurate DNA Fingerprinting** — Handles mirroring and color shift using OpenCV perceptual hashing (pHash) and keypoint tie-breakers.
- **AI-Powered Validation** — Integrates Google Cloud Vision AI to perform semantic verification (logos, stadiums, jersey matching) to confirm illegal broadcasts.
- **Instant DMCA Enforcement** — Automatically packages court-ready ZIP evidence bundles and drafts legally compliant notices citing BCCI/ICC broadcast rights.

---

## 🧩 Features

### 📂 AI Asset Library
- **Video DNA Ingestion**: Upload reference video highlights or promotional images to generate unique pHash and flipped-pHash DNA footprints.
- **Smart Licensed Content Filtering**: Allows configuring `licensedDomains` and `licensedPartners` on assets so authorized streams are automatically ignored, reducing false-positive overhead.

### 🔍 Intelligent Scan Discovery
- **Platform Connectors**: Scans 6 platforms simultaneously (YouTube, X, Telegram, Web, Twitch, Kick).
- **Keyword Suggestion**: Uses Gemini 1.5 Flash to automatically generate search keywords and query patterns based on asset metadata.

### 📹 Real-Time Livestream Dashboard
- **Livestream Telemetry**: Dedicated live interface tracking scan jobs for custom RTMP/HLS streams, Twitch, and Kick channels.
- **Real-Time Feeds**: Active scan logs and status events updated instantly using Socket.io and Firebase Firestore `onSnapshot`.

### 👥 Creator Portal & Role-Based Access (RBAC)
- **Role Workflows**: Tailored workflows and navigation layouts for **Admin**, **Analyst**, and **Legal** roles, plus independent developer/creator account types.
- **Role Auto-Redirects**: Unified login page that redirects users automatically to their workspace based on permissions.

### 🧠 Upgraded ML Pipeline
- **Mirror-Aware Matcher**: Automatically catches horizontally mirrored reposts by evaluating both standard and flipped pHash DNA.
- **ORB + RANSAC Tie-Breaker**: Uses homographic keypoint matching on borderline matches, boosting confidence rates to 95–99% precision.
- **Cloud Vision Verification**: Matches broadcast logos, stadium visual cues, and player jerseys to add semantic proof to violation files.

### 🛡️ Violation Command Center (USP)
- **Interactive Evidence Audit**: Deep-dive metrics panel displaying similarity percentages (color, Hamming distance, frame matches, ORB verify indicators).
- **One-Click DMCA Draft**: Generates legally valid, platform-specific takedown notices citing BCCI/ICC broadcasting rights.
- **Evidence Packages**: Downloads a ZIP bundle containing the Gemini-drafted notice, Puppeteer screenshot PDF report, and raw metadata.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Vanilla CSS, Socket.io client, Chart.js
- **Backend**: Node.js, Express, MongoDB Atlas, Mongoose
- **ML / Scraper Service**: Python, FastAPI, OpenCV, ORB Keypoint matching, PyTest
- **Google Cloud & AI Integration**: 
  - Gemini 1.5 Flash (keyword suggestion, legal DMCA drafting)
  - Google Cloud Vision API (visual verification check)
  - Google Cloud Translation API (multilingual search keyword expansion)
  - Firebase (Auth, Firestore real-time snapshots, Hosting)
  - Google Cloud Run (Serverless hosting for client, server, and ml-service)
  - YouTube Data API v3 & Google Custom Search Engine (CSE)
- **Notifications**: Brevo (SMTP for weekly digests and high-confidence alerts)
- **Asset Storage**: Cloudinary CDN

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/Google-Solution-Challenge.git
cd Google-Solution-Challenge
```

### 2. Configure Environment Files
Set up the `.env` configuration files in all three sub-directories based on their `.env.example` templates:
- [Backend Config File](file:///Ubuntu/home/jagdish/coding/hacks/Google-Solution-Challenge/server/.env.example)
- [ML Service Config File](file:///Ubuntu/home/jagdish/coding/hacks/Google-Solution-Challenge/ml-service/.env.example)
- [Client Config Details](file:///Ubuntu/home/jagdish/coding/hacks/Google-Solution-Challenge/client/.env)

### 3. Run the ML Service (FastAPI)
```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Run the Express Backend API
```bash
cd server
npm install
npm run dev
```

### 5. Run the React Client
```bash
cd client
npm install
npm run dev
```

---

## ⚙️ Environment Variables

### Backend API — `server/.env`

| Variable | Description |
|---|---|
| `PORT` | Listening port for the API server (e.g. `5000`) |
| `MONGO_URI` | MongoDB connection URL |
| `JWT_SECRET` | Secret key used for signing authentication tokens |
| `CLIENT_URL` | Base URL of the client dashboard (for CORS verification) |
| `ML_SERVICE_URL` | Connection URL for the FastAPI ML service |
| `GEMINI_API_KEY` | Google Gemini API key for keyword generation and legal drafting |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Credentials for video/image asset uploads |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP configuration for email alerts and digests |
| `DIGEST_CRON_SECRET` | Secret key used to verify manual digest trigger runs |

### ML service — `ml-service/.env`

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_VISION_API_KEY` | Google Cloud Vision API key for logo/label verification |
| `YOUTUBE_API_KEY` | YouTube API key for video scraping |
| `GOOGLE_CSE_API_KEY` / `GOOGLE_CSE_CX` | Google Custom Search credentials for web search |
| `YOUTUBE_MAX_RESULTS` / `WEB_MAX_RESULTS` | Limits for scraping queries |

### Client Portal — `client/.env`

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base API URL of the SportShield Express backend |
| `VITE_SOCKET_URL` | WebSocket URL of the Express server |
| `VITE_FIREBASE_API_KEY` / `VITE_FIREBASE_PROJECT_ID` | Firebase frontend configurations for credentials and auth |

---

## 📜 Scripts

### Backend Server (`server`)
- `npm run dev`: Start the API gateway in development watch mode.
- `npm run start`: Run the Node.js production server.
- `npm run lint`: Run ESLint to review code quality.

### React Client (`client`)
- `npm run dev`: Start the Vite development hot-reload server.
- `npm run build`: Compile and build the static frontend.
- `npm run preview`: Run a local preview server for the compiled build.

### ML Service (`ml-service`)
- `uvicorn app.main:app --reload --port 8000`: Start the FastAPI server locally.
- `pytest`: Execute unit and integration tests.

---

## 🤝 Contributing

We welcome contributions to SportShield! Please review our [Contributing Guidelines](CONTRIBUTING.md) and [Security Policy](SECURITY.md) before submitting pull requests.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
