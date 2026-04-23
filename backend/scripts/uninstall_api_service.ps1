$ErrorActionPreference = 'Stop'

$startup = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
$lnkPath = Join-Path $startup 'CoreAvicolaAPI.lnk'

if (Test-Path $lnkPath) {
  Remove-Item $lnkPath -Force
  Write-Host "Servicio desinstalado (Startup): CoreAvicolaAPI"
} else {
  Write-Host "No existe el servicio (Startup): CoreAvicolaAPI"
}

# Intento de apagado: si existe un proceso escuchando en 8000, lo detenemos.
try {
  $conns = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    if ($c.OwningProcess) {
      Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
} catch {
  # Ignorar
}
