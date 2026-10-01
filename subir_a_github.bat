@echo off
setlocal EnableDelayedExpansion
title Actualizar CosmoScope 3D en GitHub

cd /d "%~dp0"

if exist "%LocalAppData%\Programs\Git\cmd" (
    set "PATH=%LocalAppData%\Programs\Git\cmd;%PATH%"
)

where git >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Git no esta detectado en el sistema.
    pause
    exit /b 1
)

echo ========================================================
echo         ACTUALIZAR COSMOSCOPE 3D EN GITHUB
echo ========================================================
echo.

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
    git init
    git branch -M main
)

git remote get-url origin >nul 2>nul
if errorlevel 1 (
    echo Repositorio no conectado a GitHub.
    echo Introduce el enlace HTTPS de tu repositorio:
    echo Ejemplo: https://github.com/30964urc4/CosmoScope3D.git
    echo.
    set /p "REPO_URL=URL del repositorio: "
    if "!REPO_URL!"=="" (
        echo [!] Operacion cancelada.
        pause
        exit /b 1
    )
    git remote add origin !REPO_URL!
) else (
    for /f "tokens=*" %%a in ('git remote get-url origin') do set "REPO_URL=%%a"
    echo Repositorio conectado: !REPO_URL!
    echo.
)

echo Que cambios has hecho? (Mensaje del commit)
echo (Puedes pulsar Enter para poner 'Actualizacion de CosmoScope 3D'):
set "COMMIT_MSG="
set /p "COMMIT_MSG=Mensaje: "
if "!COMMIT_MSG!"=="" set "COMMIT_MSG=Actualizacion de CosmoScope 3D"

echo.
echo [1/3] Preparando archivos modificados...
git add .

echo [2/3] Guardando cambios locales...
git commit -m "!COMMIT_MSG!"

echo [3/3] Subiendo cambios a GitHub (rama main)...
git push origin main

if errorlevel 1 (
    echo.
    echo [!] Hubo un error al subir a GitHub. Comprueba tu conexion o permisos.
) else (
    echo.
    echo ========================================================
    echo      CAMBIOS ACTUALIZADOS CON EXITO EN GITHUB
    echo ========================================================
    echo Tu web en GitHub Pages se actualizara en 1 minuto en:
    echo https://30964urc4.github.io/CosmoScope3D/
)

echo.
pause
