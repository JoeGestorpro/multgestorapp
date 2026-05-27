import { useEffect, useRef, useMemo, useState } from 'react'
import {
  SERVICE_TEMPLATES,
  inferCategory,
  inferServiceType,
  getDefaultIconForCategory,
  getSuggestions,
  getCategoryConfig,
  normalizeServiceIcon,
  SERVICE_ICON_OPTIONS
} from './ServiceIcon.utils'
import ServiceIcon from './ServiceIcon'
import { ChevronRight, Sparkles, Zap, Copy, Plus, Check } from 'lucide-react'

function ServiceTemplatePicker({ onSelect, selectedTemplate }) {
  return (
    <div className="smart-service-templates">
      <div className="smart-service-templates-header">
        <Sparkles size={14} />
        <span>Templates rapidos</span>
      </div>
      <div className="smart-service-templates-grid">
        {SERVICE_TEMPLATES.slice(0, 8).map((template) => {
          const isSelected = selectedTemplate?.id === template.id
          const catConfig = getCategoryConfig(template.category)
          return (
            <button
              key={template.id}
              className={`smart-template-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(template)}
              type="button"
              style={{ '--template-color': catConfig.color }}
            >
              <ServiceIcon icon={template.icon} size={18} />
              <span>{template.name}</span>
              {isSelected && <Check size={12} className="template-check" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ServiceSuggestions({ name, onSelect }) {
  const suggestions = useMemo(() => getSuggestions(name, 4), [name])
  if (suggestions.length === 0) return null

  return (
    <div className="smart-service-suggestions">
      <span className="smart-suggestions-label">Sugestoes</span>
      <div className="smart-suggestions-list">
        {suggestions.map((template) => {
          const catConfig = getCategoryConfig(template.category)
          return (
            <button
              key={template.id}
              className="smart-suggestion-item"
              onClick={() => onSelect(template)}
              type="button"
            >
              <ServiceIcon icon={template.icon} size={16} />
              <span>{template.name}</span>
              <span className="suggestion-meta">~R$ {template.price}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function QuickTimeSelector({ value, onChange }) {
  const presets = [15, 30, 45, 60, 90, 120]
  return (
    <div className="quick-time-selector">
      {presets.map((time) => (
        <button
          key={time}
          className={`quick-time-btn ${value == time ? 'active' : ''}`}
          onClick={() => onChange({ target: { name: 'estimatedTimeMinutes', value: String(time) } })}
          type="button"
        >
          {time}m
        </button>
      ))}
    </div>
  )
}

function ServiceFormSection({ children, title }) {
  return (
    <div className="smart-service-section">
      {title && <div className="smart-service-section-title">{title}</div>}
      {children}
    </div>
  )
}

function SmartServiceForm({
  form,
  onFormChange,
  onSubmit,
  onClose,
  isEditing,
  isSaving,
  onSaveAndContinue,
  onDuplicate,
  services
}) {
  const nameRef = useRef(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [manualCategoryOverride, setManualCategoryOverride] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const currentCategory = useMemo(() => {
    if (manualCategoryOverride) return null
    return inferCategory(form.name)
  }, [form.name, manualCategoryOverride])

  const effectiveCategory = currentCategory || form.category || 'corte'

  const visibleIcons = useMemo(() => {
    const catIcons = SERVICE_ICON_OPTIONS.filter(opt => opt.category === effectiveCategory)
    if (catIcons.length > 0) return catIcons
    return SERVICE_ICON_OPTIONS.slice(0, 12)
  }, [effectiveCategory])

  useEffect(() => {
    if (!isEditing && nameRef.current) {
      nameRef.current.focus()
    }
  }, [isEditing])

  const handleNameChange = (e) => {
    const value = e.target.value
    onFormChange(e)

    setShowSuggestions(value.length >= 2)

    if (!manualCategoryOverride && !isEditing) {
      const template = SERVICE_TEMPLATES.find(t =>
        t.name.toLowerCase() === value.toLowerCase() ||
        t.keywords.some(k => value.toLowerCase().includes(k))
      )
      if (template) {
        setSelectedTemplate(template)
      } else {
        setSelectedTemplate(null)
      }
    }
  }

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    setManualCategoryOverride(true)

    onFormChange({ target: { name: 'name', value: template.name } })
    onFormChange({ target: { name: 'estimatedTimeMinutes', value: String(template.time) } })
    onFormChange({ target: { name: 'price', value: String(template.price) } })
    onFormChange({ target: { name: 'serviceType', value: template.serviceType } })
    onFormChange({ target: { name: 'icon', value: template.icon } })
  }

  const handleSuggestionSelect = (template) => {
    handleTemplateSelect(template)
    setShowSuggestions(false)
  }

  const handleCategoryClick = () => {
    setManualCategoryOverride(true)
  }

  const categoryTabs = [
    { key: 'corte', label: 'Corte' },
    { key: 'barba', label: 'Barba' },
    { key: 'combo', label: 'Combo' },
    { key: 'estetica', label: 'Estetica' },
    { key: 'coloracao', label: 'Cor' },
    { key: 'quimica', label: 'Quimica' },
    { key: 'infantil', label: 'Infantil' },
    { key: 'premium', label: 'Premium' },
    { key: 'spa', label: 'Spa' }
  ]

  const handleDuplicate = () => {
    if (services && services.length > 0) {
      const lastCreated = services[services.length - 1]
      if (lastCreated) {
        onFormChange({ target: { name: 'name', value: `${lastCreated.name} (Copia)` } })
        onFormChange({ target: { name: 'price', value: String(lastCreated.price) } })
        onFormChange({ target: { name: 'estimatedTimeMinutes', value: String(lastCreated.estimated_time_minutes || lastCreated.estimatedTimeMinutes || '') } })
        onFormChange({ target: { name: 'icon', value: lastCreated.icon || 'scissors' } })
        setManualCategoryOverride(true)
      }
    }
  }

  const activeIcon = normalizeServiceIcon(form.icon, form.name)
  const catConfig = getCategoryConfig(effectiveCategory)

  return (
    <form className="smart-service-form" onSubmit={onSubmit}>
      <ServiceFormSection title="Template">
        <ServiceTemplatePicker
          onSelect={handleTemplateSelect}
          selectedTemplate={selectedTemplate}
        />
      </ServiceFormSection>

      <ServiceFormSection title="Nome">
        <div className="smart-name-field">
          <input
            ref={nameRef}
            className="barber-input smart-name-input"
            id="service-name"
            name="name"
            onChange={handleNameChange}
            onFocus={() => setShowSuggestions(form.name.length >= 2)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Ex: Corte Degrade Fade"
            required
            value={form.name}
          />
          {activeIcon && (
            <div className="smart-name-icon">
              <ServiceIcon icon={form.icon} serviceName={form.name} size={22} />
            </div>
          )}
        </div>
        {showSuggestions && (
          <ServiceSuggestions name={form.name} onSelect={handleSuggestionSelect} />
        )}
      </ServiceFormSection>

      <ServiceFormSection title="Preco e Tempo">
        <div className="smart-form-row">
          <div className="smart-form-field">
            <label htmlFor="service-price">Preco</label>
            <input
              className="barber-input"
              id="service-price"
              min="0"
              name="price"
              onChange={onFormChange}
              placeholder="0.00"
              required
              step="0.01"
              type="number"
              value={form.price}
            />
          </div>
          <div className="smart-form-field">
            <label htmlFor="estimated-time-minutes">Tempo</label>
            <input
              className="barber-input"
              id="estimated-time-minutes"
              min="0"
              name="estimatedTimeMinutes"
              onChange={onFormChange}
              placeholder="min"
              step="1"
              type="number"
              value={form.estimatedTimeMinutes}
            />
          </div>
        </div>
        <QuickTimeSelector
          value={form.estimatedTimeMinutes}
          onChange={onFormChange}
        />
      </ServiceFormSection>

      <ServiceFormSection title="Categoria">
        <div className="smart-category-selector">
          <div className="smart-category-tabs">
            {categoryTabs.map((tab) => {
              const config = getCategoryConfig(tab.key)
              const isActive = effectiveCategory === tab.key
              return (
                <button
                  key={tab.key}
                  className={`smart-category-tab ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    handleCategoryClick()
                    onFormChange({ target: { name: 'category', value: tab.key } })
                    onFormChange({ target: { name: 'icon', value: getDefaultIconForCategory(tab.key) } })
                  }}
                  type="button"
                  style={{ '--cat-color': config.color }}
                >
                  <ServiceIcon icon={getDefaultIconForCategory(tab.key)} size={14} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </ServiceFormSection>

      <ServiceFormSection title="Icone">
        <div className="smart-icon-section">
          <div className="smart-icon-preview">
            <ServiceIcon icon={form.icon} serviceName={form.name} size={32} />
            <span className="smart-icon-label">{catConfig.label}</span>
          </div>
          <div className="smart-icon-picker">
            <div className="smart-icon-grid">
              {visibleIcons.slice(0, 16).map((option) => {
                const isActive = activeIcon === option.key
                const optConfig = getCategoryConfig(option.category)
                return (
                  <button
                    key={option.key}
                    className={`smart-icon-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onFormChange({ target: { name: 'icon', value: option.key } })
                      setManualCategoryOverride(true)
                    }}
                    type="button"
                    style={isActive ? { color: optConfig.color, borderColor: optConfig.color } : {}}
                    title={option.label}
                  >
                    <ServiceIcon icon={option.key} size={18} />
                    {isActive && <Check size={10} className="icon-check" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </ServiceFormSection>

      <ServiceFormSection title="Opcoes">
        <div className="smart-form-row">
          <div className="smart-form-field">
            <label htmlFor="service-type">Tipo</label>
            <select
              className="barber-select"
              id="service-type"
              name="serviceType"
              onChange={onFormChange}
              value={form.serviceType}
            >
              <option value="service">Servico</option>
              <option value="product">Produto</option>
              <option value="combo">Combo</option>
            </select>
          </div>
          <div className="smart-form-field">
            <label htmlFor="service-status">Status</label>
            <select
              className="barber-select"
              id="service-status"
              name="isActive"
              onChange={onFormChange}
              value={String(form.isActive)}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
        </div>
      </ServiceFormSection>

      <ServiceFormSection title="Descricao">
        <textarea
          className="barber-textarea"
          id="service-description"
          name="description"
          onChange={onFormChange}
          placeholder="Diferenciais, observacoes ou o que esta incluso."
          rows="2"
          value={form.description}
        />
      </ServiceFormSection>

      <div className="smart-service-actions">
        <button className="smart-action-btn cancel" onClick={onClose} type="button">
          Cancelar
        </button>
        {!isEditing && (
          <button
            className="smart-action-btn continue"
            onClick={(e) => {
              e.preventDefault()
              if (onSaveAndContinue) onSaveAndContinue()
            }}
            type="button"
            disabled={isSaving}
          >
            <Plus size={16} />
            Salvar e continuar
          </button>
        )}
        <button className="smart-action-btn submit" type="submit" disabled={isSaving}>
          <Check size={16} />
          {isSaving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Salvar servico'}
        </button>
      </div>
    </form>
  )
}

export default SmartServiceForm