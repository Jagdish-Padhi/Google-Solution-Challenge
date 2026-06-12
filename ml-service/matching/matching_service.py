"""Fingerprint matching service with Phase 7 Google Vision AI fallback."""

from __future__ import annotations

import os
from typing import Any

import cv2
import numpy as np
from google.cloud import vision

from fingerprint.fingerprint_service import (
	generate_fingerprint,
	hamming_distance,
	_download_to_tempfile,
)

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


def _match_type_from_signals(hamming_bits: int, frame_matches: int, vision_boosted: bool = False, orb_verified: bool = False) -> str:
	if orb_verified or vision_boosted or hamming_bits <= 6:
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


def _orb_match_score(img1_path: str, img2_path: str, is_flipped: bool = False) -> tuple[int, int]:
	"""
	Computes keypoint matches between two images using ORB and RANSAC homography.
	If is_flipped is True, flips the candidate image (img1) horizontally first.
	Returns:
		(num_inliers, total_matches)
	"""
	img1 = cv2.imread(img1_path, cv2.IMREAD_GRAYSCALE)
	img2 = cv2.imread(img2_path, cv2.IMREAD_GRAYSCALE)

	if img1 is None or img2 is None:
		return 0, 0

	if is_flipped:
		img1 = cv2.flip(img1, 1)

	orb = cv2.ORB_create(nfeatures=1000)
	kp1, des1 = orb.detectAndCompute(img1, None)
	kp2, des2 = orb.detectAndCompute(img2, None)

	if des1 is None or des2 is None or len(des1) < 10 or len(des2) < 10:
		return 0, 0

	bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
	matches = bf.match(des1, des2)
	matches = sorted(matches, key=lambda x: x.distance)

	if len(matches) < 8:
		return 0, len(matches)

	src_pts = np.float32([kp1[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
	dst_pts = np.float32([kp2[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)

	try:
		_, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
		if mask is not None:
			return int(np.sum(mask)), len(matches)
	except Exception:
		pass

	return 0, len(matches)


def _verify_with_orb(scraped_path: str, reference_url: str, is_flipped: bool = False) -> bool:
	if not reference_url:
		return False

	ref_path = None
	remove_ref = False
	try:
		ref_path, remove_ref = _download_to_tempfile(reference_url)
		inliers, _ = _orb_match_score(scraped_path, ref_path, is_flipped)
		return inliers >= 12
	except Exception as e:
		print(f"[matching_service] ORB tie-breaker failed: {e}")
		return False
	finally:
		if remove_ref and ref_path and os.path.exists(ref_path):
			os.remove(ref_path)


def match_fingerprint_bundle(
	scraped_fingerprint: dict[str, Any], 
	reference_fingerprint: dict[str, Any],
	source_url: str = "",
	reference_url: str = ""
) -> dict[str, Any]:
	scraped_hash = scraped_fingerprint.get("pHash")
	stored_hash = reference_fingerprint.get("pHash")

	if not scraped_hash or not stored_hash:
		raise ValueError("Both scraped and reference pHash values are required.")

	# 1. Hamming distance check with Mirroring/Horizontal flip detection
	hamming_bits_normal = hamming_distance(scraped_hash, stored_hash)
	
	scraped_hash_flipped = scraped_fingerprint.get("pHashFlipped")
	if scraped_hash_flipped:
		hamming_bits_flipped = hamming_distance(scraped_hash_flipped, stored_hash)
	else:
		hamming_bits_flipped = 999

	is_mirrored = False
	if hamming_bits_flipped < hamming_bits_normal:
		hamming_bits = hamming_bits_flipped
		is_mirrored = True
	else:
		hamming_bits = hamming_bits_normal

	color_similarity = _cosine_similarity(
		scraped_fingerprint.get("colorHistogram", []),
		reference_fingerprint.get("colorHistogram", []),
	)

	scraped_frames = scraped_fingerprint.get("frameHashes", []) or []
	scraped_frames_flipped = scraped_fingerprint.get("frameHashesFlipped", []) or []
	reference_frames = reference_fingerprint.get("frameHashes", []) or []
	
	if is_mirrored and scraped_frames_flipped:
		frame_matches = _frame_match_count(scraped_frames_flipped, reference_frames)
	else:
		frame_matches = _frame_match_count(scraped_frames, reference_frames)

	confidence = _confidence_score(hamming_bits, color_similarity, frame_matches, scraped_frames)
	
	# --- Advanced Tie-Breakers (ORB RANSAC and Vision AI) ---
	orb_verified = False
	vision_boosted = False
	reasoning = "Calculated using perceptual hashing and color analysis."
	if is_mirrored:
		reasoning += " Horizontal mirroring (flip) detected."
	
	# Run ORB keypoint validation for borderline matches or suspected mirrored content
	if (20 <= confidence <= MATCH_BORDELINE_MAX or (is_mirrored and confidence >= 20)) and reference_url:
		candidate_path = scraped_fingerprint.get("localFilePath")
		remove_candidate = False
		
		if not candidate_path and source_url:
			try:
				candidate_path, remove_candidate = _download_to_tempfile(source_url)
			except Exception:
				candidate_path = None
				
		if candidate_path:
			try:
				if _verify_with_orb(candidate_path, reference_url, is_flipped=is_mirrored):
					confidence = max(95, min(99, confidence + 30))
					orb_verified = True
					reasoning = f"ORB keypoint homography verified geometric alignment{' (mirrored)' if is_mirrored else ''}, boosting confidence."
			finally:
				if remove_candidate and candidate_path and os.path.exists(candidate_path):
					os.remove(candidate_path)

	# Google Vision API fallback (if ORB did not resolve/verify and source URL is available)
	if not orb_verified and MATCH_BORDELINE_MIN <= confidence <= MATCH_BORDELINE_MAX and source_url:
		tags = reference_fingerprint.get("tags", []) or [reference_fingerprint.get("title", "")]
		if _verify_with_vision_api(source_url, tags):
			confidence = min(92, confidence + 25)
			vision_boosted = True
			reasoning = "Vision API confirmed semantic match (stadium/content overlap), boosting confidence."

	match_type = _match_type_from_signals(hamming_bits, frame_matches, vision_boosted, orb_verified)

	return {
		"matchConfidence": confidence,
		"matchType": match_type,
		"evidenceBundle": {
			"hammingDistance": hamming_bits,
			"colorSimilarity": round(color_similarity, 4),
			"frameMatchCount": frame_matches,
			"visionBoosted": vision_boosted,
			"orbVerified": orb_verified,
			"isMirrored": is_mirrored,
			"reasoning": reasoning
		},
		"scrapedFingerprint": scraped_fingerprint,
	}


def match_content(scraped_url: str, reference_fingerprint: dict[str, Any], reference_url: str = "") -> dict[str, Any]:
	scraped_fingerprint = generate_fingerprint(source_url=scraped_url)
	return match_fingerprint_bundle(
		scraped_fingerprint,
		reference_fingerprint,
		source_url=scraped_url,
		reference_url=reference_url
	)
