require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Resend } = require('resend');

const pool = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const bookingAuthRoutes = require('./routes/booking-auth.routes');
const barberRoutes = require('./routes/barber.routes');
const masterRoutes = require('./routes/master.routes');
const clientRoutes = require('./routes/client.routes');
const publicAuthRoutes = require('./routes/public-auth.routes');
const publicBookingRoutes = require('./routes/public-booking.routes');
const webhooksRoutes = require('./routes/webhooks.routes');
const { getAppBaseUrl } = require('./services/email/email.service');

const app = express();
const PORT = 5000;
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
    console.warn('[config] APP_BASE_URL nao configurada. Links de email nao serao gerados corretamente.');
  }

  if (!apiUrl) {
    console.warn('[config] BACKEND_URL nao configurada.');
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

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend rodando',
    time: new Date()
  });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      success: true,
      db_time: result.rows[0]
    });
  } catch (err) {
    console.error('Erro no banco:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get('/api/test-email', async (req, res) => {
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
    console.error('[ERRO EMAIL]', {
      statusCode: diagnostic.statusCode,
      diagnostic: diagnostic.diagnostic,
      message: diagnostic.message
    });

    return res.status(diagnostic.statusCode >= 400 ? diagnostic.statusCode : 500).json({
      success: false,
      error: diagnostic.message,
      diagnostic: diagnostic.diagnostic
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/booking-auth', bookingAuthRoutes);
app.use('/api/booking-customer', bookingAuthRoutes);
app.use('/api', publicAuthRoutes);
app.use('/api/public', publicBookingRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/barber', barberRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota nao encontrada'
  });
});

app.use((err, req, res, next) => {
  console.error('Erro interno:', err);

  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

app.listen(PORT, () => {
  validateRuntimeUrls();
  if (typeof pool.getDatabaseTargetSummary === 'function') {
    const target = pool.getDatabaseTargetSummary();
    console.log(`[database] alvo do backend: ${target.label}`);
  }
  try {
    console.log(`[config] APP_BASE_URL em uso: ${getAppBaseUrl()}`);
  } catch (error) {
    console.warn('[config] Falha ao resolver APP_BASE_URL:', error.message);
  }
  console.log(`Servidor rodando na porta ${PORT}`);
});
