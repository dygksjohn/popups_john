try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:  # pragma: no cover
    from pydantic.v1 import BaseSettings  # type: ignore

    SettingsConfigDict = None  # type: ignore


class Settings(BaseSettings):
    service_name: str = "pupoo-ai"
    internal_token: str = "dev-internal-token"
    log_level: str = "INFO"

    if SettingsConfigDict is not None:
        model_config = SettingsConfigDict(
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
