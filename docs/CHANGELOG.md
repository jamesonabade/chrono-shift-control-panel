
# Changelog

## [1.0.0] - 2024-01-01

### Adicionado
- Sistema de autenticação com múltiplos usuários
- Dashboard com abas organizadas por permissões
- Upload e execução de scripts bash/shell
- Sistema de logs frontend e backend
- Personalização completa da interface (papel de parede, logo, favicon, títulos)
- Gerenciamento de usuários e permissões
- Configuração de data do sistema
- Restauração de banco de dados
- Preview e edição de scripts inline
- Categorização automática de scripts
- Exportação de logs em JSON
- Container Docker com execução privilegiada
- Volume mounts para persistência
- Documentação completa

### Tecnologias
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + Multer
- DevOps: Docker + Docker Compose
- UI: Shadcn/UI components
- Logs: Arquivo + memória com rotação

### Segurança
- Execução isolada em containers
- Permissões granulares por usuário
- Logs de auditoria completos
- Validação de uploads
- CORS configurado

### Deploy
- Suporte completo para produção
- Nginx reverse proxy
- SSL/TLS com Let's Encrypt
- Scripts de monitoramento
- Backup automatizado
- Health checks

## Próximas Versões

### [1.1.0] - Planejado
- [ ] Autenticação JWT
- [ ] Criptografia de senhas
- [ ] API rate limiting
- [ ] Notificações em tempo real
- [ ] Editor de código melhorado
- [ ] Agendamento de scripts
- [ ] Métricas de performance

### [1.2.0] - Planejado
- [ ] Integração com APIs externas
- [ ] Dashboard de monitoramento
- [ ] Alertas por email/webhook
- [ ] Versionamento de scripts
- [ ] Rollback automático
- [ ] Clusters multi-node
