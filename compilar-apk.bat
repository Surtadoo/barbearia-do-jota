@echo off
title Compilar Barbearia do Jota - APK
echo ========================================
echo  BARBEARIA DO JOTA - COMPILADOR APK
echo ========================================
echo.

REM Verifica se esta na pasta correta
if not exist "site-barbearia\index.html" (
    echo ERRO: Rode este arquivo na raiz do projeto (onde esta a pasta site-barbearia).
    pause
    exit /b 1
)

cd site-barbearia

echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao esta instalado. Instale em https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js OK.

echo [2/6] Instalando Capacitor...
npm install @capacitor/core @capacitor/cli --save-dev >nul 2>&1
if errorlevel 1 (
    echo AVISO: Falha ao instalar Capacitor (verifique sua internet).
)

echo [3/6] Inicializando Capacitor (se necessario)...
if not exist "capacitor.config.json" (
    echo {} > capacitor.config.json
)
npx cap init "Barbearia do Jota" "com.barbeariadojota.app" --web-dir www >nul 2>&1

echo [4/6] Criando pasta www e copiando arquivos do site...
if not exist "www" mkdir www
copy index.html www\index.html >nul 2>&1
copy styles.css www\styles.css >nul 2>&1
copy app.js www\app.js >nul 2>&1
if exist "logo.svg" copy logo.svg www\logo.svg >nul 2>&1
if exist "barbeiro.jpg" copy barbeiro.jpg www\barbeiro.jpg >nul 2>&1

echo [5/6] Adicionando plataforma Android...
npx cap add android >nul 2>&1
if errorlevel 1 (
    echo Plataforma Android ja adicionada ou falha ao adicionar.
)

echo [6/6] Sincronizando web com Android...
npx cap copy >nul 2>&1
npx cap sync android >nul 2>&1

echo.
echo ========================================
echo  PRONTO! O projeto Android esta em:
echo  site-barbearia\android
echo ========================================
echo.
echo Para gerar o APK, abra o Android Studio:
echo   1. Clique em "Open an existing Android Studio project"
echo   2. Selecione a pasta: site-barbearia\android
echo   3. Clique em Build > Build Bundle(s) / APK(s) > Build APK(s)
echo.
echo Ou rode no terminal:
echo   cd site-barbearia\android
echo   ./gradlew assembleRelease
echo.
echo O APK ficara em: site-barbearia\android\app\build\outputs\apk\release\app-release.apk
echo.
pause
