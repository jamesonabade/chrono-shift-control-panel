
@echo off
setlocal enabledelayedexpansion

REM Script para build e deploy do TimeEventos
REM Uso: build-deploy.bat [dev|prod]

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev

set CONFIG_FILE=.registry-config.bat

echo === TimeEventos Build ^& Deploy ===
echo Ambiente: %ENVIRONMENT%

REM Verificar se existe configuracao
if not exist "%CONFIG_FILE%" (
    call :collect_registry_config
) else (
    echo Carregando configuracoes existentes...
    call "%CONFIG_FILE%"
)

REM Validar variaveis
if "%REGISTRY_URL%"=="" (
    echo Erro: Configuracoes do registry nao encontradas
    exit /b 1
)

REM Fazer login no registry
echo Fazendo login no registry...
echo %REGISTRY_PASSWORD% | docker login %REGISTRY_URL% -u %REGISTRY_USERNAME% --password-stdin

if errorlevel 1 (
    echo Erro: Falha no login do registry
    exit /b 1
)

REM Gerar tag baseada no ambiente
if "%ENVIRONMENT%"=="prod" (
    for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set DATE=%%c%%a%%b
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIME=%%a%%b
    set TAG=!DATE!-!TIME!
    set COMPOSE_FILE=docker-compose.prod.yml
) else (
    for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set DATE=%%c%%a%%b
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIME=%%a%%b
    set TAG=dev-!DATE!-!TIME!
    set COMPOSE_FILE=docker-compose.yml
)

echo Tag: %TAG%
echo Compose file: %COMPOSE_FILE%

REM Build das imagens
echo === Building Frontend ===
docker build -f Dockerfile.prod -t %REGISTRY_URL%/timeeventos-frontend:%TAG% .
docker build -f Dockerfile.prod -t %REGISTRY_URL%/timeeventos-frontend:latest .

echo === Building Backend ===
docker build -f backend/Dockerfile.prod -t %REGISTRY_URL%/timeeventos-backend:%TAG% ./backend
docker build -f backend/Dockerfile.prod -t %REGISTRY_URL%/timeeventos-backend:latest ./backend

REM Push das imagens
echo === Pushing Images ===
docker push %REGISTRY_URL%/timeeventos-frontend:%TAG%
docker push %REGISTRY_URL%/timeeventos-frontend:latest
docker push %REGISTRY_URL%/timeeventos-backend:%TAG%
docker push %REGISTRY_URL%/timeeventos-backend:latest

echo === Build e Push Concluidos ===
echo Frontend: %REGISTRY_URL%/timeeventos-frontend:%TAG%
echo Backend: %REGISTRY_URL%/timeeventos-backend:%TAG%

REM Se for ambiente de desenvolvimento, fazer deploy local
if "%ENVIRONMENT%"=="dev" (
    echo === Deploy Local (Desenvolvimento) ===
    set REGISTRY_URL=%REGISTRY_URL%
    set TAG=%TAG%
    docker-compose -f %COMPOSE_FILE% up -d
    echo Deploy local concluido!
) else (
    echo === Para deploy em producao ===
    echo Execute no servidor de producao:
    echo REGISTRY_URL=%REGISTRY_URL% TAG=%TAG% docker-compose -f %COMPOSE_FILE% up -d
)

goto :eof

:collect_registry_config
echo === Configuracao do Registry Privado ===
set /p REGISTRY_URL=URL do Registry (ex: my-registry.com): 
set /p REGISTRY_USERNAME=Username do Registry: 
set /p REGISTRY_PASSWORD=Password/Token do Registry: 

REM Salvar configuracoes
(
echo set REGISTRY_URL=%REGISTRY_URL%
echo set REGISTRY_USERNAME=%REGISTRY_USERNAME%
echo set REGISTRY_PASSWORD=%REGISTRY_PASSWORD%
) > %CONFIG_FILE%

echo Configuracoes salvas em %CONFIG_FILE%
echo IMPORTANTE: Adicione '%CONFIG_FILE%' ao seu .gitignore
goto :eof
