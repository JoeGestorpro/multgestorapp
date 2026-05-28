import { Component } from 'react'
import * as sentry from '../lib/sentry.js'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    if (sentry.isEnabled()) {
      sentry.captureException(error, { tags: { component: 'ErrorBoundary' } })
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Erro capturado:', error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#1f2933',
            background: '#f4f6f8',
          }}
        >
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>
            Algo deu errado
          </h2>
          <p style={{ color: '#667085', marginBottom: '1.5rem', maxWidth: '400px' }}>
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              background: '#0f766e',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Recarregar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
