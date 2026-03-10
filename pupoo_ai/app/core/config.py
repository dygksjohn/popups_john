import os
from pathlib import Path

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:  # pragma: no cover
    from pydantic.v1 import BaseSettings  # type: ignore

    SettingsConfigDict = None  # type: ignore

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_STORAGE_ROOT = PROJECT_ROOT / "generated"
LEGACY_ENV_MAP = {
    "APP_NAME": "PUPOO_AI_SERVICE_NAME",
    "APP_ENV": "PUPOO_AI_APP_ENV",
    "APP_PORT": "PUPOO_AI_APP_PORT",
    "INTERNAL_TOKEN": "PUPOO_AI_INTERNAL_TOKEN",
    "LOG_LEVEL": "PUPOO_AI_LOG_LEVEL",
    "OPENAI_API_KEY": "PUPOO_AI_OPENAI_API_KEY",
    "BACKEND_BASE_URL": "PUPOO_AI_BACKEND_BASE_URL",
    "REDIS_URL": "PUPOO_AI_REDIS_URL",
}


def _strip_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def _load_local_env() -> None:
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = _strip_quotes(value.strip())

        os.environ.setdefault(key, value)
        mapped_key = LEGACY_ENV_MAP.get(key)
        if mapped_key:
            os.environ.setdefault(mapped_key, value)


_load_local_env()


class Settings(BaseSettings):
    service_name: str = "pupoo-ai"
    app_env: str = "local"
    app_port: int = 8000
    internal_token: str = "dev-internal-token"
    log_level: str = "INFO"
    openai_api_key: str | None = None
    openai_image_model: str = "gpt-image-1"
    backend_base_url: str = "http://localhost:8080"
    redis_url: str = "redis://localhost:6379/0"
    poster_use_mock_generation: bool = True
    storage_root_dir: str = str(DEFAULT_STORAGE_ROOT)
    storage_mount_path: str = "/generated"
    storage_public_base_url: str | None = None

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
