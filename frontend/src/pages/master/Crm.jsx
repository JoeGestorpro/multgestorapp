import { useState } from 'react'
import MasterLayout from '../../components/master/MasterLayout'
import PageHeader from '../../components/master/PageHeader'
import SectionCard from '../../components/master/SectionCard'
import ActionButton from '../../components/master/ActionButton'
import StatusBadge from '../../components/master/StatusBadge'
import ActionDrawer from '../../components/master/ActionDrawer'
import FilterBar from '../../components/master/FilterBar'
import MockNotice from '../../components/master/MockNotice'
import { showToast } from '../../components/master/Toast'

const STAGES = [
  { key: 'lead', label: 'Lead', color: '#93a4b6' },
  { key: 'qualificado', label: 'Qualificado', color: '#3b82f6' },
  { key: 'proposta', label: 'Proposta', color: '#f59e0b' },
  { key: 'negociacao', label: 'Negociação', color: '#8cff4f' },
  { key: 'fechado', label: 'Fechado', color: '#34d399' },
  { key: 'perdido', label: 'Perdido', color: '#ef4444' },
  { key: 'arquivado', label: 'Arquivado', color: '#6f7d8b' }
]

const MOCK_LEADS = [
  { id: 1, name: 'João Silva', email: 'joao@email.com', phone: '(11) 99999-0001', company: 'Barbearia do João', value: 199, stage: 'lead', date: '2026-06-15', notes: 'Interessado no plano Pro' },
  { id: 2, name: 'Maria Santos', email: 'maria@email.com', phone: '(11) 99999-0002', company: 'Salão da Maria', value: 349, stage: 'qualificado', date: '2026-06-14', notes: 'Quer módulo de agendamento' },
  { id: 3, name: 'Carlos Oliveira', email: 'carlos@email.com', phone: '(11) 99999-0003', company: 'AutoEstética Carlos', value: 499, stage: 'proposta', date: '2026-06-13', notes: 'Proposta enviada via email' },
  { id: 4, name: 'Ana Costa', email: 'ana@email.com', phone: '(11) 99999-0004', company: 'Clínica da Ana', value: 799, stage: 'negociacao', date: '2026-06-12', notes: 'Negociando plano Premium' },
  { id: 5, name: 'Pedro Almeida', email: 'pedro@email.com', phone: '(11) 99999-0005', company: 'Barbearia Pedro', value: 199, stage: 'fechado', date: '2026-06-10', notes: 'Contrato assinado' },
  { id: 6, name: 'Lucia Pereira', email: 'lucia@email.com', phone: '(11) 99999-0006', company: 'Estética Lucia', value: 249, stage: 'perdido', date: '2026-06-08', notes: 'Escolheu concorrente' },
  { id: 7, name: 'Roberto Lima', email: 'roberto@email.com', phone: '(11) 99999-0007', company: 'Barbearia Roberto', value: 199, stage: 'lead', date: '2026-06-07', notes: 'Cliente novo' },
  { id: 8, name: 'Fernanda Rocha', email: 'fernanda@email.com', phone: '(11) 99999-0008', company: 'Spa Fernanda', value: 599, stage: 'qualificado', date: '2026-06-06', notes: 'Cliente com alto potencial' },
  { id: 9, name: 'Gustavo Nunes', email: 'gustavo@email.com', phone: '(11) 99999-0009', company: 'AgroGestor Nunes', value: 1299, stage: 'proposta', date: '2026-06-05', notes: 'Interesse no AgroGestor' },
  { id: 10, name: 'Juliana Martins', email: 'juliana@email.com', phone: '(11) 99999-0010', company: 'Hotel Martins', value: 2499, stage: 'lead', date: '2026-06-04', notes: 'Rede de hotéis' },
  { id: 11, name: 'Diego Souza', email: 'diego@email.com', phone: '(11) 99999-0011', company: 'AutoGestor Souza', value: 899, stage: 'negociacao', date: '2026-06-03', notes: 'Testando módulo automotivo' },
  { id: 12, name: 'Amanda Ferreira', email: 'amanda@email.com', phone: '(11) 99999-0012', company: 'PetShop Amanda', value: 149, stage: 'fechado', date: '2026-06-02', notes: 'Plano PetGestor' },
]

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(value))
}

export default function Crm() {
  const [leads, setLeads] = useState(MOCK_LEADS)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [drawerLead, setDrawerLead] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [activeStage, setActiveStage] = useState(null)

  const filteredLeads = leads.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.company.toLowerCase().includes(search.toLowerCase())) return false
    if (activeStage && l.stage !== activeStage) return false
    return true
  })

  const leadsByStage = Object.fromEntries(STAGES.map(s => [s.key, filteredLeads.filter(l => l.stage === s.key)]))

  function moveLead(id, newStage) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: newStage } : l))
    showToast(`Lead movido para ${STAGES.find(s => s.key === newStage)?.label}`, 'info')
  }

  function handleNewLead(e) {
    e.preventDefault()
    const form = e.target
    const newLead = {
      id: Math.max(...leads.map(l => l.id)) + 1,
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value || '',
      company: form.company.value || '',
      value: Number(form.value.value) || 0,
      stage: 'lead',
      date: new Date().toISOString().slice(0, 10),
      notes: form.notes.value || ''
    }
    setLeads(prev => [...prev, newLead])
    setShowNewModal(false)
    showToast('Lead criado com sucesso!', 'success')
  }

  return (
    <MasterLayout title="CRM / Vendas">
      <PageHeader
        title="CRM / Vendas"
        description="Gerencie o funil de vendas e acompanhe leads, propostas e conversões."
        actions={
          <ActionButton variant="primary" onClick={() => setShowNewModal(true)}>
            + Novo Lead
          </ActionButton>
        }
      />

      <MockNotice />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou empresa…"
        filters={[
          { key: 'stage', label: 'Todos os estágios', value: activeStage || '', options: STAGES.map(s => ({ value: s.key, label: s.label })) }
        ]}
        onFilterChange={setFilters}
      />

      {showNewModal && (
        <div className="master-modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="master-modal master-modal--form" onClick={e => e.stopPropagation()}>
            <h3 className="master-modal-title">Novo Lead</h3>
            <form onSubmit={handleNewLead}>
              <div className="master-crm-form-grid">
                <label className="master-crm-field">
                  <span>Nome *</span>
                  <input name="name" required placeholder="Nome do contato" />
                </label>
                <label className="master-crm-field">
                  <span>Email *</span>
                  <input name="email" type="email" required placeholder="email@exemplo.com" />
                </label>
                <label className="master-crm-field">
                  <span>Telefone</span>
                  <input name="phone" placeholder="(11) 99999-0000" />
                </label>
                <label className="master-crm-field">
                  <span>Empresa</span>
                  <input name="company" placeholder="Nome da empresa" />
                </label>
                <label className="master-crm-field master-crm-field--full">
                  <span>Valor potencial (R$)</span>
                  <input name="value" type="number" placeholder="0" />
                </label>
                <label className="master-crm-field master-crm-field--full">
                  <span>Observações</span>
                  <textarea name="notes" rows={3} placeholder="Informações adicionais…" />
                </label>
              </div>
              <div className="master-modal-actions">
                <button type="button" className="master-btn master-btn--ghost" onClick={() => setShowNewModal(false)}>Cancelar</button>
                <button type="submit" className="master-btn master-btn--primary">Salvar Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="master-crm-kanban">
        {STAGES.map(stage => (
          <div key={stage.key} className="master-crm-column">
            <div className="master-crm-column-header" style={{ borderColor: stage.color }}>
              <span style={{ color: stage.color }}>{stage.label}</span>
              <span className="master-crm-count">{leadsByStage[stage.key]?.length || 0}</span>
            </div>
            <div className="master-crm-column-body">
              {(leadsByStage[stage.key] || []).map(lead => (
                <button key={lead.id} className="master-crm-card" type="button" onClick={() => setDrawerLead(lead)}>
                  <strong className="master-crm-card-name">{lead.name}</strong>
                  <small className="master-crm-card-company">{lead.company}</small>
                  <span className="master-crm-card-value">{formatCurrency(lead.value)}</span>
                  <div className="master-crm-card-footer">
                    <span className="master-crm-card-date">{formatDate(lead.date)}</span>
                    <StatusBadge status={lead.stage === 'fechado' ? 'success' : lead.stage === 'perdido' || lead.stage === 'arquivado' ? 'error' : lead.stage === 'lead' ? 'info' : 'warning'} label={STAGES.find(s => s.key === lead.stage)?.label || lead.stage} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ActionDrawer open={!!drawerLead} title={drawerLead?.name || ''} onClose={() => setDrawerLead(null)}
        footer={
          drawerLead && (
            <div className="master-crm-drawer-actions">
              {STAGES.map(s => (
                <button key={s.key} className={`master-btn master-btn--sm ${drawerLead.stage === s.key ? 'master-btn--primary' : 'master-btn--ghost'}`} type="button" onClick={() => { moveLead(drawerLead.id, s.key); setDrawerLead(null) }}>
                  {s.label}
                </button>
              ))}
            </div>
          )
        }
      >
        {drawerLead && (
          <div className="master-crm-drawer-info">
            <div className="master-crm-drawer-row"><span>Email</span><strong>{drawerLead.email}</strong></div>
            <div className="master-crm-drawer-row"><span>Telefone</span><strong>{drawerLead.phone || '-'}</strong></div>
            <div className="master-crm-drawer-row"><span>Empresa</span><strong>{drawerLead.company}</strong></div>
            <div className="master-crm-drawer-row"><span>Valor potencial</span><strong>{formatCurrency(drawerLead.value)}</strong></div>
            <div className="master-crm-drawer-row"><span>Estágio</span><StatusBadge status={drawerLead.stage} label={STAGES.find(s => s.key === drawerLead.stage)?.label} /></div>
            <div className="master-crm-drawer-row"><span>Data</span><strong>{formatDate(drawerLead.date)}</strong></div>
            {drawerLead.notes && (
              <div className="master-crm-drawer-row master-crm-drawer-row--full">
                <span>Observações</span>
                <p>{drawerLead.notes}</p>
              </div>
            )}
          </div>
        )}
      </ActionDrawer>
    </MasterLayout>
  )
}
