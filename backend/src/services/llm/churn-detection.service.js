// Churn detection (Fase 1 — IA Operacional).
// Identifica clientes sem agendamento concluído há 30+ dias (rule-based,
// sempre disponível) e pede à LLM (mode: READ_ONLY) uma sugestão curta de
// mensagem de recuperação. Resultado cacheado por 24h em ai_suggestions.

const pool = require('../../config/database')
const { appLogger } = require('../../shared/core/logger')
const { ensureCompany } = require('../../shared')
const { eventBus } = require('../../shared/core/events/event-bus')
const { AiSuggestionGenerated } = require('../../shared/core/events/contracts')
const { llmService } = require('./LlmService')

const logger = appLogger.child({ module: 'churn-detection.service' })

const CHURN_THRESHOLD_DAYS = 30
const MAX_CANDIDATES = 20
const MAX_IN_PROMPT = 8

function riskTier(daysSince) {
  if (daysSince >= 60) return 'alto'
  if (daysSince >= 45) return 'medio'
  return 'baixo'
}

async function fetchAtRiskCustomers(companyId) {
  const result = await pool.query(
    `SELECT customer_name, customer_phone, MAX(starts_at) AS last_visit, COUNT(*) AS total_visits
     FROM barber_appointments
     WHERE company_id = $1
       AND status = 'completed'
       AND starts_at IS NOT NULL
     GROUP BY customer_name, customer_phone
     HAVING MAX(starts_at) < NOW() - INTERVAL '30 days'
     ORDER BY MAX(starts_at) ASC
     LIMIT ${MAX_CANDIDATES}`,
    [companyId]
  )
  return result.rows
}

function buildClientSummaries(rows) {
  const now = Date.now()
  return rows.map((row) => {
    const daysSince = Math.floor((now - new Date(row.last_visit).getTime()) / 86_400_000)
    return {
      name: row.customer_name,
      phone: row.customer_phone,
      daysSince,
      totalVisits: Number(row.total_visits),
      risk: riskTier(daysSince)
    }
  })
}

function summarizeByRisk(clients) {
  return clients.reduce(
    (acc, c) => {
      acc[c.risk] += 1
      return acc
    },
    { alto: 0, medio: 0, baixo: 0 }
  )
}

function buildFallbackDescription(clients, byRisk) {
  return `${clients.length} cliente(s) sem visita há ${CHURN_THRESHOLD_DAYS}+ dias ` +
    `(${byRisk.alto} risco alto, ${byRisk.medio} médio, ${byRisk.baixo} baixo). ` +
    'Considere enviar uma mensagem de reengajamento para os de risco alto primeiro.'
}

function buildTask(clients) {
  const sample = clients.slice(0, MAX_IN_PROMPT)
    .map((c) => `${c.name} (${c.daysSince} dias sem visita, risco ${c.risk})`)
    .join('; ')

  return `Analise estes clientes de uma barbearia que não visitam há ${CHURN_THRESHOLD_DAYS}+ dias: ${sample}. ` +
    'Responda em português, em no máximo 3 linhas, com uma sugestão curta e prática de mensagem de recuperação ' +
    'que o dono da barbearia possa adaptar e enviar por WhatsApp.'
}

function usedRealLlm(response) {
  return response.provider !== 'mock' && !response.metadata?.blockedByConfig && !response.metadata?.fallback
}

/**
 * Gera (ou atualiza) o alerta de churn da empresa. Retorna `null` sem gravar
 * nada quando não há clientes inativos há 30+ dias.
 */
async function generateChurnDetection(companyId) {
  ensureCompany(companyId)

  const rows = await fetchAtRiskCustomers(companyId)
  if (rows.length === 0) {
    logger.info({ companyId }, 'Nenhum cliente em risco de churn')
    return null
  }

  const clients = buildClientSummaries(rows)
  const byRisk = summarizeByRisk(clients)
  const task = buildTask(clients)
  const response = await llmService.complete({ mode: 'READ_ONLY', task, sessionId: `company:${companyId}` })

  const description = response.text && !response.metadata?.blocked
    ? response.text
    : buildFallbackDescription(clients, byRisk)
  const source = usedRealLlm(response) ? 'llm' : 'rule-based'
  const title = `${clients.length} cliente(s) em risco de churn`
  const data = { thresholdDays: CHURN_THRESHOLD_DAYS, byRisk, clients }

  const result = await pool.query(
    `INSERT INTO ai_suggestions (company_id, type, title, description, data, source, expires_at)
     VALUES ($1, 'churn_alert', $2, $3, $4, $5, NOW() + INTERVAL '24 hours')
     RETURNING *`,
    [companyId, title, description, JSON.stringify(data), source]
  )

  const suggestion = result.rows[0]

  eventBus.publish(AiSuggestionGenerated.event_name, {
    suggestion_id: suggestion.id,
    company_id: companyId,
    type: 'churn_alert',
    source
  }, { company_id: companyId, aggregate_type: 'ai_suggestion', aggregate_id: suggestion.id, source: 'churn-detection.service' })

  return suggestion
}

module.exports = { generateChurnDetection }
