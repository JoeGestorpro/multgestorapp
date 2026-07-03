# AUDITORIA MULTGESTOR CORE — PLATAFORMA REUTILIZÁVEL PARA NICHOS
**Data:** 2026-07-03 · **Escopo:** exclusivamente o Core (BarberGestor/ClimaGestor usados só como evidência)

> Pergunta central: **"Se amanhã quisermos criar um novo nicho, quanto do trabalho já está
> resolvido pelo Core e quanto ainda precisa ser refeito manualmente?"**
> Método: 4 investigações paralelas (backend, dados/módulos/planos, frontend, onboarding/governança)
> com leitura direta de código + reconciliação com evidência já verificada nesta sessão.
> Escala de evidência: **VALIDADO** (produção real) · **[FATO]** (código/teste confirmado) ·
> **[PARCIAL]** (indício, falta verificação completa) · **[HIPÓTESE]** (inferência) ·
> **[INSUFICIENTE]** (sem dado — declarado, não inventado).

---

## ⚠️ Correção de uma investigação (transparência)

Uma das 4 investigações concluiu "não encontrado INSERT em `company_modules`" dentro de
`billing-provisioning.consumer.js`. Isso está **incorreto** — eu havia lido esse arquivo
diretamente nesta mesma sessão (auditoria de due diligence, 2026-07-03) e confirmo:
`activateCompanyModule(companyId, moduleId, client)` existe em `billing-provisioning.consumer.js:154-183`
e é chamado em `billing-provisioning.consumer.js:366` (`if (module?.id) { await activateCompanyModule(...) }`).
**[FATO — verificado por leitura direta, não por agente.]** O webhook de pagamento **ativa o
módulo automaticamente**. O gap real (confirmado na due diligence de ontem) é que esse mesmo
fluxo **não seta `companies.plan_type`** — motivo do incidente D-016. Mantida como achado
central desta auditoria em §5, mas com a causa correta.

---

## 1. VEREDITO EXECUTIVO

> **O MultGestor não é hoje uma plataforma multi-nicho — é o BarberGestor com uma plataforma
> em construção por baixo.** A intenção arquitetural está certa e uma fatia real do Core já
> funciona (multi-tenant, auth, módulos/planos como tabelas, billing, governança). Mas o teste
> de fogo — construir um segundo nicho de verdade — já foi tentado (ClimaGestor) e **revelou
> exatamente onde o Core ainda não é genérico**: autenticação hardcoded para barber dentro das
> rotas de clima, motor de agendamento "compartilhado" que na prática só o barber usa de
> verdade, frontend do segundo nicho parado em 7 linhas, e nenhuma automação que reduza o
> custo de criar o próximo.

**MultGestor Core Completion Index: 52/100** (ver §9 — Scorecard completo).

O ClimaGestor é, ao mesmo tempo, a melhor e a pior notícia desta auditoria: é a **prova viva**
de que dá para começar um nicho novo sem tocar no banco todo (as tabelas/rotas/módulo existem),
mas também a **prova viva** de que hoje isso ainda custa quase tanto quanto reescrever
(auth errada, sem motor compartilhado real, frontend do zero, nunca usado por uma empresa real).

---

## 2. CONTRATO OFICIAL CORE × NICHO — hoje vs. deveria ser

### O que o Core REALMENTE entrega hoje (validado por código)

| Capability | Estado real | Evidência |
|---|---|---|
| Autenticação (JWT + refresh + revogação) | ✅ Core de verdade | `auth.service.js`, `auth.controller.js` — usado por barber/master/booking |
| Multi-tenant (RLS + GUC + poolTenant) | ✅ Core de verdade, reforçado nesta semana | RLS reads em prod (PR #20); writes fechados localmente (`02c5396`); 98 testes de enforcement |
| Empresas / Usuários / Papéis | ✅ Core de verdade | `companies`, `users` sem prefixo de nicho |
| Módulos (catálogo + ativação por empresa) | 🟡 Core parcial | `modules`+`company_modules` funcionam como dado; **mas rotas de módulo são hardcoded em `server.js:17-18,380-381`**, não carregadas dinamicamente a partir do catálogo |
| Planos / Billing / Webhooks | 🟡 Core parcial | Webhook idempotente, ativa módulo automaticamente (corrigido acima); mas `plans` é 1:N com módulo (sem junction N:N) e vocabulário de feature (`advanced_schedule`) é do barber |
| Feature flags | 🔴 Não existe como Core | 100% acoplado a `requirePlanFeature`/plano — não há flag por módulo/nicho independente de billing |
| Onboarding base | 🔴 Não existe como Core | Registro cria empresa com `modules:[]` vazio; nenhuma ativação automática por `niche_type` |
| Painel Master (gestão de módulos) | 🟡 Core parcial | `Modules.jsx` tem CRUD real (toggle via API); `Niches.jsx` é mock (toasts "[Mock]", sem API) |
| Design System | 🟡 Core parcial, duplicado | `design-system/` genérico existe e é usado por master+landing; `BarberUI.jsx` reimplementa Button/Card/Modal só para barber |
| Booking Engine compartilhado | 🔴 **Não existe de verdade** | `scheduling-utils.js` (funções puras) é reutilizado; mas `booking-appointments.service.js`/`booking-scheduling.service.js` (as partes com estado/banco) têm 59+ ocorrências de `barber_*` hardcoded — Clima não usa esses services, reimplementa os próprios |
| Template de nicho (schema+rotas+telas) | 🔴 **Não existe** | Confirmado por código E pela própria documentação (`DEPENDENCIAS-MULTGESTOR.md:29,39`: *"Nichos novos dependem de `core-vs-vertical-boundary-map` + template de vertical (não existe ainda)"*) |
| Landing genérica por nicho | 🔴 Não existe | `LandingPage.jsx` é lista estática hardcoded; `BarberLanding.jsx` é 13 sections hardcoded — nenhum template |
| Observabilidade / Backup / Deploy / Governança | ✅ Core de verdade | Health/deep, backup B2 validado, CI/CD, `.opencodex/` — estes já são genuinamente nicho-agnósticos |

### O que um nicho novo TEM que entregar hoje (realidade, não o ideal)

Baseado no esforço real do ClimaGestor: schema SQL do zero (copiando barber) · rotas próprias ·
controller+service próprios (sem herdar nada do booking engine com estado) · middleware de
auth próprio corrigido (o de clima está errado, usa auth de barber) · telas de frontend 100%
do zero · landing própria · nenhuma ativação automática mesmo pagando.

**Isso é o oposto do "TODO NOVO NICHO DEVE ENTREGAR APENAS regras de negócio, entidades, telas,
fluxos, menus, campos, relatórios, landing, preço, seeds" que deveria ser o alvo.**

---

## 3. AUDITORIA DE ACOPLAMENTO — achados com evidência

| # | Onde | O que está acoplado | Impacto | Como desacoplar | Prioridade |
|---|---|---|---|---|---|
| A1 | `backend/src/server.js:17-18,380-381` | Rotas de módulo (`barber.routes`, `clima.routes`) importadas e montadas estaticamente | Todo novo nicho exige editar `server.js` e reiniciar; sem descoberta dinâmica | Registry de módulos: cada módulo exporta seu router; server.js itera sobre módulos ativos no catálogo e monta dinamicamente | P2 |
| A2 | `backend/src/server.js:183-184` | Whitelist de CORS com `barbergestor.com.br` hardcoded | Domínio de nicho específico dentro de config genérica | Mover para tabela `companies.custom_domain` ou env por ambiente | P3 |
| A3 | `backend/src/services/company.service.js:11` | `require('../utils/barber-helpers')` dentro de um service que deveria ser 100% Core | Qualquer nicho sem "barber-helpers" quebra ou herda lógica errada | Extrair o que for genérico (tema/branding) para `company.service.js`; mover o resto para dentro do módulo barber | **P0** |
| A4 | `backend/src/services/company.service.js:57,69,74` | Fallback de tema/nome default `'Barbearia'` hardcoded | Empresa de outro nicho recebe branding errado por padrão | Trocar default para o nome do módulo ativo ou genérico ("Minha Empresa") | **P0** |
| A5 | `backend/src/services/company.service.js:93-103` | JOIN direto com `barber_collaborators` dentro de service genérico | Quebra para empresas sem módulo barber | Mover a lógica para dentro do módulo barber; company.service não deveria conhecer tabelas de nicho | **P0** |
| A6 | `backend/src/routes/clima.routes.js:6` | Usa `requireBarberAdminAuth` em vez de um guard próprio/genérico | ClimaGestor roda com autorização de outro módulo — bug de segurança de fato, não só de arquitetura | Criar `requireModuleAdminAuth(moduleSlug)` genérico ou `requireClimaAdminAuth` correto | **P0** |
| A7 | `backend/src/services/booking-appointments.service.js`, `booking-scheduling.service.js` | 59+ ocorrências de `barber_collaborators`/`barber_services` dentro do que a documentação chama de "Booking Engine" genérico | O único motor de agendamento com estado é, na prática, do barber; Clima reimplementou o próprio | Extrair contrato genérico (ex: `provider_id`, `bookable_type`) parametrizado por módulo, ou aceitar que cada nicho tem seu motor e documentar honestamente | P1 |
| A8 | `frontend/src/App.jsx` (linhas 50-397) | Lista de rotas hardcoded, sem iteração por módulos ativos | Novo nicho exige editar App.jsx à mão | Rotas de módulo carregadas de um manifest (`module.routes`) resolvido em runtime | P2 |
| A9 | `frontend/src/components/barber/BarberLayout.jsx` (~linha 74-78) | "Barber Store" hardcoded em componente de layout | Sidebar não é genérica | Extrair branding para prop/config vinda do módulo ativo | P2 |
| A10 | `frontend/src/routes/ModuleRoute.jsx:15` | `auth_scope !== 'barber_admin'` hardcoded | Guard de rota não escala para outros módulos | Comparar contra `auth_scope` do módulo ativo, não string fixa | **P0** |
| A11 | `frontend/src/contexts/AuthContext.jsx:26-53` | Scopes `master`/`barber` hardcoded | Login de outro nicho não tem scope reconhecido | Scopes derivados de `modules` ativos, não enum fixo | P1 |
| A12 | `frontend/src/components/barber/BarberUI.jsx:67-108` | Reimplementa Button/Card/Modal do zero em vez de usar `design-system/` com tema | 2 design systems, manutenção duplicada | Migrar BarberUI para consumir `design-system/` com tema "barber" | P2 |
| A13 | `backend/src/middlewares/planFeatures.js` | Nomes de feature como `advanced_schedule` no vocabulário do barber | Gate de plano não é neutro de nicho | Renomear para conceitos de negócio (ex: `advanced_booking`) ou tornar por-módulo | P2 |

**Padrão que se repete:** todo achado P0 acima está em arquivos que **já se declaram genéricos**
(`company.service.js`, `clima.routes.js`, `ModuleRoute.jsx`) — o problema não é "código de nicho
existe", é "código de nicho vazou para dentro do Core". Isso é mais barato de corrigir do que
parece: são poucos arquivos, bem localizados, com correção pontual (não é reescrita).

---

## 4. AUDITORIA DE REUTILIZAÇÃO

**Já reutilizável de verdade:** auth/JWT/refresh · multi-tenant (GUC+RLS) · logger/outbox/eventbus
· billing webhooks+idempotência · design-system (parcialmente, onde é usado) · `scheduling-utils.js`
(funções puras de disponibilidade, usadas por ambos os nichos) · BaseRepository · rate limiting.

**Duplicado (mesma coisa, duas implementações):** CRUD de agendamento (barber tem
`AppointmentService`, clima tem `ClimaGestor` — mesma assinatura, zero código compartilhado)
· componentes de UI (BarberUI vs design-system) · padrão de controller (barber decompõe em 11
arquivos, clima é 1 arquivo monolítico — nem a decomposição é consistente).

**Precisa virar biblioteca/serviço compartilhado:** um "Provider/Collaborator genérico" (hoje
`barber_collaborators` é a única tabela de "pessoa que presta serviço"; clima reinventou
`clima_professionals` em vez de generalizar) · um "Bookable Entity" genérico (serviço/produto
agendável, hoje `barber_services` vs `clima_services` são cópias estruturais).

---

## 5. AUDITORIA DE CONFIGURAÇÃO — o que deveria ser parametrizável e não é

| Deveria ser config | Hoje é | Evidência |
|---|---|---|
| Nome/tema default da empresa | Hardcoded `'Barbearia'` | `company.service.js:57,69,74` |
| Domínio/branding permitido no CORS | Hardcoded no array de `server.js` | `server.js:183-184` |
| Auth scope válido por módulo | Enum fixo (`master`, `barber`) | `AuthContext.jsx:26-53`, `ModuleRoute.jsx:15` |
| Vocabulário de feature por plano | Nomes fixos do barber (`advanced_schedule`) | `planFeatures.js` |
| Ativação de módulo no registro orgânico | Não configurável — sempre vazio (`modules:[]`) | `auth.service.js` `register()` |
| Landing por nicho | Hardcoded, 13 sections fixas | `BarberLanding.jsx` |

---

## 6. AUDITORIA DE AUTOMAÇÃO — o que ainda é manual

| Processo | Hoje | Automatizável? |
|---|---|---|
| Ativar módulo no registro orgânico (sem pagamento) | Manual — master ativa via `Modules.jsx` ou SQL | ✅ sim, automatizar por `niche_type` no registro |
| Criar módulo novo no catálogo | `master.service.js` tem `createModule` (via UI admin) — funciona, mas ninguém documentou como fluxo oficial | ✅ já quase pronto, falta documentar como o caminho oficial |
| Criar schema de nicho novo | 100% manual — copiar `barber.sql`/`clima.sql` à mão | ✅ criar 1 migration-template parametrizável (nome de tabelas, FKs padrão) |
| Criar rotas de nicho novo | 100% manual — editar `server.js` | ✅ registry dinâmico (ver A1) |
| Criar telas de nicho novo | 100% manual — do zero (Clima.jsx prova: 7 linhas depois de meses) | 🟡 parcialmente — um "shell" de módulo genérico (lista+form+dashboard) reduziria bastante, mas telas de domínio sempre serão específicas |
| `seed-<nicho>.js` | Só existe `seed-barber.js`, hardcoded | ✅ generalizar para `seed-module.js --slug=<x>` |

---

## 7. AUDITORIA DO TEMPLATE DE NICHO

**Resposta direta: hoje NÃO é possível criar um nicho reutilizando o Core sem reescrever uma
fatia grande.** O ClimaGestor prova isso: mesmo com meses de existência, tem auth errada
(usa a do barber), motor de agendamento próprio (não o "compartilhado"), zero integração com
booking público, nenhuma empresa real usando, e o frontend tem 7 linhas. A própria documentação
interna (`DEPENDENCIAS-MULTGESTOR.md:29`) já sabia disso antes desta auditoria — o que esta
auditoria faz é confirmar com código exatamente **onde** o template deveria cortar.

**O que falta, em ordem de bloqueio:**
1. Registry dinâmico de rotas (A1) — sem isso, template nenhum ajuda, porque o passo final
   sempre será "editar server.js na mão".
2. Guard de auth por módulo genérico (A6/A10) — hoje até copiar o padrão do barber dá errado
   (Clima prova).
3. Contrato genérico de "Bookable Entity" + "Provider" (§4) — sem isso, todo nicho com agenda
   reescreve o motor.
4. Migration-template parametrizável (§6) — reduz o "copiar SQL na mão".
5. Shell de frontend (lista+form+dashboard genéricos consumindo o design-system real, não o
   BarberUI) — reduz o "7 linhas depois de meses" para algo utilizável no dia 1.

---

## 8. GAP ANALYSIS

- **O que impede o Core de ficar pronto?** 4 achados P0 concentrados em 3 arquivos
  (`company.service.js`, `clima.routes.js`, `ModuleRoute.jsx`) + ausência de registry de rotas.
- **O que impede criar novos nichos?** Ausência de template (§7) + auth quebrada no único
  exemplo existente + motor de agendamento não realmente compartilhado.
- **O que impede reutilização?** Duplicação de CRUD (agendamento, UI) em vez de contrato comum.
- **O que impede automação?** Falta de registry dinâmico e de scaffold de schema/seed.
- **O que impede escalabilidade?** Não é bloqueador do Core em si — infra aguenta dezenas de
  empresas hoje (ver due diligence de ontem); o teto é operacional, não arquitetural.
- **O que impede white-label?** Branding hardcoded (`'Barbearia'`, `barbergestor.com.br`) dentro
  do Core — precisa virar config antes de cogitar white-label.
- **O que impede marketplace?** Ausência total de registry de módulo/plano N:N e de qualquer
  API versionada — não é o próximo passo, é P4 mesmo.
- **O que impede API pública?** Nenhum versionamento, nenhum contrato OpenAPI, rotas hardcoded
  — pré-requisito é o próprio registry de módulos (A1) já citado para uso interno.

---

## 9. MULTGESTOR CORE COMPLETION INDEX

| Dimensão | Nota | Evidência resumida |
|---|---:|---|
| Arquitetura | 55 | Separação existe; company.service.js vazado (A3-A5) |
| Tenant (multi-tenant engine) | 75 | RLS reads em prod + writes fechados localmente + 98 testes |
| Banco | 65 | Tabelas core limpas (companies/users/modules/company_modules/plans); sem template de migration |
| Billing | 60 | Webhook idempotente ativa módulo automaticamente; plan_type não seta; plans 1:N não N:N |
| Planos | 55 | Schema ok; vocabulário de feature é do barber |
| Permissões | 50 | Scopes hardcoded (master/barber), não dirigidos por módulo |
| Módulos | 45 | Dado funciona (Modules.jsx real); rotas estáticas, sem registry |
| Templates | 10 | Não existe — confirmado por código e pela própria documentação |
| Configuração | 40 | Branding/tema/CORS/scopes com defaults de nicho vazados no Core |
| Automação | 25 | Só `seed-master-admin` é genérico; resto manual |
| Onboarding | 40 | Registro cria empresa, mas módulo fica vazio até ativação manual |
| Deploy | 70 | CI/CD real; `continue-on-error` em migrations (débito conhecido) |
| Infraestrutura | 65 | Render+Vercel+Supabase estáveis, single instance |
| Observabilidade | 55 | Health rico; zero alertas ativos |
| Documentação | 70 | `capabilities-map.md` e `DEPENDENCIAS-MULTGESTOR.md` já mapeavam o gap corretamente — raro nesse estágio |
| Governança | 80 | Constitution, fila, runbooks, audits, decisões |
| Escalabilidade | 50 | Ok para dezenas; sem plano formal além disso |
| Extensibilidade | 20 | ClimaGestor prova: ~50% backend / ~1% frontend após meses |
| API | 45 | Sem manifest, sem OpenAPI, rotas hardcoded por módulo |
| Segurança | 66 | Herdado da due diligence de ontem (baseline do Core, não muda aqui) |

### **MultGestor Core Completion Index: 52/100** 🟠

Comparar com o Enterprise Maturity Index de ontem (57/100, que mede o produto BarberGestor
inteiro): o Core sozinho pontua **abaixo** do produto porque esta auditoria pesa justamente
extensibilidade/templates/automação — os pontos cegos de qualquer plataforma no primeiro
vertical. Isso é esperado, não é uma regressão.

---

## 10. MATRIZ IA × HUMANO

| Item | Prio | IA | Humano | Bloqueia Core? | Bloqueia novos nichos? | Tempo |
|---|---|---|---|---|---|---|
| Extrair `barber-helpers`/JOIN/default de `company.service.js` (A3-A5) | P0 | ✅ | revisa | Sim | Sim | 3-4h |
| Corrigir auth de `clima.routes.js` (A6) | P0 | ✅ | revisa | Sim | Sim | 1-2h |
| Generalizar `ModuleRoute.jsx`/`AuthContext.jsx` scopes (A10-A11) | P0 | ✅ | revisa | Sim | Sim | 2-3h |
| Registry dinâmico de rotas por módulo (A1) | P1 | ✅ | revisa | Não (funciona sem) | **Sim** (é o gargalo #1 de extensibilidade) | 1-2d |
| Migration-template parametrizável | P1 | ✅ | valida schema | Não | Sim | 1d |
| Contrato genérico Bookable/Provider (extrair de booking-appointments) | P2 | ✅ | decide modelagem | Não | Sim | 3-5d |
| Unificar BarberUI → design-system com tema (A12) | P2 | ✅ | revisa visual | Não | Não (mas ajuda) | 2-3d |
| Ativação automática de módulo por `niche_type` no registro | P1 | ✅ | revisa | Não | Sim | 2h |
| Documentar módulo/plano N:N (junction table) | P2 | ✅ | decide se vale agora | Não | Sim (só se plano cobrir >1 módulo) | 1d |
| Shell de frontend genérico (lista/form/dashboard) | P2 | ✅ | decide escopo | Não | Sim | 3-5d |
| Decidir se ClimaGestor vira piloto real ou é descontinuado | P1 | assiste | **decide** | Não | Sim (define prioridade) | decisão |

---

## 11. CRITÉRIOS OBJETIVOS — "MultGestor Core está pronto"

O Core será considerado **finalizado** quando, com evidência:

1. Um novo módulo puder ser registrado (`modules` + rotas) sem editar `server.js`/`App.jsx` à mão.
2. `company.service.js` (e qualquer arquivo "genérico") não importar/consultar nada com prefixo
   de nicho (`barber_*`, `clima_*`).
3. Existir pelo menos um "Bookable Entity" e um "Provider" genéricos usados por 2 nichos reais
   (não 2 reimplementações).
4. Um nicho novo conseguir nascer com: 1 migration (usando template), 1 registro de módulo,
   1 tela usando o shell genérico — sem tocar em auth/roteamento core.
5. `company_modules` for populada automaticamente por `niche_type` no registro (ou por webhook,
   já resolvido) — nunca vazia por padrão sem explicação.
6. O ClimaGestor (ou seu sucessor) rodar com autenticação e motor de agendamento corretos,
   validado por teste de integração cross-nicho (hoje não existe nenhum).

---

## 12. KIT OFICIAL PARA CRIAÇÃO DE NOVO NICHO (estado alvo — ainda não existe)

```
1. Nome, slug, ícone, tema         → INSERT modules (via master UI, já funciona)
2. Migration de schema             → a partir do migration-template (§6/§9 — não existe ainda)
3. Rotas                           → registradas automaticamente pelo registry (A1 — não existe ainda)
4. Auth scope                      → derivado do módulo, não hardcoded (A10/A11 — corrigir antes)
5. Entidades de domínio            → Bookable/Provider genéricos + campos específicos do nicho
6. Telas                           → shell genérico (lista/form/dashboard) + telas de domínio
7. Landing                         → template de landing parametrizado (não existe ainda)
8. Planos                          → INSERT plans com module_id (já funciona)
9. Seeds                           → seed-module.js --slug=<x> (generalizar de seed-barber.js)
10. Testes                         → 1 teste de integração cross-nicho obrigatório
11. Documentação                   → atualizar capabilities-map.md + este runbook
12. Deploy                         → mesmo pipeline (já funciona, é genérico)
```

## 13. DEFINITION OF READY (para começar um nicho novo)

O Core deve ter, ANTES de começar um nicho novo pago: registry de rotas dinâmico · auth
scope por módulo corrigido · company.service.js limpo de barber-helpers · pelo menos um
contrato genérico de entidade agendável. Sem isso, "criar nicho novo" = "reescrever o Core
de novo, mais devagar" (é literalmente o que aconteceu com o ClimaGestor).

## 14. DEFINITION OF DONE (nicho considerado pronto)

Schema criado via template · rotas via registry · auth correta desde o dia 1 · telas mínimas
funcionais (não stub) · pelo menos 1 empresa real usando · teste de integração passando ·
documentação atualizada (capabilities-map + roadmap) · sem duplicar lógica que já existe no Core
(se duplicar, é sinal de que faltou extrair algo para o Core — voltar e extrair antes de seguir).

## 15. MODELO DE AUDITORIA FUTURA (reutilizável para qualquer nicho)

Ver arquivo separado: [`MODELO-AUDITORIA-NICHO.md`](../runbooks/MODELO-AUDITORIA-NICHO.md) —
checklist enxuto para auditar qualquer nicho novo (incluindo Clima quando for retomado) sem
reescrever esta investigação do zero.

---

## 16. PRODUCTION READINESS DO CORE

```
Arquitetura (sem vazamento de nicho)   ❌  P0 (A3-A6, A10)
Banco (tabelas core limpas)            ✔
Tenant/RLS                              ✔  (writes aguardando deploy)
Billing (técnico)                       ✔
Planos (gating neutro de nicho)        ❌  P2
Módulos (registry dinâmico)             ❌  P1
Templates de nicho                      ❌  P1
Automação de onboarding                 ❌  P1
Deploy/CI                               ✔
LGPD                                    ❌  (herdado da due diligence — P0 comercial)
Observabilidade                         ✔ (rico, sem alertas ativos)
Backup/Rollback                         ✔
Documentação                            ✔
Suporte                                 ❌  (herdado da due diligence)
Roadmap/Segundo Cérebro                 ✔

Pode liberar o Core para um 2º nicho pago hoje?   NÃO — 4 itens P0 primeiro (§10, linhas 1-3)
Pode continuar vendendo BarberGestor enquanto corrige o Core?  SIM — não são conflitantes
```

## 17. RELEASE GATE DO CORE

Nenhuma mudança estrutural do Core (registry de rotas, contrato Bookable/Provider, auth por
módulo) entra em produção sem: teste de integração cross-nicho passando · smoke do BarberGestor
inalterado (não pode quebrar o que já vende) · documentação de capabilities atualizada no mesmo
PR · revisão explícita de que nenhuma rota do barber mudou de comportamento.

## 18. EXECUTION PLAYBOOK — ordem de execução do Core

```
1. Corrigir os 4 P0 (A3, A4, A5, A6, A10, A11) — isolados, baixo risco, ~2 dias
2. Registry dinâmico de rotas (A1) — maior alavanca de extensibilidade
3. Migration-template parametrizável
4. Decidir: ClimaGestor vira piloto real (corrigido) ou é congelado até o Core estar pronto
5. Contrato genérico Bookable/Provider — só depois de decidir #4, para não generalizar no vácuo
6. Shell de frontend genérico
7. Reauditar com MODELO-AUDITORIA-NICHO.md usando o nicho escolhido em #4 como teste real
```

Plano de rollback: todos os itens 1-3 são aditivos/isolados (não removem nada do barber) —
reverter é apenas não fazer merge. Item 4 é decisão de produto, não técnica.

---

## VEREDITO FINAL

1. **O MultGestor Core está realmente pronto?** Não. Está **52/100** — parcialmente construído,
   com uma fatia genuinamente sólida (auth, tenant, billing técnico, governança) e uma fatia
   que ainda é BarberGestor disfarçado de Core.
2. **O que falta para finalizar definitivamente o Core?** 4 correções pontuais de acoplamento
   (P0, ~2 dias) + 1 registry de rotas dinâmico (a peça que destrava tudo o resto) + 1 template
   de migration + decisão sobre o destino do ClimaGestor.
3. **O que ainda pertence indevidamente aos nichos?** `company.service.js` conhece tabelas e
   defaults do barber; o guard de auth do clima usa autenticação do barber; scopes de auth no
   frontend são um enum fixo de 2 nichos, não um conceito genérico.
4. **O que precisa virar configuração?** Branding/tema default, whitelist de CORS, vocabulário
   de feature de plano, scopes de autenticação.
5. **O que precisa virar template?** Migration de schema de nicho, landing de nicho, shell de
   telas (lista/form/dashboard).
6. **O que precisa virar automação?** Registro de rotas por módulo, ativação de módulo por
   `niche_type` no onboarding orgânico, `seed-<nicho>.js` genérico.
7. **O que precisa virar serviço compartilhado?** Um "Bookable Entity" e um "Provider" genéricos
   — hoje cada nicho reimplementa o próprio motor de agendamento com estado.
8. **O que depende exclusivamente de humano?** Decisão de produto sobre o destino do
   ClimaGestor; revisão de qualquer mudança em `company.service.js` (arquivo sensível, usado
   por todo o sistema).
9. **O que pode ser totalmente executado por IA?** Todos os 4 itens P0 de acoplamento, o registry
   de rotas, o migration-template, e o `seed-module.js` genérico — nenhum exige decisão de
   negócio, só engenharia.
10. **O Core suporta a criação de novos nichos sem reescrita?** **Não, hoje não.** O ClimaGestor
    é a prova empírica: existe há meses e ainda está incompleto e com bugs de arquitetura
    (auth errada). Suportaria, com os itens do §18 resolvidos (~1-2 semanas de trabalho).
11. **Menor caminho para virar fábrica de SaaS verticais?** Corrigir os 4 P0 → registry de
    rotas → template de migration → escolher UM nicho (Clima ou outro) como piloto real e levá-lo
    até "1 empresa de verdade usando" antes de generalizar mais nada. Generalizar sem um segundo
    caso de uso real é como o booking-engine "compartilhado" virou compartilhado só no nome.
12. **Critérios para declarar "MultGestor Core Finalizado"?** Os 6 critérios do §11 — todos
    verificáveis por código/teste, nenhum por presunção.

---
*Esta auditoria complementa, não substitui, a due diligence de produto de 2026-07-03
([`2026-07-03-due-diligence-enterprise.md`](2026-07-03-due-diligence-enterprise.md)). Aquela
mede "pronto para vender"; esta mede "pronto para virar plataforma". São índices diferentes
de propósito — não devem ser somados ou confundidos.*
