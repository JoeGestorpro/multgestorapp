import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../../services/api'
import { BarberIcon } from '../../components/barber/BarberUI'

const EMPTY_LANDING = {
  display_name: '', slogan: '', about_text: '',
  logo_url: null,
  whatsapp: '', instagram: '', address_display: '', hours_display: '',
  booking_primary_color: '#a3ff12', booking_secondary_color: '#0c1017', booking_accent_color: '#7fe11e',
  button_text: 'Agendar Horário', button_text_color: '',
  banner_url: null,
  extra_info: '',
  differentials: [], gallery: [],
  show_hero: true, show_info: true, show_about: true,
  show_differentials: true, show_team: true, show_gallery: false
}

function tryParse(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  return String(v)
}

function ColorRow({ label, value, onChange }) {
  return (
    <div className="barber-settings-color-row">
      <input 
        type="color" 
        value={value || '#000000'} 
        onChange={(e) => onChange(e.target.value)}
        title="Clique para selecionar cor"
      />
      <input 
        type="text" 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder="#hex" 
        spellCheck={false}
      />
      <span className="barber-settings-color-label">{label}</span>
    </div>
  )
}

function PreviewCard({ form, onCtaClick: _onCtaClick }) {
  const colors = useMemo(() => ({
    primary: form.booking_primary_color || '#a3ff12',
    secondary: form.booking_secondary_color || '#0c1017',
    accent: form.booking_accent_color || '#7fe11e',
    buttonText: form.button_text_color || '#000000'
  }), [form])

  const heroGradient = form.banner_url 
    ? `url(${form.banner_url})`
    : `linear-gradient(135deg, ${colors.secondary} 0%, #1a1a2e 100%)`

  return (
    <div className="barber-booking-landing-preview">
      <div className="barber-booking-landing-preview-header">
        <h4>
          <BarberIcon name="eye" />
          Preview da Agenda Online
        </h4>
        <span>Atualizado em tempo real</span>
      </div>
      <div className="barber-booking-landing-preview-content">
        <div style={{
          background: colors.secondary,
          borderRadius: 16,
          overflow: 'hidden',
          border: `1px solid ${colors.primary}33`
        }}>
          <div style={{
            height: 120,
            background: heroGradient,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, ${colors.primary}11 0%, ${colors.secondary} 100%)`
            }} />
            <div style={{ position: 'relative', textAlign: 'center', padding: 16 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: `${colors.primary}22`,
                border: `1px solid ${colors.primary}44`,
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 10,
                color: colors.primary,
                marginBottom: 8
              }}>
                <BarberIcon name="check" size={10} />
                Agende Online
              </div>
              <h2 style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: '#fff'
              }}>
                {form.display_name || 'Minha Barbearia'}
              </h2>
              {form.slogan && (
                <p style={{
                  margin: '4px 0 0',
                  fontSize: 12,
                  color: '#ffffff99'
                }}>
                  {form.slogan}
                </p>
              )}
            </div>
          </div>
          
          <div style={{ padding: 16 }}>
            <button style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: 12,
              border: 'none',
              background: colors.primary,
              color: colors.buttonText,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              <BarberIcon name="scissors" size={16} />
              {form.button_text || 'Agendar Horário'}
            </button>

            {(form.whatsapp || form.address_display) && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {form.whatsapp && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    color: '#ffffff88'
                  }}>
                    <BarberIcon name="phone" size={12} />
                    {form.whatsapp}
                  </div>
                )}
                {form.address_display && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    color: '#ffffff88'
                  }}>
                    <BarberIcon name="mapPin" size={12} />
                    {form.address_display}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{
            background: `${colors.primary}11`,
            border: `1px solid ${colors.primary}33`,
            borderRadius: 12,
            padding: 12,
            textAlign: 'center'
          }}>
            <BarberIcon name="clock" size={16} style={{ color: colors.primary }} />
            <div style={{ fontSize: 10, color: '#fff', marginTop: 4 }}>Horario</div>
          </div>
          <div style={{
            background: `${colors.primary}11`,
            border: `1px solid ${colors.primary}33`,
            borderRadius: 12,
            padding: 12,
            textAlign: 'center'
          }}>
            <BarberIcon name="mapPin" size={16} style={{ color: colors.primary }} />
            <div style={{ fontSize: 10, color: '#fff', marginTop: 4 }}>Local</div>
          </div>
          <div style={{
            background: `${colors.primary}11`,
            border: `1px solid ${colors.primary}33`,
            borderRadius: 12,
            padding: 12,
            textAlign: 'center'
          }}>
            <BarberIcon name="star" size={16} style={{ color: colors.primary }} />
            <div style={{ fontSize: 10, color: '#fff', marginTop: 4 }}>Avaliacoes</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ImageUpload({ label, value, onUpload, onRemove, uploading, accept = "image/jpeg,image/png,image/webp", maxSize: _maxSize = 2 }) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (value) {
      setPreview(value)
    } else {
      setPreview(null)
    }
  }, [value])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const input = document.createElement('input')
      input.type = 'file'
      input.files = e.dataTransfer.files
      onUpload({ target: { files: [file] } })
    }
  }

  return (
    <div className="barber-settings-logo-section">
      <div 
        className="barber-settings-logo-preview-area"
        style={{
          border: isDragging ? `2px solid ${'#8cff4f'}` : undefined,
          background: isDragging ? `rgba(140, 255, 79, 0.1)` : undefined
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <img src={preview} alt={label} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
        ) : (
          <div className="barber-settings-logo-placeholder">
            <BarberIcon name="image" />
          </div>
        )}
      </div>
      <div>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 8px 0' }}>{label}</p>
        <div className="barber-settings-logo-actions">
          <label className="barber-settings-logo-upload-btn">
            <BarberIcon name="upload" />
            <span>{uploading ? 'Enviando...' : 'Enviar imagem'}</span>
            <input 
              type="file" 
              className="barber-settings-logo-input" 
              accept={accept}
              onChange={onUpload}
              disabled={uploading}
            />
          </label>
          {value && (
            <button type="button" className="barber-settings-logo-remove-btn" onClick={onRemove}>
              <BarberIcon name="trash" />
              <span>Remover</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BookingLandingConfig() {
  const [form, setForm] = useState({ ...EMPTY_LANDING })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [bannerUploading, setBannerUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [activeSection, setActiveSection] = useState('branding')

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { data: res } = await api.get('/barber/booking/landing')
      if (res?.success && res?.data) {
        setForm({ ...EMPTY_LANDING, ...res.data })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar configuracao da agenda online')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  useEffect(() => {
    const root = document.querySelector('.barber-premium-shell')
    if (root) {
      root.style.setProperty('--bf-accent', form.booking_primary_color || '#a3ff12')
      root.style.setProperty('--bf-accent-subtle', (form.booking_primary_color || '#a3ff12') + '1a')
      root.style.setProperty('--bf-border-accent', (form.booking_primary_color || '#a3ff12') + '33')
    }
  }, [form.booking_primary_color])

  function handleField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSuccess('')
    setError('')
  }

  async function handleSave(e) {
    e?.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {}
      for (const key of Object.keys(EMPTY_LANDING)) {
        if (key === 'differentials' || key === 'gallery' || key === 'banner_url' || key === 'logo_url') continue
        const v = form[key]
        if (typeof v === 'boolean') {
          payload[key] = v
        } else if (v !== undefined && v !== null && String(v).trim() !== '') {
          payload[key] = typeof v === 'string' ? v.trim() : v
        }
      }
      if (Array.isArray(form.differentials)) payload.differentials = form.differentials
      if (Array.isArray(form.gallery)) payload.gallery = form.gallery

      const { data: res } = await api.put('/barber/booking/landing', payload)
      if (res?.success && res?.data) {
        setForm({ ...EMPTY_LANDING, ...res.data })
      }
      setSuccess('Configuracao salva com sucesso.')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar configuracao')
    } finally {
      setSaving(false)
    }
  }

  async function handleBannerUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato invalido. Use JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Imagem muito grande. Maximo 2MB.')
      return
    }
    setBannerUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data: res } = await api.post('/barber/booking/landing/banner', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res?.success && res?.data) {
        setForm((prev) => ({ ...prev, banner_url: res.data.banner_url }))
      }
      setSuccess('Banner atualizado com sucesso.')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao enviar banner')
    } finally {
      setBannerUploading(false)
    }
  }

  async function handleBannerRemove() {
    setError('')
    try {
      const { data: res } = await api.delete('/barber/booking/landing/banner')
      if (res?.success && res?.data) {
        setForm((prev) => ({ ...prev, banner_url: null }))
      }
      setSuccess('Banner removido.')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao remover banner')
    }
  }

  async function handleGalleryUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato invalido. Use JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Imagem muito grande. Maximo 2MB.')
      return
    }
    if ((form.gallery || []).length >= 10) {
      setError('Maximo de 10 imagens na galeria.')
      return
    }
    setGalleryUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data: res } = await api.post('/barber/booking/landing/gallery', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res?.success && res?.data) {
        setForm((prev) => ({ ...prev, gallery: res.data.gallery || [] }))
      }
      setSuccess('Imagem adicionada a galeria.')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao enviar imagem')
    } finally {
      setGalleryUploading(false)
    }
  }

  async function handleGalleryRemove(imageId) {
    if (!imageId) return
    setError('')
    try {
      const { data: res } = await api.delete(`/barber/booking/landing/gallery/${imageId}`)
      if (res?.success && res?.data) {
        setForm((prev) => ({ ...prev, gallery: res.data.gallery || [] }))
      }
      setSuccess('Imagem removida da galeria.')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao remover imagem')
    }
  }

  if (loading) {
    return <div className="barber-settings-loading" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Carregando configuracoes da agenda online...</div>
  }

  const sections = [
    { id: 'branding', label: 'Branding', icon: 'building' },
    { id: 'visual', label: 'Visual', icon: 'palette' },
    { id: 'landing', label: 'Landing', icon: 'layout' },
    { id: 'contato', label: 'Contato', icon: 'phone' },
    { id: 'galeria', label: 'Galeria', icon: 'image' }
  ]

  return (
    <form onSubmit={handleSave} className="barber-booking-landing-config">
      {error && <div className="barber-form-error">{error}</div>}
      {success && <div className="barber-form-success">{success}</div>}

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 400px', minWidth: 0 }}>
          <div className="barber-settings-tabs" style={{ marginBottom: 24 }}>
            {sections.map(section => (
              <button
                key={section.id}
                type="button"
                className={activeSection === section.id ? 'active' : ''}
                onClick={() => setActiveSection(section.id)}
              >
                <BarberIcon name={section.icon} size={14} />
                <span>{section.label}</span>
              </button>
            ))}
          </div>

          {activeSection === 'branding' && (
            <div className="barber-settings-card">
              <span className="barber-overline">Identidade da agenda</span>
              <h3>Nome, slogan e descricao</h3>
              <div className="barber-form-grid">
                <div className="barber-settings-field">
                  <span>Nome exibido na agenda</span>
                  <input type="text" value={tryParse(form.display_name)} onChange={(e) => handleField('display_name', e.target.value)} placeholder="Minha Barbearia" />
                </div>
                <div className="barber-settings-field">
                  <span>Slogan / chamada principal</span>
                  <input type="text" value={tryParse(form.slogan)} onChange={(e) => handleField('slogan', e.target.value)} placeholder="O melhor corte da cidade" />
                </div>
                <div className="barber-settings-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Texto de apresentacao / Sobre</span>
                  <textarea value={tryParse(form.about_text)} onChange={(e) => handleField('about_text', e.target.value)} placeholder="Conte um pouco sobre sua barbearia..." rows={3} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'visual' && (
            <>
              <div className="barber-settings-card">
                <span className="barber-overline">Cores e aparência</span>
                <h3>Cores da agenda online</h3>
                <div className="barber-settings-colors">
                  <ColorRow label="Cor principal" value={form.booking_primary_color} onChange={(v) => handleField('booking_primary_color', v)} />
                  <ColorRow label="Cor secundaria" value={form.booking_secondary_color} onChange={(v) => handleField('booking_secondary_color', v)} />
                  <ColorRow label="Cor de destaque" value={form.booking_accent_color} onChange={(v) => handleField('booking_accent_color', v)} />
                </div>
                <div className="barber-form-grid" style={{ marginTop: 16 }}>
                  <div className="barber-settings-field">
                    <span>Texto do botao principal</span>
                    <input type="text" value={tryParse(form.button_text)} onChange={(e) => handleField('button_text', e.target.value)} placeholder="Agendar Horario" />
                  </div>
                  <div className="barber-settings-field">
                    <span>Cor do texto do botao</span>
                    <input type="text" value={tryParse(form.button_text_color)} onChange={(e) => handleField('button_text_color', e.target.value)} placeholder="#ffffff" />
                  </div>
                </div>
              </div>

              <div className="barber-settings-card" style={{ marginTop: 24 }}>
                <span className="barber-overline">Banner</span>
                <h3>Imagem de fundo do hero</h3>
                <ImageUpload
                  label="Imagem de fundo do hero da agenda. Recomendado: 1920x600px. Max 2MB."
                  value={form.banner_url}
                  onUpload={handleBannerUpload}
                  onRemove={handleBannerRemove}
                  uploading={bannerUploading}
                />
              </div>
            </>
          )}

          {activeSection === 'landing' && (
            <div className="barber-settings-card">
              <span className="barber-overline">Seções da pagina</span>
              <h3>Ativar ou desativar secoes da agenda online</h3>
              <div className="barber-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {[
                  { key: 'show_hero', label: 'Hero (cabecalho)' },
                  { key: 'show_info', label: 'Informacoes de contato' },
                  { key: 'show_about', label: 'Sobre a barbearia' },
                  { key: 'show_differentials', label: 'Diferenciais' },
                  { key: 'show_team', label: 'Equipe' },
                  { key: 'show_gallery', label: 'Galeria de fotos' },
                ].map(({ key, label }) => (
                  <div key={key} className="barber-settings-toggle">
                    <label>
                      <input type="checkbox" checked={!!form[key]} onChange={(e) => handleField(key, e.target.checked)} />
                      <span>{label}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'contato' && (
            <div className="barber-settings-card">
              <span className="barber-overline">Contato e localizacao</span>
              <h3>Informacoes exibidas na agenda</h3>
              <div className="barber-form-grid">
                <div className="barber-settings-field">
                  <span>WhatsApp</span>
                  <input type="text" value={tryParse(form.whatsapp)} onChange={(e) => handleField('whatsapp', e.target.value)} placeholder="(65) 99999-9999" />
                </div>
                <div className="barber-settings-field">
                  <span>Instagram</span>
                  <input type="text" value={tryParse(form.instagram)} onChange={(e) => handleField('instagram', e.target.value)} placeholder="@minhabarbearia" />
                </div>
                <div className="barber-settings-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Endereco / Localizacao</span>
                  <input type="text" value={tryParse(form.address_display)} onChange={(e) => handleField('address_display', e.target.value)} placeholder="Rua Exemplo, 123 - Centro" />
                </div>
                <div className="barber-settings-field">
                  <span>Horario de funcionamento</span>
                  <input type="text" value={tryParse(form.hours_display)} onChange={(e) => handleField('hours_display', e.target.value)} placeholder="Seg-Sex 09h-19h | Sab 08h-17h" />
                </div>
                <div className="barber-settings-field">
                  <span>Informacoes extras</span>
                  <input type="text" value={tryParse(form.extra_info)} onChange={(e) => handleField('extra_info', e.target.value)} placeholder="Estacionamento, formas de pagamento..." />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'galeria' && (
            <div className="barber-settings-card">
              <span className="barber-overline">Galeria</span>
              <h3>Fotos da sua barbearia</h3>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 16px 0' }}>Ate 10 imagens. Max 2MB cada. Formatos: JPG, PNG, WEBP.</p>
              <div className="barber-settings-gallery-grid">
                {(form.gallery || []).map((img) => (
                  <div key={img.id} className="barber-settings-gallery-item">
                    <img src={img.url} alt={img.alt || ''} />
                    <button type="button" onClick={() => handleGalleryRemove(img.id)}>&times;</button>
                  </div>
                ))}
                {(form.gallery || []).length < 10 && (
                  <label className="barber-settings-gallery-upload">
                    <span>+</span>
                    <input 
                      type="file" 
                      className="barber-settings-logo-input" 
                      accept="image/jpeg,image/png,image/webp" 
                      onChange={handleGalleryUpload} 
                      disabled={galleryUploading} 
                    />
                  </label>
                )}
              </div>
              {galleryUploading && <span style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>Enviando imagem...</span>}
            </div>
          )}

          <div className="barber-settings-actions">
            <button type="submit" className="barber-button barber-button--primary" disabled={saving}>
              <BarberIcon name="save" />
              {saving ? 'Salvando...' : 'Salvar configuracoes'}
            </button>
          </div>
        </div>

        <div style={{ flex: '0 0 320px' }}>
          <PreviewCard form={form} />
        </div>
      </div>
    </form>
  )
}