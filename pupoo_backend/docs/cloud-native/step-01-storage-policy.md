# Step 01 Storage Policy

## Goal

This step fixes the storage policy before any large schema or API migration.
The immediate goal is to make the storage contract explicit and keep code aligned with that contract.

## SSOT

- Application configuration SSOT is `app.storage.*`.
- Legacy `storage.*` properties remain only as compatibility aliases during the migration window.
- Database SSOT is a storage key, not a public URL.

## Fixed Policy

- Database columns store storage keys such as `uploads/event/000000000037.jpg`.
- Only the backend generates the final public URL.
- Public URL format is `{baseUrl}/{key}`.
- `app.storage.cdn-base-url` is the first choice for public URL generation.
- `app.storage.public-base-url` is the fallback for local or non-CDN environments.

## Responsibility Split

- Entities must not assemble URLs.
- Controllers must not build URLs with string concatenation.
- Services or DTO assemblers/mappers may resolve the final public URL through `StorageUrlResolver`.
- Incoming legacy paths and Windows-style file paths are normalized through `StorageKeyNormalizer`.

## Compatibility Window

- Some legacy rows or requests may still contain full `http://` or `https://` URLs.
- `StorageUrlResolver` temporarily passes those values through as-is.
- `StorageKeyNormalizer` still normalizes local filesystem paths such as `src/main/resources/uploads/...` into `uploads/...`.
- The pass-through behavior is temporary and must be removed after data cleanup.

## Current Audit Scope

### Storage Components

- `ObjectStoragePort`
- `StorageService`
- `LocalFileStorageService`
- `S3ObjectStorageService`
- `StorageKeyGenerator`
- `StorageKeyNormalizer`
- `StorageUrlResolver`

### DTO/Public URL Mapping Points

- `EventService`
- `EventAdminService`
- `ProgramService`
- `ProgramAdminService`
- `SpeakerService`
- `SpeakerAdminService`
- `ProgramApplyService`
- `GalleryService`
- `GalleryAdminService`
- `AdminDashboardService`

### Local Upload Path Dependencies

- `UploadResourceConfig`
- `StaticResourceConfig`
- `StorageKeyNormalizer`

These classes still know about local upload roots such as `src/main/resources/uploads` or `/uploads`.
That is acceptable in step 01 because local compatibility stays in place while the persistence contract moves to storage keys.

## Notes For Existing Columns

- Legacy column names such as `image_url`, `speaker_image_url`, `original_url`, `thumb_url`, and `stored_name` remain unchanged for now.
- Those columns should store keys going forward, even if the name still says `url`.
- `QrCode.original_url` is an exception because it stores the QR payload URL, not an object storage key.

## Follow-up Work

- Audit existing rows and convert legacy absolute URLs into storage keys.
- Rename `*_url` columns to `*_key` after the data migration is stable.
- Consolidate repeated DTO mapping logic into shared assemblers where it adds value.
- Align CDN and reverse proxy routing after the data contract is fully migrated.
