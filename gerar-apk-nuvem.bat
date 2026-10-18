@echo off
title Barbearia do Jota - Gerar APK (Nuvem)
where node >nul 2>nul || (echo Instale o Node.js 18+ em https://nodejs.org e rode de novo. & pause & exit /b 1)

cd /d "%~dp0app-barbearia"

echo ========================================
echo   BARBEARIA DO JOTA - APK NA NUVEM
echo ========================================
echo.
echo Este script gera o APK pela nuvem da Expo (EAS Build).
echo NAO e preciso instalar o Android Studio.
echo.

echo [1] Instalando dependencias...
call npm install || (echo Falha no npm install & pause & exit /b 1)

echo [2] Instalando EAS CLI...
call npm install -g expo-cli eas-cli || (echo Falha ao instalar EAS CLI & pause & exit /b 1)

echo [3] Fazendo login na Expo (abra o navegador que vai abrir)...
call npx expo login || (echo Falha ao fazer login & pause & exit /b 1)

echo [4] Gerando o APK (pode demorar 5-15 minutos)...
call npx eas build -p android --profile preview --non-interactive || (echo Falha ao gerar o build & pause & exit /b 1)

echo.
echo ========================================
echo   BUILD CONCLUIDO!
echo ========================================
echo.
echo O APK esta disponível na sua conta Expo (expo.dev).
echo Baixe o arquivo .apk gerado pelo link que aparece acima.
echo.
pause
