import LockedFeature from '../../../../../components/common/LockedFeature'

export default function TeamPermissionsSection({
  form,
  onChange,
  canUseExtraPermissionsFeature,
  getLockedFeatureMessage,
  handleLockedFeature,
  isAdmin
}) {
  return (
    <div className="barber-form-grid">
      <div className="barber-form-block barber-form-block-full">
        <label>Permissoes</label>
        <LockedFeature
          locked={!canUseExtraPermissionsFeature}
          message={getLockedFeatureMessage('extra_permissions')}
          onLockedClick={handleLockedFeature}
        >
          <div className="barber-permission-list">
            <label className="barber-permission-item">
              <input
                checked={form.canViewOwnDashboard}
                name="canViewOwnDashboard"
                onChange={onChange}
                type="checkbox"
              />
              <span>Pode acessar dashboard proprio</span>
            </label>
            <label className="barber-permission-item">
              <input
                checked={form.canViewOwnReports}
                name="canViewOwnReports"
                onChange={onChange}
                type="checkbox"
              />
              <span>Pode visualizar relatorio pessoal</span>
            </label>
            <label className="barber-permission-item">
              <input
                checked={form.canLaunchSales}
                name="canLaunchSales"
                onChange={onChange}
                type="checkbox"
              />
              <span>Pode lancar vendas pelo celular</span>
            </label>
          </div>
        </LockedFeature>
      </div>

      {isAdmin && (
        <div className="barber-form-block barber-form-block-full">
          <label className="barber-permission-item">
            <input
              checked={form.canMakeBarter}
              name="canMakeBarter"
              onChange={onChange}
              type="checkbox"
            />
            <span>
              Pode lancar permuta
              <small className="barber-form-hint">Permite registrar atendimentos como permuta. A comissao da permuta sera descontada do saldo do colaborador e pode deixar o saldo negativo.</small>
            </span>
          </label>
        </div>
      )}
    </div>
  )
}
