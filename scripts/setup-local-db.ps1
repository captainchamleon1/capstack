# Creates the capstack role and database on local PostgreSQL 16.
# Usage: .\scripts\setup-local-db.ps1
# You will be prompted for the postgres superuser password once.

$ErrorActionPreference = "Stop"
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"

if (-not (Test-Path $psql)) {
  Write-Error "psql not found at $psql. Install PostgreSQL 16 or update the path in this script."
}

$sql = Join-Path $PSScriptRoot "setup-local-db.sql"
Write-Host "Creating capstack role and database..."
& $psql -U postgres -f $sql

if ($LASTEXITCODE -ne 0) {
  Write-Error "Database setup failed. Check your postgres superuser password."
}

Write-Host "Done. Run: npm run db:deploy && npm run db:seed"
