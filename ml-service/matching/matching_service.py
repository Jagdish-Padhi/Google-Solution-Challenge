"""Matching service placeholder for similarity and confidence scoring."""


def match_fingerprint(scraped_hash: str, stored_hash: str) -> dict:
    """Return a minimal matching result scaffold."""
    return {"scraped": scraped_hash, "stored": stored_hash, "confidence": 0}
