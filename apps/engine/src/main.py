from datetime import datetime, timezone

from fastapi import FastAPI

app = FastAPI(title="Solar Intelligence Engine", version="0.1.0")


@app.get("/health")
def health():
    return {
        "service": "engine",
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
