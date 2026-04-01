# ML Service

FastAPI service for fingerprinting, scraping, and matching.

## Folder Intent

- `app/`: FastAPI app bootstrap and API routers
- `fingerprint/`: media fingerprinting modules
- `scraper/`: source-specific scraping connectors
- `matching/`: comparison and confidence scoring logic
- `tests/`: unit and integration tests

## Commands

- `uvicorn app.main:app --reload --port 8000`
