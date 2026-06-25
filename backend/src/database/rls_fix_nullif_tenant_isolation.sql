-- A-001 fix: substituir cast direto por NULLIF em todas as tenant_isolation policies
-- Motivação: current_setting('app.current_company_id', true) retorna '' quando o GUC
-- não está setado. Cast direto ''::uuid lança erro; NULLIF retorna NULL, a comparação
-- é falsa e a policy bloqueia silenciosamente (comportamento correto: 0 linhas visíveis).

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'anamnesis_responses', 'anamnesis_templates', 'barber_advances',
    'barber_appointments', 'barber_booking_blocks', 'barber_booking_landing',
    'barber_booking_settings', 'barber_cash_sessions', 'barber_client_events',
    'barber_client_notes', 'barber_client_tags', 'barber_collaborators',
    'barber_products', 'barber_sale_items', 'barber_sales', 'barber_services',
    'barber_settlements', 'barber_suppliers', 'barber_working_hours',
    'booking_customers', 'clima_appointments', 'clima_professionals',
    'clima_services', 'company_wallets', 'customer_loyalty', 'customer_packages',
    'deposit_configs', 'integration_configs', 'loyalty_programs',
    'loyalty_transactions', 'package_redemptions', 'service_packages',
    'topup_requests', 'wallet_transactions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      $fmt$
        DROP POLICY IF EXISTS tenant_isolation ON %I;
        CREATE POLICY tenant_isolation ON %I
          USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);
      $fmt$,
      tbl, tbl
    );
  END LOOP;
  RAISE NOTICE 'tenant_isolation policies atualizadas para NULLIF em % tabelas', array_length(tables, 1);
END $$;
