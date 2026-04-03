from pydantic import BaseModel

from fastapi import FastAPI, HTTPException

from fingerprint.fingerprint_service import generate_fingerprint

app = FastAPI(title="SportShield ML Service", version="1.0.0")


class FingerprintRequest(BaseModel):
    sourceUrl: str | None = None
    localFilePath: str | None = None


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
