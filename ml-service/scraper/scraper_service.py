"""Scraper coordinator — runs platform scrapers in parallel with Gemini query expansion."""

from __future__ import annotations

import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from scraper.gemini_query_gen import generate_search_queries
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


def _run_with_retry(handler, keyword: str, max_results: int | None = None) -> list[dict]:
    last_error = None
    for attempt in range(1, SCRAPER_MAX_RETRIES + 1):
        try:
            if max_results is not None:
                results = handler(keyword, max_results=max_results)
            else:
                results = handler(keyword)
            time.sleep(SCRAPER_DELAY_SECONDS)
            return results
        except Exception as error:
            last_error = error
            if attempt < SCRAPER_MAX_RETRIES:
                time.sleep(2 ** (attempt - 1))
    raise RuntimeError(f"Scraper failed after {SCRAPER_MAX_RETRIES} retries: {last_error}")


def run_scrape_job(
    keywords: list[str],
    platforms: list[str],
    asset_title: str = "",
    asset_type: str = "sports media",
    use_gemini: bool = True,
) -> dict:
    """
    Run selected scrapers in parallel and aggregate discovered results.

    If use_gemini=True and GEMINI_API_KEY is set, expands keywords using
    Gemini-generated adversarial queries before scraping.
    """
    normalized_keywords = [k.strip() for k in keywords if k and k.strip()]
    normalized_platforms = [p.strip().lower() for p in platforms if p and p.strip()]
    valid_platforms = [p for p in normalized_platforms if p in PLATFORM_HANDLERS]

    # --- Gemini query expansion ---
    gemini_queries: list[str] = []
    if use_gemini and asset_title:
        try:
            gemini_queries = generate_search_queries(asset_title, asset_type)
            # Remove duplicates already in normalized_keywords
            gemini_queries = [q for q in gemini_queries if q not in normalized_keywords]
            print(f"[scraper_service] Gemini expanded keywords: {gemini_queries}")
        except Exception as e:
            print(f"[scraper_service] Gemini query gen failed, continuing without: {e}")

    all_keywords = normalized_keywords + gemini_queries

    # --- Parallel scraping ---
    tasks = []
    results = []
    errors = []

    # Use a higher number of workers to handle keywords and platforms in parallel
    max_concurrency = min(20, len(valid_platforms) * len(all_keywords))
    import random
    with ThreadPoolExecutor(max_workers=max_concurrency) as executor:
        for platform in valid_platforms:
            handler = PLATFORM_HANDLERS[platform]
            
            # Platform specific realistic limits
            limits = {
                "youtube": (6, 14),
                "twitter": (4, 10),
                "web": (5, 12),
                "telegram": (None, None)
            }
            low, high = limits.get(platform, (5, 10))

            for keyword in all_keywords:
                m_res = random.randint(low, high) if low else None
                tasks.append(
                    (platform, keyword, executor.submit(_run_with_retry, handler, keyword, m_res))
                )

        for platform, keyword, future in tasks:
            try:
                discovered = future.result()
                results.extend(discovered)
            except Exception as error:
                errors.append({"platform": platform, "keyword": keyword, "error": str(error)})

    # Deduplicate by sourceUrl
    seen_urls: set[str] = set()
    unique_results = []
    for r in results:
        url = r.get("sourceUrl", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_results.append(r)

    return {
        "keywords": normalized_keywords,
        "geminiKeywords": gemini_queries,
        "platforms": valid_platforms,
        "results": unique_results,
        "discoveryMetrics": {
            "candidateUrlsFound": len(results),
            "uniqueCandidates": len(unique_results),
            "keywordsUsed": len(all_keywords),
            "geminiQueriesAdded": len(gemini_queries),
        },
        "errors": errors,
    }