from pathlib import Path

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:  # pragma: no cover
    from pydantic.v1 import BaseSettings  # type: ignore

    SettingsConfigDict = None  # type: ignore

# pupoo_ai/app/core/config.py -> parents[2] == pupoo_ai 패키지 루트 (cwd와 무관하게 .env 로드)
_DOTENV_PATH = Path(__file__).resolve().parents[2] / ".env"


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
    # 기본: Granite 278M 다국어 (출력 차원 768). 모델 변경 시 dim·Milvus 컬렉션을 맞출 것.
    watsonx_embedding_model_id: str = "ibm/granite-embedding-278m-multilingual"
    watsonx_embedding_dim: int = 768

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
            env_file=_DOTENV_PATH,
            env_prefix="PUPOO_AI_",
            case_sensitive=False,
            extra="ignore",
        )
    else:
        class Config:
            env_prefix = "PUPOO_AI_"
            case_sensitive = False
            extra = "ignore"
            env_file = str(_DOTENV_PATH)


settings = Settings()
