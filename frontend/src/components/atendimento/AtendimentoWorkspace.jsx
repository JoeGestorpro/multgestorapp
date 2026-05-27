import { useMemo, useState, useCallback, useEffect } from 'react'
import MiniFinancialCards from './MiniFinancialCards'
import ServiceCatalog from './ServiceCatalog'
import AtendimentoCart from './AtendimentoCart'
import AtendimentoHeader from './AtendimentoHeader'
import AtendimentoSuccess from './AtendimentoSuccess'
import LoadingState from './LoadingState'
import EmptyStateAtendimento from './EmptyStateAtendimento'
import HistoryTable from './HistoryTable'
import PaymentErrorModal from './PaymentErrorModal'
import QuickSaleModal from './QuickSaleModal'
import './atendimento.css'

function AtendimentoWorkspace({
  services = [],
  products = [],
  collaborators = [],
  salesSummary = {},
  salesHistory = [],
  onSubmit,
  onRefresh,
  isLoading = false,
  canManageCash = false,
  isCollaborator = false,
  currentCollaboratorId = null
}) {
  const [items, setItems] = useState([])
  const [clientName, setClientName] = useState('')
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState(currentCollaboratorId || '')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [amountReceived, setAmountReceived] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [cartExpanded, setCartExpanded] = useState(false)
  const [periodFilter, setPeriodFilter] = useState('today')
  const [searchTerm, setSearchTerm] = useState('')
  const [showPaymentError, setShowPaymentError] = useState(false)
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('')
  const [showQuickSale, setShowQuickSale] = useState(false)

  const activeCollaborators = useMemo(() => {
    return collaborators.filter(c => c.is_active && !c.is_deleted)
  }, [collaborators])

  const selectedCollaborator = useMemo(() => {
    if (!selectedCollaboratorId) return null
    return activeCollaborators.find(c => String(c.id) === String(selectedCollaboratorId)) || null
  }, [selectedCollaboratorId, activeCollaborators])

  const paymentOptions = useMemo(() => {
    const options = ['pix', 'cash', 'credit', 'debit']
    return options
  }, [])

  const { total, commission, net, cashChange } = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (Number(item.totalPrice) || 0)
    }, 0)
    const comm = items.reduce((sum, item) => {
      return sum + (Number(item.commissionAmount) || 0)
    }, 0)
    const netTotal = Math.max(0, subtotal - comm)
    const received = Number(amountReceived) || 0
    const change = received > subtotal ? received - subtotal : 0

    return { total: subtotal, commission: comm, net: netTotal, cashChange: change }
  }, [items, amountReceived])

  function applyCommission(item, collaborator) {
    const totalPrice = Number(item.unitPrice) * Number(item.quantity)
    if (!collaborator || item.itemType !== 'service') {
      return { ...item, commissionType: 'percentage', commissionValue: 0, commissionAmount: 0, shopNetAmount: totalPrice }
    }
    const commType = collaborator.commission_type || collaborator.commissionType || 'percentage'
    const commRate = Number(collaborator.commission_rate ?? collaborator.commissionRate ?? 0)
    const commissionAmount = commType === 'fixed'
      ? commRate * Number(item.quantity)
      : totalPrice * (commRate / 100)
    return {
      ...item,
      commissionType: commType,
      commissionValue: commRate,
      commissionAmount,
      shopNetAmount: Math.max(0, totalPrice - commissionAmount)
    }
  }

  const formatPrice = (value) => {
    if (!value && value !== 0) return 'R$ --'
    const num = Number(value)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num)
  }

  const handleSelectItem = useCallback((itemData) => {
    const unitPrice = Number(itemData.price) || 0
    const key = `${itemData.type}-${itemData.id}-${Date.now()}`

    setItems(prev => {
      const existing = prev.find(i => i.itemId === itemData.id && i.itemType === itemData.type)
      if (existing) {
        return prev.map(i => {
          if (i.key !== existing.key) return i
          const newQty = i.quantity + 1
          return applyCommission(
            { ...i, quantity: newQty, totalPrice: i.unitPrice * newQty, commissionAmount: 0, shopNetAmount: i.unitPrice * newQty },
            selectedCollaborator
          )
        })
      }
      const baseItem = {
        key,
        itemType: itemData.type,
        itemId: itemData.id,
        name: itemData.name,
        icon: itemData.icon || 'scissors',
        unitPrice,
        quantity: 1,
        totalPrice: unitPrice,
        commissionType: 'percentage',
        commissionValue: 0,
        commissionAmount: 0,
        shopNetAmount: unitPrice
      }
      return [...prev, applyCommission(baseItem, selectedCollaborator)]
    })

    setCartExpanded(true)
  }, [selectedCollaborator])

  const handleUpdateQty = useCallback((itemKey, delta) => {
    setItems(prev => prev.map(item => {
      if (item.key !== itemKey) return item
      const newQty = Math.max(1, item.quantity + delta)
      return applyCommission(
        { ...item, quantity: newQty, totalPrice: item.unitPrice * newQty, commissionAmount: 0, shopNetAmount: item.unitPrice * newQty },
        selectedCollaborator
      )
    }))
  }, [selectedCollaborator])

  const handleRemoveItem = useCallback((itemKey) => {
    setItems(prev => prev.filter(i => i.key !== itemKey))
  }, [])

  const handleClear = useCallback(() => {
    setItems([])
    setClientName('')
    setPaymentMethod('pix')
    setAmountReceived('')
    setNotes('')
  }, [])

  const handleSubmit = useCallback(async () => {
    if (items.length === 0) return

    setIsSubmitting(true)

    try {
      const effectiveCollaboratorId = selectedCollaboratorId || currentCollaboratorId || null
      const isCashPayment = paymentMethod === 'cash'

      const saleData = {
        collaboratorId: effectiveCollaboratorId,
        clientName: clientName || null,
        paymentMethod,
        amountReceived: isCashPayment ? Number(amountReceived) || undefined : undefined,
        changeAmount: cashChange > 0 ? cashChange : 0,
        notes: notes || null,
        items: items.map(item => ({
          itemType: item.itemType,
          itemId: item.itemId,
          service_id: item.itemType === 'service' ? item.itemId : undefined,
          product_id: item.itemType === 'product' ? item.itemId : undefined,
          quantity: Number(item.quantity) || 1
        }))
      }

      await onSubmit(saleData)

      setLastSale({
        total,
        paymentMethod,
        clientName
      })
      setShowSuccess(true)

      setTimeout(() => {
        handleClear()
        setShowSuccess(false)
      }, 2000)

    } catch (error) {
      console.error('Error submitting sale:', error)
      setPaymentErrorMessage(error?.response?.data?.message || error?.message || 'Erro ao processar pagamento. Verifique os dados e tente novamente.')
      setShowPaymentError(true)
    } finally {
      setIsSubmitting(false)
    }
  }, [items, clientName, selectedCollaboratorId, currentCollaboratorId, paymentMethod, amountReceived, cashChange, notes, total, onSubmit, handleClear])

  const handleRetryPayment = useCallback(() => {
    setShowPaymentError(false)
    setPaymentErrorMessage('')
  }, [])

  const handleQuickSaleProduct = useCallback((productData) => {
    handleSelectItem({
      id: productData.id,
      name: productData.name,
      price: productData.price,
      icon: 'package',
      type: 'product'
    })
  }, [handleSelectItem])

  const handleNewAttendance = useCallback(() => {
    handleClear()
    setShowSuccess(false)
  }, [handleClear])

  useEffect(() => {
    if (items.length === 0) return
    setItems(prev => prev.map(item => applyCommission(item, selectedCollaborator)))
  }, [selectedCollaboratorId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <LoadingState />
  }

  const isEmpty = services.length === 0 && products.length === 0
  if (isEmpty && !showSuccess) {
    return (
      <div className="at-workspace">
        <AtendimentoHeader
          itemCount={0}
          total=""
          onRefresh={onRefresh}
          onNewAttendance={handleNewAttendance}
          periodFilter={periodFilter}
          onPeriodChange={setPeriodFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <EmptyStateAtendimento onNewAttendance={handleNewAttendance} />
      </div>
    )
  }

  if (showSuccess && lastSale) {
    return (
      <div className="at-workspace">
        <AtendimentoHeader
          itemCount={0}
          total=""
          onRefresh={onRefresh}
          onNewAttendance={handleNewAttendance}
          periodFilter={periodFilter}
          onPeriodChange={setPeriodFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <AtendimentoSuccess
          total={lastSale.total}
          paymentMethod={lastSale.paymentMethod}
          clientName={lastSale.clientName}
          onNewAttendance={handleNewAttendance}
        />
      </div>
    )
  }

  return (
    <div className="at-workspace">
      <AtendimentoHeader
        itemCount={items.length}
        total={formatPrice(total)}
        onRefresh={onRefresh}
        onNewAttendance={handleNewAttendance}
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <MiniFinancialCards
        today={formatPrice(salesSummary.totals_day?.total_amount || 0)}
        week={formatPrice(salesSummary.totals_week?.total_amount || 0)}
        month={formatPrice(salesSummary.totals_month?.total_amount || 0)}
        commission={formatPrice(salesSummary.total_commission || 0)}
        todayCount={salesSummary.totals_day?.total_sales || 0}
        weekCount={salesSummary.totals_week?.total_sales || 0}
        monthCount={salesSummary.totals_month?.total_sales || 0}
      />

      <HistoryTable sales={salesHistory} />

      <div className="at-main">
        <ServiceCatalog
          services={services}
          products={products}
          onSelectItem={handleSelectItem}
          selectedItems={items}
        />

        <AtendimentoCart
          items={items}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onClear={handleClear}
          clientName={clientName}
          onClientChange={setClientName}
          paymentMethod={paymentMethod}
          onPaymentChange={setPaymentMethod}
          amountReceived={amountReceived}
          onAmountReceived={setAmountReceived}
          total={total}
          commission={commission}
          net={net}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          canManageCash={canManageCash}
          isCollaborator={isCollaborator}
          collaborators={activeCollaborators}
          selectedCollaboratorId={selectedCollaboratorId}
          onCollaboratorChange={setSelectedCollaboratorId}
          cashChange={cashChange}
          paymentOptions={paymentOptions}
          isExpanded={cartExpanded}
          onToggleExpand={() => setCartExpanded(!cartExpanded)}
        />
      </div>

      <PaymentErrorModal
        open={showPaymentError}
        onClose={() => setShowPaymentError(false)}
        onRetry={handleRetryPayment}
        errorMessage={paymentErrorMessage}
      />

      <QuickSaleModal
        open={showQuickSale}
        onClose={() => setShowQuickSale(false)}
        products={products}
        onAddProduct={handleQuickSaleProduct}
      />
    </div>
  )
}

export default AtendimentoWorkspace