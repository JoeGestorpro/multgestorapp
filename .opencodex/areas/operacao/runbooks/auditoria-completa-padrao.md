# Padrão de Auditoria Completa — MultGestor

> **Criado:** 2026-06-18 · **Autoria:** definido pelo dono do projeto.
> **v2 — Auditoria Mestre:** 2026-07-08, fundida com a proposta "Auditoria Mestre do MultGestor"
> (dono do projeto). Substitui a v1 por inteiro — não existem dois padrões concorrentes.
> **Status:** CANÔNICO — toda auditoria formal do MultGestor deve seguir esta estrutura.
> **Executor pretendido:** Claude Code, rodando na raiz do repo — único agente com acesso direto
> a código + banco (via MCP Supabase) + documentação (`.opencodex`) simultaneamente. OpenCode não
> executa auditoria (só código dentro de missão já definida).

---

## Premissa

Uma auditoria completa não pode ser só "ver se está funcionando". Ela precisa responder:

1. **O que existe?** (inventário bruto — pastas, módulos, serviços, rotas, tabelas, docs)
2. **O que funciona de verdade?** (evidência, não opinião)
3. **O que não funciona, está incompleto, ou está abandonado?**
4. **O que virou lixo?** (código morto, arquivos obsoletos, docs desatualizados)
5. **O que pode ser removido com segurança?**
6. **O que precisa ser atualizado?** (código ou documentação)
7. **O que está frágil, inseguro ou mentiroso na governança?**
8. **O que impede produção / próxima missão / venda real?**

O resultado deve deixar o projeto com **100% de entendimento** — não só uma lista de bugs.

---

## 4 camadas de auditoria

### Camada 0 — Inventário e Mapeamento (pré-requisito das outras 3)
Descobrir absolutamente tudo que existe antes de julgar qualquer coisa: módulos, código morto,
lixo de repositório, padrões arquiteturais. Sem isso as camadas seguintes auditam um mapa
incompleto.

### Camada 1 — P0 operacional (mais urgente)
Backup/restore · produção · banco · secrets · governança · fila atual · bloqueadores reais.

### Camada 2 — Técnica profunda
Backend · frontend · testes · RLS · EventBus · CI/CD · arquitetura multi-tenant · APIs · IA ·
Core × Nichos.

### Camada 3 — Produto, receita e evolução
Fluxo de cliente real · onboarding · cobrança · o que falta para vender · roadmap ·
comparação com auditorias anteriores.

---

## Pergunta-mãe de toda auditoria

> O projeto está seguro, governado e recuperável o suficiente para avançar para a próxima missão?

Não: "O código está bonito?" O risco maior não é só código — é alinhamento entre produção ·
Supabase · backup · restore · governança · fila · testes · segurança · produto vendável ·
**e o quanto o mapa mental do projeto reflete a realidade**. A auditoria boa cruza tudo isso.

---

## Seções obrigatórias

### 1. Resumo executivo

| Item | Estado |
| --- | --- |
| Backend | saudável / parcial / crítico |
| Frontend | saudável / parcial / crítico |
| Banco Supabase | saudável / parcial / crítico |
| Produção Render/Vercel | saudável / parcial / crítico |
| Segurança | saudável / atenção / crítico |
| Backup/restore | validado / parcial / inexistente |
| Testes | suficientes / frágeis / ausentes |
| Governança `.opencodex` | atualizada / divergente / crítica |
| Inventário/código morto | limpo / acumulando / crítico |
| Documentação vs código | sincronizada / divergente / crítica |
| Pronto para próxima missão? | sim / não / com ressalvas |

---

### 2. Identidade do projeto

- Nome, repositório GitHub, branch principal, branches abertas
- Último commit relevante, PRs abertos
- Ambientes: Local Windows · GitHub · Render backend · Vercel frontend · Supabase produção ·
  Supabase teste/restore
- URLs públicas
- Stack real: Node/Express · React/Vite · PostgreSQL/Supabase · JWT/cookies · Resend/email ·
  EventBus/outbox · Agendamentos públicos · `.opencodex` como governança

---

### 3. Inventário geral do projeto *(Camada 0 · novo)*

Mapear e listar (não julgar ainda):
- Pastas de primeiro/segundo nível e seu propósito
- Módulos/domínios de negócio (barber, clima, master, billing, IA, ...)
- Serviços, providers, entidades, controllers, componentes, hooks, middlewares, workers, jobs
- Migrations, seeds, scripts
- Documentação (`.opencodex`, `docs/`, READMEs)

Entregável: tabela ou árvore com contagem por categoria (ex.: "42 controllers, 18 services,
7 migrations pendentes de commit").

---

### 4. Estado de cada módulo *(Camada 0 · novo)*

Para cada módulo/domínio do inventário (seção 3), responder numa tabela:

| Módulo | Existe? | Funciona? | Rota conectada? | Testes? | Docs? | Status |
| --- | --- | --- | --- | --- | --- | --- |

Usar a **classificação de status** (ver seção "Classificação de status por item" abaixo) —
não confundir com severidade de risco (seção 27).

---

### 5. Código morto e órfãos *(Camada 0 · novo)*

Encontrar (com evidência — grep/análise, não achismo):
- Imports nunca usados · funções nunca chamadas · classes/interfaces abandonadas
- Arquivos órfãos (não importados por nada) · rotas registradas mas sem handler ativo
- Componentes frontend não referenciados · providers antigos substituídos
- Scripts esquecidos · helpers duplicados · tipagens antigas · migrations sem efeito real

---

### 6. Lixo e arquivos obsoletos *(Camada 0 · novo)*

Identificar por padrão de nome/conteúdo: `*.bak`, `*old*`, `*copy*`, `*copy 2*`, `*final*`,
`teste.js`/`teste2.js`, `debug*`, arquivos experimentais soltos na raiz, logs versionados,
diretórios de cache/build commitados, backups de `.env` (`*.bak-*`), scripts de auditoria
esquecidos (`_audit*.js`).

> Nota: este projeto já tem histórico desse tipo de artefato acumulando na raiz/backend
> (ver `chore/repo-artifact-cleanup` na fila) — esta seção deve produzir a lista definitiva.

---

### 7. Auditoria de governança

Verificar:
- `.opencodex/queue/current-task.md`, `next-task.md`, `backlog.md`, `completed/`
- `.opencodex/brain/project-state.md`, `runbooks/`, `.opencodex/audits/`
- Regras de preflight, regras de executor
- Diferença entre: tarefa ativa / pendente / bloqueada / concluída / arquivada

**Pergunta central:** A governança está refletindo o estado real do projeto ou está mentindo?

Regras: se backup/restore já foram feitos, a governança precisa dizer isso · se uma missão está
bloqueada, ela não pode aparecer como liberada · se algo foi concluído só no plano, não pode ser
marcado como executado · se algo foi executado manualmente, precisa estar registrado com evidência.

---

### 8. Auditoria de produção

**Backend Render:** serviço correto; health check; logs recentes; conexão com banco; versão do
Node; se migrations rodam no boot; se jobs/EventBus sobem sem erro; cold start / free tier.

Endpoints mínimos: `GET /api/health` · endpoints públicos de booking · endpoints críticos de auth.

**Frontend Vercel:** projeto correto; branch de deploy; root directory; URL pública; build atual;
erros de runtime; integração com API; páginas públicas; fluxo login/cadastro.

---

### 9. Auditoria de banco de dados

- Banco principal + banco de teste/restore + região
- Tabelas existentes, migrations aplicadas, migrations pendentes
- Tabelas com RLS, políticas RLS, funções SQL, triggers, índices, constraints
- Tabelas críticas sem proteção · diferença entre schema local e schema produção
- Normalização · integridade referencial · consultas custosas

Tabelas críticas: `companies` · `users` · `barber_*` · appointments · services · collaborators ·
working_hours · outbox/eventbus · `ai_suggestions`.

**Pergunta central:** Existe algum caminho onde um tenant consegue ver, alterar ou inferir dado
de outro tenant?

---

### 10. Auditoria de RLS e segurança multi-tenant

- RLS habilitado nas tabelas corretas · políticas usando `company_id` (leitura e escrita)
- Uso de `auth.uid()` ou equivalente · role com `BYPASSRLS`
- Query backend que ignora isolamento · endpoints que filtram corretamente por tenant
- Slug público só expõe o necessário

| Tabela | RLS | Política | Risco | Ação |
| --- | --- | --- | --- | --- |

---

### 11. Auditoria de autenticação e sessão

Login, cadastro, refresh token, logout · cookies HttpOnly, expiração de JWT · proteção XSS/CSRF ·
reset/alteração de senha · enumeração de usuário, mensagens de erro · brute force, validação de
input.

---

### 12. Auditoria de secrets e variáveis de ambiente

| Variável | Ambiente | Existe? | Risco |
| --- | --- | --- | --- |
| DATABASE_URL | Render | | crítico |
| APP_RUNTIME_URL | Render | | crítico |
| JWT_SECRET | Render | | crítico |
| RESEND_API_KEY | Render/Vercel | | médio |
| VERCEL_TOKEN | GitHub Secrets | | alto |
| RENDER_DEPLOY_HOOK_URL | GitHub Secrets | | alto |
| SUPABASE_URL | Render/Vercel | | médio |
| SUPABASE_ANON_KEY | frontend | | esperado |
| SUPABASE_SERVICE_ROLE | backend apenas | | crítico |

**Pergunta central:** Algum segredo está vazado em código, log, print, commit, `.env`, Markdown
ou histórico Git? **Nunca imprimir o valor do segredo no relatório — só existência/host/risco.**

---

### 13. Auditoria de backup e restore

| Item | Estado |
| --- | --- |
| Dump manual | |
| Restore em banco descartável | |
| Scheduler diário | |
| Próxima execução automática | |
| Log de sucesso | |
| Retenção | |
| Cópia externa/cloud | |

**Pergunta central:** Se o banco principal sumir hoje, conseguimos restaurar com segurança?

---

### 14. Auditoria de testes

Unitários, integração, E2E, segurança, RLS, endpoints públicos, EventBus, backup/restore (mesmo
manual) · coverage, testes skipped/xfail, testes frágeis/flaky.

Gates: `npm test` · `npm run test:integration` · `npm run build` · `npm run lint` · health check ·
public booking flow · auth flow · RLS isolation tests · EventBus mutation/outbox tests.

Separar: testado · só funcionando manualmente · sem teste algum.

---

### 15. Auditoria do fluxo público de agendamento

Slug público; serviços; colaboradores; horários; disponibilidade; escolha de data/horário;
criação de agendamento; login/cadastro só na confirmação; resposta a slug inválido/sem horários.

Slugs de teste: `barbearia-joefelipe` · `barbearia-teste`.

---

### 16. Auditoria do EventBus e outbox

Eventos emitidos; consumidores registrados; handlers duplicados; eventos sem handler; falhas de
processamento; retries; dead letter; idempotência; durabilidade.

**Pergunta central:** Quando algo importante acontece, o sistema registra e processa com
segurança ou pode perder evento silenciosamente?

---

### 17. Auditoria de APIs e contratos *(novo)*

Rotas REST; consistência de verbos/status code; versionamento (se existir); validação de input;
formato de erro padronizado (`{success, error}`); presença/ausência de OpenAPI/Swagger; proteção
de rotas expostas conforme a diretriz de abuso (`route-protection-abuse-control.md`): toda rota
nova responde pode gerar abuso? gera custo? precisa rate limit? precisa limite por tenant?

---

### 18. Auditoria de frontend

Estrutura de rotas; páginas públicas/autenticadas; tratamento de erro; loaders; estados vazios;
responsividade mobile; integração com API; proteção de rotas; armazenamento de token; componentes
duplicados; UX do fluxo principal; build Vite; warnings; variáveis `VITE_*`; design system;
acessibilidade básica; aparência profissional para cliente real.

---

### 19. Auditoria de backend e arquitetura *(expandido)*

| Área | Problema | Severidade | Evidência | Correção |
| --- | --- | --- | --- | --- |

Verificar: estrutura de pastas · controllers · services · repositories · middlewares · validação ·
tratamento de erro · logs · auth/autorização · queries SQL · transactions · migrations · jobs ·
integrações (email/billing/WhatsApp) · acoplamentos ruins.

**Padrões arquiteturais** (avaliar o que se aplica — não forçar DDD/Clean Architecture onde não
faz sentido para o tamanho do projeto, mas registrar o desvio conscientemente):
- Separação de camadas (controller → service → repository/query)
- Dependency Injection (ou ausência deliberada)
- Dependências circulares · acoplamento excessivo entre módulos · coesão dentro de cada módulo

---

### 20. Auditoria de arquitetura multi-nicho (Core × Nichos) *(expandido)*

**Pergunta central:** O sistema está virando uma plataforma multi-nicho ou está preso em
barbearia?

Core compartilhado a auditar (o que realmente é reutilizável hoje): autenticação · permissões ·
financeiro · agenda · clientes · produtos · IA · arquivos · notificações · uploads · dashboard.

Nichos a verificar contra o Core: BarberGestor · ClimaGestor · AutoGestor · PetGestor ·
AcademyGestor · FiscalGestor · outros do roadmap.

Verificar: nomes hardcoded de `barber`; tabelas específicas demais; capabilities/módulos por
tenant (`company_modules`); risco de reescrever tudo depois. Referência: `MULTGESTOR-PLATFORM-
SPECIFICATION.md` e Core Completion Index de auditorias anteriores (comparar evolução — seção 26).

---

### 21. Auditoria de performance e custo

Tempo de resposta dos endpoints; cold start Render; queries lentas; índices faltando; custo
Supabase/Render/Vercel; risco de plano gratuito; escalabilidade do banco; limites de API/storage;
logs excessivos; jobs pesados.

**Pergunta central:** O sistema aguenta clientes reais sem explodir custo ou ficar lento?

---

### 22. Auditoria de observabilidade

Logs úteis vs sensíveis; health check; status de jobs; erros não tratados; monitoramento;
alertas; auditoria de ações; rastreabilidade de eventos; visibilidade de backup/falhas.

Ideal: health check · logs estruturados · job status · backup status · eventbus status · erro com
request id · alerta de falha crítica.

---

### 23. Auditoria LGPD e dados sensíveis

Dados pessoais coletados; onde ficam armazenados; quem acessa; logs com dados pessoais; exclusão
de conta; política de privacidade; consentimento; retenção; backups com dados pessoais; exposição
em endpoints públicos.

---

### 24. Auditoria de Inteligência Artificial *(novo)*

Providers/LLM em uso (ex.: MockProvider, DeepSeek, OpenRouter) · prompts e onde vivem · agentes ·
gestão de contexto · ferramentas expostas ao modelo · memória/cache de respostas (ex.: cache 24h
de `ai_suggestions`) · custo por chamada e limites (rate limit por tenant) · fallback quando o
provider falha · segurança (nunca expor `reasoning`/chain-of-thought de providers — ver memória
`feedback-no-reasoning-exposure`; nunca vazar prompt de sistema; validar output antes de persistir).

---

### 25. Auditoria de produto e monetização

| Para vender precisa de quê? | Estado |
| --- | --- |
| Landing | |
| Cadastro empresa | |
| Agenda pública | |
| Painel administrativo | |
| Pagamento | |
| Notificações | |
| Backup | |
| Segurança mínima | |

Avaliar: nicho inicial · fluxo que gera valor · cadastro de empresa/serviços/colaboradores ·
agenda · cliente final · cobrança · onboarding · painel do dono · notificações · relatórios ·
bloqueadores para o próximo cliente pagante.

---

### 26. Sincronização de documentação *(novo)*

Localizar toda documentação existente (`.opencodex`, `docs/`, READMEs, Obsidian) e, para cada
documento relevante:
- Comparar com o código/schema real
- Marcar como: 🟢 sincronizado · 🟠 parcialmente desatualizado · 🔴 obsoleto/mentiroso
- Para o que for atualizável com segurança (fatos verificáveis, não decisões de produto):
  atualizar diretamente e registrar a mudança
- Para o que exigir decisão humana: listar, não decidir sozinho

Entregável: changelog da auditoria com cada arquivo tocado (`arquivo → o que mudou → por quê`).

---

### 27. Auditoria de Evolução *(novo — compara com auditorias anteriores)*

Ler as auditorias anteriores em `.opencodex/auditorias/multgestor/` (mais recente primeiro) e
responder:
- O que foi implementado desde a última auditoria?
- O que foi removido?
- O que regrediu (piorou ou voltou a quebrar)?
- O que continua pendente (mesmo achado, auditoria após auditoria)?
- O que mudou na arquitetura?
- Percentual estimado de evolução desde a última auditoria (ex.: Core Completion Index
  52/100 → X/100)
- Quais riscos novos surgiram que não existiam antes?
- Índice atual de prontidão para produção/venda

Manter esta seção como série histórica — cada nova auditoria referencia a anterior por data.

---

### 28. Classificação de riscos (achados)

| Severidade | Significado |
| --- | --- |
| P0 Crítico | bloqueia produção ou pode causar perda/vazamento de dados |
| P1 Alto | risco sério, mas com mitigação temporária |
| P2 Médio | problema importante, mas não bloqueia tudo |
| P3 Baixo | melhoria, limpeza ou refinamento |
| P4 Estratégico | decisão de produto/arquitetura para o futuro |

Cada achado deve conter:
```
ID:
Título:
Severidade:
Área:
Evidência:
Impacto:
Correção recomendada:
Arquivos afetados:
Status:
```

---

## Classificação de status por item *(novo — eixo complementar à severidade)*

Severidade (acima) mede **risco**. Status mede **grau de implementação** — use nas seções 4, 20 e
26 (módulos, Core×Nichos, documentação):

- 🟢 Implementado e funcionando
- 🟡 Implementado parcialmente
- 🔵 Implementado, mas precisa de melhorias
- 🟠 Obsoleto
- 🔴 Não implementado
- ⚫ Código morto ou sem uso
- 🟣 Duplicado
- ⚪ Em planejamento

---

## Modelo do relatório final

```
# Auditoria Completa MultGestor — YYYY-MM-DD
## 1. Resumo executivo
## 2. Identidade do projeto
## 3. Inventário geral
## 4. Estado de cada módulo
## 5. Código morto e órfãos
## 6. Lixo e arquivos obsoletos
## 7. Governança e Segundo Cérebro
## 8. Produção Render/Vercel
## 9. Banco Supabase
## 10. RLS e multi-tenant
## 11. Autenticação e sessão
## 12. Secrets e variáveis de ambiente
## 13. Backup e restore
## 14. Testes e CI/CD
## 15. Fluxo público de agendamento
## 16. EventBus/outbox
## 17. APIs e contratos
## 18. Frontend
## 19. Backend e arquitetura
## 20. Arquitetura multi-nicho (Core × Nichos)
## 21. Performance e custo
## 22. Observabilidade
## 23. LGPD e dados pessoais
## 24. Inteligência Artificial
## 25. Produto e prontidão comercial
## 26. Sincronização de documentação (changelog)
## 27. Auditoria de Evolução
## 28. Lista de achados
## 29. Plano de correção
## 30. Próximas missões recomendadas
## 31. Veredito final
```

---

## Resultado esperado — 7 entregas concretas

### 1. Veredito
```
VEREDITO: APROVADO COM BLOQUEIOS P1
O projeto está operacional em partes, mas ainda não deve avançar para vendas reais
sem corrigir os pontos X, Y e Z.
```
ou
```
VEREDITO: APROVADO PARA PRÓXIMA MISSÃO
Backup/restore validado, produção saudável, governança coerente e riscos críticos controlados.
```

### 2. Lista de achados

| ID | Severidade | Área | Achado | Status |
| --- | --- | --- | --- | --- |
| A-001 | P0 | Backup | scheduler ainda não executou com sucesso | aberto |
| A-002 | P1 | RLS | falta teste automatizado de isolamento | aberto |

### 3. Plano de ação por prioridade

**Agora:** corrigir P0 · validar backup automático · confirmar produção · alinhar governança
**Depois:** testes E2E · billing · notificações · UX · relatórios
**Futuro:** multi-nicho · app offline · IA operacional avançada · observabilidade avançada

### 4. Missões recomendadas

```
1. backup-scheduler-first-run-validation
2. e2e-public-booking-validation
3. rls-tenant-isolation-test-suite
```

### 5. Evidências

Prova, não opinião: comandos executados · outputs · URLs testadas · endpoints testados · logs ·
commits · branches · arquivos lidos · tabelas consultadas · contagens de banco · resultado de
testes · diferenças entre esperado e real.

### 6. Changelog de documentação

Lista de arquivos de documentação atualizados automaticamente durante a auditoria (fatos
verificáveis) + lista do que precisa decisão humana antes de atualizar.

### 7. Relatório de evolução

Comparação estruturada com a auditoria anterior (seção 27) — o que avançou, regrediu, ou
permanece parado, com percentual de evolução.

---

## Como executar esta auditoria

1. Ler a auditoria anterior mais recente em `.opencodex/auditorias/multgestor/` antes de começar
   (necessário para a seção 27).
2. Camada 0 primeiro (inventário) — pode e deve usar sub-agentes de busca em paralelo por área
   (backend, frontend, banco, docs) para não gastar o contexto principal com leitura bruta.
3. Camadas 1-3 em seguida, cruzando com o inventário da Camada 0.
4. Nunca fazer push/merge/deploy/migration como parte da auditoria — auditoria é leitura +
   evidência; correções viram missões separadas (gated conforme `CLAUDE.md`).
5. Produzir o relatório em `.opencodex/auditorias/multgestor/YYYY-MM-DD-auditoria-completa.md`
   seguindo o modelo acima.
6. Atualizar `.opencodex/queue/backlog.md` ou `next-task.md` com as missões recomendadas
   (respeitando o slot único de `next-task.md` e o processo de promoção existente).
