@echo off
setlocal EnableDelayedExpansion
title Subir CosmoScope 3D a GitHub

cd /d "%~dp0"

if exist "%LocalAppData%\Programs\Git\cmd" (
    set "PATH=%LocalAppData%\Programs\Git\cmd;%PATH%"
)

where git >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Git no esta detectado en el sistema.
    echo Asegurate de que Git este instalado.
    echo.
    pause
    exit /b 1
)

echo ========================================================
echo            SUBIR COSMOSCOPE 3D A GITHUB
echo ========================================================
echo.
echo Git detectado correctamente.
echo.
echo Introduce el enlace HTTPS de tu repositorio de GitHub:
echo Ejemplo: https://github.com/30964urc4/CosmoScope-3D.git
echo.
set /p "REPO_URL=URL del repositorio: "

if "%REPO_URL%"=="" (
    echo.
    echo [!] No has introducido ninguna URL. Operacion cancelada.
    echo.
    pause
    exit /b 1
)

echo.
echo [1/4] Inicializando repositorio local Git...
git init

echo [2/4] Preparando archivos del proyecto...
git add .

echo [3/4] Creando commit principal...
git commit -m "Release CosmoScope 3D v2.0: Exoplanet Visualizer"

echo [4/4] Conectando con GitHub en rama main...
git branch -M main
git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

echo.
echo Enviando archivos a GitHub...
echo (Si es la primera vez, se abrira una ventana para autorizar GitHub).
git push -u origin main

if errorlevel 1 (
    echo.
    echo [!] Hubo un error al subir a GitHub. Revisa la URL o tu conexion.
) else (
    echo.
    echo ========================================================
    echo         PROYECTO SUBIDO CON EXITO A GITHUB
    echo ========================================================
)

echo.
pause
