param(
  [string]$BackendUrl = "http://localhost:8080",
  [string]$AdminEmail = "admin@pupoo.com",
  [string]$AdminPassword = "admin1234",
  [string]$UserEmail = "user001@pupoo.io",
  [string]$UserPassword = "admin1234",
  [switch]$RequireUserAccount
)

$ErrorActionPreference = "Stop"

function Login($email, $password, [ref]$webSessionOut) {
  $body = @{
    email = $email
    password = $password
  } | ConvertTo-Json

  $response = Invoke-WebRequest `
    -Uri "$BackendUrl/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -UseBasicParsing `
    -SessionVariable tmpSession

  if ($response.StatusCode -ne 200) {
    throw "Login failed. email=$email status=$($response.StatusCode)"
  }

  $setCookie = [string]$response.Headers["Set-Cookie"]
  if ($setCookie -notmatch "refresh_token=") {
    throw "refresh_token cookie was not issued. email=$email"
  }
  if ($setCookie -notmatch "Path=/api/auth") {
    throw "refresh_token cookie path mismatch. expected Path=/api/auth"
  }

  $json = $response.Content | ConvertFrom-Json
  if (-not $json.success) {
    throw "Login ApiResponse failed. email=$email"
  }
  if (-not $json.data.accessToken) {
    throw "Login response missing accessToken. email=$email"
  }

  $webSessionOut.Value = $tmpSession
  return $json.data.accessToken
}

# 1) admin account login smoke
$adminSession = $null
Login -email $AdminEmail -password $AdminPassword -webSessionOut ([ref]$adminSession) | Out-Null

# 2) refresh with cookie session
$refreshResp = Invoke-WebRequest `
  -Uri "$BackendUrl/api/auth/refresh" `
  -Method POST `
  -UseBasicParsing `
  -WebSession $adminSession

if ($refreshResp.StatusCode -ne 200) {
  throw "POST /api/auth/refresh expected 200 but got $($refreshResp.StatusCode)"
}

$refreshJson = $refreshResp.Content | ConvertFrom-Json
if (-not $refreshJson.success -or -not $refreshJson.data.accessToken) {
  throw "Refresh response contract invalid."
}

$refreshedAccess = $refreshJson.data.accessToken

# 3) protected API should return 401 without bearer
try {
  Invoke-WebRequest -Uri "$BackendUrl/api/admin/users" -Method GET -UseBasicParsing | Out-Null
  throw "GET /api/admin/users without token should return 401."
} catch {
  if (-not $_.Exception.Response) {
    throw
  }
  $status = [int]$_.Exception.Response.StatusCode
  if ($status -ne 401) {
    throw "GET /api/admin/users without token expected 401 but got $status"
  }
}

# 4) protected API should succeed with refreshed bearer token
$adminResp = Invoke-WebRequest `
  -Uri "$BackendUrl/api/admin/users?page=0&size=1" `
  -Method GET `
  -UseBasicParsing `
  -Headers @{ Authorization = "Bearer $refreshedAccess" }

if ($adminResp.StatusCode -ne 200) {
  throw "GET /api/admin/users with token expected 200 but got $($adminResp.StatusCode)"
}

$adminJson = $adminResp.Content | ConvertFrom-Json
if (-not $adminJson.success) {
  throw "GET /api/admin/users returned success=false"
}

# 5) optional user account check (seed consistency)
try {
  $tmp = $null
  Login -email $UserEmail -password $UserPassword -webSessionOut ([ref]$tmp) | Out-Null
} catch {
  if ($RequireUserAccount) {
    throw "User seed login failed: $UserEmail"
  }
  Write-Host "WARN_USER_SEED_LOGIN_FAILED"
}

Write-Host "SMOKE_AUTH_OK"
