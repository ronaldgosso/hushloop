# Sync latest compiled release files into the Advanced Installer package
param (
    [string]$SourceDir = "..\release\win-unpacked",
    [string]$TargetDir = ".\app"
)

Write-Host "Syncing app files from $SourceDir to $TargetDir..." -ForegroundColor Cyan

if (-not (Test-Path $SourceDir)) {
    Write-Error "Source directory not found: $SourceDir. Please run 'npm run package:dir' first."
    exit 1
}

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

Copy-Item -Path "$SourceDir\*" -Destination $TargetDir -Recurse -Force
Write-Host "Successfully synced app files! Ready for Advanced Installer." -ForegroundColor Green
