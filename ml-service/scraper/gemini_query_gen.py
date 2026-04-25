"""Gemini-powered adversarial search query generator for content discovery."""

from __future__ import annotations

import json
import os
import re

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def generate_search_queries(asset_title: str, asset_type: str = "sports media") -> list[str]:
    """
    Use Gemini Flash to generate adversarial search queries — the kinds of
    queries a pirate would actually use to share or find this content.

    Falls back gracefully to a basic keyword list if Gemini is unavailable.
    """
    if not GEMINI_API_KEY:
        return _fallback_queries(asset_title)

    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""You are helping a sports rights protection system detect pirated content online.

Asset title: "{asset_title}"
Asset type: {asset_type}

Generate 8 search queries that someone illegally sharing or searching for this content might actually use.
Think like a pirate: include shortened titles, hashtag-style terms, common piracy phrases ("free download", "full match", "leaked"), abbreviations, and 1-2 non-English variations if relevant to sports.

Return ONLY a valid JSON array of strings. No explanation, no markdown fences, no preamble.
Example: ["query one here", "query two here"]"""

        response = model.generate_content(prompt)
        text = response.text.strip()

        # Strip markdown fences if model adds them despite instructions
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

        queries = json.loads(text.strip())

        if isinstance(queries, list) and all(isinstance(q, str) for q in queries):
            # Always include the original title too
            if asset_title not in queries:
                queries.insert(0, asset_title)
            return queries[:10]  # cap at 10

    except Exception as e:
        print(f"[gemini_query_gen] Gemini unavailable, using fallback: {e}")

    return _fallback_queries(asset_title)


def _fallback_queries(title: str) -> list[str]:
    """Basic query expansion without Gemini."""
    words = title.strip().split()
    queries = [
        title,
        f"{title} highlights",
        f"{title} full match",
        f"{title} free download",
        f"{title} leaked",
    ]
    if len(words) >= 2:
        # Add abbreviated version (first letters of each word)
        abbrev = "".join(w[0].upper() for w in words if w)
        queries.append(f"{abbrev} highlights")

    return queries