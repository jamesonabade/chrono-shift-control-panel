
# Documentação da API - Backend

## Endpoints Principais

### 1. Scripts

#### GET /api/scripts
Lista todos os scripts disponíveis
```json
{
  "scripts": [
    {
      "name": "date_config.sh",
      "type": "date",
      "size": 1024,
      "uploadDate": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

#### POST /api/upload-script
Upload de um novo script
```bash
curl -X POST \
  -F "script=@script.sh" \
  -F "type=date" \
  http://localhost:3001/api/upload-script
```

#### GET /api/preview-script/:filename
Preview do conteúdo de um script
```json
{
  "success": true,
  "content": "#!/bin/bash\necho 'Hello World'",
  "fileName": "script.sh"
}
```

#### POST /api/save-script?filename=script.sh&type=date
Salva um script editado
```bash
curl -X POST \
  -H "Content-Type: text/plain" \
  -d "#!/bin/bash\necho 'Script content'" \
  "http://localhost:3001/api/save-script?filename=script.sh&type=date"
```

#### POST /api/execute-script
Executa um script com parâmetros
```json
{
  "scriptName": "date_config.sh",
  "action": "Configurar Data",
  "environment": {
    "NEW_DATE": "2024-01-01",
    "TIME_ZONE": "America/Sao_Paulo"
  }
}
```

#### DELETE /api/delete-script/:filename
Remove um script
```bash
curl -X DELETE http://localhost:3001/api/delete-script/script.sh
```

#### GET /api/download-script/:filename
Download de um script
```bash
curl -O http://localhost:3001/api/download-script/script.sh
```

### 2. Logs

#### GET /api/backend-logs
Retorna logs do backend
```json
[
  {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "level": "INFO",
    "action": "SCRIPT_EXECUTION_SUCCESS",
    "details": {
      "scriptName": "date_config.sh",
      "stdout": "Data configurada com sucesso",
      "stderr": "",
      "exitCode": 0
    },
    "message": "[INFO] SCRIPT_EXECUTION_SUCCESS: {...}"
  }
]
```

### 3. Utilidades

#### POST /api/set-env
Define variáveis de ambiente
```json
{
  "VAR1": "value1",
  "VAR2": "value2"
}
```

#### GET /api/check-script/:type
Verifica se existe script para um tipo específico
```json
{
  "exists": true,
  "script": "date_config.sh",
  "type": "date"
}
```

## Códigos de Status

- **200**: Operação bem-sucedida
- **400**: Dados inválidos
- **404**: Recurso não encontrado
- **500**: Erro interno do servidor

## Autenticação

A API atualmente não requer autenticação JWT, utilizando validação baseada no estado do frontend.

## Rate Limiting

Não implementado atualmente. Para produção, considere implementar rate limiting.

## CORS

Configurado para aceitar todas as origens em desenvolvimento. Para produção, configure origens específicas.
