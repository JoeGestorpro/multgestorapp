import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function ModuleSelect() {
  const navigate = useNavigate()
  const { modules, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="module-page">
      <section className="module-select-card">
        <div className="module-page-header">
          <div>
            <h1>Escolha um modulo</h1>
            <p>Selecione qual gestor deseja acessar agora.</p>
          </div>
          <button type="button" onClick={handleLogout}>
            Sair
          </button>
        </div>

        <div className="module-choice-grid">
          {modules.map((module) => (
            <button
              className="module-choice"
              key={module.slug}
              onClick={() => navigate(`/${module.slug}`)}
              type="button"
            >
              <strong>{module.name}</strong>
              <span>/{module.slug}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

export default ModuleSelect
