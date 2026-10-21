# Cria a release no GitHub e anexa o APK.
# Chamado pelo publicar-apk.bat — normalmente voce nao roda isto na mao.
#
#   powershell -File publicar-release.ps1 -Versao 1.0.05 -Apk "APK\Barbearia-do-Jota.apk"
#
# Precisa do token em github-token.txt (veja TOKEN-GITHUB.md).

param(
  [Parameter(Mandatory = $true)][string]$Versao,
  [Parameter(Mandatory = $true)][string]$Apk,
  [string]$Usuario = 'Surtadoo',
  [string]$Repositorio = 'barbearia-do-jota',
  [string]$Mensagem = ''
)

$erro = 0
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$api = 'https://api.github.com'

function Falhar($msg) {
  Write-Host ""
  Write-Host "  ERRO: $msg" -ForegroundColor Red
  $script:erro = 1
}

# ---------- 1. token ----------
$arqToken = Join-Path $raiz 'github-token.txt'
if (-not (Test-Path $arqToken)) {
  Write-Host ""
  Write-Host "  ======================================================" -ForegroundColor Yellow
  Write-Host "   PRIMEIRA VEZ: preciso de um token do GitHub" -ForegroundColor Yellow
  Write-Host "  ======================================================" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "  1. Abra esta pagina no navegador:"
  Write-Host "       https://github.com/settings/tokens/new" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  2. Preencha:"
  Write-Host "       Note .............. PC da barbearia"
  Write-Host "       Expiration ........ 90 days"
  Write-Host "       Repository access . Only select repositories"
  Write-Host "                          e escolha barbearia-do-jota"
  Write-Host "       Permissions ....... Contents -> Read and write"
  Write-Host ""
  Write-Host "  3. Clique em Generate token e copie a chave (comeca com ghp_ ou github_pat_)"
  Write-Host ""
  Write-Host "  Vou abrir a pagina do GitHub. Depois cole a chave aqui."
  Write-Host ""
  try { Start-Process 'https://github.com/settings/tokens/new' } catch {}
  Write-Host "  ----------------------------------------------------"
  $digitado = Read-Host "  Cole o token aqui (ou SAIR para cancelar)"
  Write-Host "  ----------------------------------------------------"
  Write-Host ""

  if ($digitado -match '^(sair|S)$') { Falhar "Cancelado por voce."; exit 1 }
  $digitado = $digitado.Trim()

  if ($digitado -notmatch '^(gh[pousr]_|github_pat_)[A-Za-z0-9_\-]{10,}') {
    Falhar "Isso nao parece um token do GitHub."
    Write-Host "  Deve comecar com ghp_ (classico) ou github_pat_ (refinado)."
    Write-Host "  Copie de novo la no GitHub e cole na proxima tela."
    exit 1
  }

  Set-Content -Path $arqToken -Value $digitado -NoNewline -Encoding ASCII
  Write-Host "  Token salvo em github-token.txt (nao vai para o GitHub)." -ForegroundColor Green
  Write-Host ""
}

$token = ([IO.File]::ReadAllText($arqToken)).Trim()
if ($token.Length -lt 20) {
  Falhar "O token em github-token.txt parece invalido (curto demais)."
  exit 1
}
$cabec = @{ Authorization = "Bearer $token"; Accept = 'application/vnd.github+json'; 'User-Agent' = 'barbearia-apk' }

# ---------- 2. arquivo ----------
$caminhoApk = if ([IO.Path]::IsPathRooted($Apk)) { $Apk } else { Join-Path $raiz $Apk }
if (-not (Test-Path $caminhoApk)) {
  Falhar "Nao achei o APK em: $caminhoApk"
  exit 1
}
$mb = [math]::Round((Get-Item $caminhoApk).Length / 1MB, 2)
Write-Host "  APK: $(Split-Path $caminhoApk -Leaf)  ($mb MB)"

# ---------- 3. confere se a tag ja existe ----------
$tag = "v$Versao"
Write-Host "  Procurando a tag $tag ..."
$existe = $false
try {
  $r = Invoke-RestMethod "$api/repos/$Usuario/$Repositorio/git/refs/tags/$tag" -Headers $cabec -TimeoutSec 30
  $existe = $true
  Write-Host "  A tag ja existe no GitHub." -ForegroundColor Yellow
} catch {
  $existe = $false
}

# ---------- 4. cria a release ----------
$urlUpload = $null
if ($existe) {
  try {
    $rels = Invoke-RestMethod "$api/repos/$Usuario/$Repositorio/releases" -Headers $cabec -TimeoutSec 30
    $achada = $rels | Where-Object { $_.tag_name -eq $tag } | Select-Object -First 1
    if ($achada) {
      Write-Host "  Release ja existe. Vou adicionar o APK nela."
      $urlUpload = $achada.upload_url -replace '\{\?name,label\}$', ''
    }
  } catch { Falhar "Nao consegui ler as releases: $($_.Exception.Message)" }
} else {
  Write-Host "  Criando a release $tag ..."
  $corpo = @{
    tag_name    = $tag
    name        = "Barbearia do Jota $tag"
    body        = $(if ($Mensagem) { $Mensagem } else { "Atualizacao do aplicativo Barbearia do Jota." })
    draft       = $false
    prerelease  = $false
  } | ConvertTo-Json

  try {
    $rel = Invoke-RestMethod "$api/repos/$Usuario/$Repositorio/releases" -Method Post -Headers $cabec `
          -Body ([Text.Encoding]::UTF8.GetBytes($corpo)) -ContentType 'application/json; charset=utf-8' -TimeoutSec 40
    $urlUpload = $rel.upload_url -replace '\{\?name,label\}$', ''
    Write-Host "  Release criada!" -ForegroundColor Green
  } catch {
    $detalhe = $_.Exception.Message
    try {
      $leitura = $_.Exception.Response.GetResponseStream()
      $resp = (New-Object IO.StreamReader($leitura)).ReadToEnd()
      if ($resp) { $detalhe = $resp }
    } catch {}
    Falhar "Nao consegui criar a release: $detalhe"
    exit 1
  }
}

if (-not $urlUpload) { Falhar "Nao obtive o endereco de upload."; exit 1 }

# ---------- 5. anexa o APK ----------
$nomeAsset = Split-Path $caminhoApk -Leaf
Write-Host "  Enviando o APK ..."
$destino = $urlUpload + "?name=" + [uri]::EscapeDataString($nomeAsset)
try {
  Invoke-WebRequest -Uri $destino -Method Post -Headers $cabec -InFile $caminhoApk `
    -ContentType 'application/vnd.android.package-archive' -TimeoutSec 300 | Out-Null
  Write-Host "  APK anexado!" -ForegroundColor Green
} catch {
  $detalhe = $_.Exception.Message
  try {
    $leitura = $_.Exception.Response.GetResponseStream()
    $resp = (New-Object IO.StreamReader($leitura)).ReadToEnd()
    if ($resp) { $detalhe = $resp }
  } catch {}
  Falhar "Nao consegui anexar o APK: $detalhe"
  exit 1
}

Write-Host ""
Write-Host "  PRONTO! Release $tag publicada com o APK." -ForegroundColor Green
Write-Host "  https://github.com/$Usuario/$Repositorio/releases/tag/$tag"
exit 0
