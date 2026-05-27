import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import PremiumSidePanel from './PremiumSidePanel'
import PremiumCustomerAvatar from './PremiumCustomerAvatar'
import PremiumBadge from './PremiumBadge'
import PremiumTabs from './PremiumTabs'
import PremiumMetricCard from './PremiumMetricCard'
import PremiumLoadingSkeleton, { PremiumSkeletonLine } from './PremiumLoadingSkeleton'
import PremiumEmptyState from './PremiumEmptyState'
import './CustomerSidePanel.css'

function formatDate(value) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(value))
  } catch { return '-' }
}

function formatDateShort(value) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(value))
  } catch { return '-' }
}

function formatCurrency(value) {
  if (value == null || isNaN(Number(value))) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

const TABS = [
  { id: 'dados', label: 'Dados' },
  { id: 'historico', label: 'Histórico' },
  { id: 'agendamentos', label: 'Agendamentos' },
  { id: 'financeiro', label: 'Financeiro' }
]

const STATUS_LABEL = {
  scheduled: 'Agendado', confirmed: 'Confirmado', arrived: 'Chegou',
  in_progress: 'Em andamento', completed: 'Concluído', canceled: 'Cancelado', no_show: 'Faltou'
}

const LOYALTY_COLORS = { vip: 'gold', fiel: 'primary', regular: 'info', novo: 'default' }

export default function CustomerSidePanel({ customer, open, onClose, appointmentContext }) {
  const [activeTab, setActiveTab] = useState('dados')
  const [crmData, setCrmData] = useState(null)
  const [crmLoading, setCrmLoading] = useState(false)
  const [crmError, setCrmError] = useState(null)
  const [historyData, setHistoryData] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchCrm = useCallback(async () => {
    if (!customer?.id) return
    setCrmLoading(true)
    setCrmError(null)
    try {
      const res = await api.get(`/barber/customers/${customer.id}/crm`)
      setCrmData(res.data?.data || null)
    } catch (err) {
      setCrmError(err.response?.data?.error || 'Erro ao carregar dados do cliente')
      setCrmData(null)
    } finally {
      setCrmLoading(false)
    }
  }, [customer?.id])

  const fetchHistory = useCallback(async () => {
    if (!customer?.id) return
    setHistoryLoading(true)
    try {
      const res = await api.get(`/barber/customers/${customer.id}/history`)
      setHistoryData(res.data?.data || null)
    } catch {
      setHistoryData(null)
    } finally {
      setHistoryLoading(false)
    }
  }, [customer?.id])

  useEffect(() => {
    if (open && customer?.id) {
      setActiveTab('dados')
      setCrmData(null)
      setHistoryData(null)
      setCrmError(null)
    }
  }, [open, customer?.id])

  useEffect(() => {
    if (open && !crmData && !crmLoading && !crmError) fetchCrm()
  }, [open, crmData, crmLoading, crmError, fetchCrm])

  useEffect(() => {
    if (open && activeTab === 'historico' && !historyData && !historyLoading) fetchHistory()
  }, [open, activeTab, historyData, historyLoading, fetchHistory])

  const stats = useMemo(() => {
    if (!crmData?.metrics) return { total: 0, completed: 0, spent: 'R$ 0,00', lastVisit: '-' }
    const m = crmData.metrics
    return {
      total: m.total_visits || 0,
      completed: m.confirmed_count || 0,
      spent: formatCurrency(m.total_spent),
      lastVisit: crmData.last_service ? formatDateShort(crmData.last_service.date) : '-'
    }
  }, [crmData])

  const handleWhatsApp = useCallback(() => {
    if (!customer?.phone) return
    const digits = customer.phone.replace(/\D/g, '')
    if (digits.length >= 10) {
      window.open(`https://wa.me/55${digits}`, '_blank', 'noopener')
    } else {
      window.open(`https://wa.me/${digits}`, '_blank', 'noopener')
    }
  }, [customer?.phone])

  const handleNewAppointment = useCallback(() => {
    alert('Abrir modal de novo agendamento para este cliente')
  }, [])

  if (!customer) return null

  const loyaltyColor = LOYALTY_COLORS[crmData?.loyalty?.level] || 'default'

  return (
    <PremiumSidePanel open={open} onClose={onClose} title="Detalhes do Cliente">
      <div className="csp-scroll-area">
        <div className="csp-header">
          <PremiumCustomerAvatar
            name={customer.name}
            email={customer.email}
            avatarUrl={customer.avatar_url || customer.avatarUrl}
            status={customer.status}
            size={72}
            showStatus
          />
          <div className="csp-header-info">
            <h3 className="csp-header-name">{customer.name || 'Sem nome'}</h3>
            {customer.email && <span className="csp-header-email">{customer.email}</span>}
          </div>
          <div className="csp-header-badges">
            <PremiumBadge status={customer.status || 'pending'} label={customer.status === 'active' ? 'Ativo' : customer.status === 'pending' ? 'Pendente' : customer.status === 'blocked' ? 'Bloqueado' : customer.status || '-'} />
            {crmData?.loyalty && (
              <PremiumBadge status={loyaltyColor} label={crmData.loyalty.label} />
            )}
          </div>
        </div>

        {crmLoading ? (
          <div className="csp-loading-stats">
            <PremiumSkeletonLine width="100%" height={60} />
          </div>
        ) : (
          <div className="csp-stats">
            <PremiumMetricCard label="Visitas" value={stats.total} variant="default" />
            <PremiumMetricCard label="Total gasto" value={stats.spent} variant="gold" />
            <PremiumMetricCard label="Última visita" value={stats.lastVisit} variant="info" />
          </div>
        )}

        {crmError && (
          <div className="csp-error-msg">
            {crmError} — <button className="csp-error-retry" onClick={fetchCrm} type="button">tentar novamente</button>
          </div>
        )}

        {/* Appointment context from agenda */}
        {appointmentContext && (
          <div className="csp-context-banner">
            <span className="csp-context-label">Agendamento atual:</span>
            <span className="csp-context-service">{appointmentContext.service_name}</span>
            <span className="csp-context-sep">•</span>
            <PremiumBadge status={appointmentContext.status} label={STATUS_LABEL[appointmentContext.status] || appointmentContext.status} size="sm" />
          </div>
        )}

        <div className="csp-tabs-area">
          <PremiumTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="csp-tab-content">
          {activeTab === 'dados' && (
            <div className="csp-dados">
              <div className="csp-field-group">
                <label className="csp-field-label">Telefone</label>
                <span className="csp-field-value">{customer.phone || '-'}</span>
              </div>
              <div className="csp-field-group">
                <label className="csp-field-label">E-mail</label>
                <span className="csp-field-value">{customer.email || '-'}</span>
              </div>
              {crmData?.birth_date && (
                <div className="csp-field-group">
                  <label className="csp-field-label">Data de nascimento</label>
                  <span className="csp-field-value">{formatDateShort(crmData.birth_date)}</span>
                </div>
              )}
              <div className="csp-field-group">
                <label className="csp-field-label">Origem</label>
                <span className="csp-field-value">{customer.origin === 'app' ? 'Aplicativo' : customer.origin === 'manual' ? 'Cadastro manual' : customer.origin || 'Agendamento online'}</span>
              </div>
              <div className="csp-field-group">
                <label className="csp-field-label">Cliente desde</label>
                <span className="csp-field-value">{formatDate(customer.created_at)}</span>
              </div>
              <div className="csp-field-group">
                <label className="csp-field-label">Último login</label>
                <span className="csp-field-value">{formatDate(customer.last_login_at) || '-'}</span>
              </div>

              {crmData?.last_service && (
                <div className="csp-field-group">
                  <label className="csp-field-label">Último atendimento</label>
                  <span className="csp-field-value">{crmData.last_service.name} — {formatDateShort(crmData.last_service.date)}</span>
                </div>
              )}

              {crmData?.favorite_services?.length > 0 && (
                <div className="csp-field-group">
                  <label className="csp-field-label">Serviços favoritos</label>
                  <div className="csp-tags-row">
                    {crmData.favorite_services.map((s, i) => (
                      <span key={i} className="csp-tag">{s.name} ({s.count}x)</span>
                    ))}
                  </div>
                </div>
              )}

              {crmData?.tags?.length > 0 && (
                <div className="csp-field-group">
                  <label className="csp-field-label">Tags</label>
                  <div className="csp-tags-row">
                    {crmData.tags.map((t, i) => (
                      <span key={i} className="csp-tag csp-tag-tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {crmData?.notes?.length > 0 && (
                <div className="csp-field-group">
                  <label className="csp-field-label">Anotações</label>
                  {crmData.notes.map((n) => (
                    <div key={n.id} className="csp-note-item">
                      <p className="csp-note-text">{n.note}</p>
                      <span className="csp-note-meta">{n.author_name || 'Autor'} — {formatDateShort(n.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'historico' && (
            <div className="csp-historico">
              {historyLoading ? (
                <PremiumLoadingSkeleton rows={5} type="table" />
              ) : !historyData || historyData.appointments?.length === 0 ? (
                <PremiumEmptyState
                  title="Nenhum histórico encontrado"
                  description="Este cliente ainda não possui atendimentos registrados."
                />
              ) : (
                <div className="csp-historico-list">
                  {historyData.appointments.map((appt) => (
                    <div key={appt.id} className="csp-historico-item">
                      <div className="csp-historico-item-header">
                        <span className="csp-historico-date">{formatDate(appt.starts_at)}</span>
                        <PremiumBadge status={appt.status} size="sm" label={STATUS_LABEL[appt.status] || appt.status} />
                      </div>
                      <div className="csp-historico-item-body">
                        <span className="csp-historico-service">{appt.service_name || 'Serviço'}</span>
                        <span className="csp-historico-collab">{appt.collaborator_name || '-'}</span>
                      </div>
                      <div className="csp-historico-item-footer">
                        <span className="csp-historico-value">{formatCurrency(appt.service_price)}</span>
                      </div>
                      {appt.appointment_notes && <div className="csp-historico-notes">{appt.appointment_notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'agendamentos' && (
            <div className="csp-agendamentos">
              {crmLoading ? (
                <PremiumLoadingSkeleton rows={3} type="table" />
              ) : !crmData ? (
                <PremiumEmptyState title="Nenhum dado disponível" description="Não foi possível carregar os agendamentos." />
              ) : (
                <>
                  {crmData.future_appointments?.length > 0 && (
                    <>
                      <h4 className="csp-section-title">Próximos agendamentos</h4>
                      <div className="csp-historico-list">
                        {crmData.future_appointments.map((appt) => (
                          <div key={appt.id} className="csp-historico-item">
                            <div className="csp-historico-item-header">
                              <span className="csp-historico-date">{formatDate(appt.starts_at)}</span>
                              <PremiumBadge status={appt.status} size="sm" label={STATUS_LABEL[appt.status] || appt.status} />
                            </div>
                            <div className="csp-historico-item-body">
                              <span className="csp-historico-service">{appt.service_name || 'Serviço'}</span>
                              <span className="csp-historico-collab">{appt.collaborator_name || '-'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {(!crmData.future_appointments || crmData.future_appointments.length === 0) && (
                    <PremiumEmptyState
                      title="Nenhum agendamento futuro"
                      description="Este cliente não possui agendamentos agendados para os próximos dias."
                      action={handleNewAppointment}
                      actionLabel="Criar agendamento"
                    />
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'financeiro' && (
            <div className="csp-financeiro">
              {crmLoading ? (
                <div className="csp-fin-loading">
                  <PremiumSkeletonLine width="100%" height={40} />
                  <PremiumSkeletonLine width="80%" height={40} />
                </div>
              ) : !crmData ? (
                <PremiumEmptyState title="Nenhum dado financeiro" description="Não foi possível carregar os dados financeiros." />
              ) : (
                <>
                  <div className="csp-fin-grid">
                    <div className="csp-fin-item">
                      <span className="csp-fin-label">Total gasto</span>
                      <strong className="csp-fin-value">{formatCurrency(crmData.metrics?.total_spent)}</strong>
                    </div>
                    <div className="csp-fin-item">
                      <span className="csp-fin-label">Ticket médio</span>
                      <strong className="csp-fin-value">{formatCurrency(crmData.metrics?.average_ticket)}</strong>
                    </div>
                    <div className="csp-fin-item">
                      <span className="csp-fin-label">Atendimentos pagos</span>
                      <strong className="csp-fin-value">{crmData.metrics?.paid_visits || 0}</strong>
                    </div>
                    <div className="csp-fin-item">
                      <span className="csp-fin-label">Score de fidelidade</span>
                      <strong className="csp-fin-value csp-fin-score">{crmData.loyalty?.score || 0}</strong>
                    </div>
                  </div>

                  {crmData?.favorite_services?.length > 0 && (
                    <div className="csp-fin-services">
                      <h4 className="csp-section-title">Serviços mais consumidos</h4>
                      {crmData.favorite_services.map((s, i) => (
                        <div key={i} className="csp-fin-service-row">
                          <span className="csp-fin-service-name">{s.name}</span>
                          <span className="csp-fin-service-count">{s.count}x</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed footer */}
      <div className="csp-footer">
        <button className="csp-footer-btn csp-footer-primary" onClick={handleNewAppointment} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo agendamento
        </button>
        <button className="csp-footer-btn csp-footer-success" onClick={handleWhatsApp} disabled={!customer?.phone} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          WhatsApp
        </button>
        <button className="csp-footer-btn csp-footer-secondary" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
      </div>
    </PremiumSidePanel>
  )
}
