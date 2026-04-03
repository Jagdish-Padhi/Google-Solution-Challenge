from pathlib import Path

from PIL import Image

from fingerprint.fingerprint_service import compute_image_fingerprint, hamming_distance


def _build_test_image(path: Path) -> None:
    image = Image.new("RGB", (256, 256), color=(25, 80, 180))

    for row in range(32, 224):
        for col in range(64, 196):
            image.putpixel((col, row), (220, 210, 35))

    image.save(path)


def test_same_image_has_stable_phash(tmp_path):
    image_path = tmp_path / "base.jpg"
    _build_test_image(image_path)

    first = compute_image_fingerprint(str(image_path))
    second = compute_image_fingerprint(str(image_path))

    assert first["pHash"] == second["pHash"]


def test_cropped_image_remains_near_duplicate(tmp_path):
    base_path = tmp_path / "base.jpg"
    _build_test_image(base_path)

    cropped_path = tmp_path / "cropped.jpg"
    with Image.open(base_path) as image:
        cropped = image.crop((10, 10, 246, 246)).resize((256, 256))
        cropped.save(cropped_path)

    original = compute_image_fingerprint(str(base_path))
    cropped = compute_image_fingerprint(str(cropped_path))

    assert hamming_distance(original["pHash"], cropped["pHash"]) < 10