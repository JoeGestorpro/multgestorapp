---
tipo: auditoria
missao: R-003-WEBHOOKS
data: 2026-07-22
operacao: AUDIT + FIX
codigo_alterado: true
banco_alterado: false
resultado: WEBHOOKS_PUBLICOS_COM_CONTROLE_DE_ABUSO
---

# R-003-WEBHOOKS — Blindagem de abuso/custo dos webhooks públicos

> Origem: backlog priorizado [[../../projetos/multgestor/matriz-consolidacao-core]] ANEXO F #4 (R-003). Diretriz vinculante: `CLAUDE.md` §Proteção de rotas + `.opencodex/rules/route-protection-abuse-control.md`.
> Contexto: itens #1 (ADR booking) já concluído; #2 (inventário RLS em prod) **bloqueado** (Supabase MCP `Unauthorized`); #3 (ativação billing) **bloqueado** (config Kiwify + secrets externos). R-003 é o item de maior rank **executável autonomamente** e toca a rota do dinheiro.

## 1. Auditoria da superfície de rota (evidência)

Mounts em `backend/src/server.js:370-383` e proteção efetiva de cada um:

| Mount | Autenticação | Rate limit | Veredito |
|---|---|---|---|
| `/api/auth` | pública (login) | ✅ `createRateLimit` | OK |
| `/api/booking-auth` | pública | ✅ | OK |
| `/api` (public-auth) | pública | ✅ | OK |
| `/api/public` (booking) | pública (anônima por slug) | ✅ IP + tenant | OK |
| **`/api/webhooks/kiwify`** | pública (assinatura) | ❌ **ausente** | **GAP** |
| **`/api/webhooks/abacatepay`** | pública (assinatura) | ❌ **ausente** | **GAP** |
| **`/api/webhooks/whatsapp` GET+POST** | pública (assinatura Meta) | ❌ **ausente** | **GAP** |
| `/internal` | `requireMasterAdminAuth` | n/a | OK (autenticada) |
| `/api/master` | `authMiddleware` + `requireMasterAdminAuth` | n/a | OK |
| `/api/client` | auth + `requireBookingCustomerAuth` + `requireCompany` | n/a | OK |
| `/api/barber` | auth | (rotas públicas do barber já têm RL) | OK |
| `/api/barber/ai` | auth | ✅ RL + budget/circuit no `LlmService` | OK |
| `/api/clima` | auth + `requireTenantAdminAuth` + `requireCompany` + módulo | n/a | OK |

Também verificado: **não há rate limiter global** em `server.js` (cada rota é responsável pelo seu). `integration.routes.js` (config WhatsApp) é autenticada.

**Gap único e definitivo:** os 3 endpoints públicos de `/api/webhooks/*` não tinham controle de abuso/flood.

## 2. As 4 perguntas obrigatórias (CLAUDE.md) para os webhooks

1. **Pode gerar abuso?** Sim — públicos, não autenticados, alcançáveis por qualquer origem. Flood consome CPU (HMAC de assinatura), conexões e a capacidade da única instância (free tier).
2. **Gera custo?** Compute/DB por request. A assinatura é verificada **antes** de qualquer escrita (`billing-manager.js:35` → `provider.verifySignature`; WhatsApp `whatsapp-webhook.js:30` HMAC + `timingSafeEqual`), então evento **forjado é rejeitado cedo** — mas o flood em si custa CPU/conexões.
3. **Precisa de rate limit?** Sim — backstop de disponibilidade. **Aplicado.**
4. **Precisa de limite por tenant?** Não no nível HTTP — o tenant só é conhecido após verificar a assinatura e ler o payload. Os controles por-tenant dessas rotas são **verificação de assinatura + idempotência** (`payment_gateway_events ON CONFLICT (gateway,event_id) DO NOTHING`, `billing-manager.js:55-61`), não o IP.

## 3. Correção aplicada

Novo `backend/src/middlewares/webhook-rate-limit.js` — `webhookAbuseRateLimit` (reusa `createRateLimit`):
- **IP-based** (keyGenerator default `ip:method:path` → cada endpoint tem balde próprio).
- **Teto generoso** default **600/min/IP** (`WEBHOOK_RATELIMIT_MAX` / `WEBHOOK_RATELIMIT_WINDOW_MS`, ajustáveis por env para ops/tuning e testes).
- Dimensionamento seguro: webhooks são máquina-a-máquina e vários tenants chegam pelo **mesmo IP do provedor** — o teto fica ordens de magnitude acima do volume legítimo agregado, mas corta floods.
- **Fail-open** sob falha de Redis (herdado de `createRateLimit`): nunca derruba um webhook legítimo por infra.
- Provedores **repetem em 429** (retry): mesmo se um pico raro tocar o teto, nenhum evento de pagamento é perdido — só adiado.

Aplicado em:
- `backend/src/routes/webhooks.routes.js` — `/kiwify`, `/abacatepay` (+ bloco das 4 perguntas em código).
- `backend/src/server.js` — `/api/webhooks/whatsapp` GET e POST.

## 4. Evidências de teste

- Novo `backend/tests/integration/webhooks-rate-limit.test.js` (2/2): prova 429 após exceder o teto no `/kiwify` (com teto=2 via env), corpo `{success:false}` e header `X-RateLimit-Limit`; e baldes independentes por endpoint (`/abacatepay` não é afetado pelo estouro do `/kiwify`).
- Suíte unitária: **54/54 suítes, 774/774 testes**.
- Integração: 59 passando (incl. este), 7 DB-gated puladas (sem `TEST_DATABASE_URL`).

## 5. Escopo / não-escopo

- **Alterado:** `webhooks.routes.js`, `server.js` (só as 2 linhas do whatsapp), + 2 arquivos novos (middleware + teste). Nenhuma migration, secret, config de deploy ou banco.
- **Preservado:** lógica de assinatura e idempotência (não tocadas).
- **Não-escopo (residuais registrados, não bloqueiam):**
  - `integration.routes.js` `/whatsapp/test` (envio real) é autenticada e o WhatsApp está em **mock** em prod — adicionar limite por-tenant quando o provedor real for ligado.
  - `payment_gateway_events` sem policy RLS (acessada por pool privilegiado no webhook) — item da matriz `BILLING-002`, requer verificação em banco (hoje sem acesso).

## 6. Estado

```
R003_WEBHOOKS_ABUSE_HARDENING_IMPLEMENTADO
```
Testes verdes; nenhuma rota pública sem controle de abuso remanescente. Sem push/merge/deploy nesta etapa (aguarda gate de merge).
