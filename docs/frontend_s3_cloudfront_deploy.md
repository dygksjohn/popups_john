## Frontend S3 + CloudFront Notes

Production frontend is expected to be built as static assets and uploaded to S3,
with CloudFront serving the site.
The current production workflow is `.github/workflows/deploy.yml` (`Deploy Main`).

### Recommended production env values

```env
VITE_API_BASE_URL=https://api.pupoo.site
VITE_AI_BASE_URL=/ai
VITE_CDN_BASE_URL=https://cdn.pupoo.site
VITE_ASSET_BASE_URL=https://cdn.pupoo.site
```

### Basic release flow

1. Build the frontend:

```bash
cd pupoo_frontend
npm ci
npm run build
```

2. Upload `dist/` to the S3 bucket behind CloudFront.

3. Invalidate the CloudFront distribution after upload.

In normal production releases, GitHub Actions performs these steps automatically.
Use this document as a settings/reference note, not as a separate legacy deploy path.

### Important note

`VITE_ASSET_BASE_URL` is now supported by the shared request URL utility.
This allows older relative `/uploads/...` paths to resolve against the CloudFront
domain without patching every page component individually.
