"""Shared helpers for public web discovery scrapers."""

from __future__ import annotations

from datetime import datetime, timezone
from urllib.parse import parse_qs, unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup


DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    )
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_result_link(raw_link: str) -> str:
    """Normalize known redirect links from search engines."""
    parsed = urlparse(raw_link)

    if parsed.netloc.endswith("duckduckgo.com") and parsed.path.startswith("/l/"):
        target = parse_qs(parsed.query).get("uddg", [""])[0]
        if target:
            return unquote(target)

    return raw_link


def search_duckduckgo_links(query: str, max_results: int = 5, timeout: int = 20) -> list[str]:
    url = "https://duckduckgo.com/html/"
    response = requests.get(
        url,
        params={"q": query},
        headers=DEFAULT_HEADERS,
        timeout=timeout,
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    links: list[str] = []
    seen: set[str] = set()

    for anchor in soup.select("a.result__a"):
        href = anchor.get("href", "").strip()
        if not href:
            continue

        normalized = normalize_result_link(href)
        if normalized in seen:
            continue

        seen.add(normalized)
        links.append(normalized)

        if len(links) >= max_results:
            break

    return links


def fetch_page_preview(url: str, timeout: int = 20) -> dict:
    response = requests.get(url, headers=DEFAULT_HEADERS, timeout=timeout)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()

    image_url = ""
    for selector in (
        "meta[property='og:image']",
        "meta[name='twitter:image']",
        "meta[property='og:image:url']",
    ):
        tag = soup.select_one(selector)
        content = tag.get("content", "").strip() if tag else ""
        if content:
            image_url = urljoin(url, content)
            break

    if not image_url:
        image = soup.select_one("img[src]")
        if image:
            image_url = urljoin(url, image.get("src", "").strip())

    return {
        "title": title,
        "thumbnailUrl": image_url or None,
    }
