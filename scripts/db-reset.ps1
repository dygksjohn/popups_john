param(
  [switch]$NoStart
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
  docker compose down -v
  if (-not $NoStart) {
    docker compose up -d mysql
    docker compose ps
  }
} finally {
  Pop-Location
}
