from fastapi import FastAPI

app = FastAPI(title="SportShield ML Service", version="1.0.0")


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "sportshield-ml",
    }
