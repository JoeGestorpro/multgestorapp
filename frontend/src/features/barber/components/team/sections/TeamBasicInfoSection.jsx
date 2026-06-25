import CollaboratorAvatar from '../../../../../components/barber/CollaboratorAvatar'

export default function TeamBasicInfoSection({
  form,
  onChange,
  onAvatarChange,
  onAvatarRemove
}) {
  const hasAvatar = Boolean(form.avatarDataUrl || form.avatarUrl)

  return (
    <div className="barber-form-grid">
      <div className="barber-form-block barber-form-block-full">
        <div className="barber-avatar-upload">
          <CollaboratorAvatar
            avatarUrl={form.avatarDataUrl || form.avatarUrl}
            name={form.name || 'Colaborador'}
            selected={hasAvatar}
            size="xl"
          />
          <div className="barber-avatar-upload-copy">
            <strong>Foto do colaborador</strong>
            <p>Essa foto aparecera na agenda publica para seus clientes escolherem o profissional.</p>
            <div className="barber-avatar-upload-actions">
              <label className="barber-button barber-button-ghost" htmlFor="team-avatar-input">
                {hasAvatar ? 'Trocar foto' : 'Adicionar foto'}
              </label>
              {hasAvatar && (
                <button className="barber-button barber-button-ghost" onClick={onAvatarRemove} type="button">
                  Remover
                </button>
              )}
            </div>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="barber-avatar-upload-input"
              id="team-avatar-input"
              onChange={onAvatarChange}
              type="file"
            />
            <small className="barber-form-hint">Formatos aceitos: JPG, PNG e WEBP com ate 2MB.</small>
          </div>
        </div>
      </div>

      <div className="barber-form-block">
        <label htmlFor="team-name">Nome</label>
        <input
          className="barber-input"
          id="team-name"
          name="name"
          onChange={onChange}
          required
          value={form.name}
        />
      </div>

      <div className="barber-form-block">
        <label htmlFor="team-phone">Telefone</label>
        <input
          className="barber-input"
          id="team-phone"
          name="phone"
          onChange={onChange}
          value={form.phone}
        />
      </div>
    </div>
  )
}
