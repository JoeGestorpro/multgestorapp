import { memo } from 'react'

const PageLoader = memo(function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f4f6f8',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #d9e0e8',
          borderTopColor: '#0f766e',
          borderRadius: '50%',
          animation: 'page-loader-spin 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes page-loader-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
})

export default PageLoader
