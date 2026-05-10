import { useState, useRef } from 'react'
import { useTenantTheme } from '../../hooks/useTenantTheme'
import './StepBrand.css'

const COLOR_PRESETS = [
  { name: 'Dourado', color: '#D4AF37' },
  { name: 'Verde', color: '#22c55e' },
  { name: 'Azul', color: '#3b82f6' },
  { name: 'Vermelho', color: '#ef4444' },
  { name: 'Roxo', color: '#a855f7' },
  { name: 'Laranja', color: '#f97316' },
]

export default function StepBrand({ data, onChange, onNext }) {
  const { primaryColor } = useTenantTheme()
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange({ ...data, logo_url: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange({ ...data, logo_url: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleColorSelect = (color) => {
    onChange({ ...data, primary_color: color })
  }

  return (
    <div className="step-brand">
      <div className="step-brand__header">
        <h2>Sua marca</h2>
        <p>Personalize a identidade visual da sua barbearia</p>
      </div>

      <div className="step-brand__form">
        <div className="step-brand__field">
          <label>Nome da barbearia</label>
          <input
            type="text"
            value={data.company_name || ''}
            onChange={(e) => onChange({ ...data, company_name: e.target.value })}
            placeholder="Ex: Barber King"
            className="step-brand__input"
          />
        </div>

        <div className="step-brand__field">
          <label>Logo</label>
          <div
            className={`step-brand__upload ${dragOver ? 'step-brand__upload--dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              hidden
            />
            
            {data.logo_url ? (
              <div className="step-brand__logo-preview">
                <img src={data.logo_url} alt="Logo" />
                <span className="step-brand__logo-change">Clique para alterar</span>
              </div>
            ) : (
              <div className="step-brand__upload-content">
                <div className="step-brand__upload-icon" style={{ background: `${primaryColor}20` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p>Arraste ou clique para fazer upload</p>
                <span>PNG, JPG até 2MB</span>
              </div>
            )}
          </div>
        </div>

        <div className="step-brand__field">
          <label>Cor principal</label>
          <div className="step-brand__colors">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.color}
                className={`step-brand__color-btn ${data.primary_color === preset.color ? 'step-brand__color-btn--active' : ''}`}
                style={{ background: preset.color }}
                onClick={() => handleColorSelect(preset.color)}
                title={preset.name}
              />
            ))}
            <input
              type="color"
              value={data.primary_color || primaryColor}
              onChange={(e) => onChange({ ...data, primary_color: e.target.value })}
              className="step-brand__color-picker"
            />
          </div>
          <div 
            className="step-brand__color-preview"
            style={{ background: data.primary_color || primaryColor }}
          >
            <span>Preview</span>
          </div>
        </div>

        <div className="step-brand__field">
          <label>Slogan (opcional)</label>
          <input
            type="text"
            value={data.slogan || ''}
            onChange={(e) => onChange({ ...data, slogan: e.target.value })}
            placeholder="Ex: Estilo que define história"
            className="step-brand__input"
          />
        </div>
      </div>

      <div className="step-brand__actions">
        <button 
          className="step-brand__btn step-brand__btn--primary"
          style={{ '--btn-color': data.primary_color || primaryColor }}
          onClick={onNext}
          disabled={!data.company_name?.trim()}
        >
          Continuar
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}