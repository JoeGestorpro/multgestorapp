import { ShoppingBag } from 'lucide-react'
import { BarberEmptyState } from '../barber/BarberUI'

function EmptyStateAtendimento({ onNewAttendance }) {
  return (
    <div className="at-empty-state">
      <BarberEmptyState
        icon="sales"
        title="Nenhum atendimento encontrado"
        description="Crie um novo atendimento para começar a registrar serviços e vendas."
        action={onNewAttendance}
        actionLabel="Novo Atendimento"
      />
    </div>
  )
}

export default EmptyStateAtendimento
