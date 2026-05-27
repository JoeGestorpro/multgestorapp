import { money, fullDate } from '../utils/formatters'
import { BarberButton, BarberIcon, BarberModal } from '../../../components/barber/BarberUI'

export default function DeleteSaleModal({
  deleteSaleId,
  deleteSaleTarget,
  deleteReason,
  setDeleteReason,
  deletePin,
  setDeletePin,
  deleteSale,
  setDeleteSaleId
}) {
  return (
    <BarberModal
      onClose={() => setDeleteSaleId('')}
      open={Boolean(deleteSaleId)}
      size="small"
      subtitle={deleteSaleTarget ? `Atendimento de ${money(deleteSaleTarget.total_amount)} em ${fullDate(deleteSaleTarget.created_at)}` : ''}
      title="Cancelar atendimento"
    >
      <div className="barber-modal-content">
        <div className="barber-form-block">
          <label htmlFor="delete-reason">Motivo do cancelamento</label>
          <textarea
            className="barber-textarea"
            id="delete-reason"
            onChange={(event) => setDeleteReason(event.target.value)}
            rows="4"
            value={deleteReason}
          />
        </div>
        <div className="barber-form-grid">
          <div className="barber-form-block">
            <label htmlFor="delete-pin">PIN admin</label>
            <input
              className="barber-input"
              id="delete-pin"
              inputMode="numeric"
              onChange={(event) => setDeletePin(event.target.value)}
              type="password"
              value={deletePin}
            />
          </div>
        </div>
        <div className="barber-modal-actions">
          <BarberButton onClick={() => setDeleteSaleId('')} type="button" variant="ghost">
            Cancelar
          </BarberButton>
          <BarberButton onClick={deleteSale} type="button" variant="danger">
            <BarberIcon name="trash" />
            <span>Cancelar atendimento</span>
          </BarberButton>
        </div>
      </div>
    </BarberModal>
  )
}
