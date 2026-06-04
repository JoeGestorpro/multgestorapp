const pool = require('../config/database')
const { ValidationError } = require('../shared/core/errors')
const { createUnitOfWork } = require('../shared')

class AnamnesisService {
  async listTemplates(companyId) {
    const result = await pool.query(
      `SELECT id, company_id, name, description, questions, is_active, created_at, updated_at
       FROM anamnesis_templates
       WHERE company_id = $1 AND is_deleted = false
       ORDER BY created_at DESC`,
      [companyId]
    )
    return result.rows
  }

  async createTemplate(companyId, data) {
    const { name, description, questions } = data
    if (!name || !String(name).trim()) throw new ValidationError('Nome do template é obrigatório')
    if (!Array.isArray(questions)) throw new ValidationError('questions deve ser um array')

    const result = await pool.query(
      `INSERT INTO anamnesis_templates (company_id, name, description, questions)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING *`,
      [companyId, name.trim(), description || null, JSON.stringify(questions)]
    )
    return result.rows[0]
  }

  async updateTemplate(companyId, id, data) {
    const { name, description, questions, is_active } = data
    const result = await pool.query(
      `UPDATE anamnesis_templates
        SET name = COALESCE($3, name),
            description = COALESCE($4, description),
            questions = CASE WHEN $5::jsonb IS NOT NULL THEN $5::jsonb ELSE questions END,
            is_active = COALESCE($6, is_active),
            updated_at = NOW()
       WHERE id = $1 AND company_id = $2 AND is_deleted = false
       RETURNING *`,
      [id, companyId, name, description, questions ? JSON.stringify(questions) : null, is_active]
    )
    if (result.rowCount === 0) throw new ValidationError('Template não encontrado')
    return result.rows[0]
  }

  async deleteTemplate(companyId, id) {
    const result = await pool.query(
      `UPDATE anamnesis_templates SET is_deleted = true, updated_at = NOW()
       WHERE id = $1 AND company_id = $2
       RETURNING id`,
      [id, companyId]
    )
    if (result.rowCount === 0) throw new ValidationError('Template não encontrado')
  }

  async getResponse(companyId, customerId) {
    const result = await pool.query(
      `SELECT ar.id, ar.company_id, ar.customer_id, ar.template_id,
              at.name AS template_name, ar.responses,
              ar.consent_granted, ar.consent_granted_at, ar.created_at, ar.updated_at
       FROM anamnesis_responses ar
       LEFT JOIN anamnesis_templates at ON at.id = ar.template_id
       WHERE ar.company_id = $1 AND ar.customer_id = $2`,
      [companyId, customerId]
    )
    return result.rows[0] || null
  }

  async upsertResponse(companyId, customerId, data) {
    const { template_id, responses, consent_granted, consent_ip } = data
    if (!responses || typeof responses !== 'object') throw new ValidationError('responses deve ser um objeto')

    const uow = createUnitOfWork()
    try {
      await uow.begin()

      const result = await uow.client.query(
        `INSERT INTO anamnesis_responses
           (company_id, customer_id, template_id, responses, consent_granted, consent_granted_at, consent_ip)
         VALUES ($1, $2, $3, $4::jsonb, $5, CASE WHEN $5 THEN NOW() ELSE NULL END, CASE WHEN $5 THEN $6 ELSE NULL END)
         ON CONFLICT (company_id, customer_id) DO UPDATE
           SET template_id = COALESCE(EXCLUDED.template_id, anamnesis_responses.template_id),
               responses = EXCLUDED.responses,
               consent_granted = EXCLUDED.consent_granted,
               consent_granted_at = CASE WHEN EXCLUDED.consent_granted AND anamnesis_responses.consent_granted_at IS NULL
                 THEN NOW() ELSE anamnesis_responses.consent_granted_at END,
               consent_ip = CASE WHEN EXCLUDED.consent_granted THEN EXCLUDED.consent_ip ELSE NULL END,
               updated_at = NOW()
         RETURNING *`,
        [companyId, customerId, template_id || null, JSON.stringify(responses), consent_granted || false, consent_ip || null]
      )

      uow.addEvent('anamnesis.response.saved', {
        company_id: companyId,
        customer_id: customerId,
        consent_granted: result.rows[0].consent_granted
      }, { aggregateType: 'anamnesis', aggregateId: result.rows[0].id })

      await uow.commit()
      return result.rows[0]
    } catch (err) {
      await uow.rollback()
      throw err
    }
  }

  async exportData(companyId, customerId) {
    const response = await this.getResponse(companyId, customerId)
    if (!response) throw new ValidationError('Cliente não possui dados de anamnese')

    const uow = createUnitOfWork()
    try {
      await uow.begin()

      await uow.client.query(
        `UPDATE anamnesis_responses
         SET lgpd_export_requested_at = NOW(), lgpd_exported_at = NOW()
         WHERE company_id = $1 AND customer_id = $2`,
        [companyId, customerId]
      )

      uow.addEvent('anamnesis.data.exported', {
        company_id: companyId,
        customer_id: customerId
      }, { aggregateType: 'anamnesis', aggregateId: response.id })

      await uow.commit()

      return {
        exported_at: new Date().toISOString(),
        customer_id: customerId,
        company_id: companyId,
        template_name: response.template_name,
        responses: response.responses,
        consent_granted: response.consent_granted,
        consent_granted_at: response.consent_granted_at
      }
    } catch (err) {
      await uow.rollback()
      throw err
    }
  }

  async requestDelete(companyId, customerId) {
    const uow = createUnitOfWork()
    try {
      await uow.begin()

      const result = await uow.client.query(
        `SELECT id FROM anamnesis_responses WHERE company_id = $1 AND customer_id = $2`,
        [companyId, customerId]
      )
      if (result.rowCount === 0) throw new ValidationError('Cliente não possui dados de anamnese')

      await uow.client.query(
        `UPDATE anamnesis_responses
         SET lgpd_delete_requested_at = NOW(),
             responses = '{}'::jsonb,
             consent_granted = false,
             updated_at = NOW()
         WHERE company_id = $1 AND customer_id = $2`,
        [companyId, customerId]
      )

      uow.addEvent('anamnesis.data.deleted', {
        company_id: companyId,
        customer_id: customerId
      }, { aggregateType: 'anamnesis', aggregateId: result.rows[0].id })

      await uow.commit()
      return { message: 'Dados de anamnese anonimizados conforme solicitação LGPD' }
    } catch (err) {
      await uow.rollback()
      throw err
    }
  }
}

module.exports = AnamnesisService
