try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:  # pragma: no cover
    from pydantic.v1 import BaseSettings  # type: ignore

    SettingsConfigDict = None  # type: ignore


class Settings(BaseSettings):
    service_name: str = "pupoo-ai"
    internal_token: str = "dev-internal-token"
    log_level: str = "INFO"
    anthropic_api_key: str = ""
    aws_region: str = "us-east-1"
    bedrock_model_id: str = "us.amazon.nova-lite-v1:0"
    db_url: str = ""
    db_host: str = ""
    db_port: int = 3306
    db_user: str = ""
    db_password: str = ""
    db_name: str = ""
    db_charset: str = "utf8mb4"
    db_connect_timeout: int = 5
    db_read_timeout: int = 10
    db_write_timeout: int = 10
    db_ssl_ca: str = ""

    redis_url: str = "redis://localhost:6379/0"
    moderation_threshold: float = 0.7
    hatebert_model: str = "GroNLP/hateBERT"
    if SettingsConfigDict is not None:
        model_config = SettingsConfigDict(
            env_file=".env",
            env_prefix="PUPOO_AI_",
            case_sensitive=False,
            extra="ignore",
        )
    else:
        class Config:
            env_prefix = "PUPOO_AI_"
            case_sensitive = False
            extra = "ignore"


settings = Settings()
