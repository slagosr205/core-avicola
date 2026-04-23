$ErrorActionPreference = 'Stop'

$url = 'http://localhost:5173/'
$name = 'Core Avicola (Frontend)'

$desktop = [Environment]::GetFolderPath('Desktop')
$path = Join-Path $desktop ($name + '.lnk')

$wsh = New-Object -ComObject WScript.Shell
$s = $wsh.CreateShortcut($path)

$s.TargetPath = $url
$s.IconLocation = "$env:SystemRoot\System32\url.dll,0"
$s.Save()

Write-Host "Acceso directo creado en Escritorio: $path"
