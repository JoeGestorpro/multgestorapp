import { X, AlertTriangle, RefreshCw } from 'lucide-react'

function PaymentErrorModal({ open, onClose, onRetry, errorMessage }) {
  if (!open) return null

  return (
    <div className="at-modal-root">
      <button
        aria-label="Fechar"
        className="at-modal-backdrop"
        onClick={onClose}
        type="button"
      />
      <div className="at-modal at-modal-error" role="dialog" aria-modal="true">
        <button
          className="at-modal-close"
          onClick={onClose}
          type="button"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>

        <div className="at-modal-body">
          <div className="at-modal-error-icon">
            <AlertTriangle size={28} />
          </div>
          <h3>Erro no pagamento</h3>
          <p>{errorMessage || 'O pagamento não foi processado. Verifique os dados e tente novamente.'}</p>
        </div>

        <div className="at-modal-actions">
          <button
            className="at-modal-btn at-modal-btn-primary"
            onClick={onRetry}
            type="button"
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
          <button
            className="at-modal-btn at-modal-btn-ghost"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentErrorModal
