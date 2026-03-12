FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

COPY requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip && pip install -r /tmp/requirements.txt

COPY . /app/pupoo_ai

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "pupoo_ai.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
