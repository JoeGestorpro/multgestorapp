import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { X, Search, Plus, Minus, Trash2, AlertCircle } from 'lucide-react'
import { money } from '../utils/formatters'
import './SaleSlideover.css'

function useIdleTimer(callback, ms) {
  const saved = useRef()
  useEffect(() => { saved.current = callback }, [callback])
  useEffect(() => {
    const id = setInterval(() => saved.current(), ms)
    return () => clearInterval(id)
  }, [ms])
}

export default function SaleSlideover({
  open,
  onClose,
  services,
  products,
  collaborators,
  cashSession,
  loggedInCollaboratorId,
  canManageCash,
  isCollaborator,
  user,
  onSubmit
}) {
  const [items, setItems] = useState([])
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('')
  const [clientName, setClientName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [amountReceived, setAmountReceived] = useState('')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')
  const [catalogTab, setCatalogTab] = useState('all')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const searchRef = useRef(null)
  const panelRef = useRef(null)

  useIdleTimer(() => {
    if (!open) document.activeElement?.blur()
  }, 300000)

  useEffect(() => {
    if (open) {
      setItems([])
      setClientName('')
      setPaymentMethod('pix')
      setAmountReceived('')
      setNotes('')
      setSearch('')
      setError('')
      setCatalogTab('all')
      setSelectedCollaboratorId(isCollaborator ? loggedInCollaboratorId : '')
      setTimeout(() => searchRef.current?.focus(), 150)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeCollaborators = useMemo(
    () => collaborators.filter(c => c.is_active && !c.is_deleted),
    [collaborators]
  )

  const selectedCollaborator = useMemo(
    () => activeCollaborators.find(c => String(c.id) === String(selectedCollaboratorId)) || null,
    [selectedCollaboratorId, activeCollaborators]
  )

  const filteredCatalog = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const items = [
      ...services.filter(s => s.is_active !== false && s.is_deleted !== true).map(s => ({
        id: s.id, type: 'service', name: s.name,
        price: Number(s.price || 0),
        duration: s.duration || null
      })),
      ...products.filter(p => p.is_active !== false && p.is_deleted !== true).map(p => ({
        id: p.id, type: 'product', name: p.name,
        price: Number(p.sale_price || 0)
      }))
    ]
    return items.filter(item => {
      if (catalogTab === 'services' && item.type !== 'service') return false
      if (catalogTab === 'products' && item.type !== 'product') return false
      if (!normalizedSearch) return true
      return item.name.toLowerCase().includes(normalizedSearch)
    })
  }, [services, products, search, catalogTab])

  function applyCommission(item) {
    const totalPrice = Number(item.unitPrice) * Number(item.quantity)
    if (!selectedCollaborator || item.type !== 'service') {
      return { ...item, commissionAmount: 0, shopNetAmount: totalPrice }
    }
    const commType = selectedCollaborator.commission_type || selectedCollaborator.commissionType || 'percentage'
    const commRate = Number(selectedCollaborator.commission_rate ?? selectedCollaborator.commissionRate ?? 0)
    const amount = commType === 'fixed' ? commRate * Number(item.quantity) : totalPrice * (commRate / 100)
    return { ...item, commissionAmount: amount, shopNetAmount: Math.max(0, totalPrice - amount) }
  }

  useEffect(() => {
    if (items.length === 0) return
    setItems(prev => prev.map(item => applyCommission(item)))
  }, [selectedCollaboratorId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddItem = useCallback((catalogItem) => {
    const qty = 1
    const unitPrice = catalogItem.price
    setItems(prev => {
      const existing = prev.find(i => i.itemId === catalogItem.id && i.type === catalogItem.type)
      if (existing) {
        return prev.map(i => {
          if (i.key !== existing.key) return i
          const newQty = i.quantity + 1
          return applyCommission({ ...i, quantity: newQty, totalPrice: i.unitPrice * newQty })
        })
      }
      const base = {
        key: `${catalogItem.type}-${catalogItem.id}-${Date.now()}`,
        type: catalogItem.type,
        itemId: catalogItem.id,
        name: catalogItem.name,
        unitPrice, quantity: qty, totalPrice: unitPrice * qty
      }
      return [...prev, applyCommission(base)]
    })
    setError('')
  }, [])

  const handleUpdateQty = useCallback((key, delta) => {
    setItems(prev => prev.map(item => {
      if (item.key !== key) return item
      const newQty = Math.max(1, item.quantity + delta)
      return applyCommission({ ...item, quantity: newQty, totalPrice: item.unitPrice * newQty })
    }))
  }, [])

  const handleRemoveItem = useCallback((key) => {
    setItems(prev => prev.filter(i => i.key !== key))
  }, [])

  const { total, commission, net, cashChange } = useMemo(() => {
    const sub = items.reduce((s, i) => s + Number(i.totalPrice || 0), 0)
    const comm = items.reduce((s, i) => s + Number(i.commissionAmount || 0), 0)
    return {
      total: sub,
      commission: comm,
      net: Math.max(0, sub - comm),
      cashChange: (paymentMethod === 'cash' || paymentMethod === 'dinheiro')
        ? Math.max(0, (Number(amountReceived) || 0) - sub) : 0
    }
  }, [items, amountReceived, paymentMethod])

  const handleSubmit = useCallback(async () => {
    setError('')
    if (items.length === 0) { setError('Adicione ao menos um serviço ou produto'); return }
    if (!loggedInCollaboratorId && !selectedCollaboratorId && canManageCash) { setError('Selecione um colaborador'); return }
    if (isCollaborator && !loggedInCollaboratorId) { setError('Colaborador não identificado'); return }
    if ((paymentMethod === 'permuta') && !selectedCollaborator?.can_make_barter && !selectedCollaborator?.canMakeBarter) { setError('Permuta não liberada para este colaborador'); return }
    if ((paymentMethod === 'cash' || paymentMethod === 'dinheiro') && (Number(amountReceived) || 0) < total) { setError('Valor recebido menor que o total'); return }

    const effectiveCollaboratorId = selectedCollaboratorId || loggedInCollaboratorId
    setSubmitting(true)
    try {
      await onSubmit({
        collaboratorId: effectiveCollaboratorId,
        clientName: clientName || null,
        paymentMethod,
        amountReceived: (paymentMethod === 'cash' || paymentMethod === 'dinheiro') ? Number(amountReceived) || undefined : undefined,
        changeAmount: cashChange > 0 ? cashChange : 0,
        notes: notes || null,
        items: items.map(item => ({
          itemType: item.type,
          itemId: item.itemId,
          service_id: item.type === 'service' ? item.itemId : undefined,
          product_id: item.type === 'product' ? item.itemId : undefined,
          quantity: Number(item.quantity) || 1
        }))
      })
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Erro ao registrar venda')
    } finally {
      setSubmitting(false)
    }
  }, [items, selectedCollaboratorId, loggedInCollaboratorId, canManageCash, isCollaborator, paymentMethod, selectedCollaborator, amountReceived, total, cashChange, clientName, notes, onSubmit])

  const isCash = paymentMethod === 'cash' || paymentMethod === 'dinheiro'
  const cashStatus = cashSession?.status
  const isCashOpen = cashStatus === 'open'

  if (!open) return null

  return (
    <div className="ss-overlay" onClick={onClose}>
      <div className="ss-panel" ref={panelRef} onClick={e => e.stopPropagation()}>

        <div className="ss-header">
          <div className="ss-header-left">
            <button className="ss-back" onClick={onClose} type="button" aria-label="Fechar">
              <X size={18} />
            </button>
            <div>
              <h2 className="ss-title">Novo Atendimento</h2>
              <span className="ss-subtitle">Registre um atendimento no caixa</span>
            </div>
          </div>
          <span className="ss-header-time">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="ss-body">
          <div className="ss-form">

            <div className="ss-search">
              <Search size={14} className="ss-search-icon" />
              <input ref={searchRef} type="text" placeholder="Buscar serviço ou produto..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="ss-tabs">
              <button className={`ss-tab${catalogTab === 'all' ? ' active' : ''}`} onClick={() => setCatalogTab('all')} type="button">Todos</button>
              <button className={`ss-tab${catalogTab === 'services' ? ' active' : ''}`} onClick={() => setCatalogTab('services')} type="button">Serviços</button>
              <button className={`ss-tab${catalogTab === 'products' ? ' active' : ''}`} onClick={() => setCatalogTab('products')} type="button">Produtos</button>
            </div>

            <div className="ss-catalog">
              {filteredCatalog.length > 0 ? (
                filteredCatalog.map(item => (
                  <button key={`${item.type}-${item.id}`} className="ss-card" onClick={() => handleAddItem(item)} type="button">
                    <span className="ss-card-icon">{item.type === 'product' ? '📦' : '✂️'}</span>
                    <div className="ss-card-body">
                      <span className="ss-card-name">{item.name}</span>
                      <span className="ss-card-price">{money(item.price)}</span>
                    </div>
                    <Plus size={14} className="ss-card-add" />
                  </button>
                ))
              ) : (
                <p className="ss-catalog-empty">Nenhum item encontrado</p>
              )}
            </div>

            <div className="ss-fields">
              <div className="ss-field">
                <label htmlFor="ss-colab">Colaborador</label>
                {canManageCash ? (
                  <select id="ss-colab" value={selectedCollaboratorId} onChange={e => setSelectedCollaboratorId(e.target.value)}>
                    <option value="">Selecione</option>
                    {activeCollaborators.map(c => (
                      <option key={c.id} value={c.id}>{c.name || c.nickname}</option>
                    ))}
                  </select>
                ) : (
                  <span className="ss-field-value">{user?.name?.split(' ')[0] || 'Você'}</span>
                )}
              </div>

              <div className="ss-field">
                <label htmlFor="ss-client">Cliente</label>
                <input id="ss-client" type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome do cliente (opcional)" />
              </div>

              <div className="ss-field">
                <label>Pagamento</label>
                <div className="ss-chips">
                  {[
                    { v: 'pix', l: 'Pix' },
                    { v: 'cash', l: 'Dinheiro' },
                    { v: 'credit', l: 'Crédito' },
                    { v: 'debit', l: 'Débito' },
                    { v: 'permuta', l: 'Permuta' }
                  ].map(opt => (
                    <button key={opt.v} className={`ss-chip${paymentMethod === opt.v ? ' active' : ''}`} onClick={() => setPaymentMethod(opt.v)} type="button">
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {isCash && (
                <div className="ss-field">
                  <label htmlFor="ss-cash">Valor recebido</label>
                  <input id="ss-cash" type="number" step="0.01" min={total || 0} value={amountReceived} onChange={e => setAmountReceived(e.target.value)} placeholder="0,00" />
                </div>
              )}

              <div className="ss-field">
                <label htmlFor="ss-notes">Observações</label>
                <textarea id="ss-notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" />
              </div>
            </div>
          </div>

          <div className="ss-summary">
            <div className="ss-summary-inner">
              <h3 className="ss-summary-title">Resumo</h3>

              <div className="ss-summary-items">
                {items.length > 0 ? items.map(item => (
                  <div className="ss-summary-item" key={item.key}>
                    <div className="ss-summary-item-info">
                      <span className="ss-summary-item-name">{item.name}</span>
                      <div className="ss-qty">
                        <button className="ss-qty-btn" onClick={() => handleUpdateQty(item.key, -1)} type="button" aria-label="Diminuir quantidade">−</button>
                        <span>{item.quantity}</span>
                        <button className="ss-qty-btn" onClick={() => handleUpdateQty(item.key, 1)} type="button" aria-label="Aumentar quantidade">+</button>
                      </div>
                    </div>
                    <div className="ss-summary-item-right">
                      <span className="ss-summary-item-price">{money(item.totalPrice)}</span>
                      <button className="ss-summary-item-remove" onClick={() => handleRemoveItem(item.key)} type="button" aria-label="Remover item"><Trash2 size={14} /></button>
                    </div>
                  </div>
                )) : (
                  <div className="ss-summary-empty">
                    <Plus size={24} />
                    <p>Toque em um serviço ao lado<br />para começar</p>
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="ss-totals">
                  <div className="ss-total-row"><span>Subtotal</span><strong>{money(total)}</strong></div>
                  {commission > 0 && (
                    <div className="ss-total-row">
                      <span>Comissão {selectedCollaborator ? `(${selectedCollaborator.name || selectedCollaborator.nickname})` : ''}</span>
                      <strong>{money(commission)}</strong>
                    </div>
                  )}
                  <div className="ss-total-row ss-total-row--net">
                    <span>Líquido</span>
                    <strong>{money(net)}</strong>
                  </div>
                  {isCash && (
                    <div className="ss-total-row ss-total-row--change">
                      <span>Troco</span>
                      <strong>{money(Math.max(0, cashChange))}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="ss-context">
                <div className="ss-context-item">
                  <span>Caixa</span>
                  <span className={isCashOpen ? 'ss-text-success' : 'ss-text-danger'}>{isCashOpen ? 'Aberto' : 'Fechado'}</span>
                </div>
                <div className="ss-context-item">
                  <span>Pagamento</span>
                  <span className="ss-text-cap">{paymentMethod}</span>
                </div>
                <div className="ss-context-item">
                  <span>Itens</span>
                  <span>{items.length}</span>
                </div>
              </div>

              {error && (
                <div className="ss-error">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <button className="ss-submit" onClick={handleSubmit} disabled={submitting || items.length === 0} type="button">
                {submitting ? (
                  <span className="ss-submit-loading">Registrando...</span>
                ) : (
                  <><Plus size={16} /> Finalizar {items.length > 0 ? money(total) : ''}</>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
