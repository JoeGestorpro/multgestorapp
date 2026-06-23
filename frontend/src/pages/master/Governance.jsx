import { useState } from 'react'
import MasterLayout from '../../components/master/MasterLayout'
import PageHeader from '../../components/master/PageHeader'
import SectionCard from '../../components/master/SectionCard'
import StatusBadge from '../../components/master/StatusBadge'
import MockNotice from '../../components/master/MockNotice'
import { showToast } from '../../components/master/Toast'

const RISKS = [
  { id: 'CRITICAL-1', title: 'CORS completamente aberto', severity: 'critical', area: 'Backend', detail: 'Middleware CORS permite qualquer origem — risco de segurança em produção.' },
  { id: 'CRITICAL-2', title: 'columnExists não implementado', severity: 'critical', area: 'Database', detail: 'Função columnExists pode causar erros em migrações futuras.' },
  { id: 'CRITICAL-3', title: 'OutboxWorker não inicializado', severity: 'critical', area: 'Infra', detail: 'Worker de fila de eventos nunca é iniciado — eventos não são processados.' },
  { id: 'RK-01', title: 'barber.service.js god class', severity: 'critical', area: 'Código', detail: '~6.500 linhas em um único arquivo — manutenção severamente impactada.' },
  { id: 'RK-02', title: 'Barber.jsx monolítico', severity: 'critical', area: 'Frontend', detail: '~4.652 linhas em um único componente React.' },
  { id: 'RK-03', title: 'Repository layer ausente', severity: 'critical', area: 'Arquitetura', detail: 'Acesso a dados espalhado pelos services — sem camada de repositório.' },
  { id: 'RK-04', title: 'Event bus ausente', severity: 'critical', area: 'Arquitetura', detail: 'Eventos são tratados inline — sem sistema de publicação/assinatura.' },
  { id: 'RK-05', title: 'Multi-tenant manual (data leak)', severity: 'high', area: 'Segurança', detail: 'Filtro manual por tenant_id em cada query — risco de vazamento entre clientes.' },
  { id: 'RK-06', title: 'JWT em localStorage', severity: 'high', area: 'Segurança', detail: 'Token armazenado em localStorage — vulnerável a XSS.' },
  { id: 'RK-07', title: 'OutboxWorker não inicializado', severity: 'high', area: 'Infra', detail: 'Processamento de eventos assíncronos desabilitado.' },
]

const DECISIONS = [
  { id: 'P4', title: 'Nunca colocar lógica crítica no frontend', detail: 'Frontend é cliente descartável — toda lógica de negócio fica no backend.' },
  { id: 'P9', title: 'Nunca expor tokens no frontend', detail: 'Integrações mostram status, nunca secrets ou tokens de acesso.' },
  { id: 'P2', title: 'PostgreSQL como fonte única de verdade', detail: 'Nenhum cache ou storage externo como fonte primária.' },
  { id: 'P7', title: 'Toda empresa começa como trial', detail: 'Modelo de aquisição freemium — trial de 14 dias para todos os planos.' },
]

const READINESS_ITEMS = [
  { label: 'Logs centralizados', done: true },
  { label: 'Monitoramento de erros (Sentry)', done: true },
  { label: 'Backup automatizado (B2)', done: true },
  { label: 'CI/CD pipeline', done: false },
  { label: 'Testes automatizados (cobertura > 60%)', done: false },
  { label: 'Documentação de API (Swagger)', done: false },
  { label: 'Rate limiting', done: false },
  { label: 'Auditoria de eventos', done: false },
]

export default function Governance() {
  const [, setShowArch] = useState(false)

  function handleArchive(riskId) {
    showToast(`[Mock] Risco ${riskId} arquivado. Ação preparada para backend futuro.`, 'info')
  }

  return (
    <MasterLayout title="Governança">
      <PageHeader title="Governança" description="Missão, riscos ativos, decisões arquiteturais e readiness checklist da plataforma." />
      <MockNotice />

      <div className="master-governance-mission">
        <SectionCard title="Missão & Visão">
          <div className="master-governance-mission-content">
            <div>
              <span className="master-governance-mission-label">Missão</span>
              <p>Democratizar a gestão empresarial multi-nicho através de uma plataforma SaaS modular, permitindo que pequenos e médios negócios tenham acesso a ferramentas de gestão de nível enterprise.</p>
            </div>
            <div>
              <span className="master-governance-mission-label">Visão</span>
              <p>Ser o maior ecossistema de gestão verticalizada da América Latina, com presença em 7+ nichos de mercado até 2030.</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Riscos Ativos" meta={`${RISKS.length} riscos registrados`}>
        <div className="master-governance-risks">
          {RISKS.map(risk => (
            <div key={risk.id} className={`master-governance-risk master-governance-risk--${risk.severity}`}>
              <div className="master-governance-risk-header">
                <strong>{risk.id}</strong>
                <StatusBadge status={risk.severity} label={risk.severity === 'critical' ? 'Crítico' : 'Alto'} />
                <span className="master-governance-risk-area">{risk.area}</span>
              </div>
              <p className="master-governance-risk-title">{risk.title}</p>
              <p className="master-governance-risk-detail">{risk.detail}</p>
              <button className="master-btn master-btn--sm master-btn--ghost" type="button" onClick={() => handleArchive(risk.id)}>Arquivar</button>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="master-premium-two-columns">
        <SectionCard title="Decisões Arquiteturais" meta={`${DECISIONS.length} registradas`}>
          <div className="master-governance-decisions">
            {DECISIONS.map(d => (
              <div key={d.id} className="master-governance-decision">
                <strong>{d.id}: {d.title}</strong>
                <p>{d.detail}</p>
              </div>
            ))}
            <button className="master-btn master-btn--sm master-btn--ghost" type="button" onClick={() => setShowArch(true)}>
              Ver todas as 13 decisões
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Readiness Checklist" meta={`${READINESS_ITEMS.filter(i => i.done).length}/${READINESS_ITEMS.length} concluídos`}>
          <div className="master-governance-readiness">
            {READINESS_ITEMS.map(item => (
              <div key={item.label} className={`master-governance-readiness-item ${item.done ? 'done' : ''}`}>
                <span className="master-governance-readiness-check">{item.done ? '✓' : '○'}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </MasterLayout>
  )
}
