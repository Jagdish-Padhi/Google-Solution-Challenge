"""Twitter/X scraper adapter using public web search discovery."""

from __future__ import annotations

import os
from urllib.parse import urlparse

from scraper.search_utils import fetch_page_preview, now_iso, search_duckduckgo_links


TWITTER_MAX_RESULTS = int(os.getenv("TWITTER_MAX_RESULTS", "5"))


def _is_twitter_url(url: str) -> bool:
    hostname = urlparse(url).netloc.lower()
    return hostname.endswith("x.com") or hostname.endswith("twitter.com")


def scrape_twitter(keyword: str) -> list[dict]:
    normalized = keyword.strip()
    if not normalized:
        return []

    query = f"site:x.com OR site:twitter.com {normalized}"
    links = search_duckduckgo_links(query, max_results=max(1, min(10, TWITTER_MAX_RESULTS)))

    results: list[dict] = []
    for link in links:
        if not _is_twitter_url(link):
            continue

        title = link
        thumbnail_url = None
        try:
            preview = fetch_page_preview(link)
            title = preview.get("title") or link
            thumbnail_url = preview.get("thumbnailUrl")
        except Exception:
            pass

        results.append(
            {
                "platform": "twitter",
                "sourceUrl": link,
                "thumbnailUrl": thumbnail_url,
                "videoUrl": None,
                "pageTitle": title,
                "status": "pending_match",
                "scrapedAt": now_iso(),
            }
        )

    return results