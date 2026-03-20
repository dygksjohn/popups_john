import importlib
import pkgutil
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pupoo_ai.app.core.config import settings
from pupoo_ai.app.core.exceptions import register_exception_handlers
from pupoo_ai.app.core.middleware import TraceIdMiddleware

load_dotenv()

ROUTERS_PACKAGE = "pupoo_ai.app.api.routers"
ROUTERS_PATH = Path(__file__).resolve().parent / "api" / "routers"


def include_registered_routers(app: FastAPI) -> None:
    # 기능: router 패키지에 등록된 엔드포인트를 자동으로 앱에 연결한다.
    for module_info in sorted(pkgutil.iter_modules([str(ROUTERS_PATH)]), key=lambda item: item.name):
        if module_info.name.startswith("_"):
            continue
        module = importlib.import_module(f"{ROUTERS_PACKAGE}.{module_info.name}")
        router = getattr(module, "router", None)
        if router is not None:
            app.include_router(router)


def create_app() -> FastAPI:
    app = FastAPI(
    title=settings.service_name,
    servers=[
    {"url": "http://pupoo-ai.default.svc.cluster.local:8000", "description": "K8s 운영"},
],
)
    app.add_middleware(TraceIdMiddleware)
    register_exception_handlers(app)
    include_registered_routers(app)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app


app = create_app()
