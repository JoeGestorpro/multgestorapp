# Objeções e Limitações — MultGestor Core (pós-Gate 4)

**Data:** 2026-07-20 | **Gate 4:** Reconciliação aplicada

---

## 1. Objeções Confirmadas

### OBJ-001: God Service barber.service.js (CRÍTICO)
- **Afirmação:** 3.831 linhas, 37 funções, SQL inline, zero imports de repositories.
- **Evidência:** `backend/src/services/barber.service.js:1-3831`
- **Tipo:** FATO_VERIFICADO
- **Mitigação parcial:** `barber-core.service.js` (264 linhas, facade) existe mas controllers não migraram.

### OBJ-002: Redis ausente em produção (CRÍTICO)
- **Afirmação:** `.env.production` não define REDIS_URL; fallback no-op.
- **Evidência:** `redis-client.js:6-9` + `.env.production` (2 linhas)
- **Tipo:** INFERENCIA_FORTE (chave pode existir no Render panel)

### OBJ-003: Frontend sem testes (ALTO)
- **Afirmação:** 2 arquivos de teste em todo o frontend.
- **Evidência:** `useBarberOverview.test.js` + `overviewRules.test.js`
- **Tipo:** FATO_VERIFICADO

### OBJ-004: Documentação desatualizada (ALTO)
- **Afirmação:** 4+ documentos contradizem o código.
- **Evidência:** AUDIT_REPORT (5 objeções descartadas), capabilities-map (Repository "planned"), runtime-map ("no refresh token"), PLATFORM_ARCHITECTURE ("no versioned migrations")
- **Tipo:** FATO_VERIFICADO

### OBJ-005: columnExists anti-performático (MÉDIO)
- **Afirmação:** Copy-paste em 4 services, até 24 queries/request.
- **Evidência:** company.service.js:27, company-plan.service.js:45, master.service.js:57
- **Tipo:** FATO_VERIFICADO

### OBJ-006: Acoplamento BarberGestor no Core (MÉDIO)
- **Afirmação:** wallet/packages/loyalty/anamnesis sob /api/barber/. VIEW = barber_appointments.
- **Evidência:** barber.routes.js, client-booking.sql:180-194
- **Tipo:** FATO_VERIFICADO

### OBJ-007: Testes sem coverage (MÉDIO)
- **Afirmação:** 71 arquivos sem --coverage no CI.
- **Evidência:** ci.yml sem coverage step
- **Tipo:** FATO_VERIFICADO

---

## 2. Objeções Descartadas

| Objeção | Evidência de descarte |
|---------|----------------------|
| CORS aberto | server.js:180-204 allowlist |
| OutboxWorker não inicializado | server.js:436 `start()` |
| JWT em localStorage | authStorage.js Map |
| Duas pastas middleware | Apenas `middlewares/` |
| Auth duplicada | Contexts diferentes para escopos diferentes |

---

## 3. Limitações Técnicas

| ID | Limitação | Risco |
|----|-----------|-------|
| LIM-01 | Express 5 | Baixo |
| LIM-02 | JS sem TypeScript | Médio |
| LIM-03 | Sem ORM | Médio |
| LIM-04 | Migrations via buildCommand | Baixo |
| LIM-05 | Sem staging | Alto |
| LIM-06 | Supabase Storage dual | Baixo |

---

## 4. Correções de Dados

| Dado | T3 | Real |
|------|-----|------|
| barber.service.js | 4.368 | 3.831 |
| Repositories | 12 | 10 |
| Outbox handlers | 14 | 15 |
| Controllers | 22 | 28 |
| Services | 20+/30+ | 50 |
| Endpoints | "80+" | 226 |
| Branch | core-booking-001 | sec-booking-rls-001 |
| HEAD | 271c884 | 0d392e6 |
