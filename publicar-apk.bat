@echo off
REM ==========================================================
REM  Publica uma versao nova do aplicativo no GitHub.
REM
REM  Uso:  clique 2x neste arquivo e responda o numero da versao.
REM
REM  O que ele faz:
REM    1. Sobe o numero da versao no app.js
REM    2. Gera o APK
REM    3. Manda tudo para o GitHub
REM    4. Cria a "Release" com o APK anexado
REM
REM  Depois disso, quem tem o app instalado abre e ve o popup
REM  "Versao X disponivel" com os botoes Atualizar / Depois.
REM ==========================================================
setlocal enabledelayedexpansion

cd /d "%~dp0"
set RAIZ=%CD%
set SITE=%RAIZ%\site-barbearia

echo.
echo ==========================================================
echo   PUBLICAR NOVIDADE NO GITHUB
echo ==========================================================
echo.

REM ---------- 1. git instalado? ----------
git --version >nul 2>&1
if errorlevel 1 (
  echo [ERRO] O Git nao esta instalado.
  echo Baixe em: https://git-scm.com/download/win
  echo Depois reinstale e rode este arquivo de novo.
  echo.
  pause
  exit /b 1
)

REM ---------- 2. versao atual ----------
set VERSAO=
for /f "tokens=2 delims=," %%v in ('findstr /b /c:"  APP_VERSION:" "%SITE%\app.js"') do (
  for %%t in (%%v) do set VERSAO=%%t
)
set VERSAO=%VERSAO:'=%
set VERSAO=%VERSAO: =%
echo Versao atual: %VERSAO%

set /p NOVA="Numero da versao nova (ex: 1.2.0): "
if "%NOVA%"=="" (
  echo Versao vazia. Cancelado.
  pause
  exit /b 1
)

echo.
echo Nova versao: v%NOVA%
echo.
set /p CONF=Confirma? (digite s): 
if /i not "%CONF%"=="s" (
  echo Cancelado.
  pause
  exit /b 1
)

REM ---------- 3. sobe a versao no app.js e no build.gradle ----------
echo.
echo [1/4] Atualizando numero da versao...
powershell -NoProfile -ExecutionPolicy Bypass -File "%RAIZ%\subir-versao.ps1" %NOVA%
if errorlevel 1 (
  echo [ERRO] Nao consegui mudar a versao. Veha a mensagem acima.
  pause
  exit /b 1
)

REM ---------- 4. sincroniza e gera o APK ----------
echo.
echo [2/4] Gerando o APK...
copy /Y "%SITE%\index.html" "%SITE%\www\index.html" >nul
copy /Y "%SITE%\app.js"     "%SITE%\www\app.js"     >nul
copy /Y "%SITE%\styles.css" "%SITE%\www\styles.css" >nul
copy /Y "%SITE%\logo.svg"   "%SITE%\www\logo.svg"   >nul
if exist "%SITE%\img" xcopy /E /I /Y /Q "%SITE%\img" "%SITE%\www\img" >nul

pushd "%SITE%"
call npx.cmd cap sync android >nul
popd

set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
pushd "%SITE%\android"
call gradlew.bat assembleDebug --no-daemon
popd

if not exist "%SITE%\android\app\build\outputs\apk\debug\app-debug.apk" (
  echo.
  echo [ERRO] O APK nao foi gerado. Veja as mensagens acima.
  pause
  exit /b 1
)
if not exist "%RAIZ%\APK" mkdir "%RAIZ%\APK"
copy /Y "%SITE%\android\app\build\outputs\apk\debug\app-debug.apk" "%RAIZ%\APK\Barbearia-do-Jota-v%NOVA%.apk" >nul
echo       pronto: APK\Barbearia-do-Jota-v%NOVA%.apk

REM ---------- 5. envia para o GitHub ----------
echo.
echo [3/4] Mandando para o GitHub...
if not exist "%RAIZ%\.git" (
  echo       ainda nao e um repositorio, criando...
  git init -q
  git branch -M main
)
git -c core.quotepath=false add -A
set /p MSG="   Mensagem da mudanca (ex: 'Corrigido o Pix'): "
if "%MSG%"=="" set MSG=Atualizacao %NOVA%
git commit -q -m "v%NOVA% - %MSG%"
if errorlevel 1 (
  echo       nada novo para enviar, segue em frente.
)

git push -u origin main
if errorlevel 1 (
  echo.
  echo ==========================================================
  echo   NAO CONSEGUI ENVIAR PARA O GITHUB
  echo ==========================================================
  echo.
  echo  "Repository not found" = endereco do repositorio errado.
  echo  "Authentication" ou "could not read Username" = falta login.
  echo.
  echo  Rode este comando UMA vez, na sua propria janela:
  echo.
  echo      cd /d "%RAIZ%"
  echo      git push -u origin main
  echo.
  echo  Vai abrir o navegador: faca login e autorize.
  echo  Depois volte aqui e rode o publicar-apk.bat de novo.
  echo.
  pause
  exit /b 1
)

REM ---------- 6. cria a release com o APK ----------
echo.
echo [4/4] Criando a release v%NOVA% no GitHub...
gh release create "v%NOVA%" "%RAIZ%\APK\Barbearia-do-Jota-v%NOVA%.apk" ^
   --title "Barbearia do Jota v%NOVA%" ^
   --notes "%MSG%" 2>nul

if errorlevel 1 (
  echo.
  echo O comando "gh" nao estava disponivel, entao a release nao foi criada sozinha.
  echo Crie na mao pelo site:
  echo.
  echo     https://github.com/Surtadoo/barbearia-do-jota/releases/new
  echo
  echo   - Tag:               v%NOVA%
  echo   - Titulo:            Barbearia do Jota v%NOVA%
  echo   - Anexar arquivo:    APK\Barbearia-do-Jota-v%NOVA%.apk
  echo.
  echo Sem a release o popup de atualizacao NAO aparece.
) else (
  echo       release criada!
)

echo.
echo ==========================================================
echo   PUBLICADO: v%NOVA%
echo.
echo   Quem tem o app instalado vera o popup ao abrir.
echo   Ele precisa estar no mesmo repositorio que esta
echo   em Ajustos ^> Repositorio do GitHub.
echo ==========================================================
echo.
pause
endlocal
