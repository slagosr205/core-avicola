$ErrorActionPreference = 'Stop'

$startup = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
$lnkPath = Join-Path $startup 'CoreAvicolaAPI.lnk'

Write-Host "Instalado (Startup): $([bool](Test-Path $lnkPath))"

try {
  $listening = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
  if ($listening) {
    Write-Host "API escuchando en 8000: SI (PID(s): $((($listening | Select-Object -ExpandProperty OwningProcess) | Sort-Object -Unique) -join ', '))"
  } else {
    Write-Host "API escuchando en 8000: NO"
  }
} catch {
  Write-Host "API escuchando en 8000: (no se pudo verificar)"
}
