import { useState } from 'react'
import { BarberButton, BarberIcon, BarberModal } from '../../../../components/barber/BarberUI'
import TeamBasicInfoSection from './sections/TeamBasicInfoSection'
import TeamAccessSection from './sections/TeamAccessSection'
import TeamCommissionSection from './sections/TeamCommissionSection'
import TeamPermissionsSection from './sections/TeamPermissionsSection'
import './TeamFormModal.css'

const TABS = [
  { key: 'basic', label: 'Basico' },
  { key: 'access', label: 'Acesso' },
  { key: 'commission', label: 'Comissao' },
  { key: 'permissions', label: 'Permissoes' }
]

export default function TeamFormModal({
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
  const [activeTab, setActiveTab] = useState('basic')

  function handleTabClick(key) {
    setActiveTab(key)
  }

  function handleFormChange(e) {
    const target = e.currentTarget || e.target
    const name = target.name
    const value = target.type === 'checkbox' ? target.checked : target.value
    updateCollaboratorForm({ target: { name, value } })
  }

  function handleAvatarChange(e) {
    updateCollaboratorAvatar(e)
  }

  return (
    <BarberModal
      onClose={closeCollaboratorModal}
      open={collaboratorModalOpen}
      subtitle="Cadastro com login proprio, permissoes de acesso e controle de lancamento pelo celular."
      title={isEditingCollaborator ? 'Editar colaborador' : 'Novo colaborador'}
    >
      <div className="barber-modal-content">
        <div className="team-form-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`team-form-tab ${activeTab === tab.key ? 'team-form-tab-active' : ''}`}
              onClick={() => handleTabClick(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form className="barber-panel-stack" onSubmit={createCollaborator} style={{ marginTop: 16 }}>
          {activeTab === 'basic' && (
            <TeamBasicInfoSection
              form={collaboratorForm}
              onChange={handleFormChange}
              onAvatarChange={handleAvatarChange}
              onAvatarRemove={removeCollaboratorAvatarPreview}
              isEditing={isEditingCollaborator}
            />
          )}

          {activeTab === 'access' && (
            <TeamAccessSection
              form={collaboratorForm}
              onChange={handleFormChange}
              isEditing={isEditingCollaborator}
            />
          )}

          {activeTab === 'commission' && (
            <TeamCommissionSection
              form={collaboratorForm}
              onChange={handleFormChange}
            />
          )}

          {activeTab === 'permissions' && (
            <TeamPermissionsSection
              form={collaboratorForm}
              onChange={handleFormChange}
              canUseExtraPermissionsFeature={canUseExtraPermissionsFeature}
              getLockedFeatureMessage={getLockedFeatureMessage}
              handleLockedFeature={handleLockedFeature}
              isAdmin={isAdmin}
            />
          )}

          <div className="barber-modal-actions" style={{ marginTop: 20 }}>
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
