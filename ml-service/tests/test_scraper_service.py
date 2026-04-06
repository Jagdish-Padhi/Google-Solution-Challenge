from scraper.scraper_service import run_scrape_job


def test_run_scrape_job_returns_results_for_supported_platforms():
    response = run_scrape_job(
        keywords=["goal highlight"],
        platforms=["youtube", "web", "telegram"],
    )

    assert response["platforms"] == ["youtube", "web", "telegram"]
    assert len(response["results"]) >= 3


def test_run_scrape_job_ignores_unknown_platforms():
    response = run_scrape_job(
        keywords=["club clip"],
        platforms=["web", "unknown-platform"],
    )

    assert response["platforms"] == ["web"]
    assert all(item["platform"] == "web" for item in response["results"])