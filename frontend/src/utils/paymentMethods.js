const PAYMENT_METHODS = {
  pix: {
    label: 'Pix',
    tone: 'pix',
    chartColor: '#5ca8ff'
  },
  cash: {
    label: 'Dinheiro',
    tone: 'cash',
    chartColor: '#5cff6b'
  },
  credit: {
    label: 'Cartão Crédito',
    tone: 'credit',
    chartColor: '#ff8a4c'
  },
  debit: {
    label: 'Cartão Débito',
    tone: 'debit',
    chartColor: '#9d7cff'
  },
  barter: {
    label: 'Permuta',
    tone: 'permuta',
    chartColor: '#f4c86c'
  }
}

const PAYMENT_METHOD_ALIASES = {
  dinheiro: 'cash',
  cash: 'cash',
  pix: 'pix',
  cartao: 'credit',
  card: 'credit',
  credito: 'credit',
  credit: 'credit',
  debito: 'debit',
  debit: 'debit',
  barter: 'barter',
  trade: 'barter',
  permuta: 'barter'
}

export function normalizePaymentMethod(paymentMethod) {
  const normalized = String(paymentMethod || '').trim().toLowerCase()
  return PAYMENT_METHOD_ALIASES[normalized] || normalized
}

export function getPaymentMethodLabel(paymentMethod) {
  const normalized = normalizePaymentMethod(paymentMethod)
  return PAYMENT_METHODS[normalized]?.label || paymentMethod || 'Nao informado'
}

export function getPaymentMethodTone(paymentMethod) {
  const normalized = normalizePaymentMethod(paymentMethod)
  return PAYMENT_METHODS[normalized]?.tone || 'cash'
}

export function getPaymentMethodChartColor(paymentMethod) {
  const normalized = normalizePaymentMethod(paymentMethod)
  return PAYMENT_METHODS[normalized]?.chartColor || '#5cff6b'
}

export function buildPaymentOptions({ includeBarter = true } = {}) {
  return ['pix', 'cash', 'credit', 'debit', 'barter']
    .filter((method) => includeBarter || method !== 'barter')
    .map((method) => ({
      value: method === 'barter' ? 'permuta' : method,
      label: getPaymentMethodLabel(method),
      tone: getPaymentMethodTone(method),
      icon: {
        pix: 'money',
        cash: 'wallet',
        credit: 'catalog',
        debit: 'catalog',
        barter: 'switch'
      }[method]
    }))
}

export const paymentMethodLabels = Object.freeze(
  Object.fromEntries(
    Object.keys(PAYMENT_METHOD_ALIASES).map((alias) => [
      alias,
      getPaymentMethodLabel(alias)
    ])
  )
)
