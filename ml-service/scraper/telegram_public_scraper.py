"""Telegram public channel scraper — scrapes t.me/s/<channel> web view. No API key needed."""

from __future__ import annotations

import re
from datetime import datetime, timezone

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
