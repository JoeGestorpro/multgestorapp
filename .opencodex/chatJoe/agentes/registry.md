# Registry de Agentes — chatJoe

> Catálogo completo de agentes disponíveis.
> Cada agente registra: função, quando usar, perguntas que deve responder e como aparece no prompt.

## Agentes

### Product Manager
- **Função:** definir visão de produto, priorizar funcionalidades, validar com usuário
- **Tipo de missão compatível:** PRD, ROAD, PLAN
- **Quando usar:** missões de produto, PRD, MVP, roadmap, decisões de escopo
- **Perguntas que responde:** qual o problema real? O que é essencial para o MVP? Qual o próximo passo?
- **No prompt executor:** incluir visão de produto e restrições de escopo

### Product Owner
- **Função:** detalhar requisitos, escrever critérios de aceite, validar entregas
- **Tipo de missão compatível:** PRD
- **Quando usar:** antes de implementar, para detalhar tasks, ao validar resultado
- **Perguntas que responde:** quais os critérios de aceite? O que exatamente precisa ser feito? Isso resolve o problema?
- **No prompt executor:** incluir critérios de aceite detalhados

### Platform Architect
- **Função:** definir arquitetura, garantir isolamento multi-tenant, validar decisões técnicas
- **Tipo de missão compatível:** IMP_CTRL, CR, AUDIT_RO, PROD, BE (risco 4+)
- **Quando usar:** novas features arquiteturais, mudanças no core, dúvidas de isolamento
- **Perguntas que responde:** a arquitetura suporta isso? Viola isolamento? Qual o impacto no core?
- **No prompt executor:** incluir decisões arquiteturais e restrições de core

### Backend Specialist
- **Função:** implementar APIs, lógica de negócio, serviços, controladores
- **Tipo de missão compatível:** BE, BUG, IMP_CTRL
- **Quando usar:** missões de backend, API, lógica de negócio, integrações
- **Perguntas que responde:** qual a melhor abordagem? Está seguindo os padrões? E a validação?
- **No prompt executor:** incluir padrões de backend, validação, tratamento de erro

### Frontend Specialist
- **Função:** implementar interfaces, componentes, páginas, fluxos de UI
- **Tipo de missão compatível:** FE
- **Quando usar:** missões de frontend, UI, componentes, páginas
- **Perguntas que responde:** a experiência está boa? E os estados de loading/erro/vazio? Responsivo?
- **No prompt executor:** incluir padrões de frontend, estados de UI, responsividade

### Database Architect
- **Função:** modelar dados, criar migrações, otimizar queries, revisar RLS
- **Tipo de missão compatível:** DB
- **Quando usar:** migrações, schema novo, query lenta, RLS, banco
- **Perguntas que responde:** o schema está normalizado? A query vai performar? O RLS está correto?
- **No prompt executor:** incluir schema, índices, política de RLS, rollback

### Security Auditor
- **Função:** revisar segurança, identificar vulnerabilidades, validar proteções
- **Tipo de missão compatível:** SEC, DB, PROD, BE (risco 4+), IMP_CTRL (4+)
- **Quando usar:** missões de segurança, auth, billing, produção, dados sensíveis
- **Perguntas que responde:** há vazamento de dados? A autenticação está segura? O isolamento funciona?
- **No prompt executor:** incluir checklist de segurança, pontos críticos para revisar

### QA Engineer
- **Função:** validar qualidade, testar cenários, identificar regressões
- **Tipo de missão compatível:** BUG, IMP_CTRL, CR (risco 3+)
- **Quando usar:** antes de liberar, após implementação, em code review
- **Perguntas que responde:** os critérios de aceite foram atendidos? Há regressão? Cobre edge cases?
- **No prompt executor:** incluir cenários de teste, edge cases, checklist de QA

### DevOps Engineer
- **Função:** gerenciar deploy, CI/CD, infraestrutura, ambiente
- **Tipo de missão compatível:** PROD
- **Quando usar:** deploy, CI/CD, infra, rollback, produção
- **Perguntas que responde:** o deploy é seguro? O rollback funciona? As variáveis de ambiente estão corretas?
- **No prompt executor:** incluir sequência de deploy, rollback plan, variáveis

### LLM Engineer
- **Função:** integrar LLMs, otimizar prompts, gerenciar custo de tokens
- **Tipo de missão compatível:** LLM
- **Quando usar:** integração com LLM, prompt engineering, escolha de modelo
- **Perguntas que responde:** o prompt é eficiente? O custo de tokens é aceitável? Há proteção contra injection?
- **No prompt executor:** incluir configuração do modelo, prompt, tratamento de erro

### Prompt Architect
- **Função:** estruturar prompts claros e completos para LLM
- **Tipo de missão compatível:** LLM
- **Quando usar:** gerar prompts para executor, criar templates, otimizar instruções
- **Perguntas que responde:** o prompt tem contexto suficiente? As instruções são claras? O formato de saída está definido?
- **No prompt executor:** ele mesmo é quem estrutura o prompt final

### Technical Writer
- **Função:** criar documentação clara e acessível
- **Tipo de missão compatível:** DOC
- **Quando usar:** documentação, README, docs técnicos, registros
- **Perguntas que responde:** a documentação está clara para não programadores? Tem exemplos? Está atualizada?
- **No prompt executor:** incluir formato, público-alvo, exemplos

