import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import PremiumTable from './PremiumTable'
import PremiumTabs from './PremiumTabs'
import PremiumLoadingSkeleton from './PremiumLoadingSkeleton'
import PremiumEmptyState from './PremiumEmptyState'
import './PremiumViews.css'

function formatCurrency(value) {
  if (value == null || isNaN(Number(value))) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

const PERIOD_TABS = [
  { id: 'month', label: 'Este mês' },
  { id: 'last_month', label: 'Mês passado' },
  { id: 'year', label: 'Este ano' }
]

export default function ServicesAnalyticsView({ variant = 'top' }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/barber/services/analytics', { params: { period } })
      setData(res.data.data)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    const id = setTimeout(() => loadAnalytics(), 300)
    return () => clearTimeout(id)
  }, [period, loadAnalytics])

  const title = variant === 'top' ? 'Serviços mais vendidos' : variant === 'favorites' ? 'Serviços favoritos' : 'Comissões por serviço'
  const subtitle = variant === 'top'
    ? 'Ranking dos serviços com maior saída na barbearia.'
    : variant === 'favorites'
      ? 'Serviços mais utilizados pelos clientes com maior recorrência.'
      : 'Comissões configuradas por serviço e valores estimados no período.'

  const topColumns = useMemo(() => [
    { key: 'pos', label: '#', width: '40px', render: (row, idx) => <span className="pv-rank">{idx + 1}</span> },
    { key: 'service_name', label: 'Serviço', render: (row) => <span className="pv-service-name">{row.service_name}</span> },
    { key: 'quantidade_execucoes', label: 'Execuções', render: (row) => row.quantidade_execucoes || 0 },
    { key: 'receita_total', label: 'Receita', render: (row) => formatCurrency(row.receita_total) },
    { key: 'ticket_medio', label: 'Ticket médio', render: (row) => formatCurrency(row.ticket_medio) },
    { key: 'participacao_percentual', label: 'Participação', render: (row) => `${row.participacao_percentual || 0}%` }
  ], [])

  const favoritesColumns = useMemo(() => [
    { key: 'pos', label: '#', width: '40px', render: (row, idx) => <span className="pv-rank">{idx + 1}</span> },
    { key: 'service_name', label: 'Serviço', render: (row) => <span className="pv-service-name">{row.service_name}</span> },
    { key: 'total_clientes', label: 'Clientes', render: (row) => row.total_clientes || 0 },
    { key: 'total_quantidade', label: 'Quantidade', render: (row) => row.total_quantidade || 0 },
    { key: 'total_vendas', label: 'Vendas', render: (row) => row.total_vendas || 0 },
    { key: 'ultima_execucao', label: 'Última execução', render: (row) => {
      if (!row.ultima_execucao) return '-'
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(row.ultima_execucao))
    }}
  ], [])

  const commissionsColumns = useMemo(() => [
    { key: 'service_name', label: 'Serviço', render: (row) => <span className="pv-service-name">{row.service_name}</span> },
    { key: 'commission_type', label: 'Tipo', render: (row) => row.commission_type === 'percentage' ? 'Percentual' : row.commission_type === 'fixed' ? 'Fixo' : '-' },
    { key: 'commission_value', label: 'Valor', render: (row) => row.commission_value != null ? (row.commission_type === 'percentage' ? `${row.commission_value}%` : formatCurrency(row.commission_value)) : '-' },
    { key: 'total_vendas_periodo', label: 'Vendas (período)', render: (row) => row.total_vendas_periodo || 0 },
    { key: 'receita_periodo', label: 'Receita (período)', render: (row) => formatCurrency(row.receita_periodo) },
    { key: 'total_comissao_estimada', label: 'Comissão estimada', render: (row) => formatCurrency(row.total_comissao_estimada) }
  ], [])

  const titleLabel = title

  return (
    <section className="pv-section">
      <div className="pv-hero">
        <div>
          <span className="barber-overline">Serviços • Analytics</span>
          <h1>{titleLabel}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <PremiumTabs tabs={PERIOD_TABS} active={period} onChange={setPeriod} />

      {loading ? (
        <PremiumLoadingSkeleton rows={8} type="table" />
      ) : !data ? (
        <PremiumEmptyState
          title="Dados indisponíveis"
          description="Não foi possível carregar os dados de analytics. Verifique se existem vendas registradas no período."
        />
      ) : variant === 'top' ? (
        !data.mais_vendidos || data.mais_vendidos.length === 0 ? (
          <PremiumEmptyState title="Nenhum serviço vendido" description="Nenhuma venda registrada no período selecionado." />
        ) : (
          <PremiumTable columns={topColumns} rows={data.mais_vendidos} />
        )
      ) : variant === 'favorites' ? (
        !data.favoritos || data.favoritos.length === 0 ? (
          <PremiumEmptyState title="Nenhum serviço favorito" description="Nenhum dado de recorrência disponível para o período." />
        ) : (
          <PremiumTable columns={favoritesColumns} rows={data.favoritos} />
        )
      ) : variant === 'commissions' ? (
        !data.comissoes || data.comissoes.length === 0 ? (
          <PremiumEmptyState title="Nenhuma comissão configurada" description="Nenhum serviço com comissão registrada no período." />
        ) : (
          <PremiumTable columns={commissionsColumns} rows={data.comissoes} />
        )
      ) : null}
    </section>
  )
}
