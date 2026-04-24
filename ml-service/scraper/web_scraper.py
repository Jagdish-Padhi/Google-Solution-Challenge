"""Web scraper — uses Google Custom Search API if keys set, else googlesearch-python (no key)."""

from __future__ import annotations

import os
from datetime import datetime, timezone

import requests

GOOGLE_CSE_KEY = os.getenv("GOOGLE_CSE_KEY", "")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID", "")

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


def _scrape_via_cse(keyword: str, max_results: int = 6) -> list[dict]:
    """Google Custom Search API — image search mode."""
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": GOOGLE_CSE_KEY,
        "cx": GOOGLE_CSE_ID,
        "q": keyword,
        "searchType": "image",
        "num": min(max_results, 10),
    }
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    items = resp.json().get("items", [])
    now = datetime.now(timezone.utc).isoformat()
    return [
        {
            "platform": "web",
            "sourceUrl": item.get("image", {}).get("contextLink", item.get("link", "")),
            "thumbnailUrl": item.get("image", {}).get("thumbnailLink", ""),
            "videoUrl": None,
            "pageTitle": item.get("title", ""),
            "status": "pending_match",
            "scrapedAt": now,
        }
        for item in items
        if item.get("link")
    ]


def _scrape_via_googlesearch(keyword: str, max_results: int = 6) -> list[dict]:
    """
    Fallback: use googlesearch-python to get page URLs, then extract og:image
    from each page as the thumbnail. No API key needed.
    """
    try:
        from googlesearch import search as gsearch
    except ImportError:
        return []

    from bs4 import BeautifulSoup

    now = datetime.now(timezone.utc).isoformat()
    results = []

    # Build a query that targets non-YouTube pages likely hosting pirated content
    query = f'{keyword} highlights site:-youtube.com site:-twitter.com'

    try:
        urls = list(gsearch(query, num_results=max_results, sleep_interval=1))
    except Exception:
        return []

    for url in urls:
        try:
            resp = requests.get(url, headers=_HEADERS, timeout=8)
            soup = BeautifulSoup(resp.text, "html.parser")

            # Try og:image first, fall back to first <img> with src
            og_img = soup.find("meta", property="og:image")
            thumbnail = og_img["content"] if og_img and og_img.get("content") else ""

            if not thumbnail:
                img_tag = soup.find("img", src=True)
                thumbnail = img_tag["src"] if img_tag else ""

            title_tag = soup.find("title")
            title = title_tag.get_text(strip=True) if title_tag else url

            results.append(
                {
                    "platform": "web",
                    "sourceUrl": url,
                    "thumbnailUrl": thumbnail,
                    "videoUrl": None,
                    "pageTitle": title,
                    "status": "pending_match",
                    "scrapedAt": now,
                }
            )
        except Exception:
            # Skip pages that time out or block us
            continue

    return results


def scrape_web(keyword: str) -> list[dict]:
    """Entry point called by scraper_service. Auto-selects CSE or fallback."""
    if GOOGLE_CSE_KEY and GOOGLE_CSE_ID:
        return _scrape_via_cse(keyword)
    return _scrape_via_googlesearch(keyword)