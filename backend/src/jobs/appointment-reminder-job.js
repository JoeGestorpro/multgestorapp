'use strict';

const pool = require('../config/database');
const { eventBus } = require('../shared/core/events');
const { appLogger } = require('../shared/core/logger');

const LEAD_HOURS = Number(process.env.REMINDER_LEAD_HOURS || 3);

async function runAppointmentReminderJob() {
  appLogger.info('[AppointmentReminderJob] Iniciando varredura');

  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT id, company_id, customer_name, customer_phone, starts_at
       FROM barber_appointments
       WHERE reminder_sent_at IS NULL
         AND customer_phone IS NOT NULL AND customer_phone <> ''
         AND status = 'confirmed'
         AND starts_at BETWEEN NOW() AND NOW() + make_interval(hours => $1)`,
      [LEAD_HOURS]
    );

    const appointments = result.rows;
    let sentCount = 0;

    for (const appt of appointments) {
      const updateResult = await client.query(
        `UPDATE barber_appointments SET reminder_sent_at = NOW() WHERE id = $1 AND reminder_sent_at IS NULL`,
        [appt.id]
      );

      if (updateResult.rowCount === 0) {
        continue;
      }

      try {
        eventBus.publish('appointment.reminder', {
          appointment_id: appt.id,
          company_id: appt.company_id,
          customer_name: appt.customer_name,
          customer_phone: appt.customer_phone,
          starts_at: appt.starts_at
        }, {
          company_id: appt.company_id,
          aggregate_type: 'appointment',
          aggregate_id: appt.id
        });
        sentCount++;
        appLogger.info({ appointmentId: appt.id, companyId: appt.company_id }, '[AppointmentReminderJob] Lembrete emitido');
      } catch (err) {
        appLogger.error({ err, appointmentId: appt.id }, '[AppointmentReminderJob] Erro ao emitir lembrete');
      }
    }

    appLogger.info({ sentCount, total: appointments.length }, '[AppointmentReminderJob] Varredura concluida');
  } finally {
    client.release();
  }
}

module.exports = { runAppointmentReminderJob };
