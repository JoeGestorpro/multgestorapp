require('dotenv').config();

// Inicializar Sentry antes de qualquer outro require (se configurado)
const sentry = require('./shared/core/monitoring/sentry');
sentry.init();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const { Resend } = require('resend');

const pool = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const bookingAuthRoutes = require('./routes/booking-auth.routes');
const barberRoutes = require('./routes/barber.routes');
const climaRoutes = require('./routes/clima.routes');
const masterRoutes = require('./routes/master.routes');
const clientRoutes = require('./routes/client.routes');
const publicAuthRoutes = require('./routes/public-auth.routes');
const publicBookingRoutes = require('./routes/public-booking.routes');
const webhooksRoutes = require('./routes/webhooks.routes');
const { getAppBaseUrl } = require('./services/email/email.service');
const { appLogger } = require('./shared/core/logger');
const correlationId = require('./middlewares/correlation-id.middleware');
const requestLogger = require('./middlewares/request-logger.middleware');
const errorHandler = require('./middlewares/error-handler.middleware');
const { tenantContext, registerDefaultConsumers } = require('./shared');
const { IntegrationManager, resolveWhatsAppProvider, AppointmentIntegrationConsumer, WhatsAppWebhook } = require('./integrations');
const OutboxWorker = require('./shared/core/outbox/outbox-worker');
const redisClient = require('./shared/core/cache/redis-client');
const { runTrialEmailJob } = require('./jobs/trial-email-job');

registerDefaultConsumers();
appLogger.info('[EventBus] Default consumers registered');

// Handlers globais de processo — devem ser registrados cedo, antes de qualquer I/O.
process.on('unhandledRejection', (reason) => {
  appLogger.error({ err: reason }, '[process] unhandledRejection — Promise rejeitada sem handler');
});

process.on('uncaughtException', (err) => {
  appLogger.error({ err }, '[process] uncaughtException — encerrando processo');
  process.exit(1);
});

const integrationManager = new IntegrationManager();
const whatsappProvider = resolveWhatsAppProvider({
  providerType: process.env.WHATSAPP_PROVIDER || 'mock',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  companyId: null
});
integrationManager.registerProvider('whatsapp', whatsappProvider);

const appointmentIntegrationConsumer = new AppointmentIntegrationConsumer(integrationManager);
appointmentIntegrationConsumer.register();
appLogger.info('[Integration] Integration layer initialized');

const whatsappWebhook = new WhatsAppWebhook({
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || ''
});

const app = express();
const PORT = Number(process.env.PORT || 5000);
const resend = new Resend(process.env.RESEND_API_KEY);

function validateRuntimeUrls() {
  const appUrl = String(
    process.env.APP_BASE_URL ||
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    ''
  ).trim();
  const apiUrl = String(process.env.BACKEND_URL || process.env.API_URL || '').trim();

  if (!appUrl) {
    appLogger.warn('[config] APP_BASE_URL nao configurada. Links de email nao serao gerados corretamente.');
  }

  if (!apiUrl) {
    appLogger.warn('[config] BACKEND_URL nao configurada.');
  }
}

function getTestEmailTo(req) {
  if (process.env.NODE_ENV !== 'production' && req.query.to) {
    return String(req.query.to).trim();
  }

  const configuredTo = String(
    process.env.TEST_EMAIL_TO ||
    process.env.RESEND_TEST_EMAIL ||
    process.env.EMAIL_TEST_TO ||
    process.env.MASTER_ADMIN_EMAIL ||
    ''
  ).trim();

  if (configuredTo) {
    return configuredTo;
  }

  const from = String(process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || '').trim();
  const match = from.match(/<([^>]+)>/);

  return match ? match[1].trim() : from;
}

function getResendDiagnostic(error) {
  const message = error?.message || 'Falha ao enviar email via Resend';
  const statusCode = error?.statusCode || error?.status || 500;
  const normalizedMessage = message.toLowerCase();

  if (!process.env.RESEND_API_KEY) {
    return {
      statusCode: 500,
      diagnostic: 'RESEND_API_KEY nao carregada pelo dotenv',
      message: 'Variavel RESEND_API_KEY nao configurada'
    };
  }

  if (statusCode === 401 || normalizedMessage.includes('api key')) {
    return {
      statusCode: 401,
      diagnostic: 'Erro de autenticacao no Resend. Confira RESEND_API_KEY.',
      message
    };
  }

  if (
    normalizedMessage.includes('domain') ||
    normalizedMessage.includes('verify') ||
    normalizedMessage.includes('sender')
  ) {
    return {
      statusCode: 400,
      diagnostic: 'Dominio/remetente nao verificado ou remetente nao autorizado no Resend.',
      message
    };
  }

  return {
    statusCode,
    diagnostic: 'Falha retornada pelo Resend.',
    message
  };
}

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://barbergestor.com.br',
  'https://www.barbergestor.com.br',
  'https://www.multgestorapp.com.br',
  ...(process.env.APP_BASE_URL ? [process.env.APP_BASE_URL] : []),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    appLogger.warn({ origin }, '[CORS] Origem bloqueada');
    callback(new Error('CORS: origem nao permitida'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(cookieParser());
app.use(express.json({ limit: '3mb' }));
app.use(correlationId);
app.use(requestLogger);
app.use(tenantContext);
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend rodando',
    time: new Date(),
    integration: integrationManager.getHealth()
  });
});

app.get('/api/health/deep', async (req, res) => {
  const checks = {};
  let overallStatus = 'healthy';

  // Check: banco de dados
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    checks.database = { status: 'ok', latency_ms: Date.now() - start };
  } catch (err) {
    checks.database = { status: 'error', error: err.message };
    overallStatus = 'unhealthy';
  }

  // Check: redis
  try {
    if (redisClient.isAvailable()) {
      const t0 = Date.now();
      await redisClient.set('mg:health:ping', '1', 'PX', 5000);
      const val = await redisClient.get('mg:health:ping');
      checks.redis = { status: val === '1' ? 'ok' : 'degraded', latency_ms: Date.now() - t0 };
    } else {
      checks.redis = { status: 'degraded', message: 'Redis nao configurado — fallback in-memory ativo' };
    }
  } catch (err) {
    checks.redis = { status: 'unhealthy', error: err.message };
    overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
  }

  // Check: outbox worker
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS pending
       FROM outbox_messages
       WHERE status = 'pending'`
    );
    const pending = result.rows[0].pending;
    checks.outbox = {
      status: pending > 100 ? 'degraded' : 'ok',
      pending_messages: pending
    };
    if (pending > 100) overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
  } catch (err) {
    checks.outbox = { status: 'error', error: err.message };
  }

  // Check: email provider
  checks.email_provider = {
    status: 'ok',
    provider: process.env.EMAIL_PROVIDER || 'smtp'
  };

  // Check: whatsapp provider
  checks.whatsapp_provider = {
    status: 'ok',
    provider: process.env.WHATSAPP_PROVIDER || 'mock',
    is_mock: (process.env.WHATSAPP_PROVIDER || 'mock') === 'mock'
  };

  // Check: integrações
  try {
    checks.integrations = integrationManager.getHealth();
  } catch {
    checks.integrations = { status: 'unknown' };
  }

  return res.status(overallStatus === 'unhealthy' ? 503 : 200).json({
    success: overallStatus !== 'unhealthy',
    status: overallStatus,
    checks,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0'
  });
});

app.get('/api/test-email', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, error: 'Rota nao disponivel' });
  }

  const to = getTestEmailTo(req);

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'RESEND_API_KEY nao configurada'
    });
  }

  if (!to) {
    return res.status(400).json({
      success: false,
      error: 'Configure TEST_EMAIL_TO no .env para testar o envio pelo Resend'
    });
  }

  try {
    const response = await resend.emails.send({
      from: `${String(process.env.EMAIL_NAME || 'MultGestor').trim()} <${String(process.env.EMAIL_FROM || '').trim()}>`,
      to,
      subject: 'Teste MultGestor',
      html: '<h1>Email funcionando &#128640;</h1>'
    });

    if (response.error) {
      const error = new Error(response.error.message || 'Falha ao enviar email via Resend');
      error.statusCode = response.error.statusCode;
      error.name = response.error.name;
      throw error;
    }

    return res.json({
      success: true,
      response: response.data
    });
  } catch (error) {
    const diagnostic = getResendDiagnostic(error);
    req.log.error({ err: error, statusCode: diagnostic.statusCode, diagnostic: diagnostic.diagnostic }, '[ERRO EMAIL]');

    return res.status(diagnostic.statusCode >= 400 ? diagnostic.statusCode : 500).json({
      success: false,
      error: diagnostic.message,
      diagnostic: diagnostic.diagnostic
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/booking-auth', bookingAuthRoutes);
app.use('/api', publicAuthRoutes);
app.use('/api/public', publicBookingRoutes);
app.use('/api/webhooks', webhooksRoutes);

app.get('/api/webhooks/whatsapp', (req, res) => whatsappWebhook.handleVerification(req, res));
app.post('/api/webhooks/whatsapp', (req, res) => whatsappWebhook.handleIncoming(req, res));
app.use('/api/master', masterRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/barber', barberRoutes);
app.use('/api/clima', climaRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota nao encontrada'
  });
});

sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

const outboxWorker = new OutboxWorker(pool, {
  batchSize: Number(process.env.OUTBOX_BATCH_SIZE || 50),
  pollIntervalMs: Number(process.env.OUTBOX_POLL_INTERVAL_MS || 1000),
  onError(err) {
    appLogger.error({ err }, '[OutboxWorker] Erro no poll');
  }
});

outboxWorker.start();
appLogger.info('[OutboxWorker] Iniciado');

// Trial email job — rodar 1x por hora
const TRIAL_EMAIL_INTERVAL_MS = 60 * 60 * 1000; // 1 hora
setInterval(async () => {
  try {
    await runTrialEmailJob();
  } catch (err) {
    appLogger.error({ err }, '[TrialEmailJob] Erro no job');
  }
}, TRIAL_EMAIL_INTERVAL_MS).unref();
// Rodar uma vez no startup (apos 30s para nao competir com inicializacao)
setTimeout(() => {
  runTrialEmailJob().catch(err => appLogger.error({ err }, '[TrialEmailJob] Erro no startup'));
}, 30_000);
appLogger.info({ intervalMinutes: 60 }, '[TrialEmailJob] Agendado');

const server = app.listen(PORT, () => {
  validateRuntimeUrls();
  if (typeof pool.getDatabaseTargetSummary === 'function') {
    const target = pool.getDatabaseTargetSummary();
    appLogger.info({ target: target.label }, '[database] alvo do backend');
  }
  try {
    appLogger.info({ appBaseUrl: getAppBaseUrl() }, '[config] APP_BASE_URL em uso');
  } catch (error) {
    appLogger.warn({ err: error }, '[config] Falha ao resolver APP_BASE_URL');
  }
  appLogger.info({ port: PORT }, 'Servidor rodando');
});

function gracefulShutdown(signal) {
  appLogger.info({ signal }, '[shutdown] Sinal recebido — encerrando servidor');

  server.close(() => {
    appLogger.info('[shutdown] HTTP server fechado');

    outboxWorker.stop();
    appLogger.info('[shutdown] OutboxWorker parado');

    pool.end()
      .then(() => {
        appLogger.info('[shutdown] Pool do banco encerrado');
        process.exit(0);
      })
      .catch((err) => {
        appLogger.error({ err }, '[shutdown] Erro ao encerrar pool');
        process.exit(1);
      });
  });

  // Forca encerramento se o shutdown demorar mais de 10s
  setTimeout(() => {
    appLogger.warn('[shutdown] Timeout atingido — forcando saida');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
