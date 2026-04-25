<<<<<<< HEAD
"""YouTube scraper adapter using public API or HTML search fallback."""
=======
"""YouTube scraper — uses Data API v3 if key is set, otherwise scrapes search page."""
>>>>>>> pvj

from __future__ import annotations

import os
import re
<<<<<<< HEAD
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
=======
import time
from datetime import datetime, timezone
>>>>>>> pvj

import requests
from bs4 import BeautifulSoup

<<<<<<< HEAD
def scrape_youtube(keyword: str) -> list[dict]:
    normalized = keyword.strip()
    if not normalized:
        return []

    results = _search_via_api(normalized)
    if results:
        return results

    return _search_via_html(normalized)
=======
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def _scrape_via_api(keyword: str, max_results: int = 8) -> list[dict]:
    """Use YouTube Data API v3 (requires YOUTUBE_API_KEY env var)."""
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": keyword,
        "type": "video",
        "maxResults": max_results,
        "key": YOUTUBE_API_KEY,
        "order": "relevance",
    }
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    items = resp.json().get("items", [])
    now = datetime.now(timezone.utc).isoformat()
    return [
        {
            "platform": "youtube",
            "sourceUrl": f"https://youtube.com/watch?v={item['id']['videoId']}",
            "thumbnailUrl": item["snippet"]["thumbnails"]["high"]["url"],
            "videoUrl": f"https://youtube.com/watch?v={item['id']['videoId']}",
            "pageTitle": item["snippet"]["title"],
            "channelName": item["snippet"]["channelTitle"],
            "status": "pending_match",
            "scrapedAt": now,
        }
        for item in items
        if item.get("id", {}).get("videoId")
    ]


def _scrape_via_html(keyword: str, max_results: int = 8) -> list[dict]:
    """Fallback: scrape YouTube search results page (no API key needed)."""
    search_url = "https://www.youtube.com/results"
    params = {"search_query": keyword}
    resp = requests.get(search_url, params=params, headers=_HEADERS, timeout=12)
    resp.raise_for_status()

    # YouTube embeds results as JSON inside a var ytInitialData = {...}
    match = re.search(r"var ytInitialData\s*=\s*(\{.*?\});</script>", resp.text, re.DOTALL)
    if not match:
        return []

    import json
    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError:
        return []

    # Walk the nested structure to get videoRenderer items
    contents = (
        data.get("contents", {})
        .get("twoColumnSearchResultsRenderer", {})
        .get("primaryContents", {})
        .get("sectionListRenderer", {})
        .get("contents", [])
    )

    results = []
    now = datetime.now(timezone.utc).isoformat()

    for section in contents:
        items = (
            section.get("itemSectionRenderer", {}).get("contents", [])
        )
        for item in items:
            vr = item.get("videoRenderer", {})
            video_id = vr.get("videoId")
            if not video_id:
                continue
            title = vr.get("title", {}).get("runs", [{}])[0].get("text", "")
            thumb = vr.get("thumbnail", {}).get("thumbnails", [{}])[-1].get("url", "")
            channel = (
                vr.get("ownerText", {}).get("runs", [{}])[0].get("text", "")
                or vr.get("longBylineText", {}).get("runs", [{}])[0].get("text", "")
            )
            results.append(
                {
                    "platform": "youtube",
                    "sourceUrl": f"https://youtube.com/watch?v={video_id}",
                    "thumbnailUrl": thumb,
                    "videoUrl": f"https://youtube.com/watch?v={video_id}",
                    "pageTitle": title,
                    "channelName": channel,
                    "status": "pending_match",
                    "scrapedAt": now,
                }
            )
            if len(results) >= max_results:
                return results

    return results


def scrape_youtube(keyword: str) -> list[dict]:
    """Entry point called by scraper_service. Auto-selects API or HTML fallback."""
    if YOUTUBE_API_KEY:
        return _scrape_via_api(keyword)
    return _scrape_via_html(keyword)
>>>>>>> pvj
