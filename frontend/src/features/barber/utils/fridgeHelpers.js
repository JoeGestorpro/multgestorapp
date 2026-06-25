export const FRIDGE_LOCATIONS = [
  { value: 'geladeira', label: 'Geladeira' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'balcao', label: 'Balcão' },
  { value: 'prateleira', label: 'Prateleira' }
]

export const FRIDGE_CATEGORIES = [
  { value: 'bebida', label: 'Bebida' },
  { value: 'produto', label: 'Produto' },
  { value: 'alimento', label: 'Alimento' },
  { value: 'outro', label: 'Outro' }
]

export const emptyFridgeItem = {
  name: '',
  category: '',
  location: 'geladeira',
  salePrice: '',
  costPrice: '',
  stockCurrent: '',
  stockMinimum: '',
  unit: 'un',
  commissionEnabled: false,
  commissionType: 'percent',
  commissionValue: '',
  isFavorite: false,
  isActive: true
}

export const defaultFridgeFilters = {
  search: '',
  status: 'all',
  location: '',
  category: ''
}

export function normalizeFridgeItem(item) {
  return {
    name: item?.name || '',
    category: item?.category || '',
    location: item?.location || 'geladeira',
    salePrice: item?.sale_price ?? item?.salePrice ?? '',
    costPrice: item?.cost_price ?? item?.costPrice ?? '',
    stockCurrent: item?.stock_current ?? item?.stockCurrent ?? '',
    stockMinimum: item?.stock_minimum ?? item?.stockMinimum ?? '',
    unit: item?.unit || 'un',
    commissionEnabled: item?.commission_enabled ?? item?.commissionEnabled ?? false,
    commissionType: item?.commission_type ?? item?.commissionType ?? 'percent',
    commissionValue: item?.commission_value ?? item?.commissionValue ?? '',
    isFavorite: item?.is_favorite ?? item?.isFavorite ?? false,
    isActive: item?.is_active ?? item?.isActive ?? true
  }
}

export function fridgeItemToPayload(form) {
  return {
    name: form.name,
    category: form.category || null,
    location: form.location,
    salePrice: Number(form.salePrice || 0),
    costPrice: form.costPrice === '' ? null : Number(form.costPrice),
    stockCurrent: Number(form.stockCurrent || 0),
    stockMinimum: Number(form.stockMinimum || 0),
    unit: form.unit || 'un',
    commissionEnabled: form.commissionEnabled,
    commissionType: form.commissionEnabled ? form.commissionType : 'percent',
    commissionValue: form.commissionEnabled ? Number(form.commissionValue || 0) : 0,
    isFavorite: form.isFavorite,
    isActive: form.isActive
  }
}

export function getStockStatus(item) {
  if (!item.isActive && !item.is_active) return 'inactive'
  const current = Number(item.stockCurrent ?? item.stock_current ?? 0)
  if (current <= 0) return 'out'
  const min = Number(item.stockMinimum ?? item.stock_minimum ?? 0)
  if (min > 0 && current <= min) return 'low'
  return 'normal'
}
