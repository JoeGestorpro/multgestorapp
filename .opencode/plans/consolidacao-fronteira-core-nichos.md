# Fronteira Core x Nichos — MultGestor (pós-Gate 4)

**Data:** 2026-07-20 | **Gate 4:** Reconciliação aplicada

---

## 1. Reutilizável por segundo nicho

| Capacidade | Status | Limitação |
|-----------|--------|-----------|
| Multi-tenancy (RLS) | ✅ CONSOLIDADO_LOCALMENTE | Novas tabelas precisam RLS |
| Auth system | ✅ CONSOLIDADO_LOCALMENTE | Novo escopo necessário |
| Shared kernel | ✅ CONSOLIDADO_LOCALMENTE | — |
| Billing engine | ✅ CONSOLIDADO_LOCALMENTE | Genérico |
| Scheduling utils | ✅ CONSOLIDADO_LOCALMENTE | Puro, sem deps |
| Master admin | ✅ CONSOLIDADO_LOCALMENTE | — |
| CI/CD | ✅ CONSOLIDADO | — |
| Email infra | ✅ CONSOLIDADO_LOCALMENTE | Templates custom |

---

## 2. Precisa de extração

| Capacidade | O que falta | Esforço |
|-----------|-------------|---------|
| Wallet | Mover de /api/barber/ | Médio |
| Packages | Mover de /api/barber/ | Médio |
| Loyalty | Mover de /api/barber/ | Médio |
| Anamnesis | Mover de /api/barber/ | Baixo |
| CRM | Renomear tabelas barber_ | Alto |

---

## 3. BarberGestor-specific

- barber.service.js (3.831 linhas)
- 22 controllers, 127 routes
- Barber Dashboard UI
- appointments VIEW (barber_appointments)

---

## 4. Acoplamento no Core

| Caso | Arquivo | Problema |
|------|---------|---------|
| VIEW | client-booking.sql:180 | appointments = barber_appointments |
| Module gate | client.routes.js:11 | requireBarberModule hardcoded |
| ✅ Billing consumer | billing-provisioning | Genérico (resolvido) |

---

## 5. Prontidão para nicho

| Requisito | Status |
|-----------|--------|
| Multi-tenancy | ✅ |
| Auth | ✅ |
| Shared kernel | ✅ |
| Billing | ✅ |
| Master admin | ✅ |
| Scheduling utils | ✅ |
| CI/CD | ✅ |
| Booking completo | ❌ VIEW depende de barber |
| Wallet/Pkg/Loyalty | ❌ Não extraído |
| Nicho tables | ❌ A criar |
| Nicho services | ❌ A criar |
| Nicho frontend | ❌ A criar |
