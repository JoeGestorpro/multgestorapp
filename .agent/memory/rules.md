# Regras Permanentes do Projeto

Estas regras DEVEM ser seguidas por todos os agentes que trabalharem neste projeto.

---

## Regras de Contexto

### R1. Leitura Obrigatória da Memória Compartilhada
Antes de qualquer implementação, o agente DEVE ler:
- `.agent/context/memory-snapshot.md` — resumo executivo
- `.agent/context/ai-operating-rules.md` — regras de operação para IA
- `.agent/memory/current-state.md` — estado atual do projeto
- `.agent/memory/next-actions.md` — próximas ações

### R2. Context Engineer é obrigatório primeiro
Antes de qualquer ação técnica, chamar o context-engineer (`.agent/Joe-orchestrators/agents/context-manager.md`) para reconstruir o estado real do projeto.

### R3. Atualização da Memória Após Tarefa
Após qualquer implementação, atualizar:
- `current-state.md` se houver mudanças no estado
- `implementation-log.md` com detalhes da implementação
- `next-actions.md` movendo itens concluídos
- `decisions.md` se novas decisões forem tomadas
- `session-snapshot.md` com o estado atualizado

---

## Regras de Arquitetura

### R4. company_id é obrigatório (NUNCA owner_id)
- `company_id` é a chave de isolamento multi-tenant
- `owner_id` NUNCA deve ser usado para isolar dados
- Toda query em tabelas tenant DEVE ter `WHERE company_id = $1`
- INSERT em tabelas tenant DEVE incluir `company_id`

### R5. Backend é a fonte única de verdade
- O frontend NUNCA é confiável para validação crítica
- Toda regra de negócio DEVE ser validada no backend
- O frontend pode ter validações complementares apenas para UX

### R6. Separação Frontend/Backend
- Frontend e backend são camadas completamente separadas
- Nunca misturar lógica de backend no frontend
- Nunca fazer acesso direto ao banco pelo frontend
- Comunicação exclusivamente via API REST

### R7. Master Admin isolado dos módulos tenant
- Master Admin tem tabelas e rotas separadas (`/master/*`)
- Master Admin NUNCA acessa dados operacionais dos tenants
- Módulos tenant NUNCA acessam dados do master

---

## Regras de Segurança

### R8. Nunca expor tokens sensíveis
- GET de integrações NUNCA retorna token real
- WhatsApp access_token criptografado no banco
- .env NUNCA vai para o GitHub

### R9. Validação de entrada no backend
- Toda entrada do usuário DEVE ser validada no backend
- Validar tipos, formatos, tamanhos, valores obrigatórios
- Sanitizar strings (espaços, injeção SQL via parametrização)
- Verificar permissões do usuário para cada ação

### R10. Preservar autenticação e autorização
- JWT em toda rota autenticada
- PIN para ações sensíveis (excluir, fechar caixa)
- Verificar role do usuário antes de ações administrativas

---

## Regras de Desenvolvimento

### R11. Ser cirúrgico
- Alterar apenas o arquivo necessário
- Não reformatar código inteiro
- Não adicionar funcionalidades não solicitadas
- Não "aproveitar" para fazer melhorias não pedidas

### R12. Usar solução mínima segura
- Preferir a solução mais simples que atende ao requisito
- Não adicionar dependências desnecessárias
- Não criar abstrações prematuras
- Priorizar legibilidade sobre "elegância"

### R13. Sempre validar com build
- Rodar `npm run build` no frontend após alterações
- Verificar logs do backend após alterações
- Informar como testar a mudança

### R14. Proteger produção
- Nunca rodar `DROP TABLE` ou `DROP COLUMN` sem plano de rollback
- Testar migrations em dev primeiro
- Fazer backup antes de alterações em produção

---

## Regras de Banco de Dados

### R15. Queries sempre parametrizadas
```js
// CORRETO:
db.query('SELECT * FROM sales WHERE company_id = $1', [companyId])

// PROIBIDO:
db.query(`SELECT * FROM sales WHERE company_id = ${companyId}`)
```

### R16. company_id em JOINs
JOINs entre tabelas tenant DEVEM incluir `company_id` em ambas as tabelas.

### R17. Datas em UTC
- No banco: `timestamp with time zone` (UTC)
- No backend: sempre UTC
- No frontend: converter para timezone do usuário

---

## Regras de Comunicação

### R18. Idioma
- Toda resposta, documentação e comunicação: português do Brasil
- Código: inglês (variáveis, funções, arquivos)
- Comentários técnicos: português

### R19. Marketing Ecosystem em `.agent/marketing/` está disponível para tarefas de marketing
Tarefas de landing page, branding, conversão, SEO, copywriting, funis, anúncios e redes sociais DEVEM consultar `.agent/marketing/` como fonte de estratégia e padrões. Não aplicar regras de engenharia em contexto de marketing.

### R20. Module Memory em `.agent/memory/modules/` é obrigatório
Antes de qualquer ação em um módulo específico, o agente DEVE ler `.agent/memory/modules/<modulo>.md` para entender regras de negócio, features, roadmap e estado do nicho. Toda feature pertence a um módulo.

### R20. System Engines em `.agent/system/` são obrigatórios
Os 4 system engines (ai-audit-system, auto-memory-updater, automatic-task-decomposition, feature-state-engine) DEVEM ser consultados pelo Master Orchestrator antes e após cada tarefa. Nenhuma implementação deve ignorar os systems.

### R21. Respeitar fluxo obrigatório
| Tipo | Fluxo |
|------|-------|
| Criação nova | Brainstorm → Architecture → Plan → Create → Debug → Test → Deploy |
| Correção pequena | Context Discovery → Surgical Fix → Debug → Test |
| Visual/UI | Context Discovery → Frontend Design → UX/UI Review → Create → Test |
| Backend crítico | Context Discovery → Architecture → Backend Security → Database Design → Create → Test |
