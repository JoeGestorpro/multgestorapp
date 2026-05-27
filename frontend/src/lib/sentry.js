import * as SentryModule from '@sentry/react'

let _enabled = false

export function init() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  try {
    SentryModule.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      integrations: [SentryModule.browserTracingIntegration()],
      tracesSampleRate: 0,
    })
    _enabled = true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Sentry] Falha ao inicializar:', err.message)
    _enabled = false
  }
}

export function captureException(error, context = {}) {
  if (!_enabled) return
  if (context.tags) {
    SentryModule.withScope((scope) => {
      Object.entries(context.tags).forEach(([key, value]) => scope.setTag(key, value))
      SentryModule.captureException(error)
    })
  } else {
    SentryModule.captureException(error)
  }
}

export function isEnabled() {
  return _enabled
}
