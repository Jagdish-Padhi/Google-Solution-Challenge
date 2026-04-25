<<<<<<< HEAD
"""Web scraper adapter using Google CSE and DuckDuckGo discovery."""
=======
"""Web scraper — uses Google Custom Search API if keys set, else googlesearch-python (no key)."""
>>>>>>> pvj

from __future__ import annotations

import os
<<<<<<< HEAD
from urllib.parse import urlparse

import requests

from scraper.search_utils import fetch_page_preview, now_iso, search_duckduckgo_links


GOOGLE_CSE_API_URL = "https://customsearch.googleapis.com/customsearch/v1"
WEB_MAX_RESULTS = int(os.getenv("WEB_MAX_RESULTS", "5"))


def _looks_like_video(url: str) -> bool:
    path = urlparse(url).path.lower()
    return path.endswith((".mp4", ".mov", ".avi", ".mkv", ".webm"))


def _to_result(url: str, title: str, thumbnail_url: str | None) -> dict:
    return {
        "platform": "web",
        "sourceUrl": url,
        "thumbnailUrl": thumbnail_url,
        "videoUrl": url if _looks_like_video(url) else None,
        "pageTitle": title,
        "status": "pending_match",
        "scrapedAt": now_iso(),
    }


def _search_google_cse(keyword: str) -> list[dict]:
    api_key = os.getenv("GOOGLE_CSE_API_KEY", "").strip()
    cx = os.getenv("GOOGLE_CSE_CX", "").strip()
    if not api_key or not cx:
        return []

    response = requests.get(
        GOOGLE_CSE_API_URL,
        params={
            "key": api_key,
            "cx": cx,
            "q": keyword,
            "num": max(1, min(10, WEB_MAX_RESULTS)),
        },
        timeout=20,
    )
    response.raise_for_status()

    payload = response.json()
    items = payload.get("items", [])
    results: list[dict] = []

    for item in items:
        link = item.get("link", "").strip()
        if not link:
            continue

        pagemap = item.get("pagemap", {})
        metatags = (pagemap.get("metatags") or [{}])[0]
        cse_image = (pagemap.get("cse_image") or [{}])[0]
        thumbnail_url = (
            metatags.get("og:image")
            or metatags.get("twitter:image")
            or cse_image.get("src")
        )
        title = item.get("title") or item.get("snippet") or link

        results.append(_to_result(link, title, thumbnail_url))

    return results


def _search_duckduckgo(keyword: str) -> list[dict]:
    links = search_duckduckgo_links(keyword, max_results=max(1, min(10, WEB_MAX_RESULTS)))
    results: list[dict] = []

    for link in links:
        title = link
        thumbnail_url = None
        try:
            preview = fetch_page_preview(link)
            title = preview.get("title") or link
            thumbnail_url = preview.get("thumbnailUrl")
        except Exception:
            pass

        results.append(_to_result(link, title, thumbnail_url))

    return results
=======
from datetime import datetime, timezone
>>>>>>> pvj

import requests

<<<<<<< HEAD
def scrape_web(keyword: str) -> list[dict]:
    normalized = keyword.strip()
    if not normalized:
        return []

    results = _search_google_cse(normalized)
    if results:
        return results

    return _search_duckduckgo(normalized)
=======
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
>>>>>>> pvj
