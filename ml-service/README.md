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

## Real Discovery Scraping

The scraper layer now performs live public-web discovery instead of deterministic placeholders.

- `youtube`: Uses YouTube Data API when `YOUTUBE_API_KEY` is present, otherwise falls back to YouTube search HTML parsing.
- `web`: Uses Google Custom Search API when `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_CX` are present, otherwise falls back to DuckDuckGo HTML search.
- `twitter` and `telegram`: Use public web search discovery and filter results to relevant domains.

Optional environment variables:

- `YOUTUBE_API_KEY`
- `GOOGLE_CSE_API_KEY`
- `GOOGLE_CSE_CX`
- `YOUTUBE_MAX_RESULTS` (default: 5)
- `WEB_MAX_RESULTS` (default: 5)
- `TWITTER_MAX_RESULTS` (default: 5)
- `TELEGRAM_MAX_RESULTS` (default: 5)
- `SCRAPER_DELAY_SECONDS` (default: 1)
- `SCRAPER_MAX_RETRIES` (default: 3)
