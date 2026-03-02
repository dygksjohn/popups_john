param(
  [string]$BackendUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

& "$PSScriptRoot\smoke-db.ps1"
& "$PSScriptRoot\smoke-backend.ps1" -BackendUrl $BackendUrl
& "$PSScriptRoot\smoke-auth.ps1" -BackendUrl $BackendUrl
& "$PSScriptRoot\smoke-public-api.ps1" -BackendUrl $BackendUrl

Write-Host "SMOKE_ALL_OK"
