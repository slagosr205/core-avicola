$ErrorActionPreference = 'Stop'

$backendDir = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $PSScriptRoot 'run_api_service.cmd'

if (-not (Test-Path $runner)) {
  throw "No se encontro el runner: $runner"
}

Start-Process -FilePath 'cmd.exe' -ArgumentList "/c `"$runner`"" -WorkingDirectory $backendDir -WindowStyle Hidden
Write-Host 'API iniciada (background). Logs en backend\logs\api.log'
