'use strict';

const hasAppRuntime = !!process.env.APP_RUNTIME_URL;
const describeRt = hasAppRuntime ? describe : describe.skip;

describeRt('GATE 0 — app_runtime role validation', () => {
  const { Pool } = require('pg');
  let adminPool, runtimePool;
  let companyAId, companyBId;

  beforeAll(async () => {
    adminPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
    runtimePool = new Pool({ connectionString: process.env.APP_RUNTIME_URL, max: 2 });
    companyAId = require('crypto').randomUUID();
    companyBId = require('crypto').randomUUID();

    await adminPool.query(
      `INSERT INTO companies (id, name, public_booking_slug)
       VALUES ($1, 'Gate0 A', 'gate0-a'), ($2, 'Gate0 B', 'gate0-b')
       ON CONFLICT (id) DO NOTHING`,
      [companyAId, companyBId]
    );
    await adminPool.query(
      `INSERT INTO barber_services (id, company_id, name, price, estimated_time_minutes)
       VALUES (gen_random_uuid(), $1, 'Gate0 Svc A', 50, 30),
              (gen_random_uuid(), $2, 'Gate0 Svc B', 60, 45)
       ON CONFLICT DO NOTHING`,
      [companyAId, companyBId]
    );
  });

  afterAll(async () => {
    try {
      await adminPool.query('DELETE FROM barber_services WHERE company_id IN ($1, $2)', [companyAId, companyBId]);
      await adminPool.query('DELETE FROM companies WHERE id IN ($1, $2)', [companyAId, companyBId]);
    } catch (_) {}
    await adminPool.end();
    await runtimePool.end();
  });

  it('01. app_runtime: current_user = app_runtime', async () => {
    const { rows } = await runtimePool.query('SELECT current_user');
    expect(rows[0].current_user).toBe('app_runtime');
  });

  it('02. app_runtime: rolbypassrls = false', async () => {
    const { rows } = await runtimePool.query(
      'SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user'
    );
    expect(rows[0].rolbypassrls).toBe(false);
  });

  it('03. app_runtime: sem GUC, SELECT retorna 0 linhas (RLS bloqueia)', async () => {
    const { rows } = await runtimePool.query('SELECT * FROM barber_services');
    expect(rows).toHaveLength(0);
  });

  it('04. app_runtime: com GUC correto, SELECT filtra por company_id', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const { rows } = await client.query('SELECT * FROM barber_services');
      expect(rows.every(r => r.company_id === companyAId)).toBe(true);

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('05. app_runtime: INSERT cross-tenant é bloqueado (WITH CHECK)', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      await expect(
        client.query(
          `INSERT INTO barber_services (id, company_id, name, price, estimated_time_minutes)
           VALUES (gen_random_uuid(), $1, 'Gate0 Cross', 50, 30)`,
          [companyBId]
        )
      ).rejects.toThrow();

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('06. app_runtime: INSERT no próprio tenant é permitido', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const result = await client.query(
        `INSERT INTO barber_services (id, company_id, name, price, estimated_time_minutes)
         VALUES (gen_random_uuid(), $1, 'Gate0 Own', 50, 30)`,
        [companyAId]
      );
      expect(result.rowCount).toBe(1);

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('07. postgres: BYPASSRLS, consegue ver todos os tenants', async () => {
    const { rows } = await adminPool.query('SELECT * FROM barber_services');
    const uniqueCompanies = new Set(rows.map(r => r.company_id));
    expect(uniqueCompanies.has(companyAId)).toBe(true);
    expect(uniqueCompanies.has(companyBId)).toBe(true);
  });

  it('08. requireCompany + poolTenant: GUC setado no BEGIN', async () => {
    const pool = require('../../src/config/database');
    const { runWithTenantClient } = pool;

    await runWithTenantClient(null, companyAId, async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query(
          "SELECT current_setting('app.current_company_id', true) AS guc"
        );
        expect(rows[0].guc).toBe(String(companyAId));
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    });
  });

  it('09. ALS: contexto não vaza entre requests', async () => {
    const pool = require('../../src/config/database');
    const { runWithTenantClient } = pool;

    const results = await Promise.all([
      runWithTenantClient(null, companyAId, async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const { rows } = await client.query(
            "SELECT current_setting('app.current_company_id', true) AS guc"
          );
          await new Promise(r => setTimeout(r, 50));
          return rows[0].guc;
        } finally {
          await client.query('ROLLBACK');
          client.release();
        }
      }),
      runWithTenantClient(null, companyBId, async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const { rows } = await client.query(
            "SELECT current_setting('app.current_company_id', true) AS guc"
          );
          return rows[0].guc;
        } finally {
          await client.query('ROLLBACK');
          client.release();
        }
      }),
    ]);

    expect(results).toContain(String(companyAId));
    expect(results).toContain(String(companyBId));
  });
});
