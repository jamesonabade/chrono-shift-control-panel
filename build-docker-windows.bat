
@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ===========================================
echo    Script de Build Docker - Windows
echo ===========================================
echo.

:: Verificar se existe arquivo de configuração salva
set CONFIG_FILE=build-config.txt
set USE_SAVED=false

if exist %CONFIG_FILE% (
    echo Configuração anterior encontrada!
    set /p USE_SAVED="Deseja usar a configuração anterior? (s/n): "
)

if /i "!USE_SAVED!"=="s" (
    echo Carregando configuração salva...
    for /f "usebackq delims== tokens=1,2" %%a in ("%CONFIG_FILE%") do (
        if "%%a"=="IMAGE_NAME" set IMAGE_NAME=%%b
        if "%%a"=="TAG" set TAG=%%b
        if "%%a"=="DOMAIN" set DOMAIN=%%b
        if "%%a"=="BASE_PATH" set BASE_PATH=%%b
    )
    echo   Imagem: !IMAGE_NAME!:!TAG!
    echo   Domínio: !DOMAIN!
    echo   Contexto: !BASE_PATH!
    echo.
) else (
    :: Solicitar informações do usuário
    set /p IMAGE_NAME="Digite o nome da imagem (registry/nomedaimagem): "
    if "!IMAGE_NAME!"=="" (
        echo Erro: Nome da imagem é obrigatório!
        pause
        exit /b 1
    )

    set /p TAG="Digite a tag (deixe vazio para 'latest'): "
    if "!TAG!"=="" set TAG=latest

    set /p DOMAIN="Digite o domínio: "
    if "!DOMAIN!"=="" (
        echo Erro: Domínio é obrigatório!
        pause
        exit /b 1
    )

    set /p BASE_PATH="Digite o caminho base da aplicação (ex: /scripts ou deixe vazio para /): "
    if "!BASE_PATH!"=="" set BASE_PATH=/

    :: Normalizar BASE_PATH
    if not "!BASE_PATH!"=="/" (
        :: Garantir que comece com /
        if not "!BASE_PATH:~0,1!"=="/" set BASE_PATH=/!BASE_PATH!
        :: Remover / do final se existir
        if "!BASE_PATH:~-1!"=="/" set BASE_PATH=!BASE_PATH:~0,-1!
    )

    :: Salvar configuração para próxima vez
    echo IMAGE_NAME=!IMAGE_NAME! > %CONFIG_FILE%
    echo TAG=!TAG! >> %CONFIG_FILE%
    echo DOMAIN=!DOMAIN! >> %CONFIG_FILE%
    echo BASE_PATH=!BASE_PATH! >> %CONFIG_FILE%
    echo Configuração salva em %CONFIG_FILE%
)

echo.
echo ===========================================
echo Configurações:
echo   Imagem: !IMAGE_NAME!:!TAG!
echo   Domínio: !DOMAIN!
echo   Caminho: !BASE_PATH!
echo ===========================================
echo.

:: Determinar URLs corretas baseadas no contexto
if "!BASE_PATH!"=="/" (
    set API_URL=https://!DOMAIN!/api
) else (
    set API_URL=https://!DOMAIN!!BASE_PATH!/api
)

:: Criar arquivo .env.production
(
echo VITE_API_URL=!API_URL!
echo VITE_BASE_PATH=!BASE_PATH!
echo NODE_ENV=production
echo DOMAIN=!DOMAIN!
) > .env.production

echo Arquivo .env.production criado com sucesso!
echo   VITE_API_URL=!API_URL!
echo   VITE_BASE_PATH=!BASE_PATH!
echo.

:: Build do Frontend com tratamento de erro
echo ===========================================
echo Building Frontend Image...
echo ===========================================
:retry_frontend
docker build -f Dockerfile.frontend.prod -t !IMAGE_NAME!-frontend:!TAG! .
if %errorlevel% neq 0 (
    echo Erro no build do frontend!
    set /p RETRY="Deseja tentar novamente? (s/n): "
    if /i "!RETRY!"=="s" goto retry_frontend
    pause
    exit /b 1
)

echo Frontend build concluído!
echo.

:: Build do Backend com tratamento de erro
echo ===========================================
echo Building Backend Image...
echo ===========================================
:retry_backend
docker build -f backend/Dockerfile.prod -t !IMAGE_NAME!-backend:!TAG! ./backend
if %errorlevel% neq 0 (
    echo Erro no build do backend!
    set /p RETRY="Deseja tentar novamente? (s/n): "
    if /i "!RETRY!"=="s" goto retry_backend
    pause
    exit /b 1
)

echo Backend build concluído!
echo.

:: Perguntar sobre push
echo ===========================================
set /p PUSH_CHOICE="Deseja enviar (push) as imagens para o registry agora? (s/n): "
if /i "!PUSH_CHOICE!"=="s" (
    echo.
    echo Enviando imagens para o registry...
    docker push !IMAGE_NAME!-frontend:!TAG!
    docker push !IMAGE_NAME!-backend:!TAG!
    echo.
    echo Push concluído!
) else (
    echo.
    echo Build concluído sem push.
)

echo.
echo ===========================================
echo Script finalizado!
echo ===========================================
pause
