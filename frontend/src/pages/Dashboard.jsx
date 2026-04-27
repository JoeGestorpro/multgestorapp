import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Bem-vindo ao MultGestor V2.</p>
        </div>

        <button type="button" onClick={handleLogout}>
          Sair
        </button>
      </header>

      <section className="dashboard-panel">
        <h2>Usuario autenticado</h2>

        <div className="user-grid">
          <span>Nome</span>
          <strong>{user?.name}</strong>

          <span>Email</span>
          <strong>{user?.email}</strong>

          <span>Perfil</span>
          <strong>{user?.role}</strong>

          <span>Empresa</span>
          <strong>{user?.company_name || user?.company_id}</strong>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
