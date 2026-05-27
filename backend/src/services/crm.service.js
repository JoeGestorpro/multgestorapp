const CRMRepository = require('../repositories/crm.repository')
const { ValidationError, NotFoundError, ForbiddenError } = require('../shared')

function ensureCompany(companyId) {
  if (!companyId) {
    throw new ForbiddenError('Usuario sem empresa vinculada')
  }
}

function ensureAdmin(user, message) {
  if (!['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)) {
    throw new ForbiddenError(message || 'Apenas admin pode acessar CRM')
  }
}

class CRMService {
  constructor(repository) {
    this.repository = repository
  }

  async getCustomer(companyId, customerId) {
    ensureCompany(companyId)

    const customer = await this.repository.getCustomer(companyId, customerId)

    if (!customer) {
      throw new NotFoundError('Cliente')
    }

    return customer
  }

  async updateCustomerStatus(companyId, customerId, data = {}) {
    ensureCompany(companyId)

    const status = String(data.status || '').trim().toLowerCase()

    if (!['pending', 'active', 'blocked'].includes(status)) {
      throw new ValidationError('Status invalido. Use pending, active ou blocked')
    }

    const result = await this.repository.updateCustomerStatus(companyId, customerId, status)

    if (!result) {
      throw new NotFoundError('Cliente')
    }

    return {
      ...result,
      origin: result.source || 'agendamento_online'
    }
  }

  async getCustomerNotes(companyId, customerId) {
    ensureCompany(companyId)
    return this.repository.getCustomerNotes(companyId, customerId)
  }

  async createCustomerNote(companyId, customerId, userId, data) {
    ensureCompany(companyId)

    const note = String(data.note || '').trim()

    if (!note) {
      throw new ValidationError('Nota e obrigatoria')
    }

    return this.repository.createCustomerNote(companyId, customerId, userId, note)
  }

  async getCustomerHistory(companyId, customerId) {
    ensureCompany(companyId)

    const customer = await this.repository.getCustomer(companyId, customerId)

    if (!customer) {
      throw new NotFoundError('Cliente')
    }

    const appointments = await this.repository.getCustomerAppointments(companyId, customerId)
    const notes = await this.repository.getCustomerNotes(companyId, customerId)

    return {
      customer,
      appointments,
      notes
    }
  }

  async getCrmSummary(companyId, query = {}) {
    ensureCompany(companyId)

    const period = query.period || 'month'
    const now = new Date()
    let dateFrom, dateTo

    if (period === 'month') {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
    } else if (period === 'last_month') {
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      dateTo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    } else if (period === 'year') {
      dateFrom = new Date(now.getFullYear(), 0, 1).toISOString()
      dateTo = new Date(now.getFullYear() + 1, 0, 1).toISOString()
    } else {
      dateFrom = null
      dateTo = null
    }

    const stats = await this.repository.getCrmSummary(companyId, dateFrom, dateTo)

    return {
      total_clientes: Number(stats.total_clientes) || 0,
      clientes_ativos: Number(stats.clientes_ativos) || 0,
      clientes_pendentes: Number(stats.clientes_pendentes) || 0,
      clientes_bloqueados: Number(stats.clientes_bloqueados) || 0,
      clientes_novos_mes: Number(stats.clientes_novos_mes) || 0,
      clientes_inativos: Number(stats.clientes_inativos) || 0,
      clientes_vip: Number(stats.clientes_vip) || 0,
      clientes_fieis: Number(stats.clientes_fieis) || 0,
      taxa_retorno: Number(stats.taxa_retorno) || 0,
      atendimentos_no_mes: Number(stats.atendimentos_no_mes) || 0,
      receita_no_mes: String(stats.receita_no_mes || '0'),
      ticket_medio: String(stats.ticket_medio || '0')
    }
  }

  async getAgendaCrm(companyId, query = {}) {
    ensureCompany(companyId)

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const data = await this.repository.getAgendaCrm(companyId, thirtyDaysAgo)

    return {
      upcoming: data.upcoming || [],
      cancellations: data.cancellations || [],
      no_shows: data.no_shows || []
    }
  }
}

module.exports = CRMService
