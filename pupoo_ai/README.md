# Pupoo AI

## Local Run

```powershell
cd pupoo_ai
py -3.10 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn pupoo_ai.app.main:app --reload --port 8000
```

## Train Congestion Models

```powershell
cd pupoo_ai
.venv\Scripts\activate
python -m pupoo_ai.app.features.congestion.train.train_congestion_models
```

Optional arguments:

- `--limit 5000` for quick training
- `--db-url "jdbc:mysql://localhost:3306/pupoodb"`
- `--validation-ratio 0.2`

## Environment

- `PUPOO_AI_SERVICE_NAME` (default: `pupoo-ai`)
- `PUPOO_AI_INTERNAL_TOKEN` (default: `dev-internal-token`)
- `PUPOO_AI_LOG_LEVEL` (default: `INFO`)
- `PUPOO_AI_TRAIN_DB_URL` (optional, fallback to `SPRING_DATASOURCE_URL`)
- `PUPOO_AI_TRAIN_DB_USER` (optional)
- `PUPOO_AI_TRAIN_DB_PASSWORD` (optional)
- `PUPOO_AI_TRAIN_DB_HOST` (optional)
- `PUPOO_AI_TRAIN_DB_PORT` (optional)
- `PUPOO_AI_TRAIN_DB_NAME` (optional)

## Internal Endpoints

- `POST /internal/congestion/events/predict`
- `POST /internal/congestion/programs/predict`
- `POST /internal/congestion/programs/recommendations`

All internal endpoints require `X-Internal-Token`.
