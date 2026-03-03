param(
  [string]$BackendUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

$eventResp = Invoke-WebRequest -Uri "$BackendUrl/api/events" -Method GET -UseBasicParsing
if ($eventResp.StatusCode -ne 200) {
  throw "GET /api/events expected 200 but got $($eventResp.StatusCode)"
}

$eventJson = $eventResp.Content | ConvertFrom-Json
if (-not $eventJson.success) {
  throw "GET /api/events returned success=false"
}
if ($null -eq $eventJson.data) {
  throw "GET /api/events returned null data"
}

Write-Host "SMOKE_PUBLIC_API_OK"
