from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    abuseipdb_api_key: str = ""
    virustotal_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()

