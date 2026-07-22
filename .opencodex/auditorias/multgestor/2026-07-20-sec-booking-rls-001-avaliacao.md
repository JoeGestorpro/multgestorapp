---
tipo: auditoria
missao: SEC-BOOKING-RLS-001
data: 2026-07-20
operacao: READ_ONLY
codigo_alterado: false
banco_alterado: false
resultado: EVIDENCIA_LEVANTADA_COMPLETA
---

# SEC-BOOKING-RLS-001 — Avaliação da trilha pública de booking sem RLS ativo

> **Missão READ_ONLY.** Nenhum código, migration, rota, configuração ou dado de produção foi alterado. Este documento levanta evidência, delimita superfície e propõe plano de correção — a correção em si não está autorizada aqui.
> **Origem:** achado do inventário comportamental de [[../../projetos/multgestor/core/booking/CORE-BOOKING-001-transition-map]] (missão `CORE-BOOKING-001`), reclassificado para investigação de segurança dedicada.

## 1. Correção sobre a caracterização anterior

O inventário da `CORE-BOOKING-001` descreveu "a trilha pública/cliente usa o pool sem RLS". Uma leitura mais precisa dos arquivos de rota mostra que isso **não é verdade para toda a Trilha 2** — só para uma parte dela:

| Sub-rota | Middleware `requireCompany`? | Pool efetivo | Evidência |
|---|---|---|---|
| `client.routes.js` (`/client/appointments`, GET/POST/PATCH cancel) — **cliente autenticado** | **Sim** (`router.use(requireCompany)`, linha 36) | `poolTenant`, role com RLS ativo (equivalente a `NOBYPASSRLS`) | `backend/src/routes/client.routes.js:34-37` |
| `public-booking.routes.js` (`/public/booking/:slug`, `/public/booking/:slug/appointments`, `/public/scheduling/:companySlug/availability`, `register`, `login`, `resend-confirmation`) — **anônimo, por slug** | **Não** — nenhuma chamada a `requireCompany` ou `runWithTenantClient` em toda a rota | Pool privilegiado (`_originalConnect()`), **sem** enforcement de RLS | `backend/src/routes/public-booking.routes.js` (rota inteira); `backend/src/config/database.js:141-144` (`if (!companyId) return _originalConnect();`) |
| `booking-auth.routes.js` (`login`, `me`, `refresh`, `logout`) | Não aplicável — não consulta dados de booking, só autenticação | — | `backend/src/routes/booking-auth.routes.js` |

**Superfície real do achado: apenas as rotas anônimas de `public-booking.routes.js`.** O caminho autenticado do cliente já está protegido pelo mesmo mecanismo usado pela trilha staff.

## 2. Mecanismo técnico confirmado

`pool.connect` é sobrescrito em `backend/src/config/database.js:129-177` para, quando existe `companyId` no `tenantStore` (contexto de tenant estabelecido por `requireCompany`/`runWithTenantClient`), abrir a conexão via `poolTenant` e injetar `app.current_company_id` via `SELECT set_config(...)` logo após `BEGIN` — esse é o mecanismo que ativa RLS em runtime (documentado como `TENANT-002`, `CONCLUÍDA`/`VALIDADO EM CI`).

Quando **não há** `companyId` no `tenantStore` — exatamente o caso de qualquer rota que nunca passou por `requireCompany` — a mesma função cai em `_originalConnect()` (linha 143), que é a conexão privilegiada padrão (`DATABASE_URL`), sem GUC de tenant e sem o papel restrito. Isso é comportamento **documentado e intencional** do próprio mecanismo (comentário no código: "Sem contexto tenant (auth, master, jobs): pool privilegiado, sem wrap") — o desenho original previa esse caminho para rotas de autenticação/jobs internos, não necessariamente para escrita pública de dados de negócio como agendamentos.

## 3. O que protege os dados hoje, na ausência de RLS

Toda query em `booking-appointments.service.js`/`booking-scheduling.service.js` inclui `WHERE company_id = $N` escrito manualmente (confirmado em `booking-appointments.service.js:497,782,824` e nas queries de conflito/disponibilidade citadas no inventário de `CORE-BOOKING-001`). O `company_id` usado nessas queries é resolvido a partir do `:slug`/`:companySlug` da URL (consulta prévia que traduz slug → empresa) — não é fornecido diretamente pelo cliente da API.

**Isso significa que não há uma vulnerabilidade confirmada e explorável hoje** (não encontrei, nesta missão, um caminho onde `company_id` do request de um tenant vaze para a query de outro). O risco é estrutural, não um exploit comprovado: **a única proteção contra vazamento cross-tenant nessas rotas é a disciplina de cada `WHERE company_id` individual escrito à mão** — não há um segundo mecanismo (RLS) que pegue um filtro esquecido em uma query futura, como existe em todo o resto do sistema autenticado.

## 4. Delimitação da superfície afetada

Endpoints expostos por `public-booking.routes.js` (todos sem contexto de tenant/RLS):

```
GET  /api/public/booking/:slug                          (getPublicBooking)
POST /api/public/booking/:slug/appointments              (createPublicBookingAppointment)
POST /api/public/booking/:companySlug/register           (preRegister)
POST /api/public/booking/:companySlug/login              (bookingLogin)
POST /api/public/booking/:companySlug/resend-confirmation
POST /api/public/scheduling/:companySlug/pre-register
POST /api/public/scheduling/resend-confirmation
GET  /api/public/scheduling/confirm-email
GET  /api/public/scheduling/:companySlug/availability
```

Todas já têm rate limit por IP e por tenant (`createRateLimit`, ver comentário de controle de abuso já presente no próprio arquivo, alinhado a `CLAUDE.md`/R-003) — a proteção de abuso/custo está coberta; o que está em avaliação aqui é isolamento de dados entre tenants, não abuso de rota.

**Não verificado nesta missão** (fica como próximo passo, ainda READ_ONLY): leitura linha-a-linha de cada handler dessas 9 rotas para confirmar que **toda** query interna sempre inclui `company_id` corretamente — o inventário da `CORE-BOOKING-001` só cobriu `booking-appointments.service.js`/`booking-scheduling.service.js` em profundidade, não os controllers de `register`/`login`/`resend-confirmation`/`confirm-email` (fluxo de autenticação do cliente público).

## 5. Testes existentes que tocam este mecanismo

Existem suítes dedicadas ao comportamento do pool/RLS (`gate0-pool-paths.test.js`, `gate0-runtime-check.test.js`, `gate0-als-context-leak.test.js`, `tenant-connect-wrap.test.js`, `tenant-isolation-rls.test.js`), mas nenhuma delas referencia `public`, `booking` ou `slug` — ou seja, **o comportamento específico das rotas públicas de booking sob esse mecanismo não está coberto por nenhum teste hoje.**

## 6. Avaliação de risco

| Fator | Avaliação |
|---|---|
| Exploit confirmado | **Não** — nenhum caminho de vazamento cross-tenant foi demonstrado nesta missão |
| Proteção existente | Aplicação apenas (filtro manual `company_id`), sem defesa em profundidade (RLS) |
| Superfície | 9 endpoints anônimos, todos relacionados a booking público e ao fluxo de autenticação do cliente público |
| Blast radius se um filtro faltar no futuro | Alto — leitura/escrita cruzada de agendamentos, dados de cliente (nome/telefone/e-mail) de outra empresa |
| Cobertura de teste do risco específico | Nenhuma |
| Precedente no código | O restante do sistema (staff, cliente autenticado) já resolveu esse mesmo problema com `requireCompany` + `poolTenant` — a lacuna é a rota pública não ter recebido o mesmo tratamento, não a inexistência do mecanismo |

**Classificação de severidade recomendada: P1** (mesmo critério usado para `TENANT-002`/`TENANT-003` na matriz) — não por exploit confirmado, mas por ausência de defesa em profundidade em rota de escrita pública e não autenticada, tocando dados pessoais de clientes finais (LGPD-relevante: nome, telefone, e-mail).

## 7. Plano de correção (proposto, não executado)

Opções, em ordem de preferência arquitetural (nenhuma implementada nesta missão):

1. **Estabelecer contexto de tenant também nas rotas públicas.** Após resolver `slug → company_id` (já acontece hoje), chamar explicitamente `runWithTenantClient(companyId, ...)` antes de qualquer leitura/escrita — assim as rotas públicas passam a usar `poolTenant` com RLS, igual às demais. É a correção mais alinhada ao padrão já validado em `TENANT-002`.
2. **Criar um middleware equivalente a `requireCompany`, mas resolvendo por slug em vez de sessão autenticada**, aplicado a `public-booking.routes.js` inteira — evita estabelecer contexto manualmente em cada handler.
3. **(Não recomendado como solução única) Auditoria de código reforçada** — revisar cada query manualmente e adicionar teste de regressão por `WHERE company_id` — mitiga mas não elimina o risco estrutural de "um filtro esquecido no futuro".

Qualquer uma dessas opções envolve alterar código de rota/middleware — **fora do escopo desta missão READ_ONLY**. Requer nova autorização humana para: qual opção seguir, se abre migration/config nova, e janela de deploy (rota pública em produção, mudança precisa ser testada antes).

## 8. Pontos verificados nesta revisão (2026-07-20, segunda passada)

### 8.1 Controllers `register`/`login`/`resend-confirmation`/`confirm-email`

Lidos por completo: `backend/src/controllers/client-booking.controller.js` → `backend/src/services/booking-customer-auth.service.js` (`preRegisterClient`, `resendClientConfirmation`, `confirmClientEmail`).

| Fluxo | Como isola por tenant | Achado |
|---|---|---|
| `preRegisterClient` | `getCompanyBySlug(companySlug)` resolve `company.id` a partir do slug da URL; toda query subsequente (`booking_customers`, `users`, `email_verification_tokens`) usa `WHERE company_id = $1` com esse valor | Mesma proteção estrutural do resto da rota pública — manual, sem RLS, mas nenhum caminho encontrado onde o `company_id` de um tenant vaze para a query de outro |
| `resendClientConfirmation` | Idêntico — `company_id` sempre derivado do slug, nunca aceito diretamente do cliente | Idem |
| `confirmClientEmail` | **Não filtra por slug/`company_id`** — busca o token por `token_hash = $1` (hash de 32 bytes aleatórios, `crypto.randomBytes(32)`) e obtém `company_id` do próprio registro do token via `JOIN`, com `FOR UPDATE` (trava contra confirmação dupla concorrente) | **Não é uma lacuna de isolamento**: o token é o identificador — imprevisível e de uso único (`used_at`), então não há superfície de enumeração cross-tenant aqui. Este é o único ponto de todo o fluxo público que **não depende** de um `WHERE company_id` escrito à mão, porque não precisa |

**Conclusão do item 1:** nenhum caminho de vazamento cross-tenant encontrado nos quatro fluxos. O risco estrutural (ausência de RLS como segunda camada) permanece o mesmo já descrito nas §2-3 — nada de novo se soma a ele, nada o reduz.

### 8.2 Exposição de dados por `getPublicBookingInfo` / `getSchedulingAvailability`

Lidos por completo: `backend/src/services/barber/booking-scheduling.service.js:273-464`.

- `getPublicBookingInfo` retorna apenas dados de vitrine pública, por design: nome/descrição/cores/banner da landing, lista de `barber_services` (nome, preço, duração), lista de colaboradores agendáveis, e configurações de agendamento (`timezone`, `slot_interval_minutes`, `cancellation_limit_hours` etc.). **Nenhum dado de cliente (nome, telefone, e-mail) aparece neste retorno.**
- `getSchedulingAvailability` → `loadCollaboratorSlots` consulta `barber_appointments` e `barber_booking_blocks` selecionando **apenas** `starts_at, ends_at` (`booking-scheduling.service.js:447-464`) — nenhuma coluna de identidade do cliente (`customer_name`, `customer_phone`, `customer_email`) é lida ou retornada. Um visitante anônimo só descobre que um horário está ocupado, nunca por quem.

**Conclusão do item 2:** nenhuma exposição indevida de dados de terceiros encontrada. Fechado — não é mais um "não verificado".

## 9. Não verificado / próximos passos (permanecem documentais)

Nenhum item obrigatório do escopo original ficou pendente. Como extensão natural (não solicitada, registrada apenas como possibilidade): revisão equivalente do fluxo de `POST /booking/:slug/appointments` → `createPublicAppointment` já foi coberta pelo inventário original de `CORE-BOOKING-001` (não repetida aqui).

## Relações
### Depende de
[[../../projetos/multgestor/core/booking/CORE-BOOKING-001-transition-map]] (achado de origem)
### Relacionado a
`TENANT-002` (mecanismo reaproveitado) · `TENANT-003` (cobertura de RLS em produção, não mensurada)
### Bloqueia
Nenhuma missão de `CORE-BOOKING-001` — risco independente, não faz parte da cadeia de Booking Capability

## Estado final
```
SEC_BOOKING_RLS_001_EVIDENCIA_LEVANTADA_COMPLETA
```
Os dois pontos pendentes da primeira passada (§8) foram fechados nesta revisão: nenhum exploit cross-tenant e nenhuma exposição indevida de dados de terceiros foram encontrados nos fluxos investigados. O achado estrutural (§3, §6) permanece — ausência de RLS como segunda camada de defesa na rota pública — e continua exigindo decisão humana sobre qual opção do §7 seguir. **Não significa correção aplicada.**
