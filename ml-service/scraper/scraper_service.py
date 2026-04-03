"""Scraper coordinator for platform-specific collectors."""

from __future__ import annotations

from datetime import datetime, timezone


def _normalize(value: str) -> str:
    return value.strip().lower().replace(" ", "-")


def run_scrape_job(keywords: list[str], platforms: list[str]) -> dict:
    """Return deterministic, structured scan results for selected keywords/platforms."""

    normalized_keywords = [keyword.strip() for keyword in keywords if keyword and keyword.strip()]
    normalized_platforms = [platform.strip().lower() for platform in platforms if platform and platform.strip()]

    timestamp = datetime.now(timezone.utc).isoformat()
    results = []

    for platform in normalized_platforms:
        for index, keyword in enumerate(normalized_keywords, start=1):
            slug = _normalize(keyword)
            results.append(
                {
                    "platform": platform,
                    "sourceUrl": f"https://example.com/{platform}/{slug}-{index}",
                    "thumbnailUrl": f"https://picsum.photos/seed/{platform}-{slug}-{index}/320/180",
                    "pageTitle": f"{keyword} clip on {platform}",
                    "status": "pending_match",
                    "scrapedAt": timestamp,
                }
            )

    return {
        "keywords": normalized_keywords,
        "platforms": normalized_platforms,
        "results": results,
    }
