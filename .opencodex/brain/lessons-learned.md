# 🎓 LIÇÕES APRENDIDAS — MultGestor

> Incidentes e aprendizados para **não repetir**. Atualizado no Loop de Fechamento quando uma missão revela um erro de processo.
> **Origem:** `docs/lessons-learned.md` + incidentes reais de 06-04→06-07. **Status: Consolidado + Atualizado.**

## L-01 — `git clean` apagou governança untracked (2026-06-04)
`git clean -fd` apagou `.opencodex/` (na época untracked) → divergência Claude↔OpenCode. **Aprendizado:** governança passou a ser **rastreada** no git; runner **NUNCA** roda `git clean`. (Preflight CHECK + auto-queue-runner Regra #3.)

## L-02 — Dois cérebros desconectados (2026-06-07)
`.agent/` (Master Orchestrator) virou autoridade prescrita mas **congelada e bypassada**; `.opencodex/` virou autoridade real sem atualizar a memória. **Aprendizado:** fonte única (`brain/`) + **Loop de Fechamento** obrigatório + **CHECK 0** de contexto. Memória que não se atualiza sozinha morre.

## L-03 — Evento de domínio com transporte volátil (F2)
`appointment.*` P0 eram fire-and-forget no `eventBus` (erros engolidos, fora da transação). **Aprendizado:** eventos críticos vão pela **outbox durável** (UnitOfWork), atômicos com o write.

## L-04 — Migração de transporte que dropou comportamento (F2 inc.1, REQUEST_CHANGES)
Ao migrar `create` para outbox, o executor **removeu** `appointment.confirmed` → quebrou o WhatsApp de confirmação (consumer in-memory ativo). **Aprendizado:** migração de transporte **NÃO** muda comportamento; **não dropar evento com consumidor ativo** (dual-emit). Virou regra dura nos cards.

## L-05 — EVENT CONTRACTS: hardcode + sem validação (incidente do título)
Eventos publicados com `event_name`/`aggregate_type` hardcoded e sem `validateEventPayload` → drift entre formatos in-memory vs outbox. **Aprendizado:** contrato real + `validateEventPayload` + **factory** obrigatórios; gate de auditoria reprova violação. (`.opencodex/rules/event-contracts.md`.)

## L-06 — Auditor automático pode subestimar regra nova (F2 inc.2)
O OpenCode Auditor deu APPROVE ignorando a regra EVENT CONTRACTS recém-criada. **Aprendizado:** auditoria final do Claude Code verifica **no código real**, não no parecer; regra nova precisa ser amarrada no `auditor-flow` E nos critérios de aceite do card.

## L-07 — RLS inerte por BYPASSRLS
RLS `ENABLE` não isola nada se o role de runtime tem BYPASSRLS. **Aprendizado:** isolamento real exige role least-privilege; até lá, a app é a única barreira (filtros `company_id`).

## L-10 — Update só-notas gravava status='' (CHECK constraint) — 2026-06-07
`AppointmentService.update` normalizava `status` para `''` quando ausente e **sempre** o passava ao `repo.update`, que incluía `status='' ` no SET → `chk_barber_appointments_status`. Atualizar só observações → 500. Pré-existente; exposto pelo teste de integração "notes-only". **Fix:** só incluir `status` no payload quando não-vazio. **Aprendizado:** normalização defensiva (`String(x||'')`) pode transformar "ausente" em "valor inválido" — distinguir *não-informado* de *vazio* antes de persistir. (Mesmo padrão do L-09: integração pegou o que o unit não via.)

## L-09 — Mocks escondiam bug crítico do EventBus; o GATE-INTEG pegou (2026-06-07)
`event-bus.js:31` usava `event_name` (variável solta) em vez de `event.event_name` → **ReferenceError em TODA chamada real de `eventBus.publish`** (7 call sites: appointment confirmed/canceled dual-emit, reminder job, whatsapp-webhook, integration-manager). Latente desde a criação do arquivo. **Por que invisível:** todos os unit tests **mockam o eventBus**; nenhum exercitava o `publish` real. O **1º teste de integração real** (outbox-durability, sob o GATE-INTEG do Brain V3) expôs o bug antes de chegar em `main`.
**Aprendizados:**
- Toda capability central precisa de **ao menos um teste sem mock** no caminho real (criado `event-bus.test.js`).
- O **GATE-INTEG provou seu valor na 1ª execução** — segurou um bug crítico que teria ido para produção.
- "Verde no unit" ≠ "funciona": mocks validam contrato do chamador, não a implementação real do dependido.

## L-08 — Dois formatos de evento (in-memory vs outbox)
Consumer escrito para um formato quebra no outro (`event.event_name` vs `event.type`; `event.company_id` vs `context.companyId`). **Aprendizado:** acessar campos pelo formato correto; helper/factory central se variar.
