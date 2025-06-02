
@echo off
setlocal enabledelayedexpansion

REM Script unificado para build e deploy do TimeEventos
REM Uso: build-deploy.bat

set CONFIG_FILE=.build-config.bat

echo === TimeEventos Build ^& Deploy ===

REM Verificar se existe configuracao
if not exist "%CONFIG_FILE%" (
    call :collect_config
) else (
    echo Carregando configuracoes existentes...
    call "%CONFIG_FILE%"
    
    echo Configuracoes atuais:
    echo - Ambiente: !ENVIRONMENT!
    echo - API URL: !API_URL!
    echo - Registry: !REGISTRY_URL!/!REGISTRY_DIR!
    echo - Projeto: !PROJECT_NAME!
    echo - Tag: !TAG!
    echo.
    
    set /p USE_EXISTING=Deseja usar essas configuracoes? (y/n): 
    if not "!USE_EXISTING!"=="y" (
        call :collect_config
        call "%CONFIG_FILE%"
    )
)

REM Criar arquivo de configuracao da API para build
(
echo VITE_API_URL=!API_URL!
) > .env.build

echo Arquivo de configuracao da API criado: !API_URL!

REM Fazer login no registry
echo Fazendo login no registry...
echo !REGISTRY_PASSWORD! | docker login !REGISTRY_URL! -u !REGISTRY_USERNAME! --password-stdin

if errorlevel 1 (
    echo Erro: Falha no login do registry
    exit /b 1
)

REM Definir nomes das imagens
set FRONTEND_IMAGE=!REGISTRY_URL!/!REGISTRY_DIR!/!PROJECT_NAME!-frontend:!TAG!
set BACKEND_IMAGE=!REGISTRY_URL!/!REGISTRY_DIR!/!PROJECT_NAME!-backend:!TAG!

echo === Building Images ===
echo Frontend: !FRONTEND_IMAGE!
echo Backend: !BACKEND_IMAGE!

REM Build das imagens
echo Building frontend...
docker build -t !FRONTEND_IMAGE! .

echo Building backend...
docker build -t !BACKEND_IMAGE! ./backend

REM Push das imagens
echo === Pushing Images ===
docker push !FRONTEND_IMAGE!
docker push !BACKEND_IMAGE!

echo === Build e Push Concluidos ===
echo Frontend: !FRONTEND_IMAGE!
echo Backend: !BACKEND_IMAGE!

REM Se for desenvolvimento, perguntar sobre deploy local
if "!ENVIRONMENT!"=="dev" (
    set /p DEPLOY_LOCAL=Deseja fazer deploy local? (y/n): 
    if "!DEPLOY_LOCAL!"=="y" (
        echo === Deploy Local ===
        docker-compose up -d
        echo Deploy local concluido!
        echo Frontend: http://localhost:8080
        echo Backend: http://localhost:3001
    )
) else (
    echo === Para deploy em producao ===
    echo Execute no servidor de producao:
    echo docker run -d -p 8080:8080 --name timeeventos-frontend !FRONTEND_IMAGE! npm run preview -- --host 0.0.0.0 --port 8080
    echo docker run -d -p 3001:3001 --name timeeventos-backend -v /var/run/docker.sock:/var/run/docker.sock !BACKEND_IMAGE!
)

goto :eof

:collect_config
echo === Configuracao do Build ===

echo Selecione o ambiente:
echo 1) Desenvolvimento (local)
echo 2) Producao
set /p ENV_CHOICE=Escolha (1 ou 2): 

if "!ENV_CHOICE!"=="2" (
    set ENVIRONMENT=prod
    set /p API_URL=Endereco da API (ex: http://servidor-producao:3001): 
) else (
    set ENVIRONMENT=dev
    set API_URL=http://timeeventos-backend:3001
    echo Usando API padrao para desenvolvimento: !API_URL!
)

set /p REGISTRY_URL=URL do Registry (ex: registry.uesb.br): 
set /p REGISTRY_DIR=Diretorio no Registry (ex: timeeventos): 
set /p PROJECT_NAME=Nome do projeto [timeeventos]: 
if "!PROJECT_NAME!"=="" set PROJECT_NAME=timeeventos

set /p TAG=Tag da imagem [latest]: 
if "!TAG!"=="" set TAG=latest

set /p REGISTRY_USERNAME=Username do Registry: 
set /p REGISTRY_PASSWORD=Password/Token do Registry: 

REM Salvar configuracoes
(
echo set ENVIRONMENT=!ENVIRONMENT!
echo set API_URL=!API_URL!
echo set REGISTRY_URL=!REGISTRY_URL!
echo set REGISTRY_DIR=!REGISTRY_DIR!
echo set PROJECT_NAME=!PROJECT_NAME!
echo set TAG=!TAG!
echo set REGISTRY_USERNAME=!REGISTRY_USERNAME!
echo set REGISTRY_PASSWORD=!REGISTRY_PASSWORD!
) > %CONFIG_FILE%

echo Configuracoes salvas em %CONFIG_FILE%
echo IMPORTANTE: Adicione '%CONFIG_FILE%' ao seu .gitignore
goto :eof
