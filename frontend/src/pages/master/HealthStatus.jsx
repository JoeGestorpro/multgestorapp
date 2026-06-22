import { useEffect, useState } from 'react'
import MasterLayout from '../../components/master/MasterLayout'
import PageHeader from '../../components/master/PageHeader'
import SectionCard from '../../components/master/SectionCard'
import StatusBadge from '../../components/master/StatusBadge'
import api from '../../services/api'

// Rota de DADO REAL: consome /api/health/deep. Nada é simulado aqui.
// Subsistemas ainda não expostos pelo endpoint aparecem como "não monitorado".
const STATUS_BADGE = {
  ok: { badge: 'success', label: 'Saudável' },
  healthy: { badge: 'success', label: 'Saudável' },
  degraded: { badge: 'warning', label: 'Degradado' },
  warning: { badge: 'warning', label: 'Atenção' },
  error: { badge: 'error', label: 'Crítico' },
  unhealthy: { badge: 'error', label: 'Crítico' },
}

function badgeFor(status) {
  return STATUS_BADGE[status] || { badge: 'gray', label: status || 'Indisponível' }
}

function CheckRow({ name, data }) {
  const { status, ...metrics } = data || {}
  const s = badgeFor(status)
  const entries = Object.entries(metrics)
  return (
    <div className={`master-health-row master-health-row--${status || 'offline'}`}>
      <div className="master-health-row-header">
        <StatusBadge status={s.badge} label={s.label} />
        <strong>{name}</strong>
      </div>
      <div className="master-health-row-metrics">
        {entries.length === 0 ? (
          <div><span>—</span><strong>sem métricas</strong></div>
        ) : entries.map(([key, value]) => (
          <div key={key}>
            <span>{key.replace(/_/g, ' ').trim()}</span>
            <strong>{String(value).slice(0, 40)}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HealthStatus() {
  const [data, setData] = useState(null)
  const [backendOnline, setBackendOnline] = useState(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    async function checkHealth() {
      try {
        const res = await api.get('health/deep', { timeout: 5000 })
        if (!active) return
        setData(res.data || null)
        setBackendOnline(true)
      } catch (err) {
        if (!active) return
        setBackendOnline(false)
        setError(err?.message || 'Backend indisponível')
      } finally {
        if (active) setChecking(false)
      }
    }
    checkHealth()
    return () => { active = false }
  }, [])

  const checks = data?.checks || {}
  const overall = data?.status ? badgeFor(data.status) : null

  return (
    <MasterLayout title="Saúde / Status">
      <PageHeader
        title="Saúde / Status"
        description="Monitoramento real da infraestrutura via /api/health/deep."
      />

      <div className="master-health-status-bar">
        <div className="master-health-status-summary">
          <span>Backend</span>
          <StatusBadge
            status={backendOnline === null ? 'gray' : backendOnline ? 'success' : 'error'}
            label={backendOnline === null ? 'Verificando…' : backendOnline ? 'Online' : 'Offline'}
          />
        </div>
        {backendOnline && data && (
          <>
            <div className="master-health-status-summary">
              <span>Status geral</span>
              <StatusBadge status={overall.badge} label={overall.label} />
            </div>
            <div className="master-health-status-summary">
              <span>Uptime</span>
              <strong>{data.uptime_seconds != null ? `${Math.floor(data.uptime_seconds / 60)} min` : '—'}</strong>
            </div>
            <div className="master-health-status-summary">
              <span>Versão</span>
              <strong>{data.version || '—'}</strong>
            </div>
          </>
        )}
      </div>

      {checking ? (
        <SectionCard><p style={{ color: 'var(--master-muted)' }}>Verificando saúde dos serviços…</p></SectionCard>
      ) : backendOnline ? (
        <>
          <div className="master-health-grid">
            {Object.entries(checks).map(([name, cdata]) => (
              <SectionCard key={name} title={name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}>
                <CheckRow name={name} data={cdata} />
              </SectionCard>
            ))}
          </div>
          <SectionCard>
            <p style={{ color: 'var(--master-muted)' }}>
              Subsistemas ainda não expostos por <code>/api/health/deep</code> (ex.: backup, cache,
              sessões de auth) aparecerão aqui quando o endpoint os incluir. Nenhum dado é simulado nesta tela.
            </p>
          </SectionCard>
        </>
      ) : (
        <SectionCard title="Backend indisponível">
          <p style={{ color: 'var(--master-muted)' }}>
            Não foi possível conectar ao backend (<code>/api/health/deep</code>). Aguardando backend.
            {error ? ` Detalhe: ${error}` : ''}
          </p>
        </SectionCard>
      )}
    </MasterLayout>
  )
}
