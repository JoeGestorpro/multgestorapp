const pool = require('../../config/database')
const { appLogger } = require('../../shared/core/logger')

class IntegrationConfig {
  constructor() {
    this.logger = appLogger.child({ module: 'IntegrationConfig' })
  }

  async getRawConfig(companyId, channel) {
    try {
      const result = await pool.query(
        `SELECT * FROM integration_configs
         WHERE company_id = $1 AND channel = $2`,
        [companyId, channel]
      )

      if (result.rows.length === 0) {
        return null
      }

      return result.rows[0]
    } catch (error) {
      this.logger.error({
        companyId,
        channel,
        error: error.message
      }, 'Failed to get raw integration config')
      return null
    }
  }

  async getConfig(companyId, channel) {
    try {
      const result = await pool.query(
        `SELECT * FROM integration_configs
         WHERE company_id = $1 AND channel = $2 AND integration_enabled = true`,
        [companyId, channel]
      )

      if (result.rows.length === 0) {
        return null
      }

      return this._sanitizeConfig(result.rows[0])
    } catch (error) {
      this.logger.error({
        companyId,
        channel,
        error: error.message
      }, 'Failed to get integration config')
      return null
    }
  }

  async getCompanyConfigs(companyId) {
    try {
      const result = await pool.query(
        `SELECT * FROM integration_configs
         WHERE company_id = $1
         ORDER BY channel ASC`,
        [companyId]
      )

      return result.rows.map(row => this._sanitizeConfig(row))
    } catch (error) {
      this.logger.error({
        companyId,
        error: error.message
      }, 'Failed to get company integration configs')
      return []
    }
  }

  async upsertConfig(companyId, channel, config) {
    try {
      const result = await pool.query(
        `INSERT INTO integration_configs
           (company_id, channel, provider_type, api_url, phone_number_id,
            business_account_id, token_encrypted, integration_enabled, config_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (company_id, channel)
         DO UPDATE SET
           provider_type = EXCLUDED.provider_type,
           api_url = EXCLUDED.api_url,
           phone_number_id = EXCLUDED.phone_number_id,
           business_account_id = EXCLUDED.business_account_id,
           token_encrypted = EXCLUDED.token_encrypted,
           integration_enabled = EXCLUDED.integration_enabled,
           config_json = EXCLUDED.config_json,
           updated_at = NOW()
         RETURNING *`,
        [
          companyId,
          channel,
          config.providerType || 'mock',
          config.apiUrl || null,
          config.phoneNumberId || null,
          config.businessAccountId || null,
          config.tokenEncrypted || null,
          config.integrationEnabled !== false,
          config.configJson ? JSON.stringify(config.configJson) : null
        ]
      )

      this.logger.info({ companyId, channel }, 'Integration config upserted')
      return this._sanitizeConfig(result.rows[0])
    } catch (error) {
      this.logger.error({
        companyId,
        channel,
        error: error.message
      }, 'Failed to upsert integration config')
      throw error
    }
  }

  async deleteConfig(companyId, channel) {
    try {
      await pool.query(
        `DELETE FROM integration_configs
         WHERE company_id = $1 AND channel = $2`,
        [companyId, channel]
      )

      this.logger.info({ companyId, channel }, 'Integration config deleted')
      return true
    } catch (error) {
      this.logger.error({
        companyId,
        channel,
        error: error.message
      }, 'Failed to delete integration config')
      return false
    }
  }

  _sanitizeConfig(config) {
    if (!config) return null

    return {
      id: config.id,
      companyId: config.company_id,
      channel: config.channel,
      providerType: config.provider_type,
      apiUrl: config.api_url ? '***configured***' : null,
      phoneNumberId: config.phone_number_id,
      businessAccountId: config.business_account_id ? '***configured***' : null,
      tokenConfigured: !!config.token_encrypted,
      integrationEnabled: config.integration_enabled,
      configJson: config.config_json,
      createdAt: config.created_at,
      updatedAt: config.updated_at
    }
  }
}

module.exports = new IntegrationConfig()
