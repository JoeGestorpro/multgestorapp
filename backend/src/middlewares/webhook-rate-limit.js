'use strict';

// Teto de abuso/flood para os webhooks PÚBLICOS (pagamento + WhatsApp) — R-003.
//
// Por que existe: `/api/webhooks/*` são endpoints públicos, não autenticados,
// alcançáveis por qualquer origem. A assinatura já é verificada (forjação é
// rejeitada cedo), mas um flood ainda custa CPU (HMAC), conexões e a capacidade
// da única instância (free tier). Este é o backstop de disponibilidade.
//
// Dimensionamento — deliberadamente GENEROSO:
//   - Webhooks são máquina-a-máquina; vários tenants chegam pelo MESMO IP do
//     provedor (Kiwify/AbacatePay/Meta), então o bucket por IP agrega tenants.
//   - O teto default (600/min/IP) fica ORDENS DE MAGNITUDE acima do volume
//     legítimo agregado, mas ainda corta floods (milhares/min sustentados).
//   - `createRateLimit` é FAIL-OPEN sob falha de Redis (libera a request) e cai
//     para memória por-instância — nunca derruba um webhook legítimo por infra.
//   - Provedores REPETEM em 429 (retry) → mesmo se um pico raro tocar o teto,
//     nenhum evento de pagamento é perdido, só adiado.
//
// Ajustável por env (ops/tuning e testes). O keyGenerator default de
// `createRateLimit` já bucketiza por `ip:method:path`, então cada endpoint de
// webhook tem seu próprio balde com esta mesma configuração.
const createRateLimit = require('./rate-limit.middleware');

const WINDOW_MS = Number(process.env.WEBHOOK_RATELIMIT_WINDOW_MS) || 60 * 1000;
const MAX = Number(process.env.WEBHOOK_RATELIMIT_MAX) || 600;

const webhookAbuseRateLimit = createRateLimit({ windowMs: WINDOW_MS, max: MAX });

module.exports = { webhookAbuseRateLimit, WEBHOOK_RATELIMIT_WINDOW_MS: WINDOW_MS, WEBHOOK_RATELIMIT_MAX: MAX };
