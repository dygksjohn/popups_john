# Cloud Native Step 01 Storage Policy for Frontend and AI

Date: 2026-03-12

## Scope

This document is the Step 01 SSOT for `pupoo_frontend` and `pupoo_ai`.

Reference sources:

- `PATCH_REPORT.md`
- Backend storage policy described around `StorageUrlResolver`, `StorageKeyNormalizer`, and `storage.public-base-url`

Core rule:

- File URL composition responsibility belongs to the backend.

## Frontend Policy

- The frontend does not create a public URL from a storage key.
- The frontend renders only the final public URL returned by the backend, or a root-relative public path already exposed by the backend.
- The frontend does not prepend `import.meta.env` base URLs to image or file paths.
- If an image field is blank or unusable, the frontend uses a fallback image.
- During upload, the frontend sends the file payload only. Storage key selection remains a server responsibility.
- Existing two-step flows that still relay `publicPath` values are treated as legacy compatibility and must be removed in a later backend-aligned step.

## AI Policy

- AI-generated files must be managed by storage key or an internal file reference.
- Public URL generation stays in the backend or storage boundary.
- If Python code writes to a local path for internal processing, that path must not be used as an external response value.
- Future S3 integration must pass through a storage adapter boundary.
- `pupoo_ai/app/infrastructure/storage.py` is the current TODO split point for that adapter.

## Findings

- `pupoo_frontend` had frontend-side asset URL joining through `buildAssetUrl(...)` and custom `toAbsUrl(...)` helpers.
- `pupoo_frontend/src/shared/utils/publicAssetUrl.js` normalized legacy `/uploads/...` style values and effectively upgraded some non-public values into renderable URLs.
- `pupoo_frontend/src/pages/site/program/Contest.jsx` manually converted upload responses into a public image URL before sending `imageUrl` again.
- `pupoo_frontend/vite.config.js` still contains a legacy `/uploads` dev proxy. It is now marked with a TODO and kept only for compatibility.
- No Windows, macOS, or Linux absolute local file paths were found in frontend mock/sample code under `pupoo_frontend/src`.
- `pupoo_ai` currently has no live file-generation source code in the checked-in Python modules. The work in this step is policy documentation plus the storage adapter separation point.

## Implemented in Step 01

- `src/shared/config/requestUrl.js`
  - `buildAssetUrl(...)` no longer prepends a base URL.
- `src/shared/utils/publicAssetUrl.js`
  - Added `resolveImageUrl(...)`
  - Added `createImageFallbackHandler(...)`
  - `toPublicAssetUrl(...)` now accepts only absolute URLs, `data:` or `blob:` URLs, and root-relative public paths.
- Direct image URL joins were removed from the main contest and gallery related screens.
- Several display screens now use the shared fallback-aware image resolver.
- UTF-8 workspace settings were added for the workspace root, `pupoo_frontend`, and `pupoo_ai`.
- `pupoo_ai/app/infrastructure/storage.py` was added as the storage adapter TODO boundary.

## Validation Commands

Run from workspace root:

```powershell
rg -n "/uploads/" pupoo_frontend/src pupoo_frontend/vite.config.js
rg -n "buildAssetUrl\(|import\.meta\.env\.VITE_API_BASE_URL|VITE_ASSET_BASE_URL" pupoo_frontend/src
rg -n "toPublicAssetUrl\(|resolveImageUrl\(|createImageFallbackHandler\(" pupoo_frontend/src
rg -n "C:\\\\|/Users/|/home/|/var/" pupoo_frontend/src
rg -n "StorageAdapter|StorageReference|return .*path" pupoo_ai/app pupoo_ai/tests
```

Expected review points:

- `buildAssetUrl(...)` should remain only as a policy-safe helper implementation, not as a base URL join point.
- `/uploads` should remain only in compatibility locations such as dev proxy or legacy notes.
- Image rendering code should prefer `resolveImageUrl(...)`.
- Attachment links may still use `toPublicAssetUrl(...)`, but they must not depend on frontend-side base URL composition.
- AI code should not return local absolute paths as public values.

## UTF-8 Rule

- VSCode setting is fixed to `"files.encoding": "utf8"`.
- If Node file I/O is added later, `utf8` must be passed explicitly.
- If Python file I/O is added later, `encoding="utf-8"` must be passed explicitly.

## Next Step Preconditions

- Backend responses for image and file fields should be aligned so every consumer gets a final public URL or an explicit backend-owned public path contract.
- Legacy `publicPath` relay in contest application flow should be replaced by a backend-owned file reference contract.
- The `/uploads` dev proxy should be removable after backend rollout confirms no frontend-side path construction dependency.
- AI poster or file-generation features should use `StorageAdapter` before introducing S3 or presigned upload flows.
