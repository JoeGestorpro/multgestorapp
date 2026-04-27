import { useEffect, useState } from 'react'
import api from '../services/api'
import MasterLayout from '../components/master/MasterLayout'
import PageHeader from '../components/master/PageHeader'
import SectionCard from '../components/master/SectionCard'

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '-'
}

function Activations() {
  const [activations, setActivations] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadActivations(nextStatus = status) {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/master/activations', {
        params: { status: nextStatus || undefined }
      })
      setActivations(response.data.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar ativacoes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadActivations('')
    }, 0)

    return () => window.clearTimeout(timeoutId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function resend(activation) {
    setError('')
    setSuccess('')

    try {
      await api.patch(`/master/activations/${activation.id}/resend`)
      setSuccess('Ativacao reenviada com sucesso')
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel reenviar a ativacao')
    }
  }

  async function cancel(activation) {
    if (!window.confirm('Cancelar esta ativacao?')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await api.patch(`/master/activations/${activation.id}/cancel`)
      setSuccess('Ativacao cancelada com sucesso')
      await loadActivations(status)
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel cancelar a ativacao')
    }
  }

  return (
    <MasterLayout title="Ativacoes">
      <PageHeader
        title="Ativacoes"
        description="Acompanhe convites de primeiro acesso pendentes, concluidos e expirados."
      />

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <SectionCard title="Historico de ativacoes" meta={`${activations.length} registros`}>
        <form className="master-filter-row" onSubmit={(event) => { event.preventDefault(); loadActivations(status) }}>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="used">Concluidas</option>
            <option value="expired">Expiradas</option>
          </select>
          <button type="submit">Filtrar</button>
        </form>

        {loading ? (
          <p>Carregando ativacoes...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Expira em</th>
                  <th>Criado em</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {activations.map((activation) => (
                  <tr key={activation.id}>
                    <td>{activation.company_name}</td>
                    <td>{activation.user_name}</td>
                    <td>{activation.user_email}</td>
                    <td>{activation.profile}</td>
                    <td>{activation.status}</td>
                    <td>{formatDate(activation.expires_at)}</td>
                    <td>{formatDate(activation.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" disabled={activation.status !== 'pending'} onClick={() => resend(activation)}>Reenviar</button>
                        <button className="button-danger" type="button" disabled={activation.status !== 'pending'} onClick={() => cancel(activation)}>Cancelar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activations.length === 0 && (
                  <tr>
                    <td colSpan="8">Nenhuma ativacao encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </MasterLayout>
  )
}

export default Activations
