import importlib
import pkgutil
from pathlib import Path

from fastapi import FastAPI

from pupoo_ai.app.core.config import settings
from pupoo_ai.app.core.exceptions import register_exception_handlers
from pupoo_ai.app.core.middleware import TraceIdMiddleware

ROUTERS_PACKAGE = "pupoo_ai.app.api.routers"
ROUTERS_PATH = Path(__file__).resolve().parent / "api" / "routers"


def include_registered_routers(app: FastAPI) -> None:
    for module_info in sorted(pkgutil.iter_modules([str(ROUTERS_PATH)]), key=lambda item: item.name):
        if module_info.name.startswith("_"):
            continue
        module = importlib.import_module(f"{ROUTERS_PACKAGE}.{module_info.name}")
        router = getattr(module, "router", None)
        if router is not None:
            app.include_router(router)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.service_name)
    app.add_middleware(TraceIdMiddleware)
    register_exception_handlers(app)
    include_registered_routers(app)
    return app


app = create_app()
