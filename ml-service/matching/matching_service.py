"""Fingerprint matching service with Phase 7 Google Vision AI fallback."""

from __future__ import annotations

import os
from typing import Any

import numpy as np
from google.cloud import vision

from fingerprint.fingerprint_service import generate_fingerprint, hamming_distance

# Configuration for thresholds
VISION_API_KEY = os.getenv("VISION_API_KEY")  # Optional, usually uses GOOGLE_APPLICATION_CREDENTIALS
VISION_CONFIDENCE_THRESHOLD = 0.45
MATCH_BORDELINE_MIN = 40
MATCH_BORDELINE_MAX = 75

def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right:
        return 0.0

    length = min(len(left), len(right))
    if length == 0:
        return 0.0

    left_vector = np.array(left[:length], dtype=np.float32)
    right_vector = np.array(right[:length], dtype=np.float32)

    denominator = float(np.linalg.norm(left_vector) * np.linalg.norm(right_vector))
    if denominator == 0:
        return 0.0

    score = float(np.dot(left_vector, right_vector) / denominator)
    return max(0.0, min(1.0, score))


def _frame_match_count(scraped_frames: list[str], reference_frames: list[str], threshold: int = 10) -> int:
    if not scraped_frames or not reference_frames:
        return 0

    matched = 0
    for scraped in scraped_frames:
        distances = [hamming_distance(scraped, reference) for reference in reference_frames]
        if distances and min(distances) <= threshold:
            matched += 1

    return matched


def _match_type_from_signals(hamming_bits: int, frame_matches: int, vision_boosted: bool = False) -> str:
    if vision_boosted or hamming_bits <= 6:
        return "exact"
    if hamming_bits <= 12 or frame_matches >= 2:
        return "near-duplicate"
    return "partial"


def _confidence_score(hamming_bits: int, color_similarity: float, frame_matches: int, scraped_frames: list[str]) -> int:
    # Convert hamming distance to a bounded 0-100 score where lower distance is better.
    hash_score = max(0.0, 100.0 - (hamming_bits * 7.0))
    color_score = max(0.0, min(100.0, color_similarity * 100.0))
    frame_ratio = (frame_matches / max(1, len(scraped_frames))) if scraped_frames else 0.0
    frame_score = max(0.0, min(100.0, frame_ratio * 100.0))

    weighted = (hash_score * 0.55) + (color_score * 0.30) + (frame_score * 0.15)
    return int(round(max(0.0, min(100.0, weighted))))


def _verify_with_vision_api(scraped_url: str, reference_tags: list[str]) -> bool:
    """
    Perform semantic label matching using Google Cloud Vision.
    Boosts confidence if semantic labels (stadium, player, jersey, etc.) match.
    """
    if not reference_tags:
        return False

    try:
        client = vision.ImageAnnotatorClient()
        image = vision.Image()
        image.source.image_uri = scraped_url

        response = client.label_detection(image=image)
        labels = [label.description.lower() for label in response.label_annotations if label.score >= VISION_CONFIDENCE_THRESHOLD]

        if not labels:
            return False

        # Check for intersection between scraped labels and reference tags
        matches = [tag for tag in reference_tags if tag.lower() in labels]
        return len(matches) >= 2  # Require at least 2 matching semantic signals
    except Exception as e:
        print(f"[matching_service] Vision API tie-breaker failed: {e}")
        return False


def match_fingerprint_bundle(
    scraped_fingerprint: dict[str, Any], 
    reference_fingerprint: dict[str, Any],
    source_url: str = ""
) -> dict[str, Any]:
    scraped_hash = scraped_fingerprint.get("pHash")
    stored_hash = reference_fingerprint.get("pHash")

    if not scraped_hash or not stored_hash:
        raise ValueError("Both scraped and reference pHash values are required.")

    hamming_bits = hamming_distance(scraped_hash, stored_hash)
    color_similarity = _cosine_similarity(
        scraped_fingerprint.get("colorHistogram", []),
        reference_fingerprint.get("colorHistogram", []),
    )

    scraped_frames = scraped_fingerprint.get("frameHashes", []) or []
    reference_frames = reference_fingerprint.get("frameHashes", []) or []
    frame_matches = _frame_match_count(scraped_frames, reference_frames)

    confidence = _confidence_score(hamming_bits, color_similarity, frame_matches, scraped_frames)
    
    # --- Phase 7: Vision API Tie-breaker for borderline cases ---
    vision_boosted = False
    reasoning = "Calculated using perceptual hashing and color analysis."
    
    if MATCH_BORDELINE_MIN <= confidence <= MATCH_BORDELINE_MAX and source_url:
        # Use keywords/title as semantic tags for the reference
        tags = reference_fingerprint.get("tags", []) or [reference_fingerprint.get("title", "")]
        if _verify_with_vision_api(source_url, tags):
            confidence = min(92, confidence + 25)  # Boost significantly but keep below absolute "exact"
            vision_boosted = True
            reasoning = "Vision API confirmed semantic match (stadium/content overlap), boosting confidence."

    match_type = _match_type_from_signals(hamming_bits, frame_matches, vision_boosted)

    return {
        "matchConfidence": confidence,
        "matchType": match_type,
        "evidenceBundle": {
            "hammingDistance": hamming_bits,
            "colorSimilarity": round(color_similarity, 4),
            "frameMatchCount": frame_matches,
            "visionBoosted": vision_boosted,
            "reasoning": reasoning
        },
        "scrapedFingerprint": scraped_fingerprint,
    }


def match_content(scraped_url: str, reference_fingerprint: dict[str, Any]) -> dict[str, Any]:
    scraped_fingerprint = generate_fingerprint(source_url=scraped_url)
    return match_fingerprint_bundle(scraped_fingerprint, reference_fingerprint, source_url=scraped_url)
