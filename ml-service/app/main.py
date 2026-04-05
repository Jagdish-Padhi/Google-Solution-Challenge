from pydantic import BaseModel

from fastapi import FastAPI, HTTPException

from fingerprint.fingerprint_service import generate_fingerprint
from matching.matching_service import match_content
from scraper.scraper_service import run_scrape_job

app = FastAPI(title="SportShield ML Service", version="1.0.0")


class FingerprintRequest(BaseModel):
    sourceUrl: str | None = None
    localFilePath: str | None = None


class ScanRequest(BaseModel):
    scanJobId: str | None = None
    assetId: str
    keywords: list[str]
    platforms: list[str]


class MatchRequest(BaseModel):
    scrapedUrl: str
    referenceFingerprint: dict


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "sportshield-ml",
    }


@app.post("/ml/fingerprint")
def fingerprint(payload: FingerprintRequest) -> dict:
    try:
        return generate_fingerprint(
            source_url=payload.sourceUrl,
            local_file_path=payload.localFilePath,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Fingerprint generation failed: {error}") from error


@app.post("/ml/scan")
def scan(payload: ScanRequest) -> dict:
    if not payload.keywords:
        raise HTTPException(status_code=400, detail="At least one keyword is required.")

    if not payload.platforms:
        raise HTTPException(status_code=400, detail="At least one platform is required.")

    try:
        scan_result = run_scrape_job(payload.keywords, payload.platforms)

        return {
            "scanJobId": payload.scanJobId,
            "assetId": payload.assetId,
            "status": "completed",
            "results": scan_result["results"],
            "violationsCount": 0,
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Scan processing failed: {error}") from error


@app.post("/ml/match")
def match(payload: MatchRequest) -> dict:
    try:
        return match_content(
            scraped_url=payload.scrapedUrl,
            reference_fingerprint=payload.referenceFingerprint,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Match processing failed: {error}") from error
