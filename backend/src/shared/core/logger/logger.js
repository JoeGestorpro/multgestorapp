'use strict';

const pino = require('pino');

const isDev   = process.env.NODE_ENV !== 'production';
const isTest  = process.env.NODE_ENV === 'test' || process.env.LOG_LEVEL === 'silent';

const logger = pino({
  level: isTest ? 'silent' : (process.env.LOG_LEVEL || (isDev ? 'debug' : 'info')),
  base: { service: 'multgestor-backend' },
  ...(isDev && !isTest ? {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:dd/mm/yyyy HH:MM:ss',
        ignore: 'pid,hostname,service',
        messageFormat: '[{requestId}] {msg}',
      },
    },
  } : {
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
});

module.exports = logger;
