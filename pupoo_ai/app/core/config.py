try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:  # pragma: no cover
    from pydantic.v1 import BaseSettings  # type: ignore

    SettingsConfigDict = None  # type: ignore


class Settings(BaseSettings):
    # 기능: 런타임 설정값을 타입 안전하게 보관한다.
    # 설명: 외부 의존성 정보와 기능 활성화 값을 이 객체에 모아 공통 기준으로 사용한다.
    # 흐름: 환경 변수 로드 -> 타입 변환 -> settings 싱글톤으로 노출.
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
    congestion_model_enabled: bool = True
    congestion_model_dir: str = ""

    # watsonx.ai 설정 (RAG용)
    watsonx_api_key: str = ""
    watsonx_url: str = ""
    watsonx_project_id: str = ""
    watsonx_region: str = ""
    watsonx_llm_id: str = ""
    watsonx_embedding_model_id: str = ""
    watsonx_embedding_dim: int = 1024

    # 임베딩 백엔드 선택: bge-m3 (고정)
    embedding_backend: str = "bge-m3"

    # BGE-M3 embedding-service (별도 앱) 호출 설정
    embedding_service_url: str = "http://127.0.0.1:8001"
    embedding_service_timeout_seconds: int = 60

    # 기능: 정책 벡터 저장소인 Milvus 연결 정보를 정의한다.
    # 설명: moderation 정책 검색은 이 컬렉션을 기준으로 수행된다.
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
