# SportShield

Digital Content Protection System scaffold for Google Solution Challenge.

## Monorepo Structure

- `client/` React + Vite frontend
- `server/` Express + MongoDB backend
- `ml-service/` FastAPI ML microservice
- `docs/` Architecture and API docs

## Quick Start

1. Copy env templates:
   - `cp server/.env.example server/.env`
   - `cp client/.env.example client/.env`
2. Install dependencies:
   - `cd server && npm install`
   - `cd ../client && npm install`
3. Run services:
   - `cd server && npm run dev`
   - `cd client && npm run dev`

## Notes

- This scaffold is intentionally template-only.
- Feature logic will be implemented phase-wise as per `TEAM-PLAN.md`.
