import { useState, useMemo } from 'react'
import TeamCard from './TeamCard'
import TeamEmptyState from './TeamEmptyState'

export default function TeamList({
  collaborators,
  isAdmin,
  onEdit,
  onToggleStatus,
  onRemove,
  onCreate
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return collaborators.filter((c) => {
      if (statusFilter === 'active' && !c.is_active) return false
      if (statusFilter === 'inactive' && c.is_active) return false
      if (search) {
        const q = search.toLowerCase()
        const name = String(c.name || c.nickname || '').toLowerCase()
        const email = String(c.email || '').toLowerCase()
        if (!name.includes(q) && !email.includes(q)) return false
      }
      return true
    })
  }, [collaborators, search, statusFilter])

  const isEmpty = collaborators.length === 0

  if (isEmpty) {
    return <TeamEmptyState isAdmin={isAdmin} hasOperationalCollaborators={false} onCreate={onCreate} />
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          className="barber-input"
          placeholder="Buscar por nome ou email..."
          style={{ flex: 1, minWidth: 180, minHeight: 44 }}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="barber-select"
          style={{ minWidth: 140, minHeight: 44 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <TeamEmptyState isAdmin={isAdmin} hasOperationalCollaborators={true} />
      ) : (
        <div className="barber-team-grid">
          {filtered.map((c) => (
            <TeamCard
              key={c.id}
              collaborator={c}
              onEdit={isAdmin ? onEdit : null}
              onToggleStatus={isAdmin ? onToggleStatus : null}
              onRemove={isAdmin ? onRemove : null}
            />
          ))}
        </div>
      )}

      {!isEmpty && filtered.length < collaborators.length && (
        <p style={{ color: 'var(--barber-muted)', fontSize: 13, textAlign: 'center' }}>
          Mostrando {filtered.length} de {collaborators.length} colaborador(es)
        </p>
      )}
    </div>
  )
}
