import httpx

from app.config import settings


async def lookup_abuseipdb(value: str) -> dict | None:
    if not settings.abuseipdb_api_key:
        return None

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            "https://api.abuseipdb.com/api/v2/check",
            headers={"Key": settings.abuseipdb_api_key, "Accept": "application/json"},
            params={"ipAddress": value, "maxAgeInDays": 90},
        )
        response.raise_for_status()
        data = response.json().get("data", {})
        return {
            "source": "AbuseIPDB",
            "score": int(data.get("abuseConfidenceScore", 0)),
            "country": data.get("countryCode"),
            "asn": str(data.get("asn") or ""),
            "tags": ["abuse-reports"] if data.get("totalReports", 0) else ["no-abuse-reports"],
        }

