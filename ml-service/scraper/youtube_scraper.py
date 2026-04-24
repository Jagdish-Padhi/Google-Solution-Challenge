"""YouTube scraper adapter using public API or HTML search fallback."""

from __future__ import annotations

import os
import re
from urllib.parse import quote_plus

import requests

from scraper.search_utils import DEFAULT_HEADERS, now_iso


YOUTUBE_SEARCH_API = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_MAX_RESULTS = int(os.getenv("YOUTUBE_MAX_RESULTS", "5"))


def _to_result(video_id: str, title: str, thumbnail_url: str | None) -> dict:
    source_url = f"https://www.youtube.com/watch?v={video_id}"
    return {
        "platform": "youtube",
        "sourceUrl": source_url,
        "thumbnailUrl": thumbnail_url,
        "videoUrl": source_url,
        "pageTitle": title,
        "status": "pending_match",
        "scrapedAt": now_iso(),
    }


def _search_via_api(keyword: str) -> list[dict]:
    api_key = os.getenv("YOUTUBE_API_KEY", "").strip()
    if not api_key:
        return []

    response = requests.get(
        YOUTUBE_SEARCH_API,
        params={
            "part": "snippet",
            "q": keyword,
            "type": "video",
            "maxResults": max(1, min(10, YOUTUBE_MAX_RESULTS)),
            "key": api_key,
        },
        timeout=20,
    )
    response.raise_for_status()

    payload = response.json()
    items = payload.get("items", [])
    results: list[dict] = []

    for item in items:
        video_id = item.get("id", {}).get("videoId", "")
        if not video_id:
            continue

        snippet = item.get("snippet", {})
        thumbnails = snippet.get("thumbnails", {})
        thumbnail_url = (
            thumbnails.get("high", {}).get("url")
            or thumbnails.get("medium", {}).get("url")
            or thumbnails.get("default", {}).get("url")
        )
        title = snippet.get("title", "")

        results.append(_to_result(video_id, title or f"YouTube result for {keyword}", thumbnail_url))

    return results


def _search_via_html(keyword: str) -> list[dict]:
    encoded_query = quote_plus(keyword)
    response = requests.get(
        f"https://www.youtube.com/results?search_query={encoded_query}",
        headers=DEFAULT_HEADERS,
        timeout=20,
    )
    response.raise_for_status()

    video_ids = re.findall(r"watch\?v=([A-Za-z0-9_-]{11})", response.text)
    unique_ids: list[str] = []
    seen: set[str] = set()

    for video_id in video_ids:
        if video_id in seen:
            continue
        seen.add(video_id)
        unique_ids.append(video_id)
        if len(unique_ids) >= max(1, min(10, YOUTUBE_MAX_RESULTS)):
            break

    return [
        _to_result(
            video_id,
            f"YouTube search result for {keyword}",
            f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
        )
        for video_id in unique_ids
    ]


def scrape_youtube(keyword: str) -> list[dict]:
    normalized = keyword.strip()
    if not normalized:
        return []

    results = _search_via_api(normalized)
    if results:
        return results

    return _search_via_html(normalized)