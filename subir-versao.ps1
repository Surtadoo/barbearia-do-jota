# Sobe o numero da versao no site e no projeto Android.
# Uso:  powershell -ExecutionPolicy Bypass -File subir-versao.ps1 1.2.0
param(
  [Parameter(Mandatory = $true)][string]$Versao
)

$erro = 0
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$site = Join-Path $raiz "site-barbearia"

if ($Versao -notmatch '^\d+(\.\d+)*$') {
  Write-Host "ERRO: versao invalida '$Versao'. Use numeros, ex: 1.2.0" -ForegroundColor Red
  exit 1
}

# ---------- 1. site-barbearia\app.js ----------
$appJs = Join-Path $site "app.js"
$txt = [IO.File]::ReadAllText($appJs)
if ($txt -match "APP_VERSION:\s*'([^']*)'") {
  $antes = $Matches[1]
  $novo = [regex]::Replace($txt, "(APP_VERSION:\s*')[^']*(')", "`${1}$Versao`${2}")
  [IO.File]::WriteAllText($appJs, $novo)
  Write-Host ("  site       : v{0}  ->  v{1}" -f $antes, $Versao) -ForegroundColor Green
} else {
  Write-Host "  ERRO: nao achei APP_VERSION no app.js" -ForegroundColor Red
  $erro = 1
}

# ---------- 2. android\app\build.gradle ----------
$gradle = Join-Path $site "android\app\build.gradle"
if (Test-Path $gradle) {
  $txt = [IO.File]::ReadAllText($gradle)
  $antesNome = '?'
  if ($txt -match 'versionName\s+"([^"]*)"') { $antesNome = $Matches[1] }
  $txt = [regex]::Replace($txt, 'versionName\s+"[^"]*"', "versionName `"$Versao`"")

  # versionCode sempre sobe de 1 em 1
  $codigo = 1
  if ($txt -match 'versionCode\s+(\d+)') { $codigo = [int]$Matches[1] }
  $novoCodigo = $codigo + 1
  $txt = [regex]::Replace($txt, 'versionCode\s+\d+', "versionCode $novoCodigo")

  [IO.File]::WriteAllText($gradle, $txt)
  Write-Host ("  android    : {0}  ->  {1}   (codigo {2} -> {3})" -f $antesNome, $Versao, $codigo, $novoCodigo) -ForegroundColor Green
} else {
  Write-Host "  ERRO: nao achei build.gradle" -ForegroundColor Red
  $erro = 1
}

exit $erro
