import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px',
        background: 'linear-gradient(160deg, #f5f7fb 0%, #e8efe7 100%)'
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '720px',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '48px 40px',
          boxShadow: '0 24px 80px rgba(35, 52, 71, 0.12)',
          textAlign: 'center'
        }}
      >
        <span
          style={{
            display: 'inline-block',
            marginBottom: '16px',
            padding: '8px 14px',
            borderRadius: '999px',
            background: '#e9f3ea',
            color: '#1f5f3b',
            fontSize: '0.92rem',
            fontWeight: 700
          }}
        >
          MultGestor
        </span>

        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
            lineHeight: 1.05,
            color: '#132033'
          }}
        >
          MultGestor
        </h1>

        <p
          style={{
            margin: '20px auto 0',
            maxWidth: '560px',
            fontSize: '1.08rem',
            lineHeight: 1.7,
            color: '#445266'
          }}
        >
          Sistema de gestão multi-nichos para empresas brasileiras
        </p>

        <div
          style={{
            marginTop: '32px',
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <Link
            to="/master/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '220px',
              padding: '14px 22px',
              borderRadius: '14px',
              background: '#132033',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700
            }}
          >
            Acessar Master Admin
          </Link>

          <Link
            to="/barber"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '220px',
              padding: '14px 22px',
              borderRadius: '14px',
              background: '#ffffff',
              color: '#132033',
              textDecoration: 'none',
              fontWeight: 700,
              border: '1px solid #cfd9e6'
            }}
          >
            Conhecer BarberGestor
          </Link>
        </div>
      </section>
    </main>
  )
}

export default LandingPage
