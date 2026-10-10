Get-Process -Name electron -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name HushLoop -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Output "Cleaned up all Electron and HushLoop processes"
