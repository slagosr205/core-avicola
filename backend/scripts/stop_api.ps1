$ErrorActionPreference = 'Stop'

try {
  $conns = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
  if (-not $conns) {
    Write-Host 'No hay proceso escuchando en el puerto 8000'
    exit 0
  }

  $pids = ($conns | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique)
  foreach ($pid in $pids) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
  }
  Write-Host "API detenida. PID(s): $($pids -join ', ')"
} catch {
  Write-Host 'No se pudo detener la API'
  throw
}
