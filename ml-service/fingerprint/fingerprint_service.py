"""Fingerprint service for image/video hash generation."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import cv2
import imagehash
import numpy as np
import requests
from PIL import Image

try:
    from videohash import VideoHash
except Exception:  # pragma: no cover
    VideoHash = None


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


def _download_to_tempfile(source_url: str) -> tuple[str, bool]:
    # Handle base64 Data URIs
    if isinstance(source_url, str) and source_url.startswith("data:"):
        import base64
        try:
            header, encoded = source_url.split(",", 1)
            mime_type = "image/jpeg"
            if ";base64" in header:
                parts = header.split(";")
                for part in parts:
                    if part.startswith("data:"):
                        mime_type = part.replace("data:", "")
            
            data = base64.b64decode(encoded)
            content_type_suffixes = {
                "image/jpeg": ".jpg",
                "image/jpg": ".jpg",
                "image/png": ".png",
                "image/webp": ".webp",
                "image/bmp": ".bmp",
                "video/mp4": ".mp4",
                "video/quicktime": ".mov",
                "video/x-msvideo": ".avi",
                "video/x-matroska": ".mkv",
                "video/webm": ".webm",
            }
            suffix = content_type_suffixes.get(mime_type, ".bin")
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                temp_file.write(data)
                return temp_file.name, True
        except Exception as e:
            print(f"[fingerprint_service] Failed to decode data URI: {e}")

    parsed = urlparse(source_url)

    # Handle file:// scheme
    if parsed.scheme == "file":
        from urllib.request import url2pathname
        local_path = url2pathname(parsed.path)
        return local_path, False

    if parsed.scheme in {"http", "https"}:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
        }
        with requests.get(source_url, stream=True, timeout=20, headers=headers) as response:
            response.raise_for_status()

            suffix = Path(parsed.path).suffix.lower()
            if not suffix or suffix == ".bin":
                content_type = (response.headers.get("content-type") or "").split(";", 1)[0].strip().lower()
                content_type_suffixes = {
                    "image/jpeg": ".jpg",
                    "image/jpg": ".jpg",
                    "image/png": ".png",
                    "image/webp": ".webp",
                    "image/bmp": ".bmp",
                    "video/mp4": ".mp4",
                    "video/quicktime": ".mov",
                    "video/x-msvideo": ".avi",
                    "video/x-matroska": ".mkv",
                    "video/webm": ".webm",
                }
                suffix = content_type_suffixes.get(content_type, ".bin")

            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        temp_file.write(chunk)
                return temp_file.name, True

    return source_url, False


def _image_histogram(image_bgr: np.ndarray) -> list[float]:
    histogram = []

    # 8-bin normalized histogram per channel -> 24 features.
    for channel in range(3):
        channel_hist = cv2.calcHist([image_bgr], [channel], None, [8], [0, 256]).flatten()
        channel_sum = float(np.sum(channel_hist))
        if channel_sum > 0:
            channel_hist = channel_hist / channel_sum
        histogram.extend(channel_hist.tolist())

    return [float(round(value, 6)) for value in histogram]


def _to_image_phash(image_rgb: np.ndarray) -> str:
    pil_image = Image.fromarray(image_rgb)
    return str(imagehash.phash(pil_image))


def hamming_distance(left: str, right: str) -> int:
    return int(imagehash.hex_to_hash(left) - imagehash.hex_to_hash(right))


def compute_image_fingerprint(file_path: str) -> dict[str, Any]:
    image_bgr = None
    image_rgb = None

    # Try decoding with PIL first (extremely robust, avoids Windows/WSL OpenCV bugs & extension issues)
    try:
        with Image.open(file_path) as img:
            img_rgb = img.convert("RGB")
            image_rgb = np.array(img_rgb)
            image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    except Exception as pil_err:
        print(f"[fingerprint_service] PIL decoding failed for {file_path}: {pil_err}")

    # Fallback to cv2.imread if PIL failed
    if image_bgr is None:
        image_bgr = cv2.imread(file_path)
        if image_bgr is not None:
            image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    if image_bgr is None or image_rgb is None:
        raise ValueError("Unable to read image file for fingerprinting.")

    return {
        "pHash": _to_image_phash(image_rgb),
        "videoHash": None,
        "colorHistogram": _image_histogram(image_bgr),
        "frameHashes": [],
    }


def _safe_video_hash(file_path: str) -> str | None:
    if VideoHash is None:
        return None

    try:
        generated = VideoHash(path=file_path)
        if hasattr(generated, "hash_hex"):
            return str(generated.hash_hex)
        if hasattr(generated, "hash"):
            return str(generated.hash)
        return str(generated)
    except Exception:
        return None


def compute_video_fingerprint(file_path: str) -> dict[str, Any]:
    capture = cv2.VideoCapture(file_path)
    if not capture.isOpened():
        raise ValueError("Unable to open video file for fingerprinting.")

    fps = capture.get(cv2.CAP_PROP_FPS)
    if not fps or fps <= 0:
        fps = 1.0

    frame_interval = max(int(fps * 2), 1)
    frame_index = 0
    sampled_hashes: list[str] = []
    sampled_histograms: list[list[float]] = []

    while True:
        ok, frame_bgr = capture.read()
        if not ok:
            break

        if frame_index % frame_interval == 0:
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            sampled_hashes.append(_to_image_phash(frame_rgb))
            sampled_histograms.append(_image_histogram(frame_bgr))

        frame_index += 1

    capture.release()

    if sampled_histograms:
        averaged_histogram = np.mean(np.array(sampled_histograms, dtype=np.float32), axis=0)
        color_histogram = [float(round(value, 6)) for value in averaged_histogram.tolist()]
    else:
        color_histogram = []

    return {
        "pHash": sampled_hashes[0] if sampled_hashes else None,
        "videoHash": _safe_video_hash(file_path),
        "colorHistogram": color_histogram,
        "frameHashes": sampled_hashes,
    }


def generate_fingerprint(source_url: str | None = None, local_file_path: str | None = None) -> dict[str, Any]:
    if not source_url and not local_file_path:
        raise ValueError("Either source_url or local_file_path is required.")

    source_value = local_file_path or source_url
    assert source_value is not None

    resolved_path, remove_after = _download_to_tempfile(source_value)

    try:
        extension = Path(resolved_path).suffix.lower()
        if extension in IMAGE_EXTENSIONS:
            fingerprint = compute_image_fingerprint(resolved_path)
        elif extension in VIDEO_EXTENSIONS:
            fingerprint = compute_video_fingerprint(resolved_path)
        else:
            # Fallback: try to read by file signature/header (OpenCV/FFmpeg checks content, not extension)
            try:
                fingerprint = compute_image_fingerprint(resolved_path)
            except ValueError:
                try:
                    fingerprint = compute_video_fingerprint(resolved_path)
                except ValueError as error:
                    raise ValueError(f"Unsupported or corrupted file content: {error}") from error

        return {
            "sourceUrl": source_url,
            "localFilePath": local_file_path,
            **fingerprint,
        }
    finally:
        if remove_after and os.path.exists(resolved_path):
            os.remove(resolved_path)
