def correlate(indicator_value: str, tags: list[str]) -> list[str]:
    correlations = []
    if "demo-high-risk" in tags or "vt-malicious" in tags:
        correlations.append("Indicator overlaps with high-risk threat patterns.")
    if indicator_value.endswith(".ru") or "45.90" in indicator_value:
        correlations.append("Indicator belongs to a watchlisted demo pattern.")
    return correlations

