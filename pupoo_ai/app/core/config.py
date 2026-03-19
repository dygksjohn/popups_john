"""환경 설정 로더.

기능:
- AI 서비스 전역 설정값을 환경 변수에서 읽는다.

설명:
- moderation, congestion, chatbot, RDS, Milvus 설정을 한곳에서 관리한다.
- 각 기능 모듈은 직접 환경 변수를 읽지 않고 `settings`만 참조한다.
"""

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

    # 기능: RAG 기반 moderation에서 사용하는 watsonx 설정값이다.
    # 설명: 임베딩과 LLM 호출이 모두 이 설정을 공유한다.
    watsonx_api_key: str = ""
    watsonx_url: str = ""
    watsonx_project_id: str = ""
    watsonx_region: str = ""
    watsonx_llm_id: str = ""
    watsonx_embedding_model_id: str = ""
    watsonx_embedding_dim: int = 1024

    # 기능: 임베딩 백엔드를 선택한다.
    # 설명: 빈 값이면 watsonx 가능 여부를 보고 자동 선택하고, `bge-m3`면 로컬 모델을 사용한다.
    embedding_backend: str = ""

    # 기능: 정책 벡터 저장소인 Milvus 연결 정보를 정의한다.
    # 설명: moderation 정책 검색은 이 컬렉션을 기준으로 수행된다.
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
