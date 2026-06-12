"""Google Vision helper for borderline match verification."""

from __future__ import annotations

import os

import requests


VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate"


def _extract_label_scores(payload: dict) -> dict[str, float]:
    label_scores: dict[str, float] = {}
    try:
        annotations = payload.get("responses", [{}])[0].get("labelAnnotations", [])
    except Exception:
        return label_scores

    for item in annotations:
        description = str(item.get("description", "")).strip().lower()
        score = float(item.get("score", 0.0) or 0.0)
        if description:
            label_scores[description] = max(label_scores.get(description, 0.0), score)

    return label_scores


def _vision_labels_for_url(image_url: str, api_key: str) -> dict[str, float]:
    import base64
    from urllib.parse import urlparse

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
    }

    image_payload = None
    try:
        parsed = urlparse(image_url)
        if parsed.scheme in {"http", "https"}:
            resp = requests.get(image_url, headers=headers, timeout=15)
            resp.raise_for_status()
            base64_data = base64.b64encode(resp.content).decode("utf-8")
            image_payload = {"content": base64_data}
        elif parsed.scheme == "file" or not parsed.scheme:
            # handle local files or file:// paths
            local_path = image_url
            if parsed.scheme == "file":
                from urllib.request import url2pathname
                local_path = url2pathname(parsed.path)
            with open(local_path, "rb") as f:
                base64_data = base64.b64encode(f.read()).decode("utf-8")
                image_payload = {"content": base64_data}
    except Exception as e:
        print(f"[vision_service] Failed to pre-download/encode image for Vision API: {e}. Falling back to imageUri.")

    if not image_payload:
        image_payload = {"source": {"imageUri": image_url}}

    response = requests.post(
        VISION_API_URL,
        params={"key": api_key},
        json={
            "requests": [
                {
                    "image": image_payload,
                    "features": [
                        {"type": "LABEL_DETECTION", "maxResults": 20},
                    ],
                }
            ]
        },
        timeout=30,
    )

    if not response.ok:
        raise RuntimeError(f"Vision API request failed ({response.status_code}).")

    return _extract_label_scores(response.json())


def verify_visual_similarity(reference_url: str, candidate_url: str, base_confidence: int) -> dict:
    api_key = os.getenv("GOOGLE_VISION_API_KEY", "").strip()
    if not api_key:
        return {
            "available": False,
            "reason": "GOOGLE_VISION_API_KEY is not configured.",
            "baseConfidence": int(base_confidence),
            "boostedConfidence": int(base_confidence),
            "confidenceBoost": 0,
            "labelOverlap": [],
            "labelOverlapScore": 0.0,
        }

    reference_labels = _vision_labels_for_url(reference_url, api_key)
    candidate_labels = _vision_labels_for_url(candidate_url, api_key)

    overlap = sorted(set(reference_labels.keys()) & set(candidate_labels.keys()))
    overlap_score = 0.0

    if overlap:
        weighted = [min(reference_labels[label], candidate_labels[label]) for label in overlap]
        overlap_score = sum(weighted) / max(1, len(weighted))

    confidence_boost = 0
    if overlap_score >= 0.75:
        confidence_boost = 22
    elif overlap_score >= 0.60:
        confidence_boost = 14
    elif overlap_score >= 0.45:
        confidence_boost = 8

    boosted_confidence = max(0, min(100, int(base_confidence) + confidence_boost))

    return {
        "available": True,
        "baseConfidence": int(base_confidence),
        "boostedConfidence": boosted_confidence,
        "confidenceBoost": confidence_boost,
        "labelOverlap": overlap[:10],
        "labelOverlapScore": round(float(overlap_score), 4),
    }
