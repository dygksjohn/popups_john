# Pupoo AI

## Local Run

```powershell
cd pupoo_ai
py -3.10 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn pupoo_ai.app.main:app --reload --port 8000
```

## Environment

- `PUPOO_AI_SERVICE_NAME` (default: `pupoo-ai`)
- `PUPOO_AI_INTERNAL_TOKEN` (default: `dev-internal-token`)
- `PUPOO_AI_LOG_LEVEL` (default: `INFO`)

## Internal Endpoints

- `POST /internal/congestion/events/predict`
- `POST /internal/congestion/programs/predict`
- `POST /internal/congestion/programs/recommendations`

All internal endpoints require `X-Internal-Token`.
