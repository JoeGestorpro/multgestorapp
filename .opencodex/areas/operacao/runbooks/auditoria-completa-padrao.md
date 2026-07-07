# Padrão de Auditoria Completa — MultGestor

> **Criado:** 2026-06-18  
> **Autoria:** definido pelo dono do projeto.  
> **Status:** CANÔNICO — toda auditoria formal do MultGestor deve seguir esta estrutura.

---

## Premissa

Uma auditoria completa não pode ser só "ver se está funcionando".  
Ela precisa responder 4 coisas:

1. **O que temos hoje?**
2. **O que está funcionando de verdade?**
3. **O que está frágil, inseguro, incompleto ou mentiroso na governança?**
4. **Qual é o próximo plano seguro para produção e receita?**

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
| Pronto para próxima missão? | sim / não / com ressalvas |

---

### 2. Identidade do projeto

- Nome, repositório GitHub, branch principal, branches abertas
- Último commit relevante, PRs abertos
- Ambientes: Local Windows · GitHub · Render backend · Vercel frontend · Supabase produção · Supabase teste/restore
- URLs públicas
- Stack real: Node/Express · React/Vite · PostgreSQL/Supabase · JWT/cookies · Resend/email · EventBus/outbox · Agendamentos públicos · `.opencodex` como governança

---

### 3. Auditoria de governança

Verificar:
- `.opencodex/queue/current-task.md`
- `.opencodex/queue/next-task.md`
- `.opencodex/queue/backlog.md`
- `.opencodex/queue/completed/`
- `.opencodex/brain/project-state.md`
- `.opencodex/brain/runbooks/`
- `.opencodex/audits/`
- Regras de preflight, regras de executor
- Diferença entre: tarefa ativa / pendente / bloqueada / concluída / arquivada

**Pergunta central:**
> A governança está refletindo o estado real do projeto ou está mentindo?

Regras:
- Se backup/restore já foram feitos, a governança precisa dizer isso.
- Se uma missão está bloqueada, ela não pode aparecer como liberada.
- Se algo foi concluído só no plano, não pode ser marcado como executado.
- Se algo foi executado manualmente, precisa estar registrado com evidência.

---

### 4. Auditoria de produção

#### Backend Render

Verificar:
- Serviço correto no Render; health check; logs recentes; conexão com banco
- Versão do Node
- Se migrations rodam ou não no boot
- Se jobs são registrados; se EventBus sobe sem erro
- Se cold start afeta validação; fallback ou risco por free tier

Endpoints mínimos:
```
GET /api/health
GET endpoints públicos de booking
GET endpoints críticos de autenticação
```

#### Frontend Vercel

Verificar:
- Projeto correto; branch de deploy; root directory; URL pública; build atual
- Erros de runtime; integração com API; páginas públicas; fluxo login/cadastro

---

### 5. Auditoria de banco de dados

- Banco principal + banco de teste/restore + região
- Tabelas existentes, migrations aplicadas, migrations pendentes
- Tabelas com RLS, políticas RLS, funções SQL, triggers, índices, constraints
- Tabelas críticas sem proteção
- Diferença entre schema local e schema produção

Tabelas críticas no MultGestor:
`companies` · `users` · `barber_*` · appointments · services · collaborators · working_hours · outbox/eventbus

**Pergunta central:**
> Existe algum caminho onde um tenant consegue ver, alterar ou inferir dado de outro tenant?

---

### 6. Auditoria de RLS e segurança multi-tenant

Verificar:
- RLS habilitado nas tabelas corretas
- Políticas usando `company_id`; políticas de leitura e de escrita
- Uso de `auth.uid()` ou equivalente
- Se existe role com `BYPASSRLS`
- Se alguma query backend ignora isolamento
- Se endpoints filtram corretamente por tenant
- Se slug público só expõe o necessário; se dados internos aparecem em endpoints públicos

| Tabela | RLS | Política | Risco | Ação |
| --- | --- | --- | --- | --- |
| companies | sim/não | ok/frágil | baixo/médio/alto | corrigir/testar |

---

### 7. Auditoria de autenticação e sessão

Verificar:
- Login, cadastro, refresh token, logout
- Cookies HttpOnly, expiração de JWT
- Proteção contra XSS, CSRF (se aplicável)
- Reset de senha, alteração de senha
- Enumeração de usuário, mensagens de erro
- Brute force, validação de input

No MultGestor (pós-missão XSS):
- `/register` continua bloqueando payload malicioso
- Nomes antigos foram sanitizados
- Frontend não renderiza HTML perigoso
- Backend valida entrada; testes continuam passando

---

### 8. Auditoria de secrets e variáveis de ambiente

| Variável | Ambiente | Existe? | Risco |
| --- | --- | --- | --- |
| DATABASE_URL | Render | sim/não | crítico |
| JWT_SECRET | Render | sim/não | crítico |
| RESEND_API_KEY | Render/Vercel | sim/não | médio |
| VERCEL_TOKEN | GitHub Secrets | sim/não | alto |
| RENDER_DEPLOY_HOOK_URL | GitHub Secrets | sim/não | alto |
| SUPABASE_URL | Render/Vercel | sim/não | médio |
| SUPABASE_ANON_KEY | frontend | sim/não | esperado |
| SUPABASE_SERVICE_ROLE | backend apenas | sim/não | crítico |

**Pergunta central:**
> Algum segredo está vazado em código, log, print, commit, `.env`, Markdown ou histórico Git?

Verificar: `.gitignore` · arquivos `.env` · `.opencodex` · logs · documentação · commits antigos · GitHub Actions · Vercel env · Render env

---

### 9. Auditoria de backup e restore

| Item | Estado |
| --- | --- |
| Dump manual | validado |
| Restore em banco descartável | validado |
| Scheduler diário | configurado |
| Próxima execução automática | pendente/validada |
| Log de sucesso | existe/não existe |
| Retenção | definida/não definida |
| Cópia externa/cloud | existe/não existe |

Registrar: existência de backup manual e automático · horário do agendamento · local e tamanho do dump · log de sucesso · se restore foi testado e em qual banco · contagens · RPO real · RTO estimado · risco local · plano de retenção

**Pergunta central:**
> Se o banco principal sumir hoje, conseguimos restaurar com segurança?

---

### 10. Auditoria de testes

Verificar:
- Testes unitários, integração, E2E, segurança, RLS, endpoints públicos
- Testes do EventBus; testes de backup/restore (mesmo manuais)
- Coverage, testes ignorados/skipped, testes frágeis/flaky

Gates do MultGestor:
```
npm test
npm run test:integration
npm run build
npm run lint
backend health check
public booking flow
auth flow
RLS isolation tests
EventBus mutation/outbox tests
```

Separar: o que está testado · o que está só funcionando manualmente · o que não tem teste.

---

### 11. Auditoria do fluxo público de agendamento

Validar:
- Slug público; serviços; colaboradores; horários de funcionamento; disponibilidade
- Escolha de data, horário; criação de agendamento
- Login/cadastro somente na confirmação; não exigir re-login
- Resposta quando não há horários / serviço / colaborador
- Dados visíveis ao usuário público; proteção contra slug inválido

Slugs de teste MultGestor: `barbearia-joefelipe` · `barbearia-teste`

Registrar divergências como: slug sem working hours · `bookingSettings=null` · `serviceId` obrigatório · slots só com serviço real.

---

### 12. Auditoria do EventBus e outbox

Verificar:
- Eventos emitidos; consumidores registrados; handlers duplicados; eventos sem handler
- Falhas de processamento; retries; dead letter (se existir)
- Idempotência; durabilidade; risco de perder ou duplicar evento

**Pergunta central:**
> Quando algo importante acontece, o sistema registra e processa com segurança ou pode perder evento silenciosamente?

---

### 13. Auditoria de frontend

Verificar:
- Estrutura de rotas; páginas públicas e autenticadas; tratamento de erro
- Loaders; estados vazios; responsividade mobile
- Integração com API; proteção de rotas; armazenamento de token
- Componentes duplicados; UX do fluxo principal; build Vite; warnings; variáveis `VITE_*`

Avaliar:
- Aparência profissional; clareza para cliente real; fluxo para barbearia
- Fluxo para outros nichos futuros; capacidade multi-nicho

---

### 14. Auditoria de backend

| Área | Problema | Severidade | Evidência | Correção |
| --- | --- | --- | --- | --- |

Verificar: estrutura de pastas · controllers · services · repositories · middlewares · validação de input · tratamento de erro · logs · autenticação · autorização · queries SQL · transactions · migrations · jobs · integração com email/billing/WhatsApp · acoplamentos ruins · código morto.

---

### 15. Auditoria de arquitetura multi-nicho

**Pergunta central:**
> O sistema está virando uma plataforma multi-nicho ou está ficando preso em barbearia?

Verificar:
- Nomes hardcoded de `barber`; tabelas específicas demais; services reutilizáveis
- Capabilities; multi-tenant real; possibilidade de PetGestor/AutoGestor/AgroGestor
- Separação entre core e vertical; risco de reescrever tudo depois

---

### 16. Auditoria de performance e custo

Verificar:
- Tempo de resposta dos endpoints; cold start Render
- Queries lentas; índices faltando
- Custo Supabase/Render/Vercel; risco de plano gratuito
- Escalabilidade do banco; limites de API/storage
- Logs excessivos; jobs pesados

**Pergunta central:**
> O sistema aguenta clientes reais sem explodir custo ou ficar lento?

---

### 17. Auditoria de observabilidade

Verificar:
- Logs úteis vs logs sensíveis; health check; status de jobs
- Erros não tratados; monitoramento; alertas; auditoria de ações
- Rastreabilidade de eventos; visibilidade de backup e falhas

Ideal:
```
health check
logs estruturados
job status
backup status
eventbus status
erro com request id
alerta de falha crítica
```

---

### 18. Auditoria LGPD e dados sensíveis

Verificar:
- Quais dados pessoais são coletados; onde ficam armazenados; quem pode acessar
- Logs com dados pessoais; exclusão de conta; política de privacidade
- Consentimento; retenção; backups com dados pessoais
- Acesso administrativo; exposição em endpoints públicos

---

### 19. Auditoria de produto e monetização

| Para vender precisa de quê? | Estado |
| --- | --- |
| Landing | ok/parcial |
| Cadastro empresa | ok/parcial |
| Agenda pública | ok/parcial |
| Painel administrativo | ok/parcial |
| Pagamento | ok/parcial |
| Notificações | ok/parcial |
| Backup | ok |
| Segurança mínima | ok/parcial |

Avaliar: nicho inicial · fluxo que gera valor · cadastro de empresa/serviços/colaboradores · agenda · cliente final · cobrança · onboarding · painel do dono · notificações · relatórios · bloqueadores para primeiro cliente pagante.

---

### 20. Classificação de riscos

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

## Modelo do relatório final

```
# Auditoria Completa MultGestor — YYYY-MM-DD
## 1. Resumo executivo
## 2. Escopo da auditoria
## 3. Ambientes auditados
## 4. Estado atual do projeto
## 5. Governança e Segundo Cérebro
## 6. Produção Render/Vercel
## 7. Banco Supabase
## 8. RLS e multi-tenant
## 9. Segurança e secrets
## 10. Backup e restore
## 11. Testes e CI/CD
## 12. Backend
## 13. Frontend
## 14. Fluxo público de agendamento
## 15. EventBus/outbox
## 16. Arquitetura multi-nicho
## 17. Observabilidade
## 18. Performance e custo
## 19. LGPD e dados pessoais
## 20. Produto e prontidão comercial
## 21. Lista de achados
## 22. Plano de correção
## 23. Próximas missões recomendadas
## 24. Veredito final
```

---

## Resultado esperado — 5 entregas concretas

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
| A-003 | P2 | Frontend | estados vazios ruins no booking | aberto |
| A-004 | P1 | Governança | fila divergente do estado real | corrigido |

### 3. Plano de ação por prioridade

**Agora:** corrigir P0 · validar backup automático · confirmar produção · alinhar governança  
**Depois:** testes E2E · billing · notificações · UX · relatórios  
**Futuro:** multi-nicho · app offline · IA operacional · observabilidade avançada

### 4. Missões recomendadas

```
1. backup-scheduler-first-run-validation
2. e2e-public-booking-validation
3. rls-tenant-isolation-test-suite
4. eventbus-failed-sale-outbox-reconcile
5. frontend-booking-ux-hardening
6. production-observability-baseline
```

### 5. Evidências

A auditoria precisa mostrar prova, não opinião.  
Evidências: comandos executados · outputs · URLs testadas · endpoints testados · logs · commits · branches · arquivos lidos · tabelas consultadas · contagens de banco · resultado de testes · diferenças entre esperado e real.

---

## 3 camadas de auditoria

### Camada 1 — Auditoria P0 operacional (mais urgente)
Backup/restore · produção · banco · secrets · governança · fila atual · bloqueadores reais.

### Camada 2 — Auditoria técnica profunda
Backend · frontend · testes · RLS · EventBus · CI/CD · arquitetura multi-tenant.

### Camada 3 — Auditoria de produto e receita
Fluxo de cliente real · barbearia como primeiro nicho · onboarding · cobrança · notificações · dashboard · o que falta para vender.

---

## Pergunta-mãe de toda auditoria

> O projeto está seguro, governado e recuperável o suficiente para avançar para a próxima missão?

Não: "O código está bonito?"

O risco maior não é só código. É alinhamento entre: produção · Supabase · backup · restore · governança · fila · testes · segurança · produto vendável. A auditoria boa precisa cruzar tudo isso.
