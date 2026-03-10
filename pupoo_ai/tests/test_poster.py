from fastapi.testclient import TestClient

from pupoo_ai.app.main import app
from pupoo_ai.app.core.constants import HEADER_INTERNAL_TOKEN
from pupoo_ai.app.core.config import settings


def test_generate_poster_returns_success_payload() -> None:
    client = TestClient(app)

    response = client.post(
        "/internal/poster/generate",
        headers={HEADER_INTERNAL_TOKEN: settings.internal_token},
        json={
            "event_id": 1001,
            "title": "Spring Festival",
            "date_text": "2026-04-20",
            "location": "Seoul Plaza",
            "summary": "Outdoor event with booths and performances.",
            "style": "FESTIVAL",
            "tone": "bright",
            "size": "1024x1536",
            "quality": "high",
            "background": "auto",
            "output_format": "png",
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["success"] is True
    assert body["code"] == "OK"
    assert body["data"]["event_id"] == 1001
    assert body["data"]["status"] == "SUCCEEDED"
    assert body["data"]["image_url"].startswith("https://mock-storage.local/posters/")
    assert body["data"]["size"] == "1024x1536"
    assert body["data"]["quality"] == "high"


def test_generate_poster_requires_internal_token() -> None:
    client = TestClient(app)

    response = client.post(
        "/internal/poster/generate",
        json={
            "event_id": 1001,
            "title": "Spring Festival",
            "date_text": "2026-04-20",
            "location": "Seoul Plaza",
            "summary": "Outdoor event with booths and performances.",
            "style": "FESTIVAL",
            "tone": "bright",
            "size": "1024x1536",
            "quality": "high",
            "background": "auto",
            "output_format": "png",
        },
    )

    body = response.json()

    assert response.status_code == 401
    assert body["success"] is False
    assert body["code"] == "UNAUTHORIZED"
