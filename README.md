# SportShield 🛡️
### *AI-Driven Digital Rights Protection & Content Integrity*

[![Google Solution Challenge 2024](https://img.shields.io/badge/Google-Solution--Challenge--2024-blue.svg)](https://developers.google.com/community/gdsc-solution-challenge)
[![Tech Stack](https://img.shields.io/badge/Stack-MERN%20+%20FastAPI%20+%20Google%20AI-orange.svg)]()

---

## 📌 Problem Statement
Global sports broadcasting and premium content industries lose over **$28 Billion annually** to real-time digital piracy. Traditional manual monitoring is too slow to stop live streams, and simple automated tools are easily bypassed by pirates using visual modifications like cropping, rotation, and color filtering.

**The Impact:**
- **Economic Loss:** Massive revenue leakage for rights holders and broadcasters.
- **Brand Integrity:** Lower quality, unofficial streams damage the viewer experience.
- **Accessibility:** Legitimate fans are often pushed toward high-risk, unverified domains.

---

## 🚀 The Solution: SportShield
SportShield is a high-performance, AI-powered digital rights protection ecosystem designed to **Discover, Verify, and Resolve** content infringements in near real-time.

### Key Features:
- **🧠 Gemini-Powered Discovery:** Uses Gemini 1.5 Flash to generate adversarial search keywords, bypassing pirate "obfuscation" tactics.
- **👁️ AI Vision Tie-Breaker:** Leverages **Google Cloud Vision API** to semantically verify borderline matches, ensuring high accuracy even when hashing fails.
- **📊 Revenue Impact Analytics:** Real-time dashboard showing "Revenue at Risk" based on detected violations.
- **⚡ Automated Resolution:** AI-drafted DMCA notices and automated takedown workflows for YouTube, Twitter, and major pirate web domains.

---

## 🛠️ Google Technology Stack
SportShield is built on a foundation of Google's most powerful AI and Infrastructure tools:

- **Gemini 1.5 Flash:** Powers the "Adversarial Keyword Generator" and "Evidence Reasoning" engine.
- **Google Cloud Vision API:** Provides the semantic "AI Tie-breaker" for complex visual matching.
- **Google Cloud Storage (GCS):** Secure, scalable storage for reference assets and violation evidence.
- **Google Firebase:** Seamless authentication and secure organizational access.
- **Google Cloud Translate:** Enables multi-language discovery to stop piracy across global markets (Spanish, Arabic, Hindi, etc.).

---

## 🏗️ Technical Architecture
SportShield uses a modern, high-availability microservices architecture:

- **Frontend:** React + Vite + Vanilla CSS (Premium Dark/Aurora UI)
- **API Backend:** Node.js (Express) + MongoDB
- **ML Engine:** Python (FastAPI) + OpenCV + Perceptual Hashing
- **Scrapers:** Real-time scrapers for YouTube, X (Twitter/Nitter), and Public Web.

---

## 🚦 Quick Start (Demo Mode)

To experience SportShield in its fully-featured "Demo State" with realistic sports data:

1. **Clone & Install:**
   ```bash
   # Install all dependencies
   cd server && npm install
   cd ../client && npm install
   cd ../ml-service && pip install -r requirements.txt
   ```

2. **Environment Setup:**
   - Follow the `.env.example` in `server/`, `client/`, and `ml-service/`.

3. **Seed Demo Data:**
   ```bash
   cd server
   node scripts/seed_demo_data.js
   ```

4. **Launch Dashboard:**
   - **Login:** `demo@sportshield.ai`
   - **Password:** `password123`
   - **URL:** `http://localhost:5173`

---

## 🏁 Ending Note
SportShield isn't just a tool; it's a shield for the digital economy. By combining Google's cutting-edge Generative AI with high-speed automated detection, we are leveling the playing field for creators and rights holders globally.

**Built for the Google Solution Challenge 2024.** 🛡️
