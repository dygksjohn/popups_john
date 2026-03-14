## Pupoo EKS Base

This directory is the production deployment entrypoint for the current Pupoo stack.
The active GitHub Actions workflow is `.github/workflows/deploy.yml` (`Deploy Main`).

Production shape:

- `frontend`: S3 + CloudFront
- `backend`: EKS Deployment + Service + ALB Ingress
- `ai`: EKS Deployment + ClusterIP Service (temporarily exposed through ALB `/ai` for the current admin chatbot)
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

The current frontend still contains direct AI calls for the admin chatbot path.
To keep production working, the ingress exposes `/ai` to the AI service today.
That is a temporary compromise. The safer long-term shape is to move chatbot traffic
behind the backend or another authenticated server-side gateway and remove the public AI path.

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

### Required GitHub Actions secrets

- `AWS_DEPLOY_ROLE_ARN`

### Required in-cluster secrets

Create `pupoo-backend-secret` and `pupoo-ai-secret` separately before running the deploy workflow.
The `*.example.yaml` files are examples only and are intentionally not applied by `kustomize`.

Current example coverage:

- `pupoo-backend-secret`: datasource credentials, auth salts/secrets, AI internal tokens, OpenAI config, Kakao OAuth, KakaoPay
- `pupoo-ai-secret`: `PUPOO_AI_INTERNAL_TOKEN`, `OPENAI_API_KEY`
