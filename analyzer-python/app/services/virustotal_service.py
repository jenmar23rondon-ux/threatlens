import hashlib
import httpx

from app.config import settings


async def lookup_virustotal(indicator_type: str, value: str) -> dict | None:
    if not settings.virustotal_api_key:
        return None

    normalized_type = indicator_type.upper()
    if normalized_type == "IP":
        path = f"/api/v3/ip_addresses/{value}"
    elif normalized_type == "DOMAIN":
        path = f"/api/v3/domains/{value}"
    elif normalized_type == "URL":
        url_id = hashlib.sha256(value.encode()).hexdigest()
        path = f"/api/v3/urls/{url_id}"
    elif normalized_type == "HASH":
        path = f"/api/v3/files/{value}"
    else:
        return None

    async with httpx.AsyncClient(base_url="https://www.virustotal.com", timeout=10) as client:
        response = await client.get(path, headers={"x-apikey": settings.virustotal_api_key})
        response.raise_for_status()
        stats = response.json().get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
        malicious = int(stats.get("malicious", 0))
        suspicious = int(stats.get("suspicious", 0))
        score = min(100, malicious * 18 + suspicious * 8)
        return {
            "source": "VirusTotal",
            "score": score,
            "tags": ["vt-malicious"] if score >= 70 else ["vt-observed"],
        }

