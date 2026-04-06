"""Web scraper adapter using Google CSE and DuckDuckGo discovery."""

from __future__ import annotations

import os
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


def scrape_web(keyword: str) -> list[dict]:
    normalized = keyword.strip()
    if not normalized:
        return []

    results = _search_google_cse(normalized)
    if results:
        return results

    return _search_duckduckgo(normalized)