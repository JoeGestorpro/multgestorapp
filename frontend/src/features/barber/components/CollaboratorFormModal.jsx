import CollaboratorAvatar from '../../../components/barber/CollaboratorAvatar'
import LockedFeature from '../../../components/common/LockedFeature'
import { BarberButton, BarberIcon, BarberModal } from '../../../components/barber/BarberUI'

export default function CollaboratorFormModal({
  collaboratorModalOpen,
  closeCollaboratorModal,
  isEditingCollaborator,
  collaboratorForm,
  updateCollaboratorForm,
  updateCollaboratorAvatar,
  removeCollaboratorAvatarPreview,
  createCollaborator,
  canUseExtraPermissionsFeature,
  getLockedFeatureMessage,
  handleLockedFeature,
  isAdmin
}) {
  return (
    <BarberModal
      onClose={closeCollaboratorModal}
      open={collaboratorModalOpen}
      subtitle="Cadastro com login proprio, permissoes de acesso e controle de lancamento pelo celular."
      title={isEditingCollaborator ? 'Editar colaborador' : 'Novo colaborador'}
    >
      <div className="barber-modal-content">
        <form className="barber-panel-stack" onSubmit={createCollaborator}>
          <div className="barber-avatar-upload">
            <CollaboratorAvatar
              avatarUrl={collaboratorForm.avatarDataUrl || collaboratorForm.avatarUrl}
              name={collaboratorForm.name || 'Colaborador'}
              selected={Boolean(collaboratorForm.avatarDataUrl || collaboratorForm.avatarUrl)}
              size="xl"
            />
            <div className="barber-avatar-upload-copy">
              <strong>Foto do colaborador</strong>
              <p>Essa foto aparecera na agenda publica para seus clientes escolherem o profissional.</p>
              <div className="barber-avatar-upload-actions">
                <label className="barber-button barber-button-ghost" htmlFor="collaborator-avatar-input">
                  {collaboratorForm.avatarDataUrl || collaboratorForm.avatarUrl ? 'Trocar foto' : 'Adicionar foto'}
                </label>
                {(collaboratorForm.avatarDataUrl || collaboratorForm.avatarUrl) && (
                  <BarberButton onClick={removeCollaboratorAvatarPreview} type="button" variant="ghost">
                    Remover
                  </BarberButton>
                )}
              </div>
              <input
                accept="image/jpeg,image/png,image/webp"
                className="barber-avatar-upload-input"
                id="collaborator-avatar-input"
                onChange={updateCollaboratorAvatar}
                type="file"
              />
              <small className="barber-form-hint">Formatos aceitos: JPG, PNG e WEBP com ate 2MB.</small>
            </div>
          </div>
          <div className="barber-form-grid">
            <div className="barber-form-block">
              <label htmlFor="collaborator-name">Nome</label>
              <input
                className="barber-input"
                id="collaborator-name"
                name="name"
                onChange={updateCollaboratorForm}
                required
                value={collaboratorForm.name}
              />
            </div>
            <div className="barber-form-block">
              <label htmlFor="collaborator-email">Email</label>
              <input
                className="barber-input"
                id="collaborator-email"
                name="email"
                onChange={updateCollaboratorForm}
                required
                type="email"
                value={collaboratorForm.email}
              />
            </div>
            <div className="barber-form-block">
              <label htmlFor="collaborator-password">Senha inicial {isEditingCollaborator ? '(opcional)' : ''}</label>
              <input
                className="barber-input"
                id="collaborator-password"
                name="password"
                onChange={updateCollaboratorForm}
                required={!isEditingCollaborator}
                type="password"
                value={collaboratorForm.password}
              />
            </div>
            <div className="barber-form-block">
              <label htmlFor="collaborator-phone">Telefone</label>
              <input
                className="barber-input"
                id="collaborator-phone"
                name="phone"
                onChange={updateCollaboratorForm}
                value={collaboratorForm.phone}
              />
            </div>
            <div className="barber-form-block">
              <label htmlFor="collaborator-commission-type">Tipo de comissao</label>
              <select
                className="barber-select"
                id="collaborator-commission-type"
                name="commissionType"
                onChange={updateCollaboratorForm}
                value={collaboratorForm.commissionType}
              >
                <option value="percentage">Percentual</option>
                <option value="fixed">Valor fixo</option>
              </select>
            </div>
            <div className="barber-form-block">
              <label htmlFor="commission-rate">Comissao</label>
              <input
                className="barber-input"
                id="commission-rate"
                min="0"
                name="commissionRate"
                onChange={updateCollaboratorForm}
                step="0.01"
                type="number"
                value={collaboratorForm.commissionRate}
              />
            </div>
            <div className="barber-form-block">
              <label htmlFor="collaborator-status">Status</label>
              <select
                className="barber-select"
                id="collaborator-status"
                name="isActive"
                onChange={updateCollaboratorForm}
                value={String(collaboratorForm.isActive)}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div className="barber-form-block barber-form-block-full">
              <label>Agenda publica</label>
              <label className="barber-permission-item">
                <input
                  checked={collaboratorForm.availableForBooking}
                  name="availableForBooking"
                  onChange={updateCollaboratorForm}
                  type="checkbox"
                />
                <span>
                  Disponivel para agendamentos
                  <small className="barber-form-hint">Quando ativado, este colaborador aparece no link publico de agendamento da barbearia.</small>
                </span>
              </label>
            </div>
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
                      checked={collaboratorForm.canViewOwnDashboard}
                      name="canViewOwnDashboard"
                      onChange={updateCollaboratorForm}
                      type="checkbox"
                    />
                    <span>Pode acessar dashboard proprio</span>
                  </label>
                  <label className="barber-permission-item">
                    <input
                      checked={collaboratorForm.canViewOwnReports}
                      name="canViewOwnReports"
                      onChange={updateCollaboratorForm}
                      type="checkbox"
                    />
                    <span>Pode visualizar relatorio pessoal</span>
                  </label>
                  <label className="barber-permission-item">
                    <input
                      checked={collaboratorForm.canLaunchSales}
                      name="canLaunchSales"
                      onChange={updateCollaboratorForm}
                      type="checkbox"
                    />
                    <span>Pode lancar vendas pelo celular</span>
                  </label>
                </div>
              </LockedFeature>
              {isAdmin && (
                <label className="barber-permission-item">
                  <input
                    checked={collaboratorForm.canMakeBarter}
                    name="canMakeBarter"
                    onChange={updateCollaboratorForm}
                    type="checkbox"
                  />
                  <span>
                    Pode lancar permuta
                    <small className="barber-form-hint">Permite registrar atendimentos como permuta. A comissao da permuta sera descontada do saldo do colaborador e pode deixar o saldo negativo.</small>
                  </span>
                </label>
              )}
            </div>
          </div>
          <div className="barber-modal-actions">
            <BarberButton onClick={closeCollaboratorModal} type="button" variant="ghost">
              Cancelar
            </BarberButton>
            <BarberButton type="submit" variant="primary">
              <BarberIcon name="plus" />
              <span>{isEditingCollaborator ? 'Salvar colaborador' : 'Salvar colaborador'}</span>
            </BarberButton>
          </div>
        </form>
      </div>
    </BarberModal>
  )
}
