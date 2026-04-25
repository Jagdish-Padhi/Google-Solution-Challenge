"""Gemini helper for search keyword suggestion."""

from __future__ import annotations

import json
import os
import re

import requests


GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")


def _candidate_models() -> list[str]:
    configured = os.getenv("GEMINI_MODEL", "").strip()
    from_env = [item.strip() for item in configured.split(",") if item.strip()]
    defaults = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
    ]

    ordered = from_env + defaults
    seen: set[str] = set()
    result: list[str] = []
    for model in ordered:
        if model in seen:
            continue
        seen.add(model)
        result.append(model)

    return result or [DEFAULT_MODEL]


def _extract_json_text(payload: dict) -> str:
    candidates = payload.get("candidates") or []
    if not candidates:
        return ""

    content = candidates[0].get("content") or {}
    parts = content.get("parts") or []
    text_parts = [part.get("text", "") for part in parts if part.get("text")]
    return "\n".join(text_parts).strip()


def _normalize_keywords(raw_items: list[str], count: int) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()

    for item in raw_items:
        keyword = item.strip().strip("-•1234567890. ")
        if not keyword:
            continue

        lowered = keyword.lower()
        if lowered in seen:
            continue

        seen.add(lowered)
        normalized.append(keyword)

        if len(normalized) >= count:
            break

    return normalized


def _fallback_keywords(title: str, asset_type: str | None, count: int) -> list[str]:
    clean_title = re.sub(r"[^A-Za-z0-9\s]", " ", title).strip()
    words = [part for part in clean_title.split() if len(part) > 2]

    base = clean_title or title.strip()
    prefixes = [
        "full match",
        "highlights",
        "live stream",
        "watch free",
        "telegram",
        "x",
        "reddit",
        "download",
        "HD",
        "extended highlights",
    ]

    generated: list[str] = []
    if base:
        generated.append(base)
        generated.append(f"{base} {asset_type or 'video'}")

    if words:
        short_phrase = " ".join(words[:4])
        generated.append(short_phrase)

    for prefix in prefixes:
        if base:
            generated.append(f"{base} {prefix}")

    return _normalize_keywords(generated, count)


def _request_keywords_from_model(model: str, api_key: str, prompt: str, timeout: int = 30) -> list[str]:
    response = requests.post(
        f"{GEMINI_API_BASE}/{model}:generateContent",
        params={"key": api_key},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 300,
                "responseMimeType": "application/json",
            },
        },
        timeout=timeout,
    )

    if not response.ok:
        raise RuntimeError(f"Gemini request failed ({response.status_code}).")

    payload = response.json()
    text = _extract_json_text(payload)
    if not text:
        raise RuntimeError("Gemini returned empty response.")

    candidate_texts = [text]

    # Handle markdown fenced JSON and extra prose wrappers.
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            cleaned = part.replace("json", "").strip()
            if cleaned:
                candidate_texts.append(cleaned)

    first_bracket = text.find("[")
    last_bracket = text.rfind("]")
    if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
        candidate_texts.append(text[first_bracket:last_bracket + 1])

    for candidate in candidate_texts:
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, list):
                return [str(item) for item in parsed]
        except Exception:
            continue

    return [line.strip() for line in text.splitlines() if line.strip()]


def suggest_keywords(title: str, asset_type: str | None = None, source_url: str | None = None, count: int = 10) -> list[str]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    safe_count = max(5, min(20, int(count)))
    context_lines = [
        f"Asset title: {title.strip()}",
        f"Asset type: {asset_type or 'sports media'}",
    ]
    if source_url:
        context_lines.append(f"Reference URL: {source_url}")

    prompt = (
        "You are helping a sports rights protection platform discover pirated reposts. "
        f"Generate {safe_count} concise search queries that pirates might use to upload/share this asset. "
        "Return ONLY a JSON array of strings, no markdown.\n"
        + "\n".join(context_lines)
    )

    last_error: Exception | None = None
    for model in _candidate_models():
        try:
            raw_keywords = _request_keywords_from_model(model, api_key, prompt)
            keywords = _normalize_keywords(raw_keywords, safe_count)
            if keywords:
                if len(keywords) < safe_count:
                    for item in _fallback_keywords(title, asset_type, safe_count):
                        if item.lower() not in {k.lower() for k in keywords}:
                            keywords.append(item)
                        if len(keywords) >= safe_count:
                            break
                return keywords[:safe_count]
        except Exception as error:
            last_error = error

    fallback = _fallback_keywords(title, asset_type, safe_count)
    if fallback:
        return fallback

    if last_error:
        raise RuntimeError(str(last_error)) from last_error

    raise RuntimeError("No valid keywords were generated.")
