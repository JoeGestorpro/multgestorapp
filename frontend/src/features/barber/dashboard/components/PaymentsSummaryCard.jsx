import { DollarSign, Smartphone, CreditCard, Banknote } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../../components/design-system/ui/Card'
import Empty from '../../../../components/design-system/feedback/Empty'
import Loading from '../../../../components/design-system/feedback/Skeleton'
import { money } from '../../utils/formatters'

const METHOD_CONFIG = {
  pix: { icon: Smartphone, color: 'var(--accent-primary)', label: 'PIX' },
  card: { icon: CreditCard, color: 'var(--info)', label: 'Cartão Débito' },
  cash: { icon: Banknote, color: 'var(--warning)', label: 'Dinheiro' },
  credit: { icon: CreditCard, color: 'var(--success)', label: 'Cartão Crédito' }
}

export default function PaymentsSummaryCard({ payments, loading }) {
  if (loading) {
    return (
      <Card className="payments-card payments-card--loading">
        <Loading size="md" />
      </Card>
    )
  }

  if (!payments) {
    return (
      <Card className="payments-card">
        <CardHeader><CardTitle>Recebimentos</CardTitle></CardHeader>
        <Empty title="Sem recebimentos" description="Nenhum pagamento registrado hoje." compact />
      </Card>
    )
  }

  const methods = Object.entries(payments)
    .filter(([, data]) => data.amount > 0)
    .map(([key, data]) => ({ key, ...data, ...(METHOD_CONFIG[key] || { icon: DollarSign, color: 'var(--text-muted)', label: key }) }))

  const total = methods.reduce((sum, m) => sum + m.amount, 0)

  return (
    <Card className="payments-card">
      <CardHeader>
        <CardTitle>Recebimentos do Dia</CardTitle>
        <CardSubtitle>Total: {money(total)}</CardSubtitle>
      </CardHeader>
      <CardBody>
        {methods.length > 0 ? (
          <div className="payments-list">
            {methods.map(({ key, icon, color, label, amount, count }) => {
              // Alias em maiúscula para uso como tag JSX (o lint core não conta
              // JSXIdentifier como uso de parâmetro; vars ^[A-Z_] são ignoradas).
              const Icon = icon
              return (
                <div className="payments-item" key={key}>
                  <div className="payments-item__icon" style={{ color }}>
                    <Icon size={18} />
                  </div>
                  <div className="payments-item__info">
                    <span className="payments-item__label">{label}</span>
                    <span className="payments-item__count">{count} receb.</span>
                  </div>
                  <strong className="payments-item__value">{money(amount)}</strong>
                </div>
              )
            })}
          </div>
        ) : (
          <Empty title="Sem recebimentos" description="Nenhum pagamento registrado hoje." compact />
        )}
      </CardBody>
    </Card>
  )
}
