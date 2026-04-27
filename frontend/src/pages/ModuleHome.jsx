import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function ModuleHome({ title, description }) {
  const navigate = useNavigate()
  const { modules, user, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="module-page">
      <section className="module-home-card">
        <header className="module-page-header">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>

          <div className="master-user">
            <span>{user?.name}</span>
            <button type="button" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </header>

        <div className="dashboard-panel">
          <h2>Acesso liberado</h2>
          <p>Este modulo esta ativo para a empresa {user?.company_name || user?.company_id}.</p>
        </div>

        {modules.length > 1 && (
          <button className="button-secondary" type="button" onClick={() => navigate('/select-module')}>
            Trocar modulo
          </button>
        )}
      </section>
    </main>
  )
}

export default ModuleHome
