import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import PremiumTable from './PremiumTable'
import PremiumBadge from './PremiumBadge'
import PremiumLoadingSkeleton from './PremiumLoadingSkeleton'
import PremiumEmptyState from './PremiumEmptyState'
import PremiumFilterBar from './PremiumFilterBar'
import CustomerSidePanel from './CustomerSidePanel'
import './PremiumViews.css'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'canceled', label: 'Cancelados' },
  { value: 'no_show', label: 'No-show' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'scheduled', label: 'Agendados' }
]

const PERIOD_OPTIONS = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: 'all', label: 'Todo período' }
]

const APPOINTMENT_STATUS_LABELS = {
  scheduled: 'Agendado', confirmed: 'Confirmado', arrived: 'Chegou',
  in_progress: 'Em andamento', completed: 'Concluído', canceled: 'Cancelado', no_show: 'No-show'
}

function formatDateBR(value) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch { return '-' }
}

export default function AppointmentHistoryView() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('30')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (periodFilter !== 'all') {
        const days = parseInt(periodFilter)
        const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        params.date_from = from
      }
      if (search) params.search = search
      const res = await api.get('/barber/appointments', { params })
      setAppointments(res.data.data?.appointments || [])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, periodFilter, search])

  useEffect(() => {
    const id = setTimeout(() => loadHistory(), 300)
    return () => clearTimeout(id)
  }, [statusFilter, periodFilter, search, loadHistory])

  function handleFilterChange(key, value) {
    if (key === 'status') setStatusFilter(value)
    if (key === 'period') setPeriodFilter(value)
  }

  const columns = useMemo(() => [
    { key: 'customer_name', label: 'Cliente', render: (row) => (
      <div className="pv-name-cell">
        <div className="pv-name-avatar">{(row.customer_name || row.customer?.name || '?').slice(0, 2).toUpperCase()}</div>
        <span className="pv-name-text">{row.customer_name || row.customer?.name || 'Sem nome'}</span>
      </div>
    )},
    { key: 'service_name', label: 'Serviço', render: (row) => row.service_name || row.service?.name || '-' },
    { key: 'collaborator_name', label: 'Profissional', render: (row) => row.collaborator_name || row.collaborator?.name || '-' },
    { key: 'starts_at', label: 'Data/Hora', render: (row) => formatDateBR(row.starts_at) },
    { key: 'status', label: 'Status', render: (row) => (
      <PremiumBadge status={row.status || 'scheduled'} label={APPOINTMENT_STATUS_LABELS[row.status] || row.status} size="sm" />
    )},
    { key: 'source', label: 'Origem', render: (row) => row.source === 'admin_manual' ? 'Manual' : row.source === 'public' ? 'Online' : row.source || '-' }
  ], [])

  return (
    <section className="pv-section">
      <div className="pv-hero">
        <div>
          <span className="barber-overline">Agenda • Histórico</span>
          <h1>Histórico de Agendamentos</h1>
          <p>Agendamentos anteriores, concluídos, cancelados e no-show.</p>
        </div>
      </div>

      <PremiumFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar por cliente..."
        filters={[
          { key: 'status', value: statusFilter, options: STATUS_OPTIONS },
          { key: 'period', value: periodFilter, options: PERIOD_OPTIONS }
        ]}
        onFilterChange={handleFilterChange}
      />

      {loading ? (
        <PremiumLoadingSkeleton rows={8} type="table" />
      ) : appointments.length === 0 ? (
        <PremiumEmptyState
          title="Nenhum agendamento encontrado"
          description="Nenhum agendamento corresponde aos filtros atuais. Tente ajustar os filtros ou período."
        />
      ) : (
        <PremiumTable
          columns={columns}
          rows={appointments}
          onRowClick={(row) => {
            const customerId = row.customer_id || row.customer?.id
            if (customerId) setSelectedCustomer({ id: customerId, name: row.customer_name || row.customer?.name })
          }}
        />
      )}

      <CustomerSidePanel
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </section>
  )
}
