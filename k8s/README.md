## Pupoo EKS Base

This directory is the production deployment entrypoint for the current Pupoo stack.
The active GitHub Actions workflow is `.github/workflows/deploy.yml` (`Deploy Main`).

Production shape:

- `frontend`: S3 + CloudFront
- `backend`: EKS Deployment + Service + ALB Ingress
- `ai`: EKS Deployment + ClusterIP Service
- `db`: RDS MySQL
- `file`: S3
- `cache`: Redis / ElastiCache
- `monitoring`: CloudWatch + Grafana

### Deploy flow

`Deploy Main` handles the full production release path:

1. Build frontend assets
2. Sync frontend assets to S3
3. Invalidate CloudFront
4. Build backend and AI images
5. Push images to ECR
6. Apply `k8s/base`
7. Roll out backend and AI deployments

For frontend-only environment notes, see `docs/frontend_s3_cloudfront_deploy.md`.

### Important note

The admin chatbot now goes through the backend API instead of calling the AI service directly.
The public `/ai` ingress remains available for current production compatibility, but the preferred
shape is server-side proxying through authenticated backend routes.

### Apply order

Use Kustomize or `kubectl apply -k`:

```bash
kubectl apply -k k8s/base
```

### Placeholders to replace

- ECR image URLs
- ACM certificate ARN
- Route53 hostname
- RDS endpoint
- CloudFront hostname
- secret values
- IRSA role ARNs

### Required GitHub Actions variables

- `AWS_REGION`
- `EKS_CLUSTER_NAME`
- `EKS_NAMESPACE`
- `FRONTEND_S3_BUCKET`
- `FRONTEND_CF_DISTRIBUTION_ID`
- `BACKEND_ECR_REPOSITORY`
- `AI_ECR_REPOSITORY`
- `APP_STORAGE_MODE`
- `STORAGE_S3_BUCKET`
- `STORAGE_S3_REGION`
- `APP_STORAGE_KEY_PREFIX`
- `APP_STORAGE_CDN_BASE_URL`
- `APP_STORAGE_SERVICE_ENDPOINT`
- `APP_STORAGE_PATH_STYLE_ACCESS`

### Required GitHub Actions secrets

- `AWS_DEPLOY_ROLE_ARN`

### Required in-cluster secrets

Create `pupoo-backend-secret` and `pupoo-ai-secret` separately before running the deploy workflow.
The `*.example.yaml` files are examples only and are intentionally not applied by `kustomize`.

Current example coverage:

- `pupoo-backend-secret`: datasource credentials, auth salts/secrets, AI internal tokens, OpenAI config, Kakao OAuth, KakaoPay
- `pupoo-ai-secret`: `PUPOO_AI_INTERNAL_TOKEN`, `OPENAI_API_KEY`

### Milvus (standalone) on EKS

Run Milvus in standalone mode to reduce resource pressure versus the default distributed chart.

```bash
helm repo add milvus https://milvus-io.github.io/milvus-helm/
helm repo update
kubectl create namespace milvus
helm install my-milvus milvus/milvus -n milvus --create-namespace -f k8s/milvus-standalone.values.yaml
```

After install, resolve the Milvus proxy service DNS and set `PUPOO_AI_MILVUS_HOST` in `k8s/base/ai-configmap.yaml`.

```bash
kubectl get svc -n milvus
```

Example DNS:

`my-milvus-milvus.milvus.svc.cluster.local`

Then re-apply kustomize and restart AI deployment.

```bash
kubectl apply -k k8s/base
kubectl rollout restart deployment/pupoo-ai -n pupoo
```
