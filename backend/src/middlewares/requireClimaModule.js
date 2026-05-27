'use strict';

const { createModuleGuard, invalidateModuleCache } = require('./createModuleGuard');

const requireClimaModule = createModuleGuard('clima', 'ClimaGestor');

function invalidateClimaModuleCache(companyId) {
  return invalidateModuleCache(companyId, 'clima');
}

module.exports = requireClimaModule;
module.exports.invalidateClimaModuleCache = invalidateClimaModuleCache;
