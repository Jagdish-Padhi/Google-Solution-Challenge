"""Web scraper adapter (deterministic mock for MVP)."""

from __future__ import annotations

from datetime import datetime, timezone


def scrape_web(keyword: str) -> list[dict]:
    slug = keyword.strip().lower().replace(" ", "-")
    now = datetime.now(timezone.utc).isoformat()

    return [
        {
            "platform": "web",
            "sourceUrl": f"https://example.com/clips/{slug}",
            "thumbnailUrl": f"https://picsum.photos/seed/web-{slug}/320/180",
            "videoUrl": f"https://example.com/clips/{slug}",
            "pageTitle": f"{keyword} mirror upload",
            "status": "pending_match",
            "scrapedAt": now,
        }
    ]