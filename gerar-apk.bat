@echo off
REM ==========================================================
REM  Gera o APK da Barbearia do Jota
REM  Clique duas vezes neste arquivo.
REM ==========================================================
setlocal
cd /d "%~dp0site-barbearia"

echo.
echo [1/3] Sincronizando o site para a pasta www...
if not exist www mkdir www
copy /Y index.html  www\index.html  >nul
copy /Y app.js      www\app.js      >nul
copy /Y styles.css  www\styles.css  >nul
copy /Y logo.svg    www\logo.svg    >nul
if exist img xcopy /E /I /Y /Q img www\img >nul

echo [2/3] Sincronizando com o Android...
call npx.cmd cap sync android

echo [3/3] Gerando o APK (pode demorar 1-2 minutos)...
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
pushd android
call gradlew.bat assembleDebug --no-daemon
popd

if exist "..\..\APK" (
  if not exist "..\..\APK" mkdir "..\..\APK"
)
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "..\APK\Barbearia-do-Jota.apk" >nul

echo.
echo ==========================================================
echo  PRONTO! O APK esta em:  ..\APK\Barbearia-do-Jota.apk
echo ==========================================================
echo.
start "" "..\APK"
endlocal
