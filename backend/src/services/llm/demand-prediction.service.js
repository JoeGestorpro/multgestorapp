// Previsão de demanda (Fase 1 — IA Operacional).
// Agrega agendamentos dos últimos 60 dias por dia da semana/horário
// (rule-based, sempre disponível) e pede à LLM (mode: READ_ONLY) uma frase
// curta de leitura prática para o dono da barbearia. Resultado cacheado por
// 24h em ai_suggestions.

const pool = require('../../config/database')
const { appLogger } = require('../../shared/core/logger')
const { ensureCompany } = require('../../shared')
const { eventBus } = require('../../shared/core/events/event-bus')
const { AiSuggestionGenerated } = require('../../shared/core/events/contracts')
const { llmService } = require('./LlmService')

const logger = appLogger.child({ module: 'demand-prediction.service' })

// Cache de 24h: ver expires_at no INSERT abaixo.
const LOOKBACK_DAYS = 60
const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

async function fetchRecentAppointments(companyId) {
  const result = await pool.query(
    `SELECT starts_at
     FROM barber_appointments
     WHERE company_id = $1
       AND starts_at IS NOT NULL
       AND starts_at >= NOW() - INTERVAL '60 days'
       AND status IN ('completed', 'confirmed', 'scheduled')`,
    [companyId]
  )
  return result.rows
}

function aggregateByWeekdayAndHour(rows) {
  const weekdayCounts = new Array(7).fill(0)
  const hourCounts = new Array(24).fill(0)

  for (const row of rows) {
    const d = new Date(row.starts_at)
    weekdayCounts[d.getDay()] += 1
    hourCounts[d.getHours()] += 1
  }

  const busiestWeekdayIndex = weekdayCounts.indexOf(Math.max(...weekdayCounts))
  const busiestHour = hourCounts.indexOf(Math.max(...hourCounts))

  return {
    totalAppointments: rows.length,
    lookbackDays: LOOKBACK_DAYS,
    busiestWeekday: WEEKDAY_LABELS[busiestWeekdayIndex],
    busiestWeekdayCount: weekdayCounts[busiestWeekdayIndex],
    busiestHour: `${String(busiestHour).padStart(2, '0')}:00`,
    busiestHourCount: hourCounts[busiestHour],
    byWeekday: WEEKDAY_LABELS.map((label, i) => ({ label, count: weekdayCounts[i] }))
  }
}

function buildFallbackDescription(stats) {
  return `Nos últimos ${stats.lookbackDays} dias, ${stats.busiestWeekday} foi o dia mais movimentado ` +
    `(${stats.busiestWeekdayCount} agendamentos) e ${stats.busiestHour} o horário de pico ` +
    `(${stats.busiestHourCount} agendamentos). Reforce a equipe nesses momentos.`
}

function buildTask(stats) {
  return `Com base em ${stats.totalAppointments} agendamentos desta barbearia nos últimos ${stats.lookbackDays} dias, ` +
    `o dia mais movimentado é ${stats.busiestWeekday} (${stats.busiestWeekdayCount} agendamentos) e o horário de pico é ` +
    `${stats.busiestHour} (${stats.busiestHourCount} agendamentos). ` +
    'Responda em uma frase curta e prática (máximo 2 linhas) sobre como o dono da barbearia pode aproveitar essa tendência.'
}

function usedRealLlm(response) {
  return response.provider !== 'mock' && !response.metadata?.blockedByConfig && !response.metadata?.fallback
}

/**
 * Gera (ou atualiza) a sugestão de previsão de demanda da empresa. Retorna
 * `null` sem gravar nada quando não há dados suficientes (nenhum agendamento
 * nos últimos 60 dias) — evita poluir o painel com um card vazio.
 */
async function generateDemandPrediction(companyId) {
  ensureCompany(companyId)

  const rows = await fetchRecentAppointments(companyId)
  if (rows.length === 0) {
    logger.info({ companyId }, 'Sem agendamentos suficientes para previsao de demanda')
    return null
  }

  const stats = aggregateByWeekdayAndHour(rows)
  const task = buildTask(stats)
  const response = await llmService.complete({ mode: 'READ_ONLY', task, sessionId: `company:${companyId}` })

  const description = response.text && !response.metadata?.blocked
    ? response.text
    : buildFallbackDescription(stats)
  const source = usedRealLlm(response) ? 'llm' : 'rule-based'
  const title = `Pico de movimento: ${stats.busiestWeekday} às ${stats.busiestHour}`

  const result = await pool.query(
    `INSERT INTO ai_suggestions (company_id, type, title, description, data, source, expires_at)
     VALUES ($1, 'demand_prediction', $2, $3, $4, $5, NOW() + INTERVAL '24 hours')
     RETURNING *`,
    [companyId, title, description, JSON.stringify(stats), source]
  )

  const suggestion = result.rows[0]

  eventBus.publish(AiSuggestionGenerated.event_name, {
    suggestion_id: suggestion.id,
    company_id: companyId,
    type: 'demand_prediction',
    source
  }, { company_id: companyId, aggregate_type: 'ai_suggestion', aggregate_id: suggestion.id, source: 'demand-prediction.service' })

  return suggestion
}

module.exports = { generateDemandPrediction }
