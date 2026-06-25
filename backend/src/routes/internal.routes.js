'use strict';

const express = require('express');
const pool = require('../config/database');
const { poolTenant } = require('../config/database');
const { requireMasterAdminAuth } = require('../middlewares/auth.middleware');
const { appLogger } = require('../shared/core/logger');

const router = express.Router();

router.use(requireMasterAdminAuth);

router.get('/security/runtime-check', async (req, res) => {
  try {
    const tenantClient = await poolTenant.connect();
    let tenantDiag;
    try {
      const result = await tenantClient.query(
        `SELECT current_user AS "currentUser",
                (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS "bypassRls"`
      );
      tenantDiag = result.rows[0];
    } finally {
      tenantClient.release();
    }

    const mainClient = await pool.connect();
    let mainDiag;
    try {
      const result = await mainClient.query(
        `SELECT current_user AS "currentUser",
                (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS "bypassRls"`
      );
      mainDiag = result.rows[0];
    } finally {
      mainClient.release();
    }

    const appRuntimeConfigured = !!process.env.APP_RUNTIME_URL;
    const databaseUrl = (process.env.DATABASE_URL || '');
    const dbName = databaseUrl.includes('supabase') ? 'supabase' : 'local';

    const rawConnStr = String(process.env.DATABASE_URL || '');
    const parsed = rawConnStr ? new URL(rawConnStr) : null;
    const database = parsed ? parsed.pathname.replace(/^\/+/, '') : 'unknown';

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        tenantPool: {
          currentUser: tenantDiag.currentUser,
          bypassRls: tenantDiag.bypassRls,
          usingAppRuntimeUrl: appRuntimeConfigured,
        },
        mainPool: {
          currentUser: mainDiag.currentUser,
          bypassRls: mainDiag.bypassRls,
        },
        runtime: {
          appRuntimeUrlConfigured: appRuntimeConfigured,
          database: database,
          environment: dbName,
        },
        diagnostics: {
          appRuntimeUrl: appRuntimeConfigured ? '*** configurada ***' : 'não configurada',
          nodeEnv: process.env.NODE_ENV || 'development',
        },
      },
    });
  } catch (err) {
    appLogger.error({ err: err.message }, '[runtime-check] erro');
    res.status(500).json({
      success: false,
      error: 'Falha ao verificar runtime',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

module.exports = router;
