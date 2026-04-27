import { useEffect, useState } from 'react'
import api from '../services/api'
import MasterLayout from '../components/master/MasterLayout'
import PageHeader from '../components/master/PageHeader'
import SectionCard from '../components/master/SectionCard'

const emptyForm = {
  company_id: '',
  plan_name: '',
  price: '',
  status: 'pending',
  billing_cycle: 'monthly',
  next_due_date: ''
}

const statusOptions = ['active', 'pending', 'late', 'canceled', 'refunded', 'suspended']

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '-'
}

function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [companies, setCompanies] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [filters, setFilters] = useState({ q: '', status: '' })
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadCompanies() {
    const response = await api.get('/master/companies')
    setCompanies(Array.isArray(response.data.data) ? response.data.data : response.data.data.items || [])
  }

  async function loadSubscriptions(page = pagination.page) {
    setError('')
    setLoading(true)

    try {
      const response = await api.get('/master/subscriptions', {
        params: {
          page,
          limit: 10,
          q: filters.q || undefined,
          status: filters.status || undefined
        }
      })
      setSubscriptions(response.data.data.items || [])
      setPagination(response.data.data.pagination || { page: 1, totalPages: 1, total: 0 })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar assinaturas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadCompanies().catch(() => undefined)
      loadSubscriptions(1)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(subscription) {
    setEditing(subscription)
    setForm({
      company_id: subscription.company_id || '',
      plan_name: subscription.plan_name || '',
      price: subscription.price || '',
      status: subscription.status || 'pending',
      billing_cycle: subscription.billing_cycle || 'monthly',
      next_due_date: subscription.next_due_date ? String(subscription.next_due_date).slice(0, 10) : ''
    })
    setShowForm(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (editing) {
        await api.put(`/master/subscriptions/${editing.id}`, form)
        setSuccess('Assinatura atualizada com sucesso')
      } else {
        await api.post('/master/subscriptions', form)
        setSuccess('Assinatura criada com sucesso')
      }
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm)
      await loadSubscriptions(editing ? pagination.page : 1)
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel salvar a assinatura')
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(subscription, status) {
    setError('')
    setSuccess('')
    try {
      await api.patch(`/master/subscriptions/${subscription.id}/status`, { status })
      setSuccess('Status da assinatura atualizado')
      await loadSubscriptions(pagination.page)
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel alterar o status')
    }
  }

  return (
    <MasterLayout title="Assinaturas">
      <PageHeader
        title="Assinaturas"
        description="Controle planos, valores, ciclos e status das assinaturas."
        actions={<button type="button" onClick={openCreate}>Nova assinatura</button>}
      />

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <SectionCard title={editing ? 'Editar assinatura' : 'Nova assinatura'}>
          <form className="module-form master-form-grid" onSubmit={handleSubmit}>
            <label htmlFor="company_id">Empresa</label>
            <select id="company_id" name="company_id" value={form.company_id} onChange={handleChange} required>
              <option value="">Selecione uma empresa</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>

            <label htmlFor="plan_name">Plano</label>
            <input id="plan_name" name="plan_name" value={form.plan_name} onChange={handleChange} required />

            <label htmlFor="price">Valor</label>
            <input id="price" name="price" type="number" step="0.01" value={form.price} onChange={handleChange} />

            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}>
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>

            <label htmlFor="billing_cycle">Ciclo</label>
            <select id="billing_cycle" name="billing_cycle" value={form.billing_cycle} onChange={handleChange}>
              <option value="monthly">Mensal</option>
              <option value="quarterly">Trimestral</option>
              <option value="yearly">Anual</option>
            </select>

            <label htmlFor="next_due_date">Proximo vencimento</label>
            <input id="next_due_date" name="next_due_date" type="date" value={form.next_due_date} onChange={handleChange} />

            <div className="master-form-actions">
              <button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar assinatura'}</button>
              <button className="button-secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Lista de assinaturas" meta={`${pagination.total} registros`}>
        <form className="master-filter-row" onSubmit={(event) => { event.preventDefault(); loadSubscriptions(1) }}>
          <input name="q" placeholder="Buscar por empresa ou plano" value={filters.q} onChange={handleFilterChange} />
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">Todos os status</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button type="submit">Filtrar</button>
        </form>

        {loading ? (
          <p>Carregando assinaturas...</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Plano</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Vencimento</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id}>
                      <td>{subscription.company_name}</td>
                      <td>{subscription.plan_name}</td>
                      <td>{formatMoney(subscription.price)}</td>
                      <td>{subscription.status}</td>
                      <td>{formatDate(subscription.next_due_date)}</td>
                      <td>
                        <div className="table-actions">
                          <button type="button" onClick={() => openEdit(subscription)}>Editar</button>
                          <button type="button" onClick={() => changeStatus(subscription, 'active')}>Ativar</button>
                          <button type="button" onClick={() => changeStatus(subscription, 'suspended')}>Suspender</button>
                          <button className="button-danger" type="button" onClick={() => changeStatus(subscription, 'canceled')}>Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {subscriptions.length === 0 && (
                    <tr>
                      <td colSpan="6">Nenhuma assinatura encontrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="master-pagination">
              <button type="button" disabled={pagination.page <= 1} onClick={() => loadSubscriptions(pagination.page - 1)}>Anterior</button>
              <span>Pagina {pagination.page} de {pagination.totalPages || 1}</span>
              <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => loadSubscriptions(pagination.page + 1)}>Proxima</button>
            </div>
          </>
        )}
      </SectionCard>
    </MasterLayout>
  )
}

export default Subscriptions
