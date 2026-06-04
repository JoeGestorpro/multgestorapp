'use strict';

let Sentry = null;
let _enabled = false;

function init() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
    });
    _enabled = true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Sentry] Falha ao inicializar:', err.message);
    _enabled = false;
  }
}

function captureException(err, context = {}) {
  if (!_enabled || !Sentry) return;
  if (context.requestId) {
    Sentry.withScope((scope) => {
      scope.setTag('requestId', context.requestId);
      Sentry.captureException(err);
    });
  } else {
    Sentry.captureException(err);
  }
}

function captureMessage(message, level = 'info') {
  if (!_enabled || !Sentry) return;
  Sentry.captureMessage(message, level);
}

function isEnabled() {
  return _enabled;
}

function setupExpressErrorHandler(app) {
  if (!_enabled || !Sentry || !app) return;
  try {
    Sentry.setupExpressErrorHandler(app);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Sentry] Falha ao configurar error handler do Express:', err.message);
  }
}

module.exports = {
  init,
  captureException,
  captureMessage,
  isEnabled,
  setupExpressErrorHandler,
};
