import { AlertTriangle } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../../components/design-system/ui/Card'
import Badge from '../../../../components/design-system/ui/Badge'
import Empty from '../../../../components/design-system/feedback/Empty'
import Loading from '../../../../components/design-system/feedback/Skeleton'
import { money } from '../../utils/formatters'

export default function ExtraSalesCard({ products, loading }) {
  if (loading) {
    return (
      <Card className="extra-sales-card extra-sales-card--loading">
        <Loading size="md" />
      </Card>
    )
  }

  const lowCount = (products || []).filter((p) => p.isLow).length

  return (
    <Card className="extra-sales-card">
      <CardHeader>
        <div className="extra-sales__header">
          <div>
            <CardTitle>Produtos e Geladeira</CardTitle>
            <CardSubtitle>Vendas extras e estoque</CardSubtitle>
          </div>
          {lowCount > 0 && (
            <Badge variant="warning">
              <AlertTriangle size={12} />
              {lowCount} alerta{lowCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {products.length > 0 ? (
          <div className="extra-sales__list">
            {products.map((product) => (
              <div className="extra-sales__item" key={product.id}>
                <div className="extra-sales__item-info">
                  <span className="extra-sales__item-name">{product.name}</span>
                  <span className="extra-sales__item-qty">
                    {product.isOut ? (
                      <Badge variant="danger">Esgotado</Badge>
                    ) : (
                      <span className={product.isLow ? 'extra-sales__qty--low' : ''}>{product.quantity} un.</span>
                    )}
                  </span>
                </div>
                <span className="extra-sales__item-revenue">{money(product.revenue)}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="Sem produtos cadastrados" description="Cadastre produtos para acompanhar as vendas extras." compact />
        )}
      </CardBody>
    </Card>
  )
}
