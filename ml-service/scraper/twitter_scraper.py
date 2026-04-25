"""Twitter/X scraper — uses public Nitter instances to search tweets. No API key needed."""

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
    "https://nitter.no-logs.com",
    "https://nitter.rawbit.ninja",
    "https://nitter.perennialte.ch",
    "https://nitter.cz",
    "https://nitter.on-snow.com",
    "https://nitter.dr460neye.at",
    "https://nitter.moomoo.me",
    "https://nitter.projectsegfau.lt",
]


def _try_nitter_search(base_url: str, keyword: str, max_results: int) -> list[dict]:
    """Try a single Nitter instance for search results."""
    search_url = f"{base_url}/search"
    params = {"q": keyword, "f": "tweets"}
    resp = requests.get(search_url, params=params, headers=_HEADERS, timeout=10)

    if resp.status_code != 200:
        raise ValueError(f"Nitter returned {resp.status_code}")

    soup = BeautifulSoup(resp.text, "html.parser")
    now = datetime.now(timezone.utc).isoformat()
    results = []

    # Each tweet is a div.timeline-item
    tweets = soup.select("div.timeline-item")
    for tweet in tweets[:max_results]:
        # Get tweet text
        text_el = tweet.select_one("div.tweet-content")
        text = text_el.get_text(strip=True) if text_el else ""

        # Get tweet link
        link_el = tweet.select_one("a.tweet-link")
        tweet_path = link_el["href"] if link_el and link_el.get("href") else ""
        tweet_url = f"https://x.com{tweet_path}" if tweet_path else ""

        # Get image if present
        thumbnail = ""
        img_el = tweet.select_one("div.attachments img")
        if img_el and img_el.get("src"):
            src = img_el["src"]
            # Nitter uses relative paths for images
            if src.startswith("/"):
                thumbnail = f"{base_url}{src}"
            else:
                thumbnail = src

        # Get video thumbnail if no image
        if not thumbnail:
            video_el = tweet.select_one("div.attachments video")
            if video_el and video_el.get("poster"):
                poster = video_el["poster"]
                thumbnail = f"{base_url}{poster}" if poster.startswith("/") else poster

        # Get author
        author_el = tweet.select_one("a.username")
        author = author_el.get_text(strip=True) if author_el else ""

        if not tweet_url:
            continue

        results.append(
            {
                "platform": "twitter",
                "sourceUrl": tweet_url,
                "thumbnailUrl": thumbnail,
                "videoUrl": None,
                "pageTitle": text[:140] if text else f"{keyword} tweet by {author}",
                "authorHandle": author,
                "status": "pending_match",
                "scrapedAt": now,
            }
        )

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
