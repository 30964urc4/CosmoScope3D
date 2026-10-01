@echo off
title CosmoScope 3D - Inicializador
cd /d "%~dp0"
echo ========================================================
echo       INICIANDO COSMOSCOPE 3D (Explorador NASA)
echo ========================================================
echo Iniciando servidor y ventana del simulador...
start "" "CosmoScope3D.exe"
exit
