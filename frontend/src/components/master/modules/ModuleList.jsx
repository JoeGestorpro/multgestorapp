import SectionCard from '../SectionCard'
import ModuleItem from './ModuleItem'

function ModuleList({ loading, modules, onEdit, onToggle, togglingId }) {
  return (
    <SectionCard className="master-module-list-card">
        <div className="panel-title">
          <div>
          <h2>Modulos configurados</h2>
          <span>Inventario tecnico de modulos com configuracoes prontas para evolucao de backend.</span>
          </div>
          <span>{modules.length} registros</span>
        </div>

      {loading ? (
        <p>Carregando modulos...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Base path</th>
                <th>Data criacao</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => (
                <ModuleItem
                  key={module.id}
                  module={module}
                  onEdit={onEdit}
                  onToggle={onToggle}
                  toggling={String(module.id) === String(togglingId)}
                />
              ))}

              {modules.length === 0 && (
                <tr>
                  <td colSpan="6">Nenhum modulo cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}

export default ModuleList
