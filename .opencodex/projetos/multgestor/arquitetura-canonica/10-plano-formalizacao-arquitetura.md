# GATE 10 — Plano de Formalização da Arquitetura

> **Missão 1 — Arquitetura Canônica do Core MultGestor**
> **Baseline:** `ba55065` · **Data:** 2026-07-20
> **Propósito:** Converter achados em ações futuras, sem executar mudanças agora.

---

## 1. Correções Documentais (Onda 1)

| ID | Ação | Arquivo | Prioridade |
|----|------|---------|-----------|
| D-01 | Atualizar `capacidades.md` com dados da Missão 1 | `.opencodex/projetos/multgestor/capacidades.md` | Alta |
| D-02 | Arquivar ou redirecionar `docs/PLATFORM_ARCHITECTURE.md` | `docs/PLATFORM_ARCHITECTURE.md` | Média |
| D-03 | Arquivar ou redirecionar `docs/core/runtime-map.md` | `docs/core/runtime-map.md` | Média |
| D-04 | Arquivar ou redirecionar `docs/capabilities-map.md` | `docs/capabilities-map.md` | Média |
| D-05 | Referenciar arquitetura canônica a partir do `indice.md` | `.opencodex/projetos/multgestor/indice.md` | Alta |
| D-06 | Vincular `08-ARQUITETURA-CANONICA.md` no `dna.md` | `.opencodex/projetos/multgestor/dna.md` | Média |

---

## 2. ADRs Necessárias (Onda 2)

| ID | Título | Gatilho | Prioridade | Status |
|----|--------|---------|-----------|--------|
| ADR-NEXT-004 | Fronteira customer table: core ou extensão de nicho? | Zona cinzenta GATE 5 | 🟡 Média | Pendente |
| ADR-NEXT-005 | APP_RUNTIME_URL obrigatória em dev? | OPS-002 | 🟢 Baixa | Pendente |

**Decisões tomadas (registradas em ADRs):**
- ADR-007 — Booking Engine: **Opção A (REBAIXAR)** aprovada
- ADR-REDIS — Redis/Valkey: **PROVISIONAR** aprovado
- ADR-FASE-C — Fase C: **PROMOVER COM AUDITORIA** aprovado

---

## 3. Correções de Código (Onda 3+)

| ID | Descrição | Débito Base | Esforço Estimado | Decisão |
|----|-----------|-------------|-----------------|---------|
| C-01 | Registrar Fase 2 RLS como migration + harmonizar padrão | SEG-001 | Pequeno | — |
| C-02 | Configurar Redis no Render + variáveis de ambiente | OPS-001 | Médio | D-M1-REDIS ✅ |
| C-03 | Mover booking-* services para services/barber/ (Opção A) | ARC-001 | Pequeno | D-M1-BOOKING ✅ |
| C-05 | Completar decomposição de barber.service.js | ARC-002 | Médio | — |
| C-06 | Reativar Fase C consumers (loyalty + package) | BILL-001 | Pequeno | D-M1-FASE_C ✅ |

---

## 4. Migrações Futuras (Onda 3)

| ID | Descrição | Dependência | Prioridade |
|----|-----------|------------|-----------|
| M-01 | Migração 032: harmonizar Fase 2 RLS + registrar | SEG-001 resolvido | Alta |
| M-02 | Migração 033: (futuro — conforme necessidades) | — | Baixa |

---

## 5. Testes Faltantes (Onda 3+)

| ID | Descrição | Débito Base | Prioridade |
|----|-----------|-------------|-----------|
| T-01 | Testes de booking engine (especialmente scheduling-utils) | TEST-001 | Alta |
| T-02 | Testes de billing consumers (Kiwify webhook, provisioning) | TEST-001 | Alta |
| T-03 | Testes de carga para booking + auth | TEST-001 | Média |
| T-04 | Testes de frontend (pelo menos auth flow + booking flow) | C-37 | Média |
| T-05 | Testes de RLS Fase 2 (wallet, packages, loyalty, anamnese) | SEG-001 | Média |

---

## 6. Validações de Produção (Onda 7)

| ID | Descrição | Frequência |
|----|-----------|-----------|
| V-01 | Health check profundo (/api/health/deep) | Diário |
| V-02 | Verificação de poolTenant sem BYPASSRLS | A cada deploy |
| V-03 | Verificação de Redis configurado | Até OPS-001 resolvido |
| V-04 | Verificação de APP_RUNTIME_URL ativa | A cada deploy |

---

## 7. Decisões Tomadas

| Decisão | Resolução | ADR |
|---------|-----------|-----|
| Booking Engine | Opção A: **REBAIXAR** | ADR-007 ✅ |
| Redis/Valkey | **PROVISIONAR** (custo a confirmar) | ADR-REDIS ✅ |
| Fase C | **PROMOVER COM AUDITORIA** + feature flag | ADR-FASE-C ✅ |

### Ainda pendentes (não bloqueantes)

| Decisão | Impacto | ADR |
|---------|---------|-----|
| Customer table: core ou nicho? | Modelo de dados | ADR-NEXT-004 |
| APP_RUNTIME_URL obrigatória em dev? | Setup local | ADR-NEXT-005 |

---

## 8. Ondas Sugeridas

### Onda 1 — Correções Documentais (imediato)
- D-01 a D-06: atualizar documentos com dados da Missão 1

### Onda 2 — Contratos e ADRs (curto prazo)
- ADR-NEXT-004 e ADR-NEXT-005: resolver decisões remanescentes
- ADR-007, ADR-REDIS, ADR-FASE-C: registradas, decisões tomadas

### Onda 3 — Tenant, RLS e Segurança
- C-01: registrar Fase 2 RLS como migration
- C-02: configurar Redis
- M-01: migration 032

### Onda 4 — Billing e Entitlement (médio prazo)
- C-06: reativar Fase C consumers
- T-02: testar billing consumers

### Onda 5 — Booking e Fronteiras de Nicho (médio prazo)
- C-03: executar Opção A (mover booking-* services para barber/)
- T-01: testar booking engine

### Onda 6 — Eventos, Outbox e Workers (médio prazo)
- Validar cobertura de eventos
- Testar outbox durability

### Onda 7 — Observabilidade e Operação (longo prazo)
- V-01 a V-04: validações contínuas
- Dashboard de métricas

### Onda 8 — Validação Multi-nicho (longo prazo)
- Framework de teste para segundo nicho (ClimaGestor)
- NICHEKIT-001: kit de nicho formalizado

---

## 9. Débitos Bloqueantes

| Débito | Bloqueia | Até | Status |
|--------|----------|-----|--------|
| Redis não configurado (OPS-001) | Rate limit multi-instância, cache compartilhado | Provisionamento infra | Decidido (D-M1-REDIS), aguardando execução |
| Booking acoplado (ARC-001) | NICHEKIT-001 | Execução Opção A | Decidido (D-M1-BOOKING), aguardando execução |
| Fase C em quarentena (BILL-001) | Loyalty + package automáticos | Auditoria e ativação | Decidido (D-M1-FASE_C), aguardando execução |

---

## 10. POST-GATE 10

| Verificação | Status |
|-------------|--------|
| Correções documentais | ✅ 6 itens na Onda 1 |
| ADRs necessárias | ✅ 3 decididas, 2 pendentes |
| Correções de código | ✅ 6 itens |
| Migrações futuras | ✅ 1 planejada |
| Testes faltantes | ✅ 5 itens |
| Validações de produção | ✅ 4 itens |
| Decisões humanas | ✅ 3 tomadas, 2 pendentes |
| Ondas sugeridas | ✅ 8 ondas |
| Débitos bloqueantes | ✅ 3 identificados |
| Nenhum arquivo operacional alterado | ✅ |
