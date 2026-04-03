"""Telegram public scraper adapter (deterministic mock for MVP)."""

from __future__ import annotations

from datetime import datetime, timezone


def scrape_telegram_public(keyword: str) -> list[dict]:
    slug = keyword.strip().lower().replace(" ", "-")
    now = datetime.now(timezone.utc).isoformat()

    return [
        {
            "platform": "telegram",
            "sourceUrl": f"https://t.me/s/{slug or 'sports_channel'}",
            "thumbnailUrl": f"https://picsum.photos/seed/telegram-{slug}/320/180",
            "videoUrl": None,
            "pageTitle": f"{keyword} in public channel",
            "status": "pending_match",
            "scrapedAt": now,
        }
    ]