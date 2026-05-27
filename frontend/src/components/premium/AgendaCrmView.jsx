import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api'
import PremiumLoadingSkeleton from './PremiumLoadingSkeleton'
import PremiumEmptyState from './PremiumEmptyState'
import PremiumBadge from './PremiumBadge'
import CustomerSidePanel from './CustomerSidePanel'
import './PremiumViews.css'

function formatDateBR(value) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
  } catch { return '-' }
}

export default function AgendaCrmView() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/barber/agenda/crm')
      setData(res.data.data)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <section className="pv-section">
        <div className="pv-hero">
          <div>
            <span className="barber-overline">Agenda • CRM</span>
            <h1>CRM da Agenda</h1>
            <p>Próximos retornos, clientes frequentes e análise de cancelamentos.</p>
          </div>
        </div>
        <PremiumLoadingSkeleton rows={6} type="table" />
      </section>
    )
  }

  if (!data) {
    return (
      <section className="pv-section">
        <div className="pv-hero">
          <div>
            <span className="barber-overline">Agenda • CRM</span>
            <h1>CRM da Agenda</h1>
          </div>
        </div>
        <PremiumEmptyState title="Dados indisponíveis" description="Não foi possível carregar os dados do CRM da agenda." />
      </section>
    )
  }

  function renderCustomerList(items, badgeFn) {
    if (!items || items.length === 0) {
      return <p className="pv-empty-text">Nenhum registro encontrado.</p>
    }
    return (
      <div className="pv-customer-list">
        {items.map((item) => (
          <div key={item.id} className="pv-customer-item" onClick={() => setSelectedCustomer(item)}>
            <div className="pv-customer-avatar">{(item.name || '?').slice(0, 2).toUpperCase()}</div>
            <div className="pv-customer-info">
              <strong>{item.name || 'Sem nome'}</strong>
              {item.phone && <span>{item.phone}</span>}
              {item.starts_at && <span className="pv-customer-meta">{formatDateBR(item.starts_at)} — {item.service_name || ''}</span>}
              {item.last_canceled && <span className="pv-customer-meta">Último cancelamento: {formatDateBR(item.last_canceled)}</span>}
              {item.last_no_show && <span className="pv-customer-meta">Último no-show: {formatDateBR(item.last_no_show)}</span>}
              {item.last_completed && <span className="pv-customer-meta">Última visita: {formatDateBR(item.last_completed)}</span>}
              {item.last_visit && <span className="pv-customer-meta">Última visita: {formatDateBR(item.last_visit)}</span>}
              {item.days_since_last_visit != null && item.days_since_last_visit < 200 && (
                <span className="pv-customer-meta">{item.days_since_last_visit} dias sem retorno</span>
              )}
              {item.canceled_count > 1 && <span className="pv-customer-meta">{item.canceled_count}x cancelamentos</span>}
              {item.no_show_count > 0 && <span className="pv-customer-meta">{item.no_show_count}x no-show</span>}
              {item.total_visits > 0 && <span className="pv-customer-meta">{item.total_visits} visitas</span>}
            </div>
            {badgeFn && <div className="pv-customer-badge">{badgeFn(item)}</div>}
          </div>
        ))}
      </div>
    )
  }

  return (
    <section className="pv-section">
      <div className="pv-hero">
        <div>
          <span className="barber-overline">Agenda • CRM</span>
          <h1>CRM da Agenda</h1>
          <p>Próximos retornos, clientes frequentes e análise de cancelamentos.</p>
        </div>
      </div>

      <div className="pv-crm-grid">
        <div className="pv-crm-card">
          <div className="pv-crm-card-header">
            <h3>Próximos agendamentos</h3>
            <span className="pv-crm-count">{data.upcoming?.length || 0}</span>
          </div>
          {renderCustomerList(data.upcoming, (item) => (
            <PremiumBadge status={item.appointment_status || 'scheduled'} label={item.appointment_status || 'Agendado'} size="xs" />
          ))}
        </div>

        <div className="pv-crm-card">
          <div className="pv-crm-card-header">
            <h3>Cancelamentos recentes</h3>
            <span className="pv-crm-count">{data.recent_cancellations?.length || 0}</span>
          </div>
          {renderCustomerList(data.recent_cancellations)}
        </div>

        <div className="pv-crm-card">
          <div className="pv-crm-card-header">
            <h3>No-shows</h3>
            <span className="pv-crm-count">{data.no_show_customers?.length || 0}</span>
          </div>
          {renderCustomerList(data.no_show_customers)}
        </div>

        <div className="pv-crm-card">
          <div className="pv-crm-card-header">
            <h3>Sem retorno (30+ dias)</h3>
            <span className="pv-crm-count">{data.no_return?.length || 0}</span>
          </div>
          {renderCustomerList(data.no_return)}
        </div>

        <div className="pv-crm-card">
          <div className="pv-crm-card-header">
            <h3>Clientes recorrentes</h3>
            <span className="pv-crm-count">{data.recurring?.length || 0}</span>
          </div>
          {renderCustomerList(data.recurring)}
        </div>
      </div>

      <CustomerSidePanel
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </section>
  )
}
