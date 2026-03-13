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

    # watsonx.ai 설정 (RAG용)
    watsonx_api_key: str = ""
    watsonx_url: str = ""
    watsonx_project_id: str = ""
    watsonx_region: str = ""
    watsonx_llm_id: str = ""
    watsonx_embedding_model_id: str = ""
    watsonx_embedding_dim: int = 1024

    # Milvus 설정 (셀프호스팅 Vector DB). Windows에서 localhost가 IPv6로 연결될 수 있어 127.0.0.1 권장
    milvus_host: str = "127.0.0.1"
    milvus_port: int = 19530
    milvus_tls: bool = False
    milvus_username: str | None = None
    milvus_password: str | None = None
    milvus_collection: str = "policy_vectors"

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
