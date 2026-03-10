# GitHub Actions EC2 Deploy

This repository includes a deployment workflow at `.github/workflows/deploy-ec2.yml`.

Current flow:

1. Trigger on `push` to `main` or manual `workflow_dispatch`
2. Build `pupoo_backend/build/libs/pupoo-backend.jar`
3. Upload the JAR to the workflow artifacts
4. Copy the JAR and `deploy/ec2/pupoo.service.tpl` to EC2 over SSH
5. Write the runtime `.env` file from a GitHub secret
6. Install or update the systemd service
7. Restart the service and check `http://127.0.0.1:8080/api/health`

## Required GitHub Secrets

Add these repository secrets before enabling the workflow:

- `EC2_HOST`: public EC2 hostname or IP
- `EC2_PORT`: SSH port, usually `22`
- `EC2_USERNAME`: SSH login user, for example `ec2-user`
- `EC2_SSH_KEY`: private key used by GitHub Actions
- `EC2_APP_DIR`: app directory on the server, for example `/opt/pupoo`
- `EC2_APP_USER`: OS user that should own and run the service
- `EC2_UPLOADS_DIR`: upload directory, for example `/var/app/uploads`
- `APP_ENV_FILE`: full application env file content

Optional repository variable:

- `EC2_SERVICE_NAME`: systemd service name. Defaults to `pupoo` when empty.

## APP_ENV_FILE example

Store the full env file as one multi-line GitHub secret:

```env
SERVER_PORT=8080
SPRING_DATASOURCE_URL=jdbc:mysql://example-rds-endpoint:3306/pupoodb?serverTimezone=Asia/Seoul&characterEncoding=UTF-8&useUnicode=true&useSSL=false&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME=pupoo
SPRING_DATASOURCE_PASSWORD=change-me
AUTH_JWT_SECRET=replace-with-a-strong-base64-secret
AUTH_REFRESH_COOKIE_SECURE=true
KAKAO_OAUTH_CLIENT_ID=
KAKAO_OAUTH_CLIENT_SECRET=
KAKAO_OAUTH_REDIRECT_URI=https://your-domain.example/auth/kakao/callback
KAKAOPAY_SECRET_KEY=
KAKAOPAY_APPROVAL_URL=https://your-domain.example/payment/approve?paymentId={paymentId}
KAKAOPAY_CANCEL_URL=https://your-domain.example/payment/cancel?paymentId={paymentId}
KAKAOPAY_FAIL_URL=https://your-domain.example/payment/fail?paymentId={paymentId}
STORAGE_BASE_PATH=/var/app/uploads
```

## First-time EC2 setup

Install Java and create directories before the first workflow run:

```bash
sudo dnf install -y java-21-amazon-corretto nginx
sudo useradd --system --home /opt/pupoo --shell /sbin/nologin pupoo || true
sudo mkdir -p /opt/pupoo /var/app/uploads
sudo chown -R pupoo:pupoo /opt/pupoo /var/app/uploads
```

If you use `ec2-user` as the runtime user, set `EC2_APP_USER=ec2-user` and skip creating the `pupoo` user.

## Nginx example

```nginx
server {
    listen 80;
    server_name your-domain.example;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /var/app/uploads/;
    }
}
```

## Notes

- The workflow currently deploys on `main`.
- Do not set `SPRING_PROFILES_ACTIVE=prod` unless you also revisit the static file profile setup. The current code only registers the `/static/**` resource handler in `default`, `local`, and `dev`.
- Database schema must already exist. The app uses `spring.jpa.hibernate.ddl-auto=validate`.
