from scraper import scraper_service


def _build_item(platform: str, source_url: str) -> dict:
    return {
        "platform": platform,
        "sourceUrl": source_url,
        "thumbnailUrl": None,
        "videoUrl": None,
        "pageTitle": source_url,
        "status": "pending_match",
        "scrapedAt": "2026-01-01T00:00:00+00:00",
    }


def test_run_scrape_job_returns_results_for_supported_platforms(monkeypatch):
    monkeypatch.setattr(
        scraper_service,
        "PLATFORM_HANDLERS",
        {
            "youtube": lambda _keyword: [_build_item("youtube", "https://youtube.com/watch?v=test1234567")],
            "web": lambda _keyword: [_build_item("web", "https://example.org/video")],
            "telegram": lambda _keyword: [_build_item("telegram", "https://t.me/s/example")],
        },
    )

    response = scraper_service.run_scrape_job(
        keywords=["goal highlight"],
        platforms=["youtube", "web", "telegram"],
    )

    assert response["platforms"] == ["youtube", "web", "telegram"]
    assert len(response["results"]) >= 3


def test_run_scrape_job_ignores_unknown_platforms(monkeypatch):
    monkeypatch.setattr(
        scraper_service,
        "PLATFORM_HANDLERS",
        {
            "web": lambda _keyword: [_build_item("web", "https://example.org/video")],
        },
    )

    response = scraper_service.run_scrape_job(
        keywords=["club clip"],
        platforms=["web", "unknown-platform"],
    )

    assert response["platforms"] == ["web"]
    assert all(item["platform"] == "web" for item in response["results"])