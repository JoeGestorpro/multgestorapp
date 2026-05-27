'use strict';

const pool = require('../config/database');
const { asyncHandler } = require('../shared');
const { appLogger } = require('../shared/core/logger');
const cacheManager = require('../shared/core/cache/cache-manager');

const MODULE_CACHE_TTL = 5 * 60_000; // 5 min

async function invalidateModuleCache(companyId, moduleSlug) {
  if (companyId && moduleSlug) {
    await cacheManager.del(`mg:module:${companyId}:${moduleSlug}`);
  } else if (companyId) {
    await cacheManager.delByPrefix(`mg:module:${companyId}:`);
  } else {
    await cacheManager.delByPrefix('mg:module:');
  }
}

/**
 * Factory que cria o middleware de guarda para qualquer modulo.
 * @param {string} moduleSlug - slug do modulo (ex: 'barber', 'clima')
 * @param {string} [displayName] - nome legivel para mensagens de erro
 */
function createModuleGuard(moduleSlug, displayName) {
  const name = displayName || moduleSlug;

  const middleware = asyncHandler(async (req, res, next) => {
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'Usuario sem empresa vinculada'
      });
    }

    const cacheKey = `mg:module:${companyId}:${moduleSlug}`;
    const cached = await cacheManager.get(cacheKey);

    if (cached !== null) {
      if (!cached) {
        return res.status(403).json({
          success: false,
          error: `Modulo ${name} nao liberado para esta empresa`
        });
      }
      return next();
    }

    const result = await pool.query(
      `SELECT modules.id
       FROM company_modules
       INNER JOIN modules ON modules.id = company_modules.module_id
       WHERE company_modules.company_id = $1
         AND company_modules.status = 'active'
         AND modules.slug = $2
         AND modules.is_active = true
       LIMIT 1`,
      [companyId, moduleSlug]
    );

    const allowed = result.rowCount > 0;
    await cacheManager.set(cacheKey, allowed, MODULE_CACHE_TTL);

    if (!allowed) {
      appLogger.warn({ companyId, moduleSlug }, `[ModuleGuard] Modulo ${name} nao liberado`);
      return res.status(403).json({
        success: false,
        error: `Modulo ${name} nao liberado para esta empresa`
      });
    }

    return next();
  });

  return middleware;
}

module.exports = { createModuleGuard, invalidateModuleCache };
