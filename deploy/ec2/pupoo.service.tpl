[Unit]
Description=Pupoo Spring Boot
After=network.target

[Service]
Type=simple
User=__APP_USER__
WorkingDirectory=__APP_DIR__
EnvironmentFile=__APP_DIR__/.env
ExecStart=/usr/bin/java -jar __APP_DIR__/app.jar
SuccessExitStatus=143
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
