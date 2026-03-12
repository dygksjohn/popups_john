## Pupoo EKS Base

This directory contains a minimal EKS base layout for the target production shape:

- `frontend`: S3 + CloudFront
- `backend`: EKS Deployment + Service + ALB Ingress
- `ai`: EKS Deployment + internal ClusterIP Service
- `db`: RDS MySQL
- `file`: S3
- `cache`: Redis / ElastiCache
- `monitoring`: CloudWatch + Grafana

### Important note

The current frontend still contains direct AI calls for the admin chatbot path.
For production, keep the AI service internal and move that traffic behind the backend
or another authenticated server-side gateway before exposing it publicly.

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
