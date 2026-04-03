"""Scraper coordinator for platform-specific collectors."""

from __future__ import annotations

import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from scraper.telegram_public_scraper import scrape_telegram_public
from scraper.twitter_scraper import scrape_twitter
from scraper.web_scraper import scrape_web
from scraper.youtube_scraper import scrape_youtube


SCRAPER_DELAY_SECONDS = float(os.getenv("SCRAPER_DELAY_SECONDS", "1"))
SCRAPER_MAX_RETRIES = int(os.getenv("SCRAPER_MAX_RETRIES", "3"))

PLATFORM_HANDLERS = {
    "youtube": scrape_youtube,
    "twitter": scrape_twitter,
    "telegram": scrape_telegram_public,
    "web": scrape_web,
}


def _run_with_retry(handler, keyword: str) -> list[dict]:
    last_error = None

    for attempt in range(1, SCRAPER_MAX_RETRIES + 1):
        try:
            results = handler(keyword)
            # Basic request pacing to reduce block likelihood.
            time.sleep(SCRAPER_DELAY_SECONDS)
            return results
        except Exception as error:  # pragma: no cover
            last_error = error
            if attempt < SCRAPER_MAX_RETRIES:
                backoff_seconds = 2 ** (attempt - 1)
                time.sleep(backoff_seconds)

    raise RuntimeError(f"Scraper failed after retries: {last_error}")


def run_scrape_job(keywords: list[str], platforms: list[str]) -> dict:
    """Run selected scrapers in parallel and aggregate discovered results."""

    normalized_keywords = [keyword.strip() for keyword in keywords if keyword and keyword.strip()]
    normalized_platforms = [platform.strip().lower() for platform in platforms if platform and platform.strip()]

    valid_platforms = [platform for platform in normalized_platforms if platform in PLATFORM_HANDLERS]

    tasks = []
    results = []
    errors = []

    with ThreadPoolExecutor(max_workers=max(1, len(valid_platforms) or 1)) as executor:
        for platform in valid_platforms:
            handler = PLATFORM_HANDLERS[platform]
            for keyword in normalized_keywords:
                tasks.append((platform, keyword, executor.submit(_run_with_retry, handler, keyword)))

        for platform, keyword, future in tasks:
            try:
                discovered = future.result()
                results.extend(discovered)
            except Exception as error:
                errors.append(
                    {
                        "platform": platform,
                        "keyword": keyword,
                        "error": str(error),
                    }
                )

    return {
        "keywords": normalized_keywords,
        "platforms": valid_platforms,
        "results": results,
        "errors": errors,
    }
