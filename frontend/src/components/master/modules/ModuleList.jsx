import SectionCard from '../SectionCard'
import ModuleItem from './ModuleItem'

function ModuleList({ loading, modules, onEdit, onToggle, togglingId }) {
  return (
    <SectionCard className="master-module-list-card">
      <div className="panel-title">
        <div>
          <h2>Catalogo de modulos</h2>
          <span>Catalogo tecnico controlado pelo sistema, com gestao comercial separada e leitura segura.</span>
        </div>
        <span>{modules.length} registros</span>
      </div>

      {loading ? (
        <p>Carregando modulos...</p>
      ) : (
        <>
          <div className="table-wrap master-module-table">
          <table>
            <thead>
              <tr>
                <th>Modulo</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Planos</th>
                <th>Base path</th>
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
                  variant="table"
                />
              ))}

              {modules.length === 0 && (
                <tr>
                  <td colSpan="6">Nenhum modulo do catalogo foi encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <div className="master-module-card-list">
            {modules.map((module) => (
              <ModuleItem
                key={`${module.id}-card`}
                module={module}
                onEdit={onEdit}
                onToggle={onToggle}
                toggling={String(module.id) === String(togglingId)}
                variant="card"
              />
            ))}
          </div>
        </>
      )}
    </SectionCard>
  )
}

export default ModuleList
