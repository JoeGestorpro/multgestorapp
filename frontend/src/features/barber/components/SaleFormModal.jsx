import { money, collaboratorDisplayName } from '../utils/formatters'
import { SummaryCard } from '../../../components/design-system'
import { BarberButton, BarberEmptyState, BarberIcon, BarberModal, BarberTable } from '../../../components/barber/BarberUI'

export default function SaleFormModal({
  saleModalOpen,
  closeSaleModal,
  canManageCash,
  visibleServices,
  collaborators,
  collaboratorDisplayName,
  loggedInCollaborator,
  user,
  saleForm,
  updateSaleForm,
  salePaymentOptions,
  isCashPayment,
  saleEffectiveTotal,
  addSaleItem,
  removeSaleItem,
  saleTotal,
  saleCommissionTotal,
  activeSaleCollaborator,
  saleShopNetTotal,
  saleChangeDue,
  submittingSale,
  createSale
}) {
  return (
    <BarberModal
      onClose={closeSaleModal}
      open={saleModalOpen}
      subtitle={canManageCash
        ? 'Selecione um servico ativo, vincule o colaborador e registre a venda direto no caixa.'
        : 'Selecione um servico ativo e registre a venda vinculada automaticamente ao colaborador autenticado.'}
      title="Nova venda"
    >
      <div className="barber-modal-content">
        <form className="barber-panel-stack" onSubmit={createSale}>
          <div className="barber-form-grid">
            <div className="barber-form-block">
              <label htmlFor="cash-sale-service">Servico</label>
              <select
                className="barber-select"
                id="cash-sale-service"
                name="serviceId"
                onChange={updateSaleForm}
                value={saleForm.serviceId}
              >
                <option value="">Selecione o servico</option>
                {visibleServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {money(service.price)}
                  </option>
                ))}
              </select>
            </div>

            {canManageCash ? (
              <div className="barber-form-block">
                <label htmlFor="cash-sale-collaborator">Colaborador</label>
                <select
                  className="barber-select"
                  id="cash-sale-collaborator"
                  name="collaboratorId"
                  onChange={updateSaleForm}
                  required
                  value={saleForm.collaboratorId}
                >
                  <option value="">Selecione o colaborador</option>
                  {collaborators
                    .filter((collaborator) => collaborator.is_active)
                    .map((collaborator) => (
                      <option key={collaborator.id} value={collaborator.id}>
                        {collaborator.name || collaborator.nickname}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="barber-form-block">
                <label>Colaborador</label>
                <div className="barber-inline-hint">
                  {collaboratorDisplayName(loggedInCollaborator) || user?.name || 'Colaborador autenticado'}
                </div>
              </div>
            )}

            <div className="barber-form-block">
              <label htmlFor="cash-sale-quantity">Quantidade</label>
              <input
                className="barber-input"
                id="cash-sale-quantity"
                min="1"
                name="quantity"
                onChange={updateSaleForm}
                step="1"
                type="number"
                value={saleForm.quantity}
              />
            </div>

            <div className="barber-form-block">
              <label htmlFor="cash-sale-client">Cliente</label>
              <input
                className="barber-input"
                id="cash-sale-client"
                name="clientName"
                onChange={updateSaleForm}
                placeholder="Opcional"
                value={saleForm.clientName}
              />
            </div>

            <div className="barber-form-block">
              <label htmlFor="cash-sale-payment">Pagamento</label>
              <select
                className="barber-select"
                id="cash-sale-payment"
                name="paymentMethod"
                onChange={updateSaleForm}
                required
                value={saleForm.paymentMethod}
              >
                {salePaymentOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {isCashPayment && (
              <div className="barber-form-block">
                <label htmlFor="cash-sale-received">Valor recebido</label>
                <input
                  className="barber-input"
                  id="cash-sale-received"
                  min={saleEffectiveTotal || 0}
                  name="amountReceived"
                  onChange={updateSaleForm}
                  step="0.01"
                  type="number"
                  value={saleForm.amountReceived}
                />
              </div>
            )}

            <div className="barber-form-block barber-form-block-full">
              <label htmlFor="cash-sale-notes">Observacoes</label>
              <textarea
                className="barber-textarea"
                id="cash-sale-notes"
                name="notes"
                onChange={updateSaleForm}
                rows="3"
                value={saleForm.notes}
              />
            </div>
          </div>

          <div className="barber-inline-actions">
            <BarberButton onClick={addSaleItem} type="button" variant="secondary">
              <BarberIcon name="plus" />
              <span>Adicionar item</span>
            </BarberButton>
          </div>

          <BarberTable columns={['Tipo', 'Item', 'Qtd', 'Valor', 'Comissao', 'Liquido', 'Acoes']}>
            {saleForm.items.length > 0 ? (
              saleForm.items.map((item) => (
                <tr key={item.key}>
                  <td>Servico</td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{money(item.totalPrice)}</td>
                  <td>{money(item.commissionAmount)}</td>
                  <td>{money(item.shopNetAmount)}</td>
                  <td>
                    <BarberButton onClick={() => removeSaleItem(item.key)} type="button" variant="danger">
                      Remover
                    </BarberButton>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">
                  <BarberEmptyState
                      description="Adicione servicos do catalogo para registrar a operacao."
                      title="Nenhum item na venda"
                    />
                </td>
              </tr>
            )}
          </BarberTable>

          <SummaryCard
            items={[
              {
                label: "Total bruto",
                description: saleForm.items.length ? `${saleForm.items.length} item(ns) na operacao` : 'Adicione itens para montar a venda',
                value: <strong>{money(saleTotal)}</strong>
              },
              {
                label: "Comissao total",
                description: activeSaleCollaborator ? `Aplicada para ${collaboratorDisplayName(activeSaleCollaborator)}` : 'Escolha o colaborador responsavel',
                value: <strong>{money(saleCommissionTotal)}</strong>
              },
              {
                label: "Liquido da barbearia",
                description: "Total menos a comissao dos itens",
                value: <strong>{money(saleShopNetTotal)}</strong>,
                valueVariant: "success"
              },
              {
                label: "Troco",
                description: isCashPayment ? 'Calculado em tempo real' : 'Nao se aplica',
                value: (
                  <strong style={isCashPayment && saleChangeDue < 0 ? { color: '#ff7d7d' } : undefined}>
                    {isCashPayment ? money(Math.max(0, saleChangeDue)) : money(0)}
                  </strong>
                )
              }
            ]}
          />

          {isCashPayment && saleForm.amountReceived && saleChangeDue < 0 && (
            <div className="barber-message barber-message-error">
              Valor recebido menor que o total da venda.
            </div>
          )}

          <div className="barber-modal-actions">
            <BarberButton onClick={closeSaleModal} type="button" variant="ghost">
              Cancelar
            </BarberButton>
            <BarberButton disabled={submittingSale} type="submit" variant="primary">
              <BarberIcon name="plus" />
              <span>{submittingSale ? 'Lancando venda...' : 'Lancar venda do colaborador'}</span>
            </BarberButton>
          </div>
        </form>
      </div>
    </BarberModal>
  )
}
