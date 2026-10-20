@echo off
REM ==========================================================
REM  Liga TUDO o que a barbearia precisa:
REM    1. o servidor que confere o Pix na InfinitePay
REM    2. o site
REM
REM  DEIXE ESTA JANELA ABERTA. Se fechar, o Pix para.
REM ==========================================================
title Barbearia do Jota - Rodando
cd /d "%~dp0"

echo.
echo ==========================================================
echo   BARBEARIA DO JOTA
echo ==========================================================
echo.

REM --- 1. servidor do Pix ---
echo [0/2] (ja sincronizado acima)
echo.
echo [1/2] Ligando o servidor de pagamento Pix...
if not exist "backend\node_modules" (
  echo       primeira vez: instalando dependencias...
  pushd backend
  call npm.cmd install
  popd
)
start "Barbearia - Servidor Pix" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 4 /nobreak >nul

REM --- sincroniza o site para a pasta www (para o APK) ---
echo [1/2] Sincronizando o site para a pasta www...
if not exist "site-barbearia\www" mkdir "site-barbearia\www"
xcopy /Y /Q "site-barbearia\index.html" "site-barbearia\www\" >nul
xcopy /Y /Q "site-barbearia\app.js"      "site-barbearia\www\" >nul
xcopy /Y /Q "site-barbearia\styles.css"  "site-barbearia\www\" >nul
xcopy /Y /Q "site-barbearia\logo.svg"    "site-barbearia\www\" >nul
if exist "site-barbearia\img" xcopy /E /I /Y /Q "site-barbearia\img" "site-barbearia\www\img" >nul

REM --- 2. site ---
echo [2/2] Ligando o site...
start "Barbearia - Site" cmd /k "cd /d "%~dp0site-barbearia" && python -m http.server 8080"
timeout /t 3 /nobreak >nul

echo.
echo ==========================================================
echo   PRONTO!
echo.
echo   Site .............. http://localhost:8080
echo   No celular ........ http://192.168.1.73:8080
echo   Servidor do Pix ... rodando
echo.
echo   >>> Abra o site e faça um agendamento com Pix.
echo   >>> Se aparecer "Pix automatico nao esta funcionando",
echo       o servidor nao subiu: veja a janela "Servidor Pix".
echo.
echo   >>> IMPORTANTE: as duas janelas PRECISAM ficar abertas.
echo ==========================================================
echo.
start "" "http://localhost:8080"
echo (esta janela pode fechar, as outras duas nao)
timeout /t 10 /nobreak >nul
exit
