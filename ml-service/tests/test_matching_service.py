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


def test_matching_detects_horizontal_mirroring(tmp_path):
    ref_path = tmp_path / "ref.jpg"
    cand_path = tmp_path / "cand.jpg"

    # Build reference image
    ref_image = Image.new("RGB", (256, 256), color=(20, 70, 150))
    # Draw asymmetrical shape to distinguish flip
    for row in range(40, 220):
        for col in range(60, 130):  # left side
            ref_image.putpixel((col, row), (220, 200, 35))
    ref_image.save(ref_path)

    # Build mirrored candidate image
    cand_image = ref_image.transpose(Image.FLIP_LEFT_RIGHT)
    cand_image.save(cand_path)

    ref_fp = compute_image_fingerprint(str(ref_path))
    cand_fp = compute_image_fingerprint(str(cand_path))

    result = match_fingerprint_bundle(cand_fp, ref_fp)

    assert result["evidenceBundle"]["isMirrored"] is True
    assert result["matchConfidence"] >= 80


def test_matching_verifies_with_orb_tie_breaker(tmp_path):
    ref_path = tmp_path / "ref_orb.jpg"
    cand_path = tmp_path / "cand_orb.jpg"

    # Create reference image with detailed, unique asymmetric pattern for ORB keypoints
    ref_image = Image.new("RGB", (300, 300), color=(50, 50, 50))
    from PIL import ImageDraw
    draw = ImageDraw.Draw(ref_image)
    # Draw distinct shapes and lines to create rich keypoints
    draw.rectangle([20, 30, 80, 90], fill=(220, 100, 50))
    draw.ellipse([100, 120, 180, 200], fill=(50, 200, 100))
    draw.line([30, 250, 270, 250], fill=(255, 255, 255), width=3)
    draw.polygon([(200, 20), (250, 50), (220, 90)], fill=(100, 50, 250))
    ref_image.save(ref_path)

    # Create candidate image with a scoreboard/watermark overlay (block of solid color over a large area)
    cand_image = ref_image.copy()
    for row in range(10, 120):
        for col in range(10, 120):
            cand_image.putpixel((col, row), (255, 0, 0))  # red box overlay
    cand_image.save(cand_path)

    ref_fp = compute_image_fingerprint(str(ref_path))
    cand_fp = compute_image_fingerprint(str(cand_path))

    # Without reference_url (no ORB tie-breaker), it should get a borderline score
    result_no_orb = match_fingerprint_bundle(cand_fp, ref_fp)
    assert result_no_orb["evidenceBundle"]["orbVerified"] is False

    # With reference_url, it should download/read the reference and confirm alignment using ORB
    result_with_orb = match_fingerprint_bundle(
        cand_fp, 
        ref_fp, 
        source_url=str(cand_path),
        reference_url=str(ref_path)
    )
    assert result_with_orb["evidenceBundle"]["orbVerified"] is True
    assert result_with_orb["matchConfidence"] >= 95

