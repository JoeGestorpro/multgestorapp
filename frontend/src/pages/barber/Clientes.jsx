import { useEffect, useState } from 'react'
import api from '../../services/api'
import { CustomerSidePanel } from '../../components/premium'

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function statusLabel(status) {
  return {
    pending: 'Pendente',
    active: 'Ativo',
    blocked: 'Bloqueado'
  }[status] || status
}

const estiloAvatar = {
  width: 40, height: 40, borderRadius: '50%',
  background: 'var(--barber-panel-soft)',
  border: '1px solid var(--barber-border)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 600, fontSize: 14, color: 'var(--barber-text)',
  cursor: 'pointer', flexShrink: 0
}

function ClientesBarber() {
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filters, setFilters] = useState({ search: '', status: 'all' })
  const [result, setResult] = useState({ total: 0, items: [] })
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  async function loadCustomers(currentFilters = filters) {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/barber/customers', {
        params: {
          search: currentFilters.search || undefined,
          status: currentFilters.status !== 'all' ? currentFilters.status : undefined
        }
      })

      setResult(response.data.data || { total: 0, items: [] })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar os clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadCustomers()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  async function handleStatusChange(customerId, status) {
    setSavingId(customerId)
    setError('')
    setSuccess('')

    try {
      await api.patch(`/barber/customers/${customerId}/status`, { status })
      setSuccess('Status do cliente atualizado com sucesso.')
      await loadCustomers()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel atualizar o status do cliente')
    } finally {
      setSavingId('')
    }
  }

  function submitFilters(event) {
    event.preventDefault()
    loadCustomers(filters)
  }

  return (
    <section className="barber-page barber-customers-page">
      <div className="barber-page-hero">
        <div>
          <span className="barber-overline">Clientes do agendamento</span>
          <h1>Base de clientes online</h1>
          <p>Quem cria conta pelo link publico da barbearia passa a aparecer aqui, com status, origem e ultimo acesso.</p>
        </div>
      </div>

      {error && <div className="barber-message barber-message-error">{error}</div>}
      {success && <div className="barber-message barber-message-success">{success}</div>}

      <div className="barber-kpi-grid barber-customers-kpis">
        <article className="barber-kpi-card">
          <span>Total</span>
          <strong>{result.total}</strong>
          <small>Clientes vinculados a esta barbearia</small>
        </article>
        <article className="barber-kpi-card">
          <span>Ativos</span>
          <strong>{result.items.filter((item) => item.status === 'active').length}</strong>
          <small>Com email confirmado e acesso liberado</small>
        </article>
        <article className="barber-kpi-card">
          <span>Pendentes</span>
          <strong>{result.items.filter((item) => item.status === 'pending').length}</strong>
          <small>Aguardando confirmacao de email</small>
        </article>
      </div>

      <form className="barber-customers-toolbar" onSubmit={submitFilters}>
        <input
          className="barber-input"
          placeholder="Buscar por nome, telefone ou e-mail"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        />
        <select
          className="barber-select"
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="active">Ativos</option>
          <option value="blocked">Bloqueados</option>
        </select>
        <button className="barber-button barber-button-primary" type="submit">
          Buscar
        </button>
      </form>

      {loading ? (
        <div className="barber-public-loading">Carregando clientes...</div>
      ) : result.items.length === 0 ? (
        <section className="barber-empty-state">
          <strong>Nenhum cliente encontrado</strong>
          <p>Quando alguem criar conta pelo agendamento online, o cadastro aparecera aqui automaticamente.</p>
        </section>
      ) : (
        <div className="barber-customers-list">
          {result.items.map((customer) => (
            <article className="barber-customers-card" key={customer.id}>
              <div style={estiloAvatar} onClick={() => setSelectedCustomer(customer)}>
                {(customer.name || '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="barber-customers-card-main" onClick={() => setSelectedCustomer(customer)} style={{ cursor: 'pointer' }}>
                <strong>{customer.name}</strong>
                <span>{customer.email}</span>
                <span>{customer.phone || 'Telefone nao informado'}</span>
              </div>

              <div className="barber-customers-card-meta">
                <span className={`master-client-status-pill barber-customer-status barber-customer-status-${customer.status}`}>
                  {statusLabel(customer.status)}
                </span>
                <small>Origem: {customer.origin || 'agendamento_online'}</small>
                <small>Cadastro: {formatDate(customer.created_at)}</small>
                <small>Ultimo login: {formatDate(customer.last_login_at)}</small>
              </div>

              <div className="barber-customers-card-actions">
                <select
                  className="barber-select"
                  disabled={savingId === customer.id}
                  value={customer.status}
                  onChange={(event) => handleStatusChange(customer.id, event.target.value)}
                >
                  <option value="pending">Pendente</option>
                  <option value="active">Ativo</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      )}

      <CustomerSidePanel
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </section>
  )
}

export default ClientesBarber
