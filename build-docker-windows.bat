
@echo off
setlocal enabledelayedexpansion

echo ===========================================
echo    Script de Build Docker - Windows
echo ===========================================
echo.

:: Solicitar informações do usuário
set /p IMAGE_NAME="Digite o nome da imagem (registry/nomedaimagem): "
if "%IMAGE_NAME%"=="" (
    echo Erro: Nome da imagem é obrigatório!
    pause
    exit /b 1
)

set /p TAG="Digite a tag (deixe vazio para 'latest'): "
if "%TAG%"=="" set TAG=latest

set /p DOMAIN="Digite o domínio: "
if "%DOMAIN%"=="" (
    echo Erro: Domínio é obrigatório!
    pause
    exit /b 1
)

echo.
echo ===========================================
echo Configurações:
echo   Imagem: %IMAGE_NAME%:%TAG%
echo   Domínio: %DOMAIN%
echo ===========================================
echo.

:: Criar arquivo .env.production
echo VITE_API_URL=https://%DOMAIN%/api > .env.production
echo NODE_ENV=production >> .env.production
echo DOMAIN=%DOMAIN% >> .env.production

echo Arquivo .env.production criado com sucesso!
echo.

:: Build do Frontend
echo ===========================================
echo Building Frontend Image...
echo ===========================================
docker build -f Dockerfile.frontend.prod -t %IMAGE_NAME%-frontend:%TAG% .
if %errorlevel% neq 0 (
    echo Erro no build do frontend!
    pause
    exit /b 1
)

echo Frontend build concluído!
echo.

:: Build do Backend
echo ===========================================
echo Building Backend Image...
echo ===========================================
docker build -f backend/Dockerfile.prod -t %IMAGE_NAME%-backend:%TAG% ./backend
if %errorlevel% neq 0 (
    echo Erro no build do backend!
    pause
    exit /b 1
)

echo Backend build concluído!
echo.

:: Perguntar sobre push
echo ===========================================
set /p PUSH_CHOICE="Deseja enviar (push) as imagens para o registry agora? (s/n): "
if /i "%PUSH_CHOICE%"=="s" (
    echo.
    echo Enviando imagens para o registry...
    docker push %IMAGE_NAME%-frontend:%TAG%
    docker push %IMAGE_NAME%-backend:%TAG%
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
