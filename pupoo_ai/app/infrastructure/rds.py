from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

import pymysql

from pupoo_ai.app.core.config import settings


@dataclass(frozen=True)
class DbConnectionConfig:
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
    connection = create_connection()
    try:
        yield connection
    finally:
        connection.close()


def check_connection() -> dict[str, Any]:
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
