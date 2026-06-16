# 🛡️ SportShield : AI-Powered Rights Protection & Intelligence

**Hackathon:** Google Solution Challenge 2026 | **Team:** Esc(Reality); | **Track:** Digital Asset Protection

> Transforming reactive piracy monitoring into proactive, AI-driven legal enforcement through real-time fingerprinting and automated DMCA resolution.

---

## 🔗 Quick Links (For Real experience)

| 🚀 Live Demo | 🎥 Video Walkthrough | 📊 Presentation |
|:------------:|:-------------------:|:---------------:|
| [**Launch App**](https://gdg-vesit.web.app) | [**Watch Demo**](https://youtu.be/cCq9Nstpw8o) | [**View PPT**](https://canva.link/wcxppf1vd2k979i) |

---

## 🎯 Problem Statement
Digital piracy in live sports and premium content costs broadcasters billions annually. Current detection methods are fragmented, often failing to track content across diverse platforms like Telegram and Twitter. Even when detected, the legal enforcement process (DMCA filing) is manual, slow, and lacks the hard technical evidence needed for rapid takedowns.

## 💡 Solution
SportShield is an end-to-end intelligence suite that protects digital assets using **AI Video DNA Fingerprinting**. It monitors major social platforms and the open web in real-time, provides deep technical evidence (Hamming distance, frame similarity), and bridges the gap to enforcement with **AI-powered DMCA drafting**, allowing rights holders to go from "detection" to "takedown" in seconds.

---

## ✨ What's New in Round 2
SportShield has been significantly upgraded for Round 2, shifting from a prototype to a production-grade rights protection engine:
- **Expanded Platform Coverage**: Now monitors 6 platforms (YouTube, X, Telegram, Web, Twitch, Kick).
- **Real-Time Livestream Dashboard**: Supports custom HLS/RTMP streams with active scan status and live telemetry.
- **Creator Portal & Role-Based Access**: Specialized views and navigation workflows for Admin, Analyst, and Legal roles.
- **Upgraded ML Pipeline**: Mirror-aware fingerprinting, ORB+RANSAC tie-breakers, and Google Cloud Vision AI integration for semantic validation.
- **Sports-Specific DMCA Notices**: Automated platform-specific filing guides, evidence packaging, and ICC/BCCI rights citations.
- **Smart Licensed Content Detection**: Domain and partner matching to filter out false-positive violations.

---

## 🚀 Key Features

### ✅ AI Asset Library
- **Video DNA Ingestion**: Upload match highlights or images to generate a unique digital fingerprint.
- **Asset Intelligence**: View similarity metrics and tracking history for every protected file.
- **Cloud Management**: Secure storage and metadata management for corporate rights holders.
- **Smart Licensed Content Detection**: Employs `licensedDomains` and `licensedPartners` in the data model to auto-mark matches as "licensed" and reduce false positives.

### ✅ Intelligent Scan Discovery
- **Expanded Platform Coverage (6 Platforms)**: Simultaneously scans YouTube, X (Twitter), Telegram, the open web, Twitch, and Kick.com.
- **AI Auto-Suggest**: Automatically generates search keywords and metadata based on asset context.
- **Confidence Scoring**: Prioritizes results based on AI-calculated match probability.

### ✅ Real-Time Livestream Monitoring
- **Streams Dashboard**: A dedicated dashboard to track active livestream scan jobs for custom HLS/RTMP, Twitch, and Kick channels.
- **Real-Time Telemetry**: Immediate scan feedback and telemetry powered by Socket.io events.
- **Real-Time Ingestion Feed**: Discovery ingestion log rendered dynamically on the overview page via Firestore `onSnapshot`.

### ✅ Creator Portal & Role-Based Access
- **Role-Based Workflows**: Custom workflows and navigation paths for Admin, Analyst, and Legal users.
- **Independent Creators**: Tailored account types for Photographers and Independent Creators.
- **Auto-Redirects**: Seamless login page that auto-redirects based on the user's role.

### ✅ Upgraded ML Pipeline
- **Mirror-Aware Fingerprinting**: Generates both pHash and flipped pHash to automatically identify horizontally mirrored reposts.
- **Thumbnail → Frame Bonus**: Matches scraped thumbnails against reference frames, recovering a full 15% frame-weight signal.
- **ORB + RANSAC Tie-Breaker**: Employs keypoint matching and homography on borderline cases, boosting verified matches to 95–99% confidence.
- **Google Cloud Vision AI Verification**: Uses label-overlap checking (stadium, jersey, broadcast logo) and appends a detailed reasoning field to the evidence bundle.

### ✅ Violation Command Center (USP)
- **Evidence Audit**: Deep-dive into match explainability (Color similarity, Hamming distance, Frame match count).
- **One-Click DMCA Draft**: Instantly generates legally-compliant, platform-specific takedown notices.
- **Resolution Workflow**: Track cases through `OPEN` → `REPORTED` → `RESOLVED` statuses.
- **Deep Linking**: Direct navigation from email alerts to specific evidence records.

### ✅ Sports-Specific DMCA Notices & Evidence Packaging
- **Broadcasting Rights Citations**: Generated DMCA notices cite specific broadcast rights (e.g., BCCI & ICC).
- **Enhanced Evidence Packaging**: High-fidelity sport-specific screenshots (cricket, football, generic) and a visual Confidence Score Breakdown panel (detailing contributions from pHash, Color, Frame, ORB, Mirror, and Vision API).
- **ZIP Downloads**: Direct evidence ZIP downloads packaged with platform-specific step-by-step filing guides.

### ✅ Organization Settings & Team Management
- **Team Invites**: Invite and remove team members with granular role assignments.
- **Manual Digest Triggers**: Manually trigger the weekly email digest directly from the settings panel.
- **Notification Preferences**: Highly customizable preferences for high-confidence alerts, in-app updates, and digests.
- **Real-Time Webhooks**: Support webhooks for instant external broadcast alerts.

### ✅ Advanced Violations Filtering
- **Date-Based Filtering**: Search and filter violations by specific dates.
- **Status Badges**: Easily inspect attributes like `isMirrored`, `orbVerified`, and `visionAvailable` per violation.

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

| Layer         | Technology |
|---------------|------------|
| Frontend      | React 18, Vite, Vanilla CSS, Lucide Icons, Chart.js, Socket.io client |
| Backend       | Node.js, Express.js, MongoDB Atlas, deployed on Google Cloud Run |
| ML/Scraping   | Python, FastAPI, Mirror-aware fingerprinting, ORB+RANSAC, OpenCV perceptual hashing, 6-platform scraping (YouTube, X, Telegram, Web, Twitch, Kick), deployed on Google Cloud Run |
| AI/Google     | Gemini 1.5 Flash, Cloud Vision API, Cloud Translation API, Firebase Auth, Firebase Firestore, Firebase Hosting, YouTube Data API v3, Google CSE API, Google Fonts |
| Emails        | Brevo (transactional alerts + weekly digest) |
| Asset Storage | Cloudinary (fallback CDN) |
| Real-time     | Socket.io (livestream telemetry), Firebase Firestore (onSnapshot) |
| PDF Reports   | Puppeteer (headless Chrome) |

---

## 🌐 Google Technologies Used

| Google Technology | Implementation | Status |
|---|---|---|
| Gemini 1.5 Flash | Adversarial piracy keyword generation + sports-specific DMCA legal drafting | 🚀 Active |
| Google Cloud Vision API | Semantic label-overlap verification, AI tie-breaker for borderline matches (+22 confidence boost) | 🚀 Active |
| Google Cloud Translation API | Multilingual keyword expansion across 10+ languages for global piracy detection | 🚀 Active |
| Firebase Authentication | Google One-Tap SSO + email/password; Firebase Admin SDK for server-side token verification | 🚀 Active |
| Firebase Firestore | Real-time violation event feed via onSnapshot; user profile sync | 🚀 Active |
| Firebase Hosting | Frontend deployment at gdg-vesit.web.app | 🚀 Active |
| Google Cloud Run | All 3 services deployed serverless (client, server, ml-service) on asia-south1 | 🚀 Active |
| YouTube Data API v3 | Cross-platform piracy scanning on YouTube | 🚀 Active |
| Google Custom Search Engine | Web-wide image search for pirated content discovery | 🚀 Active |
| Google Fonts | UI typography (Outfit, Orbitron, IBM Plex) + PDF report fonts (Inter) | 🚀 Active |
| Chrome DevTools (Puppeteer) | High-fidelity PDF violation intelligence report generation | 🚀 Active |

---

## 🚀 Live Deployment (Google Cloud Run — asia-south1)

| Service | URL |
|---|---|
| Client | https://gdg-vesit.web.app (Firebase Hosting) |
| Server API | https://sportshield-api-660444655892.asia-south1.run.app/api |
| ML Service | https://sportshield-ml-660444655892.asia-south1.run.app |

### Demo Credentials
- **Admin**: `demo@sportshield.com` / `SportShield@123`
- **Creator**: `twi123@gmail.com` / `password123`

> [!NOTE]
> Free tier servers may need 3-4 attempts on initial startup due to cold start sleep. All features work once all 3 servers are up.

---

## 🔮 Future Scope
- **IoT Live Stream Integration**: Direct ingestion from broadcast feeds.
- **Blockchain Evidence Anchoring**: Immutably record proof of infringement for court cases.
- **Automated Takedown API**: Direct integration with platform copyright APIs for zero-click resolution.
- **Predictive Piracy Heatmaps**: AI forecasting of where leaks are likely to occur based on match popularity.

---

**Built with ❤️ by Team Esc(Reality);**
