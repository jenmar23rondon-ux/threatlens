from app.schemas.lookup import LookupResponse


def demo_signal(indicator_type: str, value: str) -> dict:
    lowered = value.lower()
    high_patterns = ["malware", "phish", "evil", "botnet", "45.90", "185."]
    medium_patterns = ["suspicious", "unknown", "190.", "203.0.113"]
    if any(pattern in lowered for pattern in high_patterns):
        return {"score": 84, "tags": ["demo-high-risk"], "country": "Unknown", "asn": "AS-DEMO"}
    if any(pattern in lowered for pattern in medium_patterns):
        return {"score": 55, "tags": ["demo-watchlist"], "country": "Unknown", "asn": "AS-DEMO"}
    if indicator_type.upper() == "HASH" and len(value) >= 32:
        return {"score": 35, "tags": ["hash-observed"], "country": None, "asn": None}
    return {"score": 12, "tags": ["clean-demo"], "country": "Global", "asn": "AS-DEMO"}


def combine_results(indicator_type: str, value: str, source_results: list[dict]) -> LookupResponse:
    fallback = demo_signal(indicator_type, value)
    scores = [fallback["score"], *[int(result.get("score", 0)) for result in source_results]]
    score = max(scores)
    severity = "HIGH" if score >= 71 else "MEDIUM" if score >= 31 else "LOW"
    sources = [result.get("source", "unknown") for result in source_results] or ["demo-risk-engine"]
    tags = list({tag for result in source_results for tag in result.get("tags", [])} | set(fallback["tags"]))
    country = next((result.get("country") for result in source_results if result.get("country")), fallback["country"])
    asn = next((result.get("asn") for result in source_results if result.get("asn")), fallback["asn"])
    return LookupResponse(
        riskScore=score,
        severity=severity,
        sources=sources,
        tags=tags,
        country=country,
        asn=asn,
        summary=f"{indicator_type} indicator {value} scored {score}/100 from {', '.join(sources)}."
    )

