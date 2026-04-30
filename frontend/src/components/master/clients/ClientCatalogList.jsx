import SectionCard from '../SectionCard'

function ClientRowActions({ client, onManage, onToggleStatus, onAccessAction, accessBusy, statusBusy }) {
  return (
    <div className="table-actions">
      <button type="button" onClick={() => onManage(client)}>
        Gerenciar
      </button>
      <button className="button-secondary" type="button" disabled={statusBusy} onClick={() => onToggleStatus(client)}>
        {statusBusy ? 'Salvando...' : client.company_status === 'ativo' ? 'Inativar' : 'Ativar'}
      </button>
      <button className="button-secondary" type="button" disabled={accessBusy} onClick={() => onAccessAction(client)}>
        {accessBusy ? 'Enviando...' : client.pending_activation ? 'Reenviar acesso' : 'Criar acesso'}
      </button>
    </div>
  )
}

function ClientCatalogList({
  loading,
  clients,
  onManage,
  onToggleStatus,
  onAccessAction,
  statusBusyId,
  accessBusyId
}) {
  return (
    <SectionCard className="master-client-list-card">
      <div className="panel-title">
        <div>
          <h2>Catalogo de clientes</h2>
          <span>Empresas, modulo principal, plano, origem e disponibilidade comercial em uma visao unica.</span>
        </div>
        <span>{clients.length} registros</span>
      </div>

      {loading ? (
        <p>Carregando clientes...</p>
      ) : (
        <>
          <div className="table-wrap master-client-table">
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Nicho</th>
                  <th>Modulo principal</th>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Origem</th>
                  <th>Criado em</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div className="master-client-company-cell">
                        <strong>{client.name}</strong>
                        <small>{client.email || client.phoneLabel || 'Sem contato principal'}</small>
                      </div>
                    </td>
                    <td>{client.niche || '-'}</td>
                    <td>{client.primary_module_name || 'Sem modulo'}</td>
                    <td>{client.plan_name || '-'}</td>
                    <td>
                      <span className={`master-client-status-pill ${client.company_status}`}>
                        {client.company_status_label}
                      </span>
                    </td>
                    <td>{client.source_label}</td>
                    <td>{client.created_label}</td>
                    <td>
                      <ClientRowActions
                        client={client}
                        onManage={onManage}
                        onToggleStatus={onToggleStatus}
                        onAccessAction={onAccessAction}
                        accessBusy={String(accessBusyId) === String(client.id)}
                        statusBusy={String(statusBusyId) === String(client.id)}
                      />
                    </td>
                  </tr>
                ))}

                {clients.length === 0 && (
                  <tr>
                    <td colSpan="8">Nenhum cliente encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="master-client-card-list">
            {clients.map((client) => (
              <article key={`${client.id}-card`} className="master-client-card-item">
                <div className="master-client-card-header">
                  <div className="master-client-company-cell">
                    <strong>{client.name}</strong>
                    <small>{client.email || client.phoneLabel || 'Sem contato principal'}</small>
                  </div>
                  <span className={`master-client-status-pill ${client.company_status}`}>
                    {client.company_status_label}
                  </span>
                </div>

                <div className="master-client-card-meta">
                  <div>
                    <span>Nicho</span>
                    <strong>{client.niche || '-'}</strong>
                  </div>
                  <div>
                    <span>Modulo principal</span>
                    <strong>{client.primary_module_name || 'Sem modulo'}</strong>
                  </div>
                  <div>
                    <span>Plano</span>
                    <strong>{client.plan_name || '-'}</strong>
                  </div>
                  <div>
                    <span>Origem</span>
                    <strong>{client.source_label}</strong>
                  </div>
                  <div>
                    <span>Criado em</span>
                    <strong>{client.created_label}</strong>
                  </div>
                </div>

                <ClientRowActions
                  client={client}
                  onManage={onManage}
                  onToggleStatus={onToggleStatus}
                  onAccessAction={onAccessAction}
                  accessBusy={String(accessBusyId) === String(client.id)}
                  statusBusy={String(statusBusyId) === String(client.id)}
                />
              </article>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  )
}

export default ClientCatalogList
