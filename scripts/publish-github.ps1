# Publishes Equitr to https://github.com/captainchamleon1/capstack
# Prerequisite: gh auth login (run once)

$ErrorActionPreference = "Stop"
$repo = "captainchamleon1/capstack"

function Get-GhExe {
  $candidates = @(
    "C:\Program Files\GitHub CLI\gh.exe",
    "$env:TEMP\gh-cli\bin\gh.exe"
  )
  foreach ($path in $candidates) {
    if (Test-Path $path) { return $path }
  }
  throw "GitHub CLI not found. Install from https://cli.github.com or rerun the agent publish step."
}

$gh = Get-GhExe
& $gh auth status | Out-Null

Push-Location $PSScriptRoot\..

if (-not (git remote get-url origin 2>$null)) {
  git remote add origin "https://github.com/$repo.git"
}

$exists = & $gh repo view $repo 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Creating public repository $repo..."
  & $gh repo create $repo --public --source . --remote origin --description "Modern cap table management for startups"
}

Write-Host "Pushing to GitHub..."
git push -u origin master

Write-Host ""
Write-Host "Live at: https://github.com/$repo"
