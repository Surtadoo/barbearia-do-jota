# Atualiza o APK do Painel: versao, assets e build.
#   powershell -ExecutionPolicy Bypass -File atualizar-painel.ps1 1.0.12
param([Parameter(Mandatory = $true)][string]$Versao)

$erro = 0
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$painel = Join-Path $raiz 'apk-painel'

if ($Versao -notmatch '^\d+(\.\d+)*$') {
  Write-Host "ERRO: versao invalida '$Versao'." -ForegroundColor Red
  exit 1
}

# ---------- 1. apk-painel\painel.js ----------
$js = Join-Path $painel 'painel.js'
if (Test-Path $js) {
  $txt = [IO.File]::ReadAllText($js)
  $antes = if ($txt -match "APP_VERSION:\s*'([^']*)'") { $Matches[1] } else { '?' }
  $txt = [regex]::Replace($txt, "(APP_VERSION:\s*')[^']*(')", "`${1}$Versao`${2}")
  [IO.File]::WriteAllText($js, $txt)
  Write-Host ("  painel.js  : v{0}  ->  v{1}" -f $antes, $Versao) -ForegroundColor Green
} else {
  Write-Host "  ERRO: nao achei apk-painel\painel.js" -ForegroundColor Red
  $erro = 1
}

# ---------- 2. android\app\build.gradle ----------
$gradle = Join-Path $painel 'android\app\build.gradle'
if (Test-Path $gradle) {
  $txt = [IO.File]::ReadAllText($gradle)
  $antesNome = '?'
  if ($txt -match 'versionName\s+"([^"]*)"') { $antesNome = $Matches[1] }
  $txt = [regex]::Replace($txt, 'versionName\s+"[^"]*"', "versionName `"$Versao`"")
  $codigo = 1
  if ($txt -match 'versionCode\s+(\d+)') { $codigo = [int]$Matches[1] }
  $txt = [regex]::Replace($txt, 'versionCode\s+\d+', "versionCode $($codigo + 1)")
  [IO.File]::WriteAllText($gradle, $txt)
  Write-Host ("  painel apk : {0}  ->  {1}   (codigo {2} -> {3})" -f $antesNome, $Versao, $codigo, ($codigo + 1)) -ForegroundColor Green
} else {
  Write-Host "  ERRO: nao achei apk-painel\android\app\build.gradle" -ForegroundColor Red
  $erro = 1
}

# ---------- 3. copia a web para os assets ----------
Write-Host "  copiando a web do painel para o android..."
$dest = Join-Path $painel 'android\app\src\main\assets\public\'
New-Item -ItemType Directory -Path $dest -Force | Out-Null
Copy-Item (Join-Path $painel 'index.html'), (Join-Path $painel 'painel.js'), (Join-Path $painel 'styles.css'), (Join-Path $painel 'logo.svg') -Destination $dest -Force

# ---------- 4. build ----------
Write-Host "  gerando o APK do Painel (1 minuto)..."
$env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
if (-not $env:JAVA_HOME) { $env:JAVA_HOME = (Get-Command java).Source.Replace('\bin\java.exe', '') }
$said = Join-Path $painel 'android\app\build\outputs\apk\debug\app-debug.apk'
# apaga o APK antigo para nao copiar versao velha por engano
if (Test-Path $said) { Remove-Item $said -Force }
Push-Location (Join-Path $painel 'android')
& ".\gradlew.bat" assembleDebug --no-daemon | Out-Null
$buildOk = ($LASTEXITCODE -eq 0)
Pop-Location
if ($buildOk -and (Test-Path $said)) {
  $apasta = Join-Path $raiz 'APK'
  if (-not (Test-Path $apasta)) { New-Item -ItemType Directory -Path $apasta | Out-Null }
  Copy-Item $said (Join-Path $apasta "Painel-v$Versao.apk") -Force
  Copy-Item $said (Join-Path $apasta 'Painel.apk') -Force
  Write-Host ("  pronto     : APK\Painel-v{0}.apk" -f $Versao) -ForegroundColor Green
} else {
  Write-Host "  ERRO: o APK do painel nao foi gerado." -ForegroundColor Red
  $erro = 1
}

exit $erro
