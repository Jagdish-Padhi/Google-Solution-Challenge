"""Twitch live scraper — finds active channels/streams on Twitch matching keywords."""

from __future__ import annotations

import os
from datetime import datetime, timezone
import requests

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}

def scrape_twitch(keyword: str, max_results: int = 6) -> list[dict]:
    """Find live Twitch streams matching the keyword."""
    now = datetime.now(timezone.utc).isoformat()
    results = []
    
    # Try using googlesearch fallback to find channels/streams
    try:
        from googlesearch import search as gsearch
        query = f'site:twitch.tv "{keyword}" live'
        urls = list(gsearch(query, num_results=max_results, sleep_interval=1))
    except Exception as e:
        raise RuntimeError(f"Google Search query failed for Twitch scraper: {e}") from e

    for url in urls[:max_results]:
        # Clean URL to match channel format https://www.twitch.tv/channel_name
        if "twitch.tv/" not in url:
            continue
        channel_part = url.split("twitch.tv/")[-1].split("/")[0]
        channel_name = channel_part.replace("?", "").replace("&", "")
        
        if not channel_name or channel_name in ["directory", "search", "p", "videos"]:
            continue
            
        results.append({
            "platform": "twitch",
            "sourceUrl": f"https://www.twitch.tv/{channel_name}",
            "thumbnailUrl": f"https://static-cdn.jtvnw.net/previews-ttv/live_user_{channel_name.lower()}-320x180.jpg",
            "videoUrl": f"https://www.twitch.tv/{channel_name}",
            "pageTitle": f"Live sports stream: {keyword} on Twitch",
            "channelName": channel_name,
            "status": "pending_match",
            "scrapedAt": now
        })
        
    return results
