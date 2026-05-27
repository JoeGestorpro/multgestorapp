'use strict';

describe('sentry.js — backend monitoring', () => {
  const ORIGINAL_ENV = process.env.SENTRY_DSN;

  afterEach(() => {
    process.env.SENTRY_DSN = ORIGINAL_ENV;
    jest.resetModules();
  });

  it('isEnabled() retorna false quando SENTRY_DSN nao esta definido', () => {
    delete process.env.SENTRY_DSN;
    jest.resetModules();
    const sentry = require('../../src/shared/core/monitoring/sentry');
    sentry.init();
    expect(sentry.isEnabled()).toBe(false);
  });

  it('captureException nao lanca quando Sentry esta desabilitado', () => {
    delete process.env.SENTRY_DSN;
    jest.resetModules();
    const sentry = require('../../src/shared/core/monitoring/sentry');
    sentry.init();
    expect(() => sentry.captureException(new Error('test'))).not.toThrow();
  });

  it('captureMessage nao lanca quando Sentry esta desabilitado', () => {
    delete process.env.SENTRY_DSN;
    jest.resetModules();
    const sentry = require('../../src/shared/core/monitoring/sentry');
    sentry.init();
    expect(() => sentry.captureMessage('hello')).not.toThrow();
  });

  it('isEnabled() retorna true quando SENTRY_DSN esta definido', () => {
    process.env.SENTRY_DSN = 'https://fake@example.com/1';
    jest.resetModules();

    // Mock @sentry/node para nao tentar conectar na rede
    jest.doMock('@sentry/node', () => ({
      init: jest.fn(),
      captureException: jest.fn(),
      captureMessage: jest.fn(),
      withScope: jest.fn((cb) => cb({ setTag: jest.fn() })),
      setupExpressErrorHandler: jest.fn(),
    }));

    const sentry = require('../../src/shared/core/monitoring/sentry');
    sentry.init();
    expect(sentry.isEnabled()).toBe(true);
  });
});
