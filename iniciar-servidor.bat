@echo off
REM ==========================================================
REM  Sobe o servidor que confere o pagamento do Pix
REM  Clique duas vezes e DEIXE A JANELA ABERTA.
REM ==========================================================
cd /d "%~dp0backend"

echo.
echo  Iniciando o servidor da Barbearia do Jota...
echo  Para o Pix funcionar, esta janela precisa ficar aberta.
echo.

node server.js

echo.
echo  O servidor foi encerrado. Fecheu esta janela, o Pix parou de funcionar.
pause
