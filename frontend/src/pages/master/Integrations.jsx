import { useState } from 'react'
import MasterLayout from '../../components/master/MasterLayout'
import PageHeader from '../../components/master/PageHeader'
import SectionCard from '../../components/master/SectionCard'
import StatusBadge from '../../components/master/StatusBadge'
import FilterBar from '../../components/master/FilterBar'
import MockNotice from '../../components/master/MockNotice'
import { showToast } from '../../components/master/Toast'

const INTEGRATIONS = [
  { id: 'pagarme', name: 'Pagarme', category: 'Pagamento', description: 'Processamento de pagamentos com cartão, boleto e PIX.', status: 'active', docs: 'https://docs.pagar.me' },
  { id: 'mercadopago', name: 'Mercado Pago', category: 'Pagamento', description: 'Gateway de pagamentos alternativo — checkout transparente.', status: 'active', docs: 'https://www.mercadopago.com.br/developers' },
  { id: 'kiwify', name: 'Kiwify', category: 'Pagamento', description: 'Checkout de planos e assinaturas — links de pagamento.', status: 'active', docs: 'https://docs.kiwify.com.br' },
  { id: 'supabase', name: 'Supabase', category: 'Infraestrutura', description: 'Banco de dados PostgreSQL + Auth + Storage + Realtime.', status: 'active', docs: 'https://supabase.com/docs' },
  { id: 'sentry', name: 'Sentry', category: 'Monitoramento', description: 'Monitoramento de erros e performance do frontend.', status: 'active', docs: 'https://docs.sentry.io' },
  { id: 'backblaze', name: 'Backblaze B2', category: 'Infraestrutura', description: 'Backup externo de banco de dados — retention de 30 dias.', status: 'active', docs: 'https://www.backblaze.com/docs' },
  { id: 'whatsapp', name: 'WhatsApp API', category: 'Comunicação', description: 'Envio de mensagens e notificações via WhatsApp Business API.', status: 'partial', docs: 'https://developers.facebook.com/docs/whatsapp' },
  { id: 'email', name: 'Email (SMTP)', category: 'Comunicação', description: 'Disparo de emails transacionais — boas-vindas, recuperação de senha.', status: 'active', docs: '' },
  { id: 'recharts', name: 'Recharts', category: 'Analytics', description: 'Biblioteca de gráficos para dashboards financeiros.', status: 'active', docs: 'https://recharts.org' },
  { id: 'viacep', name: 'ViaCEP', category: 'Serviços', description: 'Busca automática de endereço por CEP.', status: 'active', docs: 'https://viacep.com.br' },
  { id: 'openai', name: 'OpenAI API', category: 'IA', description: 'Integração futura para geração de relatórios e copiloto.', status: 'future', docs: 'https://platform.openai.com' },
  { id: 'meta', name: 'Meta (Facebook/IG)', category: 'Comunicação', description: 'Login social e integração com Instagram.', status: 'future', docs: 'https://developers.facebook.com' },
  { id: 'github', name: 'GitHub Actions', category: 'Infraestrutura', description: 'CI/CD pipeline — deploy automatizado.', status: 'planning', docs: 'https://docs.github.com/actions' },
  { id: 'swagger', name: 'Swagger / OpenAPI', category: 'Infraestrutura', description: 'Documentação da API REST.', status: 'planning', docs: 'https://swagger.io' },
]

const STATUS_MAP = {
  active: { label: 'Ativo', color: 'success' },
  partial: { label: 'Parcial', color: 'warning' },
  future: { label: 'Futuro', color: 'gray' },
  planning: { label: 'Planejado', color: 'info' }
}

const CATEGORY_LABELS = {
  Pagamento: { icon: 'M3 6h18v12H3zM3 10h18', color: '#34d399' },
  Infraestrutura: { icon: 'M5 12h14M12 5l7 7-7 7', color: '#3b82f6' },
  Monitoramento: { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: '#a78bfa' },
  Comunicação: { icon: 'M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: '#f59e0b' },
  Analytics: { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: '#8cff4f' },
  IA: { icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: '#f472b6' },
  Serviços: { icon: 'M21 21l-5-5M10 18a8 8 0 100-16 8 8 0 000 16z', color: '#60a5fa' }
}

export default function Integrations() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ category: '' })

  const filtered = INTEGRATIONS.filter(int => {
    if (search && !int.name.toLowerCase().includes(search.toLowerCase()) && !int.description.toLowerCase().includes(search.toLowerCase())) return false
    if (filters.category && int.category !== filters.category) return false
    return true
  })

  function handleClick(int) {
    showToast(`[Mock] Integração "${int.name}" — detalhes preparados para backend futuro.`, 'info')
  }

  return (
    <MasterLayout title="Integrações">
      <PageHeader title="Integrações" description="Status de todas as integrações e serviços conectados à plataforma." />
      <MockNotice />

      <FilterBar
        search={search} onSearchChange={setSearch} searchPlaceholder="Buscar integração…"
        filters={[
          { key: 'category', label: 'Categoria', value: filters.category, options: Object.entries(CATEGORY_LABELS).map(([k]) => ({ value: k, label: k })) }
        ]}
        onFilterChange={setFilters}
      />

      <div className="master-integration-grid">
        {filtered.map(int => {
          const cat = CATEGORY_LABELS[int.category] || CATEGORY_LABELS.Infraestrutura
          const s = STATUS_MAP[int.status] || STATUS_MAP.future
          return (
            <SectionCard key={int.id}>
              <div className="master-integration-card" onClick={() => handleClick(int)}>
                <div className="master-integration-card-top">
                  <span className="master-integration-icon" style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}44`, color: cat.color }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22">
                      <path d={cat.icon} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <StatusBadge status={s.color} label={s.label} />
                </div>
                <strong className="master-integration-card-name">{int.name}</strong>
                <p className="master-integration-card-desc">{int.description}</p>
                <span className="master-integration-card-category">{int.category}</span>
              </div>
            </SectionCard>
          )
        })}
      </div>
    </MasterLayout>
  )
}
