import { useEffect, useState } from 'react'
import api from '../services/api'
import MasterLayout from '../components/master/MasterLayout'
import PageHeader from '../components/master/PageHeader'
import SectionCard from '../components/master/SectionCard'
import StatCard from '../components/master/StatCard'

const initialDashboard = {
  totalCompanies: 0,
  totalModules: 0,
  totalActiveModules: 0,
  totalActiveSubscriptions: 0,
  totalPendingActivations: 0,
  recentCompanies: [],
  recentModules: []
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value))
}

function MasterDashboard() {
  const [dashboard, setDashboard] = useState(initialDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get('/master/dashboard')
        setDashboard(response.data.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel carregar o dashboard master')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const cards = [
    { label: 'Empresas', value: dashboard.totalCompanies },
    { label: 'Modulos', value: dashboard.totalModules },
    { label: 'Modulos ativos', value: dashboard.totalActiveModules },
    { label: 'Assinaturas ativas', value: dashboard.totalActiveSubscriptions },
    { label: 'Ativacoes pendentes', value: dashboard.totalPendingActivations }
  ]

  return (
    <MasterLayout title="Dashboard">
      <PageHeader
        title="Dashboard Master"
        description="Controle central da plataforma MultGestor V2."
      />

      {loading && <SectionCard><p>Carregando dashboard...</p></SectionCard>}
      {!loading && error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          <section className="master-premium-stats">
            {cards.map((card) => (
              <StatCard key={card.label} label={card.label} value={card.value} />
            ))}
          </section>

          <section className="master-premium-two-columns">
            <SectionCard title="Empresas recentes" meta={`${dashboard.recentCompanies.length} registros`}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Nicho</th>
                      <th>Status</th>
                      <th>Criada em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentCompanies.map((company) => (
                      <tr key={company.id}>
                        <td>{company.name}</td>
                        <td>{company.niche_type || '-'}</td>
                        <td>{company.status || '-'}</td>
                        <td>{formatDate(company.created_at)}</td>
                      </tr>
                    ))}

                    {dashboard.recentCompanies.length === 0 && (
                      <tr>
                        <td colSpan="4">Nenhuma empresa encontrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Modulos recentes" meta={`${dashboard.recentModules.length} registros`}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Modulo</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th>Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentModules.map((module) => (
                      <tr key={module.id}>
                        <td>{module.name}</td>
                        <td>{module.slug}</td>
                        <td>{module.is_active ? 'Ativo' : 'Inativo'}</td>
                        <td>{formatDate(module.created_at)}</td>
                      </tr>
                    ))}

                    {dashboard.recentModules.length === 0 && (
                      <tr>
                        <td colSpan="4">Nenhum modulo encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </section>
        </>
      )}
    </MasterLayout>
  )
}

export default MasterDashboard
