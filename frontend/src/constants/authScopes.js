// Hoje existem 3 auth_scope emitidos pelo backend (auth.controller.js):
// 'master' (painel master), 'barber_admin' (dono/admin/colaborador de
// QUALQUER empresa tenant, independente do módulo/nicho ativo — não existe
// um escopo por nicho hoje) e 'booking_customer' (cliente final da agenda
// pública). O nome 'barber_admin' é histórico: é o escopo genérico de
// qualquer empresa tenant, não exclusivo do BarberGestor.
export const AUTH_SCOPE_MASTER = 'master'
export const AUTH_SCOPE_TENANT_ADMIN = 'barber_admin'
export const AUTH_SCOPE_BOOKING_CUSTOMER = 'booking_customer'
