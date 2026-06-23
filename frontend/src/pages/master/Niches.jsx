import { useState } from 'react'
import MasterLayout from '../../components/master/MasterLayout'
import PageHeader from '../../components/master/PageHeader'
import SectionCard from '../../components/master/SectionCard'
import StatusBadge from '../../components/master/StatusBadge'
import MockNotice from '../../components/master/MockNotice'
import { showToast } from '../../components/master/Toast'

const VERTICALS = [
  {
    id: 'barber', name: 'BarberGestor', description: 'Gestão completa para barbearias — agendamento, colaboradores, financeiro, caixa.',
    status: 'production', maturity: 'produção', modules: 14, clients: 128, color: '#8cff4f',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0l-14 0m2-12h2m-2 4h2m6-4h2m-2 4h2'
  },
  {
    id: 'clima', name: 'ClimaGestor', description: 'Monitoramento climático para agronegócio — previsões, alertas, histórico.',
    status: 'partial', maturity: 'parcial', modules: 3, clients: 12, color: '#3b82f6',
    icon: 'M12 3v1m0 16v1m8-9h-1M4 12H3m15.36-6.36l-.71.71M6.36 17.64l-.71.71M17.64 17.64l.71.71M6.36 6.36l.71.71'
  },
  {
    id: 'terra', name: 'TerraGestor', description: 'Gestão de propriedades rurais — áreas, cultivos, insumos, produção.',
    status: 'partial', maturity: 'parcial', modules: 5, clients: 8, color: '#22c55e',
    icon: 'M3.5 2L12 12m0 0l8.5-10M12 12v10'
  },
  {
    id: 'pet', name: 'PetGestor', description: 'Gestão para petshops e clínicas veterinárias — agendamento, clientes, serviços.',
    status: 'future', maturity: 'futuro', modules: 0, clients: 0, color: '#a78bfa',
    icon: 'M14 7h.01M10 7h.01M6 11h.01M18 11h.01M12 21c7 0 9-5 9-9a7 7 0 00-14 0c0 4 2 9 9 9z'
  },
  {
    id: 'auto', name: 'AutoGestor', description: 'Gestão automotiva — oficinas, concessionárias, peças, serviços.',
    status: 'future', maturity: 'futuro', modules: 0, clients: 0, color: '#f59e0b',
    icon: 'M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M4 7l2 1M4 7l2-1M4 7v2.5M12 21l2-1m-2 1l-2-1m2 1v-2.5'
  },
  {
    id: 'agro', name: 'AgroGestor', description: 'Gestão agroindustrial — safras, insumos, maquinário, logística.',
    status: 'future', maturity: 'futuro', modules: 0, clients: 0, color: '#84cc16',
    icon: 'M3 21l12-12m0 0l6-6m-6 6l-6 6m6-6l6 6m-6-6l-6-6'
  },
  {
    id: 'hotel', name: 'HotelGestor', description: 'Gestão hoteleira — reservas, check-in/out, governança, financeiro.',
    status: 'future', maturity: 'futuro', modules: 0, clients: 0, color: '#f472b6',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m2-12h2m-2 4h2m6-4h2m-2 4h2'
  }
]

const MATURITY_LABELS = {
  'produção': { label: 'Produção', color: 'green' },
  'parcial': { label: 'Parcial', color: 'yellow' },
  'futuro': { label: 'Futuro', color: 'gray' }
}

export default function Niches() {
  const [selected, setSelected] = useState(null)

  function handleAction(action, niche) {
    showToast(`[Mock] Ação "${action}" executada em "${niche.name}". Endpoint futuro.`, 'info')
  }

  return (
    <MasterLayout title="Nichos">
      <PageHeader
        title="Nichos / Verticais"
        description="Gerencie os nichos de mercado da plataforma MultGestor."
      />

      <MockNotice />

      <div className="master-niche-grid">
        {VERTICALS.map(niche => (
          <SectionCard key={niche.id} className={selected === niche.id ? 'master-niche-card--selected' : ''}>
            <div className="master-niche-card" onClick={() => setSelected(selected === niche.id ? null : niche.id)}>
              <div className="master-niche-card-top">
                <span className="master-niche-icon" style={{ background: `${niche.color}18`, border: `1px solid ${niche.color}44`, color: niche.color }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
                    <path d={niche.icon} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <StatusBadge status={niche.status} label={MATURITY_LABELS[niche.maturity]?.label || niche.maturity} customColor={MATURITY_LABELS[niche.maturity]?.color} />
              </div>
              <strong className="master-niche-card-name">{niche.name}</strong>
              <p className="master-niche-card-desc">{niche.description}</p>
              <div className="master-niche-card-meta">
                <span>{niche.modules} módulo{niche.modules !== 1 ? 's' : ''}</span>
                <span>{niche.clients} cliente{niche.clients !== 1 ? 's' : ''}</span>
              </div>
            </div>
            {selected === niche.id && (
              <div className="master-niche-card-actions">
                <button className="master-btn master-btn--sm master-btn--primary" type="button" onClick={() => handleAction('ativar', niche)}>Ativar</button>
                <button className="master-btn master-btn--sm master-btn--secondary" type="button" onClick={() => handleAction('configurar', niche)}>Configurar</button>
                <button className="master-btn master-btn--sm master-btn--ghost" type="button" onClick={() => handleAction('detalhes', niche)}>Detalhes</button>
              </div>
            )}
          </SectionCard>
        ))}
      </div>
    </MasterLayout>
  )
}
