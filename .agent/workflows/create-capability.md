# Workflow: /create-capability

## Quando usar
Quando uma feature específica de um vertical deve ser abstraída como capability reutilizável do Core MultGestor.

## Trigger
```
/create-capability <nome-da-capability>
```

Exemplo: `/create-capability booking-engine`

---

## Passos

### PASSO 1 — Análise de Reutilização

O agente `platform-architect` avalia:
- Quais verticais usariam esta capability?
- O comportamento é o mesmo ou apenas os dados mudam?
- Quais partes são genéricas vs específicas de nicho?

**Output:** Relatório de viabilidade + interface proposta

---

### PASSO 2 — Definição de Interface e Contratos

```js
// Definir interface clara ANTES de implementar
interface IBookingEngine {
  getAvailableSlots(params): Promise<Slot[]>
  createBooking(params): Promise<Booking>
  cancelBooking(params): Promise<void>
  rescheduleBooking(params): Promise<Booking>
}
```

**Arquivo:** `backend/src/shared/capabilities/<name>/index.js`

---

### PASSO 3 — Definir Eventos de Domínio

Documentar em `docs/DOMAIN_EVENTS_CATALOG.md`:
- Quais eventos a capability publica?
- Quais eventos a capability consome?
- Payload de cada evento

---

### PASSO 4 — Implementar

Estrutura de arquivos:
```
backend/src/shared/capabilities/<name>/
  index.js           ← interface pública (exports)
  <name>.js          ← implementação principal
  <name>.repository.js  ← acesso a dados
  <name>.events.js   ← publicação de eventos
  <name>.schemas.js  ← validação de entrada
```

---

### PASSO 5 — Testes

```
backend/src/tests/unit/<name>.test.js
backend/src/tests/integration/<name>.integration.test.js
```

Cobrir:
- Interface com dados válidos
- Interface com dados inválidos (erros esperados)
- Isolamento: não vazar dados cross-tenant
- Idempotência de eventos

---

### PASSO 6 — Integrar no Vertical

Substituir código vertical-específico pela capability:

```js
// Antes: código específico do barber
const slots = await barberService.getAvailableSlots(...)

// Depois: capability do Core
const bookingEngine = new BookingEngine(barberConfig)
const slots = await bookingEngine.getAvailableSlots(...)
```

---

### PASSO 7 — Atualizar Documentação

- `docs/PLATFORM_ARCHITECTURE.md` — adicionar capability na seção 4
- `docs/DOMAIN_EVENTS_CATALOG.md` — adicionar eventos publicados
- `.agent/ARCHITECTURE.md` — atualizar capabilities disponíveis
- `.agent/memory/current-state.md` — registrar progresso

---

## Checklist de conclusão

```
[ ] Interface definida e documentada
[ ] Eventos catalogados em DOMAIN_EVENTS_CATALOG.md
[ ] Implementação em shared/capabilities/<name>/
[ ] Vertical usando a capability (não código próprio)
[ ] Testes unitários passando
[ ] Testes de integração passando (ou skipped com justificativa)
[ ] Documentação atualizada
[ ] Segundo vertical poderia usar com mínima configuração?
```
