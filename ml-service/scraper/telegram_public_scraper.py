<<<<<<< HEAD
"""Telegram public scraper adapter using public web search discovery."""

from __future__ import annotations

import os
from urllib.parse import urlparse

from scraper.search_utils import fetch_page_preview, now_iso, search_duckduckgo_links


TELEGRAM_MAX_RESULTS = int(os.getenv("TELEGRAM_MAX_RESULTS", "5"))


def _is_telegram_url(url: str) -> bool:
    hostname = urlparse(url).netloc.lower()
    return hostname.endswith("t.me") or hostname.endswith("telegram.me")
=======
"""Telegram public channel scraper — scrapes t.me/s/<channel> web view. No API key needed."""

from __future__ import annotations

import re
from datetime import datetime, timezone
>>>>>>> pvj

import requests
from bs4 import BeautifulSoup

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

# Known public Telegram sports channels to check against.
# These are real public channels that commonly share sports highlights.
_SPORTS_CHANNELS = [
    "footballhighlights",
    "sportsclips_hd",
    "cricketfever",
    "nba_highlights_official",
    "uefachampionsleague",
    "ipl_highlights",
]


def _scrape_channel(channel: str, keyword: str) -> list[dict]:
    """Scrape a single public Telegram channel's web view for posts matching keyword."""
    url = f"https://t.me/s/{channel}"
    try:
        resp = requests.get(url, headers=_HEADERS, timeout=10)
        if resp.status_code != 200:
            return []
    except requests.RequestException:
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    now = datetime.now(timezone.utc).isoformat()
    results = []
    keyword_lower = keyword.lower()

    # Each post is a div.tgme_widget_message_wrap
    posts = soup.select("div.tgme_widget_message_wrap")
    for post in posts:
        # Get post text
        text_el = post.select_one("div.tgme_widget_message_text")
        text = text_el.get_text(strip=True) if text_el else ""

        # Only include posts that mention the keyword
        if keyword_lower not in text.lower() and not any(
            w in text.lower() for w in keyword_lower.split()
        ):
            continue

        # Get post URL
        link_el = post.select_one("a.tgme_widget_message_date")
        post_url = link_el["href"] if link_el and link_el.get("href") else url

        # Get image thumbnail if present
        img_el = post.select_one("a.tgme_widget_message_photo_wrap")
        thumbnail = ""
        if img_el and img_el.get("style"):
            # style contains background-image:url('...')
            m = re.search(r"url\(['\"]?(https?://[^'\")\s]+)['\"]?\)", img_el["style"])
            thumbnail = m.group(1) if m else ""

        # Try video thumbnail
        if not thumbnail:
            video_el = post.select_one("video")
            if video_el and video_el.get("poster"):
                thumbnail = video_el["poster"]

        results.append(
            {
                "platform": "telegram",
                "sourceUrl": post_url,
                "thumbnailUrl": thumbnail,
                "videoUrl": None,
                "pageTitle": text[:120] if text else f"{keyword} in {channel}",
                "channelName": channel,
                "status": "pending_match",
                "scrapedAt": now,
            }
        )

    return results


def scrape_telegram_public(keyword: str) -> list[dict]:
<<<<<<< HEAD
    normalized = keyword.strip()
    if not normalized:
        return []

    query = f"site:t.me {normalized}"
    links = search_duckduckgo_links(query, max_results=max(1, min(10, TELEGRAM_MAX_RESULTS)))

    results: list[dict] = []
    for link in links:
        if not _is_telegram_url(link):
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
                "platform": "telegram",
                "sourceUrl": link,
                "thumbnailUrl": thumbnail_url,
                "videoUrl": None,
                "pageTitle": title,
                "status": "pending_match",
                "scrapedAt": now_iso(),
            }
        )

    return results
=======
    """
    Search known public sports channels for posts mentioning the keyword.
    Returns all matching posts found across channels.
    """
    all_results = []
    for channel in _SPORTS_CHANNELS:
        try:
            results = _scrape_channel(channel, keyword)
            all_results.extend(results)
        except Exception:
            continue
    return all_results
>>>>>>> pvj
