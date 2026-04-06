"""YouTube scraper adapter (deterministic mock for MVP)."""

from __future__ import annotations

from datetime import datetime, timezone


def scrape_youtube(keyword: str) -> list[dict]:
    slug = keyword.strip().lower().replace(" ", "-")
    now = datetime.now(timezone.utc).isoformat()

    return [
        {
            "platform": "youtube",
            "sourceUrl": f"https://youtube.com/watch?v={slug[:12] or 'sportclip'}",
            "thumbnailUrl": f"https://picsum.photos/seed/youtube-{slug}/320/180",
            "videoUrl": f"https://youtube.com/watch?v={slug[:12] or 'sportclip'}",
            "pageTitle": f"{keyword} highlights",
            "status": "pending_match",
            "scrapedAt": now,
        }
    ]