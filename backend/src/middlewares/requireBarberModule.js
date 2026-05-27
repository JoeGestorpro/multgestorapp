'use strict';

const { createModuleGuard, invalidateModuleCache } = require('./createModuleGuard');

const requireBarberModule = createModuleGuard('barber', 'BarberGestor');

function invalidateBarberModuleCache(companyId) {
  return invalidateModuleCache(companyId, 'barber');
}

module.exports = requireBarberModule;
module.exports.invalidateBarberModuleCache = invalidateBarberModuleCache;
