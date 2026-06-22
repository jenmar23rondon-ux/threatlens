from pydantic import BaseModel


class LookupRequest(BaseModel):
    type: str
    value: str


class LookupResponse(BaseModel):
    riskScore: int
    severity: str
    sources: list[str]
    tags: list[str]
    country: str | None = None
    asn: str | None = None
    summary: str

