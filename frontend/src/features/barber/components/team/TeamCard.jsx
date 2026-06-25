import CollaboratorAvatar from '../../../../components/barber/CollaboratorAvatar'
import { collaboratorDisplayName } from '../../utils/formatters'
import TeamStatusBadge from './TeamStatusBadge'

export default function TeamCard({
  collaborator,
  onEdit,
  onToggleStatus,
  onRemove
}) {
  const badges = []

  badges.push({ type: collaborator.is_active ? 'active' : 'inactive' })

  if (!collaborator.email) {
    badges.push({ type: 'noEmail' })
  }

  if (!collaborator.commission_rate && !collaborator.commissionRate) {
    badges.push({ type: 'noCommission' })
  }

  if (collaborator.available_for_booking || collaborator.availableForBooking) {
    badges.push({ type: 'booking' })
  }

  if (collaborator.can_launch_sales || collaborator.canLaunchSales) {
    badges.push({ type: 'sales' })
  }

  if (collaborator.can_view_own_dashboard || collaborator.canViewOwnDashboard) {
    badges.push({ type: 'dashboard' })
  }

  if (collaborator.can_view_own_reports || collaborator.canViewOwnReports) {
    badges.push({ type: 'report' })
  }

  if (collaborator.can_make_barter || collaborator.canMakeBarter) {
    badges.push({ type: 'barter' })
  }

  return (
    <div className="barber-card barber-card-team" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <CollaboratorAvatar
          avatarUrl={collaborator.avatar_url}
          name={collaboratorDisplayName(collaborator)}
          size="md"
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <strong style={{ color: '#f8fafc', display: 'block', fontSize: 16 }}>
            {collaboratorDisplayName(collaborator)}
          </strong>
          <span style={{ color: 'var(--barber-muted)', fontSize: 13 }}>
            {collaborator.email || 'Sem email'}
            {collaborator.phone ? ` • ${collaborator.phone}` : ''}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {badges.map((badge, i) => (
          <TeamStatusBadge key={i} type={badge.type} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 12 }}>
        {onEdit && (
          <button className="barber-button barber-button-ghost" onClick={() => onEdit(collaborator.id)} type="button" style={{ flex: 1, minWidth: 0 }}>
            Editar
          </button>
        )}
        {onToggleStatus && (
          <button
            className={`barber-button ${collaborator.is_active ? 'barber-button-secondary' : 'barber-button-primary'}`}
            onClick={() => onToggleStatus(collaborator)}
            type="button"
            style={{ flex: 1, minWidth: 0 }}
          >
            {collaborator.is_active ? 'Desativar' : 'Ativar'}
          </button>
        )}
        {onRemove && (
          <button className="barber-button barber-button-danger" onClick={() => onRemove(collaborator.id)} type="button" style={{ flex: 1, minWidth: 0 }}>
            Excluir
          </button>
        )}
      </div>
    </div>
  )
}
