import { useEffect, useState } from 'react'
import MasterLayout from '../../components/master/MasterLayout'
import PageHeader from '../../components/master/PageHeader'
import SectionCard from '../../components/master/SectionCard'
import StatusBadge from '../../components/master/StatusBadge'
import MockNotice from '../../components/master/MockNotice'
import api from '../../services/api'

const MOCK_HEALTH = {
  backend: { status: 'healthy', latency: '42ms', uptime: '99.8%', lastCheck: new Date().toISOString() },
  database: { status: 'healthy', connections: 23, poolUsage: '34%', lastCheck: new Date().toISOString() },
  cache: { status: 'healthy', hitRate: '87%', memory: '62%', lastCheck: new Date().toISOString() },
  backup: { status: 'healthy', lastRun: '2026-06-21 03:00 UTC', type: 'B2 (Backblaze)', size: '1.2 GB' },
  fila: { status: 'warning', pending: 47, failed: 3, lastCheck: new Date().toISOString() },
  auth: { status: 'healthy', activeSessions: 89, lastCheck: new Date().toISOString() }
}

function HealthRow({ label, status, metrics }) {
  const statusMap = {
    healthy: { badge: 'success', label: 'Saudável' },
    warning: { badge: 'warning', label: 'Atenção' },
    error: { badge: 'error', label: 'Crítico' },
    offline: { badge: 'error', label: 'Offline' }
  }
  const s = statusMap[status] || statusMap.offline

  return (
    <div className={`master-health-row master-health-row--${status}`}>
      <div className="master-health-row-header">
        <StatusBadge status={s.badge} label={s.label} />
        <strong>{label}</strong>
        <span className="master-health-row-latency">{metrics?.latency || metrics?.lastRun || metrics?.lastCheck ? '' : ''}</span>
      </div>
      <div className="master-health-row-metrics">
        {Object.entries(metrics || {}).map(([key, value]) => (
          <div key={key}>
            <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            <strong>{String(value).slice(0, 30)}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HealthStatus() {
  const [health, setHealth] = useState(MOCK_HEALTH)
  const [backendOnline, setBackendOnline] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.get('health/deep', { timeout: 5000 })
        if (res.data) {
          setBackendOnline(true)
          setHealth(prev => ({
            ...prev,
            backend: { ...prev.backend, status: 'healthy', latency: `${res.data.duration || '?'}ms` }
          }))
        }
      } catch {
        setBackendOnline(false)
      } finally {
        setChecking(false)
      }
    }
    checkHealth()
  }, [])

  return (
    <MasterLayout title="Saúde / Status">
      <PageHeader
        title="Saúde / Status"
        description="Monitoramento da infraestrutura e serviços da plataforma."
      />

      <MockNotice />

      {checking ? (
        <SectionCard><p style={{ color: 'var(--master-muted)' }}>Verificando saúde dos serviços…</p></SectionCard>
      ) : (
        <>
          <div className="master-health-status-bar">
            <div className="master-health-status-summary">
              <span>Backend</span>
              <StatusBadge status={backendOnline ? 'success' : 'error'} label={backendOnline ? 'Online' : 'Offline'} />
              {backendOnline && <small style={{ color: 'var(--master-muted)' }}>Respondeu em ~42ms</small>}
            </div>
            <div className="master-health-status-summary">
              <span>Banco</span>
              <StatusBadge status="success" label="Saudável" />
            </div>
            <div className="master-health-status-summary">
              <span>Backup (B2)</span>
              <StatusBadge status="success" label="Último: 21/06" />
            </div>
          </div>

          <div className="master-health-grid">
            {Object.entries(health).map(([key, data]) => (
              <SectionCard key={key} title={key.charAt(0).toUpperCase() + key.slice(1)}>
                <HealthRow label={key} status={data.status} metrics={(() => {
                  const { status, ...rest } = data
                  return rest
                })()} />
              </SectionCard>
            ))}
          </div>
        </>
      )}
    </MasterLayout>
  )
}
