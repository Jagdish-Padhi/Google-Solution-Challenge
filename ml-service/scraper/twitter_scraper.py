"""Twitter/X scraper adapter (deterministic mock for MVP)."""

from __future__ import annotations

from datetime import datetime, timezone


def scrape_twitter(keyword: str) -> list[dict]:
    slug = keyword.strip().lower().replace(" ", "-")
    now = datetime.now(timezone.utc).isoformat()

    return [
        {
            "platform": "twitter",
            "sourceUrl": f"https://x.com/search?q={slug}",
            "thumbnailUrl": f"https://picsum.photos/seed/twitter-{slug}/320/180",
            "videoUrl": None,
            "pageTitle": f"{keyword} shared on X",
            "status": "pending_match",
            "scrapedAt": now,
        }
    ]