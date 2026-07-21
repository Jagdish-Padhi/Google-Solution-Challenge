# Deployment & Setup Guide

## Navigation

- [Architecture Overview](Architecture.md)
- [API Reference](API.md)
- [Database Schemas](Database.md)
- [Scraper System](Scraper-System.md)

---

## Deployment Architecture

SportShield is structured as a microservices application, containerized using Docker, and deployed serverless on Google Cloud Run:

| Component | Technology | Deployed Location |
| --- | --- | --- |
| **React Client** | Vite SPA static build | Firebase Hosting (`gdg-vesit.web.app`) |
| **Express Backend** | Node.js REST API server | Google Cloud Run (`asia-south1`) |
| **ML & Scrapers** | Python FastAPI engine | Google Cloud Run (`asia-south1`) |
| **Database** | MongoDB Atlas cluster | Fully managed cloud instance |

---

## Local Setup

### Option A: Using Docker Compose (Recommended)

The repository provides a root-level `docker-compose.yml` to spin up all services alongside a local MongoDB instance.

1. Ensure Docker Desktop is installed and running.
2. Configure the required environment variables in the local directories (`client/.env`, `server/.env`, and `ml-service/.env`).
3. Run the following command from the root directory:
   ```bash
   docker-compose up --build
   ```
4. The React dashboard will be accessible at `http://localhost:5173`.

---

### Option B: Running Services Manually

To run the services independently during development:

#### 1. Pre-requisites
- **Node.js** (v18+)
- **Python** (3.9+)
- **MongoDB** (Running instance or connection URI)

#### 2. Start the ML Service
```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 3. Start the Express Backend API
```bash
cd server
npm install
npm run dev
```

#### 4. Start the React Frontend
```bash
cd client
npm install
npm run dev
```

---

## Production Deployment to Google Cloud Run

To build and deploy the containerized services to Google Cloud Run:

### 1. Build and Push Server Image
```bash
# Compile and submit backend container to Google Artifact Registry
gcloud builds submit --tag gcr.io/your-project-id/sportshield-api ./server
# Deploy to Cloud Run
gcloud run deploy sportshield-api \
  --image gcr.io/your-project-id/sportshield-api \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

### 2. Build and Push ML Service Image
```bash
# Compile and submit ML container
gcloud builds submit --tag gcr.io/your-project-id/sportshield-ml ./ml-service
# Deploy to Cloud Run
gcloud run deploy sportshield-ml \
  --image gcr.io/your-project-id/sportshield-ml \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

### 3. Deploy Client to Firebase Hosting
```bash
cd client
npm install
npm run build
firebase deploy --only hosting
```

---

## Deployment Operational Notes

- **Cold Starts**: Services running on Google Cloud Run's free tier may experience spin-up latency on the initial request. Allow up to 30-40 seconds for instances to wake up if they have gone idle.
- **WebSocket Compatibility**: Google Cloud Run supports WebSockets. Ensure session affinity is enabled if you scale the server to multiple instances.
- **Secrets Management**: For production environments, inject environment variables (like API keys and credentials) using **Google Cloud Secret Manager** instead of storing them in raw `.env` files.
