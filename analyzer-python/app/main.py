from fastapi import FastAPI

from app.schemas.lookup import LookupRequest
from app.services.abuseipdb_service import lookup_abuseipdb
from app.services.correlation_service import correlate
from app.services.risk_score_service import combine_results
from app.services.virustotal_service import lookup_virustotal

app = FastAPI(title="ThreatLens Analyzer", version="1.0.0")


@app.get("/")
def health():
    return {"name": "ThreatLens Analyzer", "status": "ok"}


@app.post("/analyze")
async def analyze(payload: LookupRequest):
    results = []
    if payload.type.upper() == "IP":
        abuse = await lookup_abuseipdb(payload.value)
        if abuse:
            results.append(abuse)

    vt = await lookup_virustotal(payload.type, payload.value)
    if vt:
        results.append(vt)

    response = combine_results(payload.type, payload.value, results)
    extra = correlate(payload.value, response.tags)
    if extra:
        response.tags.extend(["correlated"])
        response.summary = f"{response.summary} {' '.join(extra)}"
    return response

