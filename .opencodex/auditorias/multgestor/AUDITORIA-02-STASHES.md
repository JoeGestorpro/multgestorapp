# AUDITORIA-02 — Stashes

> **Data:** 2026-07-11
> **Fase:** 3 — Auditar e preservar stashes (modo leitura, sem apply/drop)

---

## stash@{0} — `temp-stash-obsidian`

| Campo | Valor |
|-------|-------|
| Commit | `05cd326a9982d0e76fbfbe89cd6bef357b7ec42b` |
| Data | 2026-06-23 (18 dias) |
| Branch de origem | `feat/joefelipe-mission-builder` |
| Conteúdo | 2 arquivos, +42/-16 |

```
.opencodex/.obsidian/graph.json      |  2 +-
.opencodex/.obsidian/workspace.json  | 56 +++++++++++++++++++-----
```

**Classificação:** Preferências visuais do Obsidian (layout do workspace/graph). Sem valor de código.
**Tratamento:** Registrar evidência (feito). Seguro para `drop` após autorização (Fase 9).

---

## stash@{1} — `safety-stash-before-b1b-gate-poolconnect`

| Campo | Valor |
|-------|-------|
| Commit | `fa6a57a4baf99815db090d4eccbf05a176cdf3df` (merge octopus: 3 pais) |
| Data | 2026-06-04 (37 dias) |
| Branch de origem | `fase2/wa-reminder` |
| Conteúdo | **31 arquivos, +734/-85** |

> ⚠️ **Correção ao plano:** o plano estimava "13 arquivos". O stash real contém **31 arquivos** com +734 linhas. A auditoria de equivalência do plano cobriu apenas 7 deles — os demais (billing, cache-manager, ThemeContext, SetupWizard, booking landing, etc.) **não foram comparados** e precisam ser antes de qualquer descarte.

### Arquivos (31):

```
.agent/context/ai-operating-rules.md                       (+72)
.agent/context/memory-snapshot.md
.agent/context/roadmap.md
.agent/memory/current-state.md
.agent/memory/features/whatsapp-api.md
.gitignore
backend/src/controllers/auth.controller.js                 (+23)
backend/src/controllers/barber/index.js
backend/src/database/rls_tenant_tables.sql                 (+76)
backend/src/integrations/consumers/index.js
backend/src/integrations/webhooks/whatsapp-webhook.js      (+40)
backend/src/repositories/sale.repository.js
backend/src/routes/barber.routes.js                        (+35)
backend/src/services/booking-appointments.service.js       (+48)
backend/src/services/email/trial-emails.service.js
backend/src/services/sale.service.js
backend/src/shared/capabilities/billing/billing-manager.js (+85)
backend/src/shared/capabilities/billing/contracts.js
backend/src/shared/capabilities/billing/providers/abacatepay.provider.js
backend/src/shared/core/cache/cache-manager.js             (+46)
backend/tests/jest.setup.js
backend/tests/unit/cache-manager.test.js                   (+31)
frontend/.env.example
frontend/src/components/common/ThemeStyles.jsx
frontend/src/components/onboarding/SetupWizard.jsx
frontend/src/contexts/ThemeContext.jsx
frontend/src/pages/Barber.jsx
frontend/src/pages/Login.jsx
frontend/src/pages/barber/BarberLogin.jsx
frontend/src/pages/booking/BookingLandingConfig.jsx
frontend/src/pages/booking/BookingLandingHero.jsx
```

### Avaliação de equivalência do plano (parcial — 7 de 31)

| Arquivo | Status (plano) |
|---------|----------------|
| `auth.controller.js` | ✅ Já aplicado (forma evoluída `REFRESH_COOKIE_NAMES`) |
| `rls_tenant_tables.sql` | ⚠️ Não aplicado neste arquivo (RLS pode estar em migrações) |
| `whatsapp-webhook.js` | ❌ Não aplicado (validação HMAC-SHA256 ausente) |
| `sale.repository.js` | ❌ Não aplicado (refactor `companyId` como parâmetro) |
| `barber.routes.js` | ❌ Não aplicado (rotas financeiras/loyalty/package) |
| `consumers/index.js` | ⚠️ Parcial (wallet sim; loyalty+package não) |
| `barber/index.js` | ❌ Não aplicado (controllers financial/wallet/package/loyalty) |

**Conclusão:** trabalho **parcialmente aplicado**. Há código potencialmente valioso não implementado (HMAC do webhook WhatsApp, rotas financeiras/loyalty/package, billing-manager, cache-manager). **Os 24 arquivos restantes ainda não foram comparados.**

**Ação recomendada (só quando autorizado — Fase 5+):**
```bash
git switch -c recovery/stash-wa-reminder origin/main
git stash apply 'stash@{1}'   # apply, NÃO pop — preservar o stash
# comparar/testar arquivo a arquivo, incluindo os 24 não avaliados
```

---

## Gate

🔒 **Nenhum stash foi aplicado ou descartado.** `stash@{1}` **NÃO** pode ser descartado até:
1. todos os 31 arquivos comparados com o código atual;
2. branch de recuperação limpa;
3. testes passando;
4. relatório comprovando equivalência.
