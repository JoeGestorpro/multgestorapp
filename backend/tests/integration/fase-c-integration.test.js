'use strict';

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { createUnitOfWork } = require('../../src/shared');

const TEST_DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';
const isTestDbAvailable = TEST_DB_URL.includes('localhost') || TEST_DB_URL.includes('127.0.0.1');

const describeIntegration = isTestDbAvailable ? describe : describe.skip;

const WalletService = require('../../src/services/wallet.service');
const PackageService = require('../../src/services/package.service');
const LoyaltyService = require('../../src/services/loyalty.service');
const AnamnesisService = require('../../src/services/anamnesis.service');
const { handleWalletTopup } = require('../../src/integrations/consumers/wallet-provisioning.consumer');
const { handleWalletTopupFailed } = require('../../src/integrations/consumers/wallet-topup-failed.consumer');

describeIntegration('Fase C — Integration', () => {
  let pool;
  let companyId;
  let customerId;
  let walletService;
  let packageService;
  let loyaltyService;
  let anamnesisService;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: TEST_DB_URL,
      max: 1,
    });

    walletService = new WalletService();
    packageService = new PackageService();
    loyaltyService = new LoyaltyService();
    anamnesisService = new AnamnesisService();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    companyId = uuidv4();
    customerId = uuidv4();
  });

  afterEach(async () => {
    if (!pool) return;
    const tables = [
      'wallet_transactions', 'company_wallets', 'topup_requests',
      'package_redemptions', 'customer_packages', 'service_packages',
      'loyalty_transactions', 'customer_loyalty', 'loyalty_programs',
      'anamnesis_responses', 'anamnesis_templates',
      'outbox_messages',
    ];
    for (const t of tables) {
      try { await pool.query(`DELETE FROM ${t}`); } catch { /* skip */ }
    }
  });

  // ── Wallet ──────────────────────────────────────────────

  describe('Wallet — Topup', () => {
    const gateway = 'abacatepay';
    const gatewayTransactionId = 'gwi-' + uuidv4();
    const topupRequestId = 'tp-' + uuidv4();

    it('handleWalletTopup credita wallet e atualiza topup_request', async () => {
      await pool.query(
        `INSERT INTO topup_requests (id, company_id, amount, gateway, status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [topupRequestId, companyId, 1000, gateway]
      );

      await handleWalletTopup({
        company_id: companyId,
        amount: 1000,
        gateway,
        gateway_transaction_id: gatewayTransactionId,
        topup_request_id: topupRequestId,
      }, { traceId: 'test', companyId, eventId: uuidv4() });

      const wallet = await pool.query(
        `SELECT balance FROM company_wallets WHERE company_id = $1`, [companyId]
      );
      expect(wallet.rowCount).toBe(1);
      expect(Number(wallet.rows[0].balance)).toBe(1000);

      const txn = await pool.query(
        `SELECT type, amount, balance_before, balance_after, gateway_transaction_id
         FROM wallet_transactions WHERE company_id = $1`,
        [companyId]
      );
      expect(txn.rowCount).toBe(1);
      expect(txn.rows[0].type).toBe('credit');
      expect(Number(txn.rows[0].amount)).toBe(1000);
      expect(txn.rows[0].gateway_transaction_id).toBe(gatewayTransactionId);

      const req = await pool.query(
        `SELECT status FROM topup_requests WHERE id = $1`, [topupRequestId]
      );
      expect(req.rows[0].status).toBe('completed');
    });

    it('handleWalletTopup é idempotente (gateway_transaction_id duplicado)', async () => {
      await pool.query(
        `INSERT INTO topup_requests (id, company_id, amount, gateway, status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [topupRequestId, companyId, 1000, gateway]
      );

      const payload = {
        company_id: companyId,
        amount: 1000,
        gateway,
        gateway_transaction_id: gatewayTransactionId,
        topup_request_id: topupRequestId,
      };
      const ctx = { traceId: 'test', companyId, eventId: uuidv4() };

      await handleWalletTopup(payload, ctx);
      await handleWalletTopup(payload, ctx);

      const wallet = await pool.query(
        `SELECT balance FROM company_wallets WHERE company_id = $1`, [companyId]
      );
      expect(Number(wallet.rows[0].balance)).toBe(1000);

      const txns = await pool.query(
        `SELECT COUNT(*) AS cnt FROM wallet_transactions WHERE company_id = $1`,
        [companyId]
      );
      expect(Number(txns.rows[0].cnt)).toBe(1);
    });

    it('handleWalletTopupFailed marca topup_request como failed', async () => {
      await pool.query(
        `INSERT INTO topup_requests (id, company_id, amount, gateway, status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [topupRequestId, companyId, 1000, gateway]
      );

      await handleWalletTopupFailed({
        company_id: companyId,
        topup_request_id: topupRequestId,
        gateway_transaction_id: gatewayTransactionId,
      }, { traceId: 'test', companyId, eventId: uuidv4() });

      const req = await pool.query(
        `SELECT status FROM topup_requests WHERE id = $1`, [topupRequestId]
      );
      expect(req.rows[0].status).toBe('failed');
    });
  });

  // ── Packages ────────────────────────────────────────────

  describe('Packages — Purchase + Redeem', () => {
    let packageId;
    let customerPackageId;

    beforeEach(async () => {
      const pkg = await pool.query(
        `INSERT INTO service_packages (company_id, name, total_credits, price, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id`,
        [companyId, 'Teste 5 créditos', 5, 10000]
      );
      packageId = pkg.rows[0].id;

      const cp = await pool.query(
        `INSERT INTO customer_packages (company_id, package_id, customer_id, credits_remaining, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING id`,
        [companyId, packageId, customerId, 5]
      );
      customerPackageId = cp.rows[0].id;
    });

    it('redeemCredit decrementa credits_remaining', async () => {
      const result = await packageService.redeemCredit(companyId, customerId, uuidv4(), {
        saleId: uuidv4(),
        redeemedBy: 'test',
      });

      expect(result.credits_remaining).toBe(4);

      const cp = await pool.query(
        `SELECT credits_remaining, credits_used, status
         FROM customer_packages WHERE id = $1`,
        [customerPackageId]
      );
      expect(Number(cp.rows[0].credits_remaining)).toBe(4);
      expect(Number(cp.rows[0].credits_used)).toBe(1);
      expect(cp.rows[0].status).toBe('active');
    });

    it('redeemCredit com FOR UPDATE evita race condition', async () => {
      const results = await Promise.allSettled([
        packageService.redeemCredit(companyId, customerId, uuidv4(), { saleId: uuidv4(), redeemedBy: 'race1' }),
        packageService.redeemCredit(companyId, customerId, uuidv4(), { saleId: uuidv4(), redeemedBy: 'race2' }),
        packageService.redeemCredit(companyId, customerId, uuidv4(), { saleId: uuidv4(), redeemedBy: 'race3' }),
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      expect(fulfilled.length).toBeGreaterThanOrEqual(1);
      expect(fulfilled.length).toBeLessThanOrEqual(3);

      const cp = await pool.query(
        `SELECT credits_remaining FROM customer_packages WHERE id = $1`,
        [customerPackageId]
      );
      expect(Number(cp.rows[0].credits_remaining)).toBe(5 - fulfilled.length);
    });

    it('exhausted quando credits_remaining chega a 0', async () => {
      for (let i = 0; i < 5; i++) {
        await packageService.redeemCredit(companyId, customerId, uuidv4(), {
          saleId: uuidv4(),
          redeemedBy: 'test',
        });
      }

      const cp = await pool.query(
        `SELECT credits_remaining, status FROM customer_packages WHERE id = $1`,
        [customerPackageId]
      );
      expect(Number(cp.rows[0].credits_remaining)).toBe(0);
      expect(cp.rows[0].status).toBe('exhausted');
    });
  });

  // ── Loyalty ─────────────────────────────────────────────

  describe('Loyalty — Earn + Redeem', () => {
    beforeEach(async () => {
      await pool.query(
        `INSERT INTO loyalty_programs (company_id, type, points_per_real, min_redeem_points, is_active)
         VALUES ($1, 'points', 10, 10, true)`,
        [companyId]
      );
    });

    it('earnPoints acumula pontos e registra transação', async () => {
      const result = await loyaltyService.earnPoints(companyId, customerId, {
        amount: 5000,
        referenceType: 'sale',
        referenceId: uuidv4(),
      });

      expect(result.points_earned).toBe(50000);
      expect(result.balance).toBe(50000);

      const cl = await pool.query(
        `SELECT points_balance, lifetime_points FROM customer_loyalty
         WHERE company_id = $1 AND customer_id = $2`,
        [companyId, customerId]
      );
      expect(Number(cl.rows[0].points_balance)).toBe(50000);
      expect(Number(cl.rows[0].lifetime_points)).toBe(50000);

      const txns = await pool.query(
        `SELECT type, points, balance_before, balance_after, reference_type, reference_id
         FROM loyalty_transactions WHERE company_id = $1 AND customer_id = $2`,
        [companyId, customerId]
      );
      expect(txns.rowCount).toBe(1);
      expect(txns.rows[0].type).toBe('earn');
      expect(Number(txns.rows[0].points)).toBe(50000);
    });

    it('earnPoints retorna 0 se programa inativo', async () => {
      await pool.query(
        `UPDATE loyalty_programs SET is_active = false WHERE company_id = $1`,
        [companyId]
      );

      const result = await loyaltyService.earnPoints(companyId, customerId, {
        amount: 5000,
        referenceType: 'sale',
        referenceId: uuidv4(),
      });

      expect(result.points_earned).toBe(0);
      expect(result.message).toBe('Programa de fidelidade inativo');
    });

    it('redeemPoints respeita min_redeem_points', async () => {
      await loyaltyService.earnPoints(companyId, customerId, {
        amount: 100,
        referenceType: 'sale',
        referenceId: uuidv4(),
      });

      await expect(
        loyaltyService.redeemPoints(companyId, customerId, 1000)
      ).rejects.toThrow('Mínimo para resgate é 10 pontos');
    });

    it('redeemPoints resgata e atualiza saldo', async () => {
      await loyaltyService.earnPoints(companyId, customerId, {
        amount: 5000,
        referenceType: 'sale',
        referenceId: uuidv4(),
      });

      const result = await loyaltyService.redeemPoints(companyId, customerId, 50, {
        description: 'Resgate de teste',
      });

      expect(result.points_redeemed).toBe(50);
      expect(result.balance).toBe(49950);

      const cl = await pool.query(
        `SELECT points_balance, lifetime_redeemed FROM customer_loyalty
         WHERE company_id = $1 AND customer_id = $2`,
        [companyId, customerId]
      );
      expect(Number(cl.rows[0].points_balance)).toBe(49950);
      expect(Number(cl.rows[0].lifetime_redeemed)).toBe(50);
    });
  });

  // ── Anamnese ────────────────────────────────────────────

  describe('Anamnese — Consent + Export + Delete', () => {
    let templateId;

    beforeEach(async () => {
      const tpl = await pool.query(
        `INSERT INTO anamnesis_templates (company_id, name, questions, is_active)
         VALUES ($1, $2, $3::jsonb, true)
         RETURNING id`,
        [companyId, 'Template LGPD Test', JSON.stringify([{ q: 'test?' }])]
      );
      templateId = tpl.rows[0].id;
    });

    it('upsertResponse grava consent e responses', async () => {
      const result = await anamnesisService.upsertResponse(companyId, customerId, {
        template_id: templateId,
        responses: { alergia: 'nenhuma' },
        consent_granted: true,
      });

      expect(result.responses.alergia).toBe('nenhuma');
      expect(result.consent_granted).toBe(true);
      expect(result.consent_granted_at).not.toBeNull();

      const saved = await pool.query(
        `SELECT responses, consent_granted, consent_granted_at
         FROM anamnesis_responses WHERE company_id = $1 AND customer_id = $2`,
        [companyId, customerId]
      );
      expect(saved.rows[0].consent_granted).toBe(true);
      expect(saved.rows[0].consent_granted_at).not.toBeNull();
    });

    it('exportData marca timestamps de exportação', async () => {
      await anamnesisService.upsertResponse(companyId, customerId, {
        template_id: templateId,
        responses: { alergia: 'nenhuma' },
        consent_granted: true,
      });

      const exported = await anamnesisService.exportData(companyId, customerId);
      expect(exported.exported_at).toBeDefined();
      expect(exported.responses.alergia).toBe('nenhuma');

      const saved = await pool.query(
        `SELECT lgpd_export_requested_at, lgpd_exported_at
         FROM anamnesis_responses WHERE company_id = $1 AND customer_id = $2`,
        [companyId, customerId]
      );
      expect(saved.rows[0].lgpd_export_requested_at).not.toBeNull();
      expect(saved.rows[0].lgpd_exported_at).not.toBeNull();
    });

    it('requestDelete anonimiza dados (LGPD)', async () => {
      await anamnesisService.upsertResponse(companyId, customerId, {
        template_id: templateId,
        responses: { alergia: 'amendoim', medicamentos: 'dorflex' },
        consent_granted: true,
      });

      await anamnesisService.requestDelete(companyId, customerId);

      const saved = await pool.query(
        `SELECT responses, consent_granted, lgpd_delete_requested_at
         FROM anamnesis_responses WHERE company_id = $1 AND customer_id = $2`,
        [companyId, customerId]
      );
      expect(saved.rows[0].responses).toEqual({});
      expect(saved.rows[0].consent_granted).toBe(false);
      expect(saved.rows[0].lgpd_delete_requested_at).not.toBeNull();
    });
  });
});
