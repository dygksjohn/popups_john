import logging
from contextvars import ContextVar, Token

from pupoo_ai.app.core.config import settings

TRACE_ID_DEFAULT = "-"
_trace_id_context: ContextVar[str] = ContextVar("trace_id", default=TRACE_ID_DEFAULT)


class ServiceTraceFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.service = settings.service_name
        record.trace_id = _trace_id_context.get()
        return True


def set_trace_id(trace_id: str) -> Token:
    return _trace_id_context.set(trace_id)


def reset_trace_id(token: Token) -> None:
    _trace_id_context.reset(token)


def get_trace_id() -> str:
    return _trace_id_context.get()


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if getattr(logger, "_pupoo_logger_configured", False):
        return logger

    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter("[%(service)s] [%(trace_id)s] [%(levelname)s] %(message)s")
    )
    handler.addFilter(ServiceTraceFilter())

    logger.handlers.clear()
    logger.addHandler(handler)
    logger.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))
    logger.propagate = False
    logger._pupoo_logger_configured = True  # type: ignore[attr-defined]
    return logger
