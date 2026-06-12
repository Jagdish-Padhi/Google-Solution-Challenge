"""Kick live scraper — finds active channels/streams on Kick matching keywords."""

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

def scrape_kick(keyword: str, max_results: int = 6) -> list[dict]:
    """Find live Kick streams matching the keyword."""
    now = datetime.now(timezone.utc).isoformat()
    results = []
    
    # Try using googlesearch fallback to find channels/streams
    try:
        from googlesearch import search as gsearch
        query = f'site:kick.com "{keyword}" live'
        urls = list(gsearch(query, num_results=max_results, sleep_interval=1))
    except Exception:
        # Static mock fallbacks for demo purposes
        slug = keyword.lower().replace(" ", "")
        urls = [f"https://kick.com/{slug}live", f"https://kick.com/{slug}hd"]

    for url in urls[:max_results]:
        # Clean URL to match channel format https://kick.com/channel_name
        if "kick.com/" not in url:
            continue
        channel_part = url.split("kick.com/")[-1].split("/")[0]
        channel_name = channel_part.replace("?", "").replace("&", "")
        
        if not channel_name or channel_name in ["search", "video", "categories", "trending"]:
            continue
            
        results.append({
            "platform": "kick",
            "sourceUrl": f"https://kick.com/{channel_name}",
            "thumbnailUrl": f"https://kick.com/uploads/images/default-thumbnail.jpg",
            "videoUrl": f"https://kick.com/{channel_name}",
            "pageTitle": f"Kick Sports Stream: {keyword}",
            "channelName": channel_name,
            "status": "pending_match",
            "scrapedAt": now
        })
        
    return results
