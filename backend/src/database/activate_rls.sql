-- Migration: Ativar FORCE ROW LEVEL SECURITY nas tabelas tenant
-- Executar APOS validar que as policies existentes estao corretas
-- As policies foram criadas em rls_tenant_tables.sql (ENABLE ROW LEVEL SECURITY)
-- Este script ativa FORCE, que garante que a policy SEJA aplicada mesmo
-- que a tabela seja acessada pelo owner (superuser) ou por query sem SET LOCAL.

-- ============================================
-- BarberGestor
-- ============================================
ALTER TABLE barber_services FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_suppliers FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_products FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_collaborators FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_appointments FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_sales FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_sale_items FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_cash_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_advances FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_settlements FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_working_hours FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_booking_blocks FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_booking_landing FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_booking_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_client_notes FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_client_tags FORCE ROW LEVEL SECURITY;
ALTER TABLE barber_client_events FORCE ROW LEVEL SECURITY;

-- ============================================
-- ClimaGestor
-- ============================================
ALTER TABLE clima_professionals FORCE ROW LEVEL SECURITY;
ALTER TABLE clima_services FORCE ROW LEVEL SECURITY;
ALTER TABLE clima_appointments FORCE ROW LEVEL SECURITY;

-- ============================================
-- Booking
-- ============================================
ALTER TABLE booking_customers FORCE ROW LEVEL SECURITY;

-- ============================================
-- Integracoes
-- ============================================
ALTER TABLE integration_configs FORCE ROW LEVEL SECURITY;
