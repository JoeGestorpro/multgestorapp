import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api'
import PremiumLoadingSkeleton from './PremiumLoadingSkeleton'
import PremiumEmptyState from './PremiumEmptyState'
import PremiumBadge from './PremiumBadge'
import './PremiumViews.css'

const WEEKDAY_LABELS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

function formatDateBR(value) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch { return '-' }
}

function parseTimeForInput(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

export default function BookingAvailabilityView() {
  const [collaborators, setCollaborators] = useState([])
  const [workingHours, setWorkingHours] = useState([])
  const [blocks, setBlocks] = useState([])
  const [_settings, setSettings] = useState({})
  const [activeCollabId, setActiveCollabId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [newBlock, setNewBlock] = useState({ collaboratorId: '', startsAt: '', endsAt: '', reason: '' })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/barber/availability')
      const data = res.data.data || {}
      setCollaborators(data.collaborators || [])
      setWorkingHours(data.working_hours || [])
      setBlocks(data.blocks || [])
      setSettings(data.settings || {})
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao carregar dados de disponibilidade')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function findWorkingHour(collaboratorId, weekday) {
    return workingHours.find(wh =>
      (wh.collaborator_id || null) === (collaboratorId || null) && wh.weekday === weekday
    )
  }

  function handleWhChange(collaboratorId, weekday, field, value) {
    setWorkingHours(prev => {
      const idx = prev.findIndex(wh =>
        (wh.collaborator_id || null) === (collaboratorId || null) && wh.weekday === weekday
      )
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], [field]: value }
        return updated
      }
      const entry = {
        collaborator_id: collaboratorId,
        weekday,
        opens_at: '08:00',
        closes_at: '18:00',
        is_closed: false,
        pauses: []
      }
      entry[field] = value
      return [...prev, entry]
    })
  }

  function handleAddPause(collaboratorId, weekday) {
    setWorkingHours(prev => {
      const idx = prev.findIndex(wh =>
        (wh.collaborator_id || null) === (collaboratorId || null) && wh.weekday === weekday
      )
      if (idx >= 0) {
        const updated = [...prev]
        const pauses = [...(updated[idx].pauses || []), { start: '12:00', end: '13:00', reason: 'Almoço' }]
        updated[idx] = { ...updated[idx], pauses }
        return updated
      }
      return [...prev, {
        collaborator_id: collaboratorId,
        weekday,
        opens_at: '08:00',
        closes_at: '18:00',
        is_closed: false,
        pauses: [{ start: '12:00', end: '13:00', reason: 'Almoço' }]
      }]
    })
  }

  function handlePauseChange(collaboratorId, weekday, pauseIdx, field, value) {
    setWorkingHours(prev => {
      const idx = prev.findIndex(wh =>
        (wh.collaborator_id || null) === (collaboratorId || null) && wh.weekday === weekday
      )
      if (idx < 0) return prev
      const updated = [...prev]
      const pauses = [...(updated[idx].pauses || [])]
      if (!pauses[pauseIdx]) return prev
      pauses[pauseIdx] = { ...pauses[pauseIdx], [field]: value }
      updated[idx] = { ...updated[idx], pauses }
      return updated
    })
  }

  function handleRemovePause(collaboratorId, weekday, pauseIdx) {
    setWorkingHours(prev => {
      const idx = prev.findIndex(wh =>
        (wh.collaborator_id || null) === (collaboratorId || null) && wh.weekday === weekday
      )
      if (idx < 0) return prev
      const updated = [...prev]
      const pauses = (updated[idx].pauses || []).filter((_, i) => i !== pauseIdx)
      updated[idx] = { ...updated[idx], pauses }
      return updated
    })
  }

  async function handleDeleteBlock(blockId) {
    try {
      await api.delete(`/barber/schedule/blocks/${blockId}`)
      setBlocks(prev => prev.filter(b => b.id !== blockId))
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao excluir bloqueio')
    }
  }

  async function handleCreateBlock() {
    if (!newBlock.startsAt || !newBlock.endsAt) {
      setError('Preencha data e horário do bloqueio')
      return
    }
    try {
      const payload = {
        startsAt: newBlock.startsAt,
        endsAt: newBlock.endsAt,
        reason: newBlock.reason || 'Bloqueio',
        collaboratorId: newBlock.collaboratorId || null
      }
      const res = await api.post('/barber/schedule/blocks', payload)
      setBlocks(prev => [res.data.data, ...prev])
      setShowBlockModal(false)
      setNewBlock({ collaboratorId: '', startsAt: '', endsAt: '', reason: '' })
      setError(null)
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao criar bloqueio')
    }
  }

  function getFilteredBlocks() {
    if (activeCollabId === null) return blocks
    return blocks.filter(b => !b.collaborator_id || b.collaborator_id === activeCollabId)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await api.put('/barber/availability', { working_hours: workingHours })
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    loadData()
  }

  if (loading) {
    return (
      <section className="pv-section">
        <div className="pv-hero">
          <div>
            <span className="barber-overline">Agenda • Disponibilidade</span>
            <h1>Disponibilidade da Semana</h1>
            <p>Configure horários de trabalho, pausas e bloqueios por profissional.</p>
          </div>
        </div>
        <PremiumLoadingSkeleton rows={6} type="table" />
      </section>
    )
  }

  if (error && collaborators.length === 0 && workingHours.length === 0) {
    return (
      <section className="pv-section">
        <div className="pv-hero">
          <div>
            <span className="barber-overline">Agenda • Disponibilidade</span>
            <h1>Disponibilidade da Semana</h1>
            <p>Configure horários de trabalho, pausas e bloqueios por profissional.</p>
          </div>
        </div>
        <div className="pv-error-banner">{error}</div>
        <button className="pv-cancel-btn" onClick={loadData}>Tentar novamente</button>
      </section>
    )
  }

  const filteredBlocks = getFilteredBlocks()

  return (
    <section className="pv-section">
      <div className="pv-hero">
        <div>
          <span className="barber-overline">Agenda • Disponibilidade</span>
          <h1>Disponibilidade da Semana</h1>
          <p>Configure horários de trabalho, pausas e bloqueios por profissional.</p>
        </div>
      </div>

      {error && <div className="pv-error-banner">{error}</div>}

      <div className="pv-collab-tabs">
        <button
          className={`pv-collab-tab ${activeCollabId === null ? 'pv-collab-tab--active' : ''}`}
          onClick={() => setActiveCollabId(null)}
        >Geral</button>
        {collaborators.map(c => (
          <button
            key={c.id}
            className={`pv-collab-tab ${activeCollabId === c.id ? 'pv-collab-tab--active' : ''}`}
            onClick={() => setActiveCollabId(c.id)}
          >{c.nickname || c.name || 'Sem nome'}</button>
        ))}
      </div>

      <div className="pv-week-grid">
        {[0, 1, 2, 3, 4, 5, 6].map(weekday => {
          const wh = findWorkingHour(activeCollabId, weekday)
          const isClosed = wh?.is_closed === true
          const pauses = wh?.pauses || []

          return (
            <div key={weekday} className="pv-day-row">
              <span className="pv-day-label">{WEEKDAY_LABELS[weekday]}</span>

              <label className="pv-day-toggle">
                <input
                  type="checkbox"
                  checked={!isClosed}
                  onChange={e => handleWhChange(activeCollabId, weekday, 'is_closed', !e.target.checked)}
                />
                {isClosed ? 'Fechado' : 'Aberto'}
              </label>

              {!isClosed && (
                <div className="pv-day-times">
                  <input
                    type="time"
                    value={parseTimeForInput(wh?.opens_at || '08:00')}
                    onChange={e => handleWhChange(activeCollabId, weekday, 'opens_at', e.target.value + ':00')}
                  />
                  <span style={{ color: 'var(--pm-text-muted)', fontSize: 12 }}>—</span>
                  <input
                    type="time"
                    value={parseTimeForInput(wh?.closes_at || '18:00')}
                    onChange={e => handleWhChange(activeCollabId, weekday, 'closes_at', e.target.value + ':00')}
                  />
                </div>
              )}

              {!isClosed && pauses.length > 0 && (
                <div className="pv-pause-list">
                  {pauses.map((p, pIdx) => (
                    <div key={pIdx} className="pv-pause-item">
                      <input
                        type="time"
                        value={parseTimeForInput(p.start)}
                        onChange={e => handlePauseChange(activeCollabId, weekday, pIdx, 'start', e.target.value)}
                      />
                      <span style={{ color: 'var(--pm-text-muted)' }}>—</span>
                      <input
                        type="time"
                        value={parseTimeForInput(p.end)}
                        onChange={e => handlePauseChange(activeCollabId, weekday, pIdx, 'end', e.target.value)}
                      />
                      <input
                        type="text"
                        value={p.reason || ''}
                        placeholder="Motivo"
                        onChange={e => handlePauseChange(activeCollabId, weekday, pIdx, 'reason', e.target.value)}
                      />
                      <button
                        className="pv-pause-remove"
                        onClick={() => handleRemovePause(activeCollabId, weekday, pIdx)}
                        title="Remover pausa"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {!isClosed && (
                <button
                  className="pv-pause-add"
                  onClick={() => handleAddPause(activeCollabId, weekday)}
                >+ Pausa</button>
              )}
            </div>
          )
        })}
      </div>

      <div className="pv-blocks-header">
        <h2>Bloqueios e Folgas</h2>
        <button className="pv-block-add-btn" onClick={() => setShowBlockModal(true)}>
          Adicionar bloqueio
        </button>
      </div>

      {filteredBlocks.length === 0 ? (
        <PremiumEmptyState
          title="Nenhum bloqueio"
          description="Não há bloqueios de horário cadastrados."
        />
      ) : (
        <div className="pv-blocks-list">
          {filteredBlocks.map(block => (
            <div key={block.id} className="pv-block-item">
              <div className="pv-block-info">
                <strong>{block.reason || 'Bloqueio sem motivo'}</strong>
                <span>{formatDateBR(block.starts_at)} — {formatDateBR(block.ends_at)}</span>
                {block.collaborator_name && (
                  <span className="pv-block-collab">Profissional: {block.collaborator_name}</span>
                )}
              </div>
              <PremiumBadge status="blocked" label="Bloqueado" size="sm" />
              <button
                className="pv-block-delete"
                onClick={() => handleDeleteBlock(block.id)}
                title="Remover bloqueio"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="pv-save-bar">
        <button className="pv-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
        <button className="pv-cancel-btn" onClick={handleCancel}>Cancelar</button>
      </div>

      {showBlockModal && (
        <div className="pv-block-modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="pv-block-modal" onClick={e => e.stopPropagation()}>
            <h3>Adicionar bloqueio</h3>

            <label>
              Profissional (opcional)
              <select
                value={newBlock.collaboratorId}
                onChange={e => setNewBlock(prev => ({ ...prev, collaboratorId: e.target.value }))}
              >
                <option value="">Todos os profissionais</option>
                {collaborators.map(c => (
                  <option key={c.id} value={c.id}>{c.nickname || c.name || 'Sem nome'}</option>
                ))}
              </select>
            </label>

            <label>
              Início
              <input
                type="datetime-local"
                value={newBlock.startsAt}
                onChange={e => setNewBlock(prev => ({ ...prev, startsAt: e.target.value }))}
              />
            </label>

            <label>
              Fim
              <input
                type="datetime-local"
                value={newBlock.endsAt}
                onChange={e => setNewBlock(prev => ({ ...prev, endsAt: e.target.value }))}
              />
            </label>

            <label>
              Motivo
              <input
                type="text"
                value={newBlock.reason}
                onChange={e => setNewBlock(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Ex: Manutenção, Folga, etc."
              />
            </label>

            <div className="pv-block-modal-actions">
              <button className="pv-cancel-btn" onClick={() => setShowBlockModal(false)}>Cancelar</button>
              <button className="pv-save-btn" onClick={handleCreateBlock}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
