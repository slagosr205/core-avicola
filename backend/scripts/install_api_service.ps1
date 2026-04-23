$ErrorActionPreference = 'Stop'

# Instalacion sin privilegios: se crea un acceso directo en la carpeta Startup del usuario.
# Esto levanta la API automaticamente al iniciar sesion y corre en segundo plano.

$backendDir = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $PSScriptRoot 'run_api_service.cmd'

if (-not (Test-Path $runner)) {
  throw "No se encontro el runner: $runner"
}

$startup = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
if (-not (Test-Path $startup)) {
  throw "No se encontro la carpeta Startup: $startup"
}

$lnkPath = Join-Path $startup 'CoreAvicolaAPI.lnk'

$wsh = New-Object -ComObject WScript.Shell
$s = $wsh.CreateShortcut($lnkPath)
$s.TargetPath = 'cmd.exe'
$s.Arguments = "/c `"$runner`""
$s.WorkingDirectory = $backendDir
$s.IconLocation = "$env:SystemRoot\System32\shell32.dll,13"
$s.WindowStyle = 7 # Minimized
$s.Save()

# Inicia ahora mismo tambien.
Start-Process -FilePath 'cmd.exe' -ArgumentList "/c `"$runner`"" -WorkingDirectory $backendDir -WindowStyle Hidden

Write-Host "Servicio instalado (Startup): CoreAvicolaAPI"
Write-Host "API: http://localhost:8000 (logs en backend\\logs\\api.log)"
