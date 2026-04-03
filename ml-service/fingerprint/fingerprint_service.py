"""Fingerprint service placeholder for image/video hash generation."""


def generate_fingerprint(source_url: str) -> dict:
    """Return a minimal fingerprint payload scaffold."""
    return {"sourceUrl": source_url, "pHash": None, "videoHash": None}
