"""Twitter/X scraper — uses public Nitter instances to search tweets."""

from __future__ import annotations

import random
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

# Multiple Nitter instances for fallback — some may be down at any time
_NITTER_INSTANCES = [
    "https://nitter.privacydev.net",
    "https://nitter.poast.org",
    "https://nitter.lucabased.xyz",
    "https://nitter.woodland.cafe",
]

def _try_nitter_search(base_url: str, keyword: str, max_results: int) -> list[dict]:
    """Try a single Nitter instance for search results."""
    search_url = f"{base_url}/search"
    params = {"q": keyword, "f": "tweets"}
    try:
        resp = requests.get(search_url, params=params, headers=_HEADERS, timeout=10)
        if resp.status_code != 200:
            return []

        soup = BeautifulSoup(resp.text, "html.parser")
        now = datetime.now(timezone.utc).isoformat()
        results = []

        tweets = soup.select("div.timeline-item")
        for tweet in tweets[:max_results]:
            text_el = tweet.select_one("div.tweet-content")
            text = text_el.get_text(strip=True) if text_el else ""

            link_el = tweet.select_one("a.tweet-link")
            tweet_path = link_el["href"] if link_el and link_el.get("href") else ""
            tweet_url = f"https://x.com{tweet_path}" if tweet_path else ""

            thumbnail = ""
            img_el = tweet.select_one("div.attachments img")
            if img_el and img_el.get("src"):
                src = img_el["src"]
                thumbnail = f"{base_url}{src}" if src.startswith("/") else src

            if not thumbnail:
                video_el = tweet.select_one("div.attachments video")
                if video_el and video_el.get("poster"):
                    poster = video_el["poster"]
                    thumbnail = f"{base_url}{poster}" if poster.startswith("/") else poster

            author_el = tweet.select_one("a.username")
            author = author_el.get_text(strip=True) if author_el else "Unknown"

            if not tweet_url:
                continue

            results.append({
                "platform": "twitter",
                "sourceUrl": tweet_url,
                "thumbnailUrl": thumbnail,
                "videoUrl": None,
                "pageTitle": text[:140] if text else f"{keyword} tweet by {author}",
                "authorHandle": author,
                "status": "pending_match",
                "scrapedAt": now,
            })
        return results
    except Exception as e:
        print(f"Nitter instance {base_url} failed: {e}")
        return []

def scrape_twitter(keyword: str, max_results: int = 8) -> list[dict]:
    """Search Twitter/X via Nitter instances."""
    instances = _NITTER_INSTANCES.copy()
    random.shuffle(instances)

    for instance in instances:
        results = _try_nitter_search(instance, keyword, max_results)
        if results:
            return results
    return []
    return results


def scrape_twitter(keyword: str, max_results: int = 8) -> list[dict]:
    """
    Search Twitter/X for tweets matching keyword via Nitter instances.
    Tries instances in random order until one works.
    """
    instances = _NITTER_INSTANCES.copy()
    random.shuffle(instances)  # distribute load across instances

    for instance in instances:
        try:
            results = _try_nitter_search(instance, keyword, max_results)
            if results:
                return results
        except Exception:
            continue  # try next instance

    # All instances failed — return empty list (don't crash the whole scan job)
    return []
