# 🛡️ SportShield : AI-Powered Rights Protection & Intelligence

**Hackathon:** Google Solution Challenge 2026 | **Team:** Esc(Reality); | **Track:** Digital Asset Protection

> Transforming reactive piracy monitoring into proactive, AI-driven legal enforcement through real-time fingerprinting and automated DMCA resolution.

---

## 🔗 Quick Links (For Real experience)

| 🚀 Live Demo | 🎥 Video Walkthrough | 📊 Presentation |
|:------------:|:-------------------:|:---------------:|
| [**Launch App**](https://sportshield-ten.vercel.app/) | [**Watch Demo**](https://www.youtube.com/watch?v=LNHvwYCQkd8) | [**View PPT**](https://canva.link/wcxppf1vd2k979i) |

---

## 🎯 Problem Statement
Digital piracy in live sports and premium content costs broadcasters billions annually. Current detection methods are fragmented, often failing to track content across diverse platforms like Telegram and Twitter. Even when detected, the legal enforcement process (DMCA filing) is manual, slow, and lacks the hard technical evidence needed for rapid takedowns.

## 💡 Solution
SportShield is an end-to-end intelligence suite that protects digital assets using **AI Video DNA Fingerprinting**. It monitors major social platforms and the open web in real-time, provides deep technical evidence (Hamming distance, frame similarity), and bridges the gap to enforcement with **AI-powered DMCA drafting**, allowing rights holders to go from "detection" to "takedown" in seconds.



## 🚀 Key Features

### ✅ AI Asset Library
- **Video DNA Ingestion**: Upload match highlights or images to generate a unique digital fingerprint.
- **Asset Intelligence**: View similarity metrics and tracking history for every protected file.
- **Cloud Management**: Secure storage and metadata management for corporate rights holders.

### ✅ Intelligent Scan Discovery
- **Cross-Platform Monitoring**: Scans YouTube, Twitter (X), Telegram, and the open web simultaneously.
- **AI Auto-Suggest**: Automatically generates search keywords and metadata based on asset context.
- **Confidence Scoring**: Prioritizes results based on AI-calculated match probability.

### ✅ Violation Command Center (USP)
- **Evidence Audit**: Deep-dive into match explainability (Color similarity, Hamming distance, Frame match count).
- **One-Click DMCA Draft**: Instantly generates legally-compliant, platform-specific takedown notices.
- **Resolution Workflow**: Track cases through `OPEN` → `REPORTED` → `RESOLVED` statuses.
- **Deep Linking**: Direct navigation from email alerts to specific evidence records.

### ✅ Intelligence Analytics
- **Professional Reporting**: Generate high-fidelity PDF reports with embedded SVG charts.
- **Background Ops**: Start complex report generation and continue working; the service follows you globally.
- **Risk Assessment**: Automated AI insights into piracy hotspots and distribution trends.

### ✅ Real-Time Alerts
- **High-Confidence Notifications**: Instant email alerts for matches >85% similarity.
- **Piracy Surge Alerts**: Automated warnings for coordinated sharing (e.g., 5+ links in 1 hour).
- **Direct Enforcement Links**: "View Evidence" buttons in emails take you straight to the action.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Vanilla CSS (Premium Themes), Lucide Icons, Chart.js |
| **Backend** | Node.js, Express.js, MongoDB Atlas (Mongoose) |
| **ML/Scraping** | Python, FastAPI, Puppeteer (PDF Rendering), Image/Video Hashing |
| **Integrations** | Brevo (Email), Cloudinary (Asset Hosting), Gemini AI (Legal Drafting) |
| **Auth** | JWT (Access + Refresh Tokens), Firebase (Social Login) |

---

## 🌐 Google Technologies Used

| Google Technology | Implementation Detail | Status |
|-------------------|-----------------------|--------|
| **Gemini Pro (Google AI)** | **AI Enforcement:** Generates high-accuracy legal context and platform-specific DMCA drafts in <3s using structured JSON outputs. | 🚀 Active |
| **Firebase Authentication** | **Identity Management:** Seamless Google One-Tap integration for verified rights-holder sessions. | 🚀 Active |
| **Google Cloud Platform** | **Microservice Target:** Proposed for serverless Cloud Run deployment to handle bursty ML workloads during live match events. | 🛡️ Target |
| **Chrome DevTools Protocol** | **Evidence Engine:** Native Puppeteer integration for high-fidelity PDF renders and automated screenshot evidence. | 🚀 Active |
| **Google Search API** | **Smart Scrapers:** Used specialized Puppeteer nodes to bypass **API rate-limits** and monitor dynamic 'pirate' domains in real-time. | 💎 Optimized |
| **Google Vision AI** | **Hybrid Matching:** Local **pHash & Transformers** used for 1M+ frame analysis to ensure **low-latency throughput** and cost scaling. | 💎 Optimized |
| **Google Maps Platform** | **Tactical Viz:** SVG-based Geo-Mapping used for **zero-latency distribution tracking** during high-traffic match windows. | 💎 Optimized |

---

## ⚡ Quick Start

```bash
# Clone repository
git clone <repo-url>
cd SportShield

# Backend setup
cd server
npm install
# Configure .env (MONGO_URI, BREVO_API_KEY, etc.)
npm run dev           # Runs on :5000

# ML/Scraper setup (new terminal)
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload  # Runs on :8000

# Frontend setup (new terminal)
cd client
npm install
npm run dev           # Runs on :5173
```

### Environment Variables

**Server (.env)**
```env
MONGO_URI=your_mongodb_uri
CLIENT_URL=http://localhost:5173
BREVO_API_KEY=your_brevo_key
BREVO_SENDER_EMAIL=your_verified_sender
CLOUDINARY_CLOUD_NAME=your_name
GEMINI_API_KEY=your_gemini_key
```

**Client (.env)**
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🔮 Future Scope
- **IoT Live Stream Integration**: Direct ingestion from broadcast feeds.
- **Blockchain Evidence Anchoring**: Immutably record proof of infringement for court cases.
- **Automated Takedown API**: Direct integration with platform copyright APIs for zero-click resolution.
- **Predictive Piracy Heatmaps**: AI forecasting of where leaks are likely to occur based on match popularity.

---

**Built with ❤️ by Team Esc(Reality);**
