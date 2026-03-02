param(
  [string]$ServiceName = "mysql"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
  $containerId = (docker compose ps -q $ServiceName).Trim()
  if (-not $containerId) {
    throw "DB container is not running. service=$ServiceName"
  }

  $health = (docker inspect -f "{{.State.Health.Status}}" $containerId).Trim()
  if ($health -ne "healthy") {
    throw "DB container is not healthy. health=$health"
  }

  $sql = "SELECT 1 AS ok;"
  $queryOut = docker compose exec -T $ServiceName mysql -upupoo -ppupoo1234! -D pupoodb -e $sql
  if (-not ($queryOut -match "\bok\b")) {
    throw "DB query failed: expected column 'ok'."
  }

  Write-Host "SMOKE_DB_OK"
} finally {
  Pop-Location
}
