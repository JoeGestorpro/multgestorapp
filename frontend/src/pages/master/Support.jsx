import { useState } from 'react'
import MasterLayout from '../../components/master/MasterLayout'
import PageHeader from '../../components/master/PageHeader'
import SectionCard from '../../components/master/SectionCard'
import StatusBadge from '../../components/master/StatusBadge'
import ActionButton from '../../components/master/ActionButton'
import ActionDrawer from '../../components/master/ActionDrawer'
import FilterBar from '../../components/master/FilterBar'
import MockNotice from '../../components/master/MockNotice'
import { showToast } from '../../components/master/Toast'

const MOCK_TICKETS = [
  { id: 'TKT-001', subject: 'Erro ao acessar módulo de agendamento', client: 'Barbearia do João', priority: 'alta', status: 'aberto', date: '2026-06-20', assignee: 'Suporte N1', channel: 'email', description: 'Cliente reporta que ao clicar em "Agendamentos" recebe tela branca. Já tentou limpar cache.' },
  { id: 'TKT-002', subject: 'Dúvida sobre plano Premium', client: 'Salão da Maria', priority: 'media', status: 'em_andamento', date: '2026-06-19', assignee: 'Vendas', channel: 'whatsapp', description: 'Cliente quer saber diferenças entre Pro e Premium para migrar.' },
  { id: 'TKT-003', subject: 'Nota fiscal não está emitindo', client: 'AutoEstética Carlos', priority: 'alta', status: 'aberto', date: '2026-06-18', assignee: 'Suporte N2', channel: 'email', description: 'Sistema de NF-e retorna erro 500 ao tentar emitir.' },
  { id: 'TKT-004', subject: 'Solicitação de nova funcionalidade', client: 'Clínica da Ana', priority: 'baixa', status: 'em_andamento', date: '2026-06-17', assignee: 'Produto', channel: 'portal', description: 'Cliente solicita integração com sistema de prontuário eletrônico.' },
  { id: 'TKT-005', subject: 'Cobrança duplicada', client: 'Barbearia Pedro', priority: 'urgente', status: 'aberto', date: '2026-06-16', assignee: 'Financeiro', channel: 'email', description: 'Cliente foi cobrado duas vezes no mesmo mês. Solicita estorno urgente.' },
  { id: 'TKT-006', subject: 'Dificuldade ao cadastrar colaboradores', client: 'Estética Lucia', priority: 'media', status: 'resolvido', date: '2026-06-15', assignee: 'Suporte N1', channel: 'chat', description: 'Cliente não consegue adicionar novos colaboradores ao sistema.' },
  { id: 'TKT-007', subject: 'Erro 404 ao acessar relatórios', client: 'Spa Fernanda', priority: 'alta', status: 'fechado', date: '2026-06-14', assignee: 'Suporte N2', channel: 'email', description: 'Link de relatórios retorna página não encontrada.' },
  { id: 'TKT-008', subject: 'Integração com WhatsApp parou', client: 'AgroGestor Nunes', priority: 'urgente', status: 'aberto', date: '2026-06-13', assignee: 'Suporte N2', channel: 'whatsapp', description: 'Mensagens não estão sendo enviadas via API do WhatsApp.' },
  { id: 'TKT-009', subject: 'Dúvida sobre período de teste', client: 'Hotel Martins', priority: 'baixa', status: 'em_andamento', date: '2026-06-12', assignee: 'Vendas', channel: 'chat', description: 'Cliente quer saber quanto tempo dura o trial gratuito.' },
  { id: 'TKT-010', subject: 'Bug no cálculo de comissão', client: 'Barbearia do João', priority: 'alta', status: 'aberto', date: '2026-06-11', assignee: 'Suporte N2', channel: 'portal', description: 'Comissão de colaboradores está sendo calculada com valor incorreto.' },
]

const PRIORITY_MAP = { urgente: 'critical', alta: 'error', media: 'warning', baixa: 'info' }
const PRIORITY_ORDER = { urgente: 0, alta: 1, media: 2, baixa: 3 }

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

export default function Support() {
  const [tickets] = useState(MOCK_TICKETS)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', priority: '' })
  const [drawerTicket, setDrawerTicket] = useState(null)
  const [respondendo, setRespondendo] = useState(false)

  const filtered = tickets.filter(t => {
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.client.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false
    if (filters.status && t.status !== filters.status) return false
    if (filters.priority && t.priority !== filters.priority) return false
    return true
  }).sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  function handleResponder(e) {
    e.preventDefault()
    setRespondendo(true)
    setTimeout(() => {
      setRespondendo(false)
      setDrawerTicket(null)
      showToast('Resposta enviada com sucesso!', 'success')
    }, 1000)
  }

  return (
    <MasterLayout title="Suporte">
      <PageHeader title="Suporte" description="Gerencie chamados de suporte, dúvidas e solicitações dos clientes." />
      <MockNotice />

      <FilterBar
        search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por ID, assunto ou cliente…"
        filters={[
          { key: 'status', label: 'Status', value: filters.status, options: [
            { value: 'aberto', label: 'Aberto' }, { value: 'em_andamento', label: 'Em andamento' },
            { value: 'resolvido', label: 'Resolvido' }, { value: 'fechado', label: 'Fechado' }
          ]},
          { key: 'priority', label: 'Prioridade', value: filters.priority, options: [
            { value: 'urgente', label: 'Urgente' }, { value: 'alta', label: 'Alta' },
            { value: 'media', label: 'Média' }, { value: 'baixa', label: 'Baixa' }
          ]}
        ]}
        onFilterChange={setFilters}
      />

      <SectionCard>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Assunto</th>
                <th>Cliente</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Atribuído</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ticket => (
                <tr key={ticket.id} className="master-support-row" onClick={() => setDrawerTicket(ticket)} style={{ cursor: 'pointer' }}>
                  <td><strong style={{ color: 'var(--master-text)' }}>{ticket.id}</strong></td>
                  <td>{ticket.subject}</td>
                  <td>{ticket.client}</td>
                  <td><StatusBadge status={PRIORITY_MAP[ticket.priority] || 'info'} label={ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} /></td>
                  <td><StatusBadge status={ticket.status === 'aberto' ? 'error' : ticket.status === 'em_andamento' ? 'warning' : ticket.status === 'resolvido' ? 'info' : 'success'} label={{ aberto: 'Aberto', em_andamento: 'Em andamento', resolvido: 'Resolvido', fechado: 'Fechado' }[ticket.status] || ticket.status} /></td>
                  <td>{ticket.assignee}</td>
                  <td>{formatDate(ticket.date)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--master-muted)' }}>Nenhum chamado encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <ActionDrawer open={!!drawerTicket} title={drawerTicket?.subject || ''} onClose={() => { setDrawerTicket(null); setRespondendo(false) }}>
        {drawerTicket && (
          <div className="master-support-drawer">
            <div className="master-support-drawer-meta">
              <div><span>ID</span><strong>{drawerTicket.id}</strong></div>
              <div><span>Cliente</span><strong>{drawerTicket.client}</strong></div>
              <div><span>Prioridade</span><StatusBadge status={PRIORITY_MAP[drawerTicket.priority] || 'info'} label={drawerTicket.priority.charAt(0).toUpperCase() + drawerTicket.priority.slice(1)} /></div>
              <div><span>Status</span><StatusBadge status={drawerTicket.status === 'aberto' ? 'error' : drawerTicket.status === 'em_andamento' ? 'warning' : drawerTicket.status === 'resolvido' ? 'info' : 'success'} label={{ aberto: 'Aberto', em_andamento: 'Em andamento', resolvido: 'Resolvido', fechado: 'Fechado' }[drawerTicket.status] || drawerTicket.status} /></div>
              <div><span>Atribuído</span><strong>{drawerTicket.assignee}</strong></div>
              <div><span>Canal</span><strong>{drawerTicket.channel}</strong></div>
              <div className="master-support-drawer-meta--full"><span>Descrição</span><p>{drawerTicket.description}</p></div>
            </div>

            <div className="master-support-response">
              <h4>Responder chamado</h4>
              <form onSubmit={handleResponder}>
                <textarea className="master-support-textarea" rows={5} placeholder="Digite sua resposta…" required disabled={respondendo} />
                <div className="master-support-response-actions">
                  <ActionButton type="submit" variant="primary" loading={respondendo}>Enviar resposta</ActionButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </ActionDrawer>
    </MasterLayout>
  )
}
