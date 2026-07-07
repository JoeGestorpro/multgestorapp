# Registry de Skills — chatJoe

> Catálogo completo de skills disponíveis.
> Cada skill registra: quando usar, o que verificar, riscos comuns e como entra no prompt do executor.

## Skills

### produto
- **Quando usar:** qualquer missão que envolva decisão de produto, funcionalidade ou feature
- **Tipo de missão compatível:** PRD, PLAN, ROAD
- **O que verificar:** se a feature resolve o problema real, se está alinhada com o PRD, se não inventa escopo
- **Riscos comuns:** adicionar funcionalidade sem necessidade, desviar do propósito do projeto
- **No prompt executor:** incluir contexto de produto e restrições de escopo

### prd-mvp
- **Quando usar:** criar ou revisar PRD, definir MVP, validar escopo mínimo
- **Tipo de missão compatível:** PRD
- **O que verificar:** se o PRD cobre problema, solução, critérios de aceite, público-alvo
- **Riscos comuns:** PRD muito grande para MVP, critérios de aceite vagos
- **No prompt executor:** estruturar seções obrigatórias do PRD

### roadmap
- **Quando usar:** planejar fases, marcos, próximos passos do projeto
- **Tipo de missão compatível:** ROAD, PLAN
- **O que verificar:** se as fases estão na ordem correta, se dependências estão mapeadas
- **Riscos comuns:** pular etapas, não considerar dependências técnicas
- **No prompt executor:** incluir visão macro e dependências

### frontend
- **Quando usar:** criar ou alterar interface do usuário, componentes, páginas
- **Tipo de missão compatível:** FE
- **O que verificar:** responsividade, acessibilidade, estado de loading/erro/vazio, consistência visual
- **Riscos comuns:** quebrar layout existente, ignorar mobile, esquecer estados de erro
- **No prompt executor:** especificar framework, componentes existentes, padrões de design

### ux-ui
- **Quando usar:** decisões de experiência do usuário, fluxo de telas, usabilidade
- **Tipo de missão compatível:** FE
- **O que verificar:** se o fluxo faz sentido para o usuário, se reduz atritos, se é intuitivo
- **Riscos comuns:** priorizar estética sobre função, ignorar feedback de erro
- **No prompt executor:** descrever jornada do usuário esperada

### backend
- **Quando usar:** criar ou alterar API, lógica de negócio, serviços, controladores
- **Tipo de missão compatível:** BE, BUG, IMP_CTRL
- **O que verificar:** validação de entrada, tratamento de erros, idempotência, isolamento multi-tenant
- **Riscos comuns:** expor dados de outros tenants, não validar entrada, esquecer rollback
- **No prompt executor:** incluir contratos de API, regras de isolamento, padrões de erro

### api-design
- **Quando usar:** criar ou alterar endpoints REST, contratos, request/response
- **Tipo de missão compatível:** BE
- **O que verificar:** consistência de nomenclatura, versionamento, status codes, documentação
- **Riscos comuns:** quebrar compatibilidade, nomes inconsistentes, falta de paginação
- **No prompt executor:** especificar padrão REST, exemplos de request/response

### banco-de-dados
- **Quando usar:** migrações, schema, queries, índices, RLS
- **Tipo de missão compatível:** DB
- **O que verificar:** performance da query, índices existentes, impacto em dados existentes, rollback da migração
- **Riscos comuns:** lock em produção, perda de dados, query lenta sem índice
- **No prompt executor:** incluir SQL, política de rollback, considerações de performance

### rls-review
- **Quando usar:** revisar políticas Row Level Security no Supabase
- **Tipo de missão compatível:** DB, SEC
- **O que verificar:** se toda tabela tenant tem RLS, se as políticas isolam por company_id, se não há bypass
- **Riscos comuns:** tabela sem RLS, política muito permissiva, bypass por service_role
- **No prompt executor:** listar tabelas, verificar políticas existentes, testar bypass

### seguranca
- **Quando usar:** qualquer alteração que envolva segurança, exposição de dados, autenticação
- **Tipo de missão compatível:** SEC, BE, DB, PROD, IMP_CTRL
- **O que verificar:** injeção, vazamento de dados, exposição de secrets, CSP, headers de segurança
- **Riscos comuns:** XSS, SQL injection, expor token/secret, pular validação no backend
- **No prompt executor:** checklist de segurança obrigatório no início

### auth-review
- **Quando usar:** revisar autenticação, autorização, controle de acesso, JWT
- **Tipo de missão compatível:** SEC
- **O que verificar:** se o JWT é validado, se company_id é extraído corretamente, se roles estão corretas
- **Riscos comuns:** usuário acessar dado de outro tenant, master sem restrição
- **No prompt executor:** incluir fluxo de auth, validação de token, regras de role

### billing
- **Quando usar:** criar ou alterar lógica de pagamento, planos, assinaturas, faturamento
- **Tipo de missão compatível:** PROD, IMP_CTRL
- **O que verificar:** idempotência, webhook de pagamento, tratamento de falha, prorata, upgrade/downgrade
- **Riscos comuns:** cobrar duas vezes, não tratar falha, perder webhook
- **No prompt executor:** incluir fluxo completo de pagamento, tratamento de erros

### producao
- **Quando usar:** deploy, rollback, release, configuração de produção
- **Tipo de missão compatível:** PROD
- **O que verificar:** variáveis de ambiente, secrets, health check, migração automática, backup
- **Riscos comuns:** esquecer secret, migração quebrar, não ter rollback testado
- **No prompt executor:** incluir sequência exata de deploy, rollback plan, health check

### devops
- **Quando usar:** CI/CD, infraestrutura, containers, ambiente
- **Tipo de missão compatível:** PROD
- **O que verificar:** se o pipeline está funcional, se há cache, se as etapas são rápidas
- **Riscos comuns:** pipeline quebrado sem alerta, ambiente divergente
- **No prompt executor:** incluir configuração de CI/CD, scripts de infra

### testes
- **Quando usar:** criar ou alterar testes, validar cobertura, debug de teste falhando
- **Tipo de missão compatível:** BUG, IMP_CTRL, BE, FE, DB
- **O que verificar:** se o teste testa o comportamento certo, se é determinístico, se cobre edge cases
- **Riscos comuns:** teste frágil, teste que passa mas não testa nada, mock mal feito
- **No prompt executor:** inclimir o que testar, padrão de teste, como rodar

### qa
- **Quando usar:** revisar qualidade geral antes de liberar, validar critérios de aceite
- **Tipo de missão compatível:** AUDIT_RO, CR
- **O que verificar:** se todos os critérios de aceite foram atendidos, se não há regressão
- **Riscos comuns:** esquecer cenário de borda, não testar integração
- **No prompt executor:** checklist de QA completo

### llm
- **Quando usar:** integrar com LLM, prompt engineering, escolha de modelo, custo de tokens
- **Tipo de missão compatível:** LLM
- **O que verificar:** se o prompt é claro, se o custo de tokens é aceitável, se há fallback
- **Riscos comuns:** prompt injection, custo alto de tokens, resposta imprevisível
- **No prompt executor:** incluir prompt completo, configuração do modelo, tratamento de erro

### prompt-engineering
- **Quando usar:** criar ou otimizar prompts para LLM, estruturar instruções
- **Tipo de missão compatível:** LLM
- **O que verificar:** clareza, contexto suficiente, exemplos, restrições de formato
- **Riscos comuns:** prompt vago, sem exemplos, sem restrições de saída
- **No prompt executor:** estrutura de prompt com contexto, instrução, exemplos, formato de saída

### agent-architecture
- **Quando usar:** arquitetar agentes de IA, definir papéis, ferramentas, fluxo entre agentes
- **Tipo de missão compatível:** LLM, IMP_CTRL
- **O que verificar:** separação de responsabilidades, ferramentas corretas, limite de escopo
- **Riscos comuns:** agente com muito poder, sem supervisão, escopo mal definido
- **No prompt executor:** definir papel, ferramentas, escopo e regras do agente

### documentacao
- **Quando usar:** criar ou atualizar documentação, README, docs técnicos
- **Tipo de missão compatível:** DOC
- **O que verificar:** linguagem clara, exemplos funcionais, informações atualizadas
- **Riscos comuns:** documentação desatualizada, sem exemplos, muito técnica
- **No prompt executor:** especificar formato, público-alvo, exemplos necessários

### code-review
- **Quando usar:** revisar código, identificar problemas, sugerir melhorias
- **Tipo de missão compatível:** CR, AUDIT_RO
- **O que verificar:** lógica, segurança, performance, padrões do projeto, testes
- **Riscos comuns:** revisar só superficialmente, não testar a mudança
- **No prompt executor:** checklist de code review, áreas para focar

