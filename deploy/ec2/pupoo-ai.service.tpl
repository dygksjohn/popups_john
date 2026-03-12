[Unit]
Description=Pupoo AI Server (FastAPI)
After=network.target

[Service]
Type=simple
User=__APP_USER__
WorkingDirectory=__AI_DIR__
EnvironmentFile=__AI_DIR__/.env
ExecStart=__AI_DIR__/venv/bin/uvicorn pupoo_ai.app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
