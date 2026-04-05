from pathlib import Path

from PIL import Image

from fingerprint.fingerprint_service import compute_image_fingerprint
from matching.matching_service import match_fingerprint_bundle


def _build_test_image(path: Path, accent: tuple[int, int, int]) -> None:
    image = Image.new("RGB", (256, 256), color=(20, 70, 150))

    for row in range(40, 220):
        for col in range(60, 200):
            image.putpixel((col, row), accent)

    image.save(path)


def test_matching_returns_high_confidence_for_same_image(tmp_path):
    image_path = tmp_path / "same.jpg"
    _build_test_image(image_path, (220, 200, 35))

    fingerprint = compute_image_fingerprint(str(image_path))
    result = match_fingerprint_bundle(fingerprint, fingerprint)

    assert result["matchConfidence"] >= 85
    assert result["matchType"] in {"exact", "near-duplicate"}
    assert result["evidenceBundle"]["hammingDistance"] == 0


def test_matching_returns_lower_confidence_for_different_images(tmp_path):
    first_path = tmp_path / "first.jpg"
    second_path = tmp_path / "second.jpg"

    _build_test_image(first_path, (240, 210, 30))
    _build_test_image(second_path, (180, 30, 200))

    first_fp = compute_image_fingerprint(str(first_path))
    second_fp = compute_image_fingerprint(str(second_path))

    result = match_fingerprint_bundle(first_fp, second_fp)

    assert result["matchConfidence"] < 80
    assert result["evidenceBundle"]["hammingDistance"] >= 0
