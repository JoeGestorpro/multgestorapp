import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function NoModules() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="page-center">
      <section className="auth-card">
        <h1>Nenhum modulo ativo</h1>
        <p>Sua empresa ainda nao possui modulos liberados. Fale com o administrador da plataforma.</p>
        <button type="button" onClick={handleLogout}>
          Sair
        </button>
      </section>
    </main>
  )
}

export default NoModules
