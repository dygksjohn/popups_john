param(
  [string]$BackendUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

function Assert-ApiSuccess($responseText, $label) {
  $obj = $responseText | ConvertFrom-Json
  if (-not $obj.success) {
    throw "$label failed: success=false"
  }
  if ($null -eq $obj.data) {
    throw "$label failed: data is null"
  }
}

$healthResp = Invoke-WebRequest -Uri "$BackendUrl/api/health" -Method GET -UseBasicParsing
if ($healthResp.StatusCode -ne 200) {
  throw "GET /api/health expected 200 but got $($healthResp.StatusCode)"
}
Assert-ApiSuccess -responseText $healthResp.Content -label "health"

try {
  Invoke-WebRequest -Uri "$BackendUrl/api/auth/secure-ping" -Method GET -UseBasicParsing | Out-Null
  throw "GET /api/auth/secure-ping should require auth and return 401."
} catch {
  if (-not $_.Exception.Response) {
    throw
  }
  $status = [int]$_.Exception.Response.StatusCode
  if ($status -ne 401) {
    throw "GET /api/auth/secure-ping expected 401 but got $status"
  }
}

Write-Host "SMOKE_BACKEND_OK"
