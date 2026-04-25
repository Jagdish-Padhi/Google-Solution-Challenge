from pydantic import BaseModel
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException

from ai.gemini_service import suggest_keywords
from ai.vision_service import verify_visual_similarity
from fingerprint.fingerprint_service import generate_fingerprint
from matching.matching_service import match_content
from scraper.scraper_service import run_scrape_job

load_dotenv()

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


class SuggestKeywordsRequest(BaseModel):
    title: str
    assetType: str | None = None
    sourceUrl: str | None = None
    count: int = 10


class VisionVerifyRequest(BaseModel):
    referenceUrl: str
    candidateUrl: str
    baseConfidence: int = 50


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


@app.post("/ml/suggest-keywords")
def suggest_keywords_endpoint(payload: SuggestKeywordsRequest) -> dict:
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="title is required.")

    count = max(5, min(20, payload.count))

    try:
        keywords = suggest_keywords(
            title=payload.title,
            asset_type=payload.assetType,
            source_url=payload.sourceUrl,
            count=count,
        )
        return {
            "keywords": keywords,
            "count": len(keywords),
        }
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Keyword suggestion failed: {error}") from error


@app.post("/ml/vision-verify")
def vision_verify_endpoint(payload: VisionVerifyRequest) -> dict:
    if not payload.referenceUrl.strip() or not payload.candidateUrl.strip():
        raise HTTPException(status_code=400, detail="referenceUrl and candidateUrl are required.")

    try:
        return verify_visual_similarity(
            reference_url=payload.referenceUrl,
            candidate_url=payload.candidateUrl,
            base_confidence=payload.baseConfidence,
        )
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Vision verification failed: {error}") from error
