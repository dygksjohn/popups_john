"""RDS 연결 유틸리티.

기능:
- 환경 설정에서 DB 연결 정보를 해석하고 상태 점검용 연결을 제공한다.

설명:
- AI 서비스는 읽기/헬스체크 성격의 접근만 여기서 수행한다.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

import pymysql

from pupoo_ai.app.core.config import settings


@dataclass(frozen=True)
class DbConnectionConfig:
    # 기능: 실제 접속에 사용할 DB 연결 파라미터를 보관한다.
    host: str
    port: int
    user: str
    password: str
    database: str
    charset: str
    connect_timeout: int
    read_timeout: int
    write_timeout: int
    ssl_ca: str = ""


def _parse_db_url(db_url: str) -> dict[str, Any]:
    # 기능: 단일 DB URL을 세부 접속 정보로 분해한다.
    # 설명: 개별 설정값보다 DB URL이 우선 제공된 경우를 지원한다.
    parsed = urlparse(db_url)
    if parsed.scheme not in {"mysql", "mysql+pymysql"}:
        raise ValueError("Unsupported DB URL scheme. Expected mysql:// or mysql+pymysql://")

    query = parse_qs(parsed.query)
    return {
        "host": parsed.hostname or "",
        "port": parsed.port or 3306,
        "user": unquote(parsed.username or ""),
        "password": unquote(parsed.password or ""),
        "database": parsed.path.lstrip("/"),
        "ssl_ca": query.get("ssl_ca", [""])[0],
    }


def is_rds_configured() -> bool:
    # 기능: RDS 설정이 최소한으로 채워졌는지 확인한다.
    if settings.db_url.strip():
        return True
    return all(
        [
            settings.db_host.strip(),
            settings.db_user.strip(),
            settings.db_name.strip(),
        ]
    )


def resolve_db_config() -> DbConnectionConfig:
    # 기능: 분산된 환경 설정을 최종 DB 접속 설정으로 정규화한다.
    # 설명: DB URL과 개별 필드가 함께 있을 수 있어 빈 값 보완 규칙을 한곳에 모은다.
    parsed_url: dict[str, Any] = {}
    if settings.db_url.strip():
        parsed_url = _parse_db_url(settings.db_url.strip())

    host = settings.db_host.strip() or parsed_url.get("host", "")
    port = settings.db_port or parsed_url.get("port", 3306)
    user = settings.db_user.strip() or parsed_url.get("user", "")
    password = settings.db_password or parsed_url.get("password", "")
    database = settings.db_name.strip() or parsed_url.get("database", "")
    ssl_ca = settings.db_ssl_ca.strip() or parsed_url.get("ssl_ca", "")

    if not all([host, user, database]):
        raise ValueError("Database configuration is incomplete.")

    return DbConnectionConfig(
        host=host,
        port=int(port),
        user=user,
        password=password,
        database=database,
        charset=settings.db_charset,
        connect_timeout=settings.db_connect_timeout,
        read_timeout=settings.db_read_timeout,
        write_timeout=settings.db_write_timeout,
        ssl_ca=ssl_ca,
    )


def create_connection() -> pymysql.connections.Connection:
    # 기능: pymysql 연결 객체를 생성한다.
    # 설명: SSL CA가 있으면 SSL 연결 설정을 함께 적용한다.
    config = resolve_db_config()
    connection_kwargs: dict[str, Any] = {
        "host": config.host,
        "port": config.port,
        "user": config.user,
        "password": config.password,
        "database": config.database,
        "charset": config.charset,
        "connect_timeout": config.connect_timeout,
        "read_timeout": config.read_timeout,
        "write_timeout": config.write_timeout,
        "cursorclass": pymysql.cursors.DictCursor,
        "autocommit": True,
    }
    if config.ssl_ca:
        connection_kwargs["ssl"] = {"ca": config.ssl_ca}
    return pymysql.connect(**connection_kwargs)


@contextmanager
def db_connection():
    # 기능: DB 연결을 컨텍스트 매니저로 감싼다.
    connection = create_connection()
    try:
        yield connection
    finally:
        connection.close()


def check_connection() -> dict[str, Any]:
    # 기능: RDS 연결 가능 여부를 헬스체크용 payload로 반환한다.
    # 흐름: 설정 해석 -> 연결 생성 -> `SELECT 1` 실행 -> 결과 정리.
    config = resolve_db_config()
    with db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 AS ok")
            row = cursor.fetchone() or {}

    return {
        "configured": True,
        "reachable": bool(row.get("ok")),
        "host": config.host,
        "port": config.port,
        "database": config.database,
        "user": config.user,
    }
