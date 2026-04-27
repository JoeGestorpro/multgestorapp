import { useEffect, useState } from 'react'
import api from '../services/api'
import MasterLayout from '../components/master/MasterLayout'
import PageHeader from '../components/master/PageHeader'
import SectionCard from '../components/master/SectionCard'

const defaultSettings = {
  platform_name: '',
  sender_email: '',
  main_domain: '',
  token_expiration_hours: '24',
  maintenance_mode: 'false',
  support_whatsapp: '',
  support_email: ''
}

function Settings() {
  const [settings, setSettings] = useState(defaultSettings)
  const [auditLogs, setAuditLogs] = useState([])
  const [auditPagination, setAuditPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await api.get('/master/settings')
        setSettings({ ...defaultSettings, ...response.data.data })
      } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel carregar configuracoes')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
    loadAuditLogs(1)
  }, [])

  async function loadAuditLogs(page = 1) {
    setLogsLoading(true)

    try {
      const response = await api.get('/master/audit-logs', {
        params: {
          page,
          limit: 10
        }
      })
      setAuditLogs(response.data.data.items || [])
      setAuditPagination(response.data.data.pagination || { page: 1, totalPages: 1, total: 0 })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar logs de auditoria')
    } finally {
      setLogsLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setSettings((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.put('/master/settings', settings)
      setSettings({ ...defaultSettings, ...response.data.data })
      setSuccess('Configuracoes salvas com sucesso')
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel salvar configuracoes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MasterLayout title="Configuracoes">
      <PageHeader
        title="Configuracoes"
        description="Ajustes administrativos da plataforma e parametros operacionais."
      />

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <SectionCard title="Configuracoes administrativas">
        {loading ? (
          <p>Carregando configuracoes...</p>
        ) : (
          <form className="module-form master-form-grid" onSubmit={handleSubmit}>
            <label htmlFor="platform_name">Nome da plataforma</label>
            <input id="platform_name" name="platform_name" value={settings.platform_name} onChange={handleChange} />

            <label htmlFor="sender_email">Email remetente</label>
            <input id="sender_email" name="sender_email" type="email" value={settings.sender_email} onChange={handleChange} />

            <label htmlFor="main_domain">Dominio principal</label>
            <input id="main_domain" name="main_domain" value={settings.main_domain} onChange={handleChange} />

            <label htmlFor="token_expiration_hours">Expiracao do primeiro acesso (horas)</label>
            <input id="token_expiration_hours" name="token_expiration_hours" type="number" min="1" value={settings.token_expiration_hours} onChange={handleChange} />

            <label htmlFor="maintenance_mode">Modo manutencao</label>
            <select id="maintenance_mode" name="maintenance_mode" value={settings.maintenance_mode} onChange={handleChange}>
              <option value="false">Desativado</option>
              <option value="true">Ativado</option>
            </select>

            <label htmlFor="support_whatsapp">WhatsApp suporte</label>
            <input id="support_whatsapp" name="support_whatsapp" value={settings.support_whatsapp} onChange={handleChange} />

            <label htmlFor="support_email">Email suporte</label>
            <input id="support_email" name="support_email" type="email" value={settings.support_email} onChange={handleChange} />

            <div className="master-form-actions">
              <button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar configuracoes'}</button>
            </div>
          </form>
        )}
      </SectionCard>

      <SectionCard title="Logs de auditoria" meta={`${auditPagination.total} registros`}>
        {logsLoading ? (
          <p>Carregando logs...</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Acao</th>
                    <th>Ator</th>
                    <th>Entidade</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.action}</td>
                      <td>{log.actor_name || log.actor_email || log.actor_role || '-'}</td>
                      <td>{log.entity_type || '-'}</td>
                      <td>{log.created_at ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(log.created_at)) : '-'}</td>
                    </tr>
                  ))}

                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan="4">Nenhum log encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="master-pagination">
              <button type="button" disabled={auditPagination.page <= 1} onClick={() => loadAuditLogs(auditPagination.page - 1)}>Anterior</button>
              <span>Pagina {auditPagination.page} de {auditPagination.totalPages || 1}</span>
              <button type="button" disabled={auditPagination.page >= auditPagination.totalPages} onClick={() => loadAuditLogs(auditPagination.page + 1)}>Proxima</button>
            </div>
          </>
        )}
      </SectionCard>
    </MasterLayout>
  )
}

export default Settings
