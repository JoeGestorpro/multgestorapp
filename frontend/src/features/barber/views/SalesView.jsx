import { Check } from 'lucide-react'
import { Card, Button } from '../../../components/design-system'
import {
  getPaymentMethodLabel,
  getPaymentMethodTone
} from '../../../utils/paymentMethods'
import {
  BarberBadge,
  BarberButton,
  BarberCard,
  BarberEmptyState,
  BarberIcon,
  BarberModal,
  BarberTable
} from '../../../components/barber/BarberUI'
import ServiceIcon from '../../../components/barber/ServiceIcon'
import { money, fullDate, collaboratorDisplayName, formatServiceName } from '../utils/formatters'
import { saleWizardSteps } from '../utils/constants'
import AtendimentoWorkspace from '../../../components/atendimento/AtendimentoWorkspace'

export default function SalesView({
  useNewAtendimentoLayout,
  services,
  products,
  fridgeItems,
  collaborators,
  sales,
  salesSummary,
  collaboratorMetrics,
  user,
  saleForm,
  saleFilters,
  salePaymentOptions,
  saleWizardStep,
  saleItemsCount,
  saleEffectiveTotal,
  saleEffectiveCommission,
  saleEffectiveNet,
  saleChangeDue,
  isCashPayment,
  submittingSale,
  servicePickerOpen,
  saleCatalogItems,
  saleCatalogSearch,
  saleCatalogFilter,
  canManageCash,
  isCollaborator,
  isAdmin,
  loggedInCollaboratorId,
  loggedInCollaborator,
  activeSaleCollaborator,
  setError,
  setSaleWizardStep,
  updateSaleForm,
  updateSalesFilters,
  createSale,
  loadData,
  resetSaleWizard,
  openServicePicker,
  closeServicePicker,
  removeSaleItem,
  startDeleteSale,
  setSaleCatalogSearch,
  setSaleCatalogFilter,
  appendSaleItemFromCatalog,
  setCrmDrawerCustomer,
  updateSaleItemQuantity,
  onSubmit,
  onRefresh
}) {
  const activeCollaborators = collaborators.filter((collaborator) => collaborator.is_active && !collaborator.is_deleted)
  const recentSales = sales.slice(0, 8)
  const periodOptions = [
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'custom', label: 'Periodo' }
  ]
  const salesSummaryCards = [
    {
      key: 'today',
      label: 'Hoje',
      value: money(salesSummary.totals_day?.total_amount || 0),
      hint: `${salesSummary.totals_day?.total_sales || 0} atendimento(s)`
    },
    {
      key: 'week',
      label: 'Semana',
      value: money(salesSummary.totals_week?.total_amount || 0),
      hint: `${salesSummary.totals_week?.total_sales || 0} atendimento(s)`
    },
    {
      key: 'month',
      label: 'Mes',
      value: money(salesSummary.totals_month?.total_amount || 0),
      hint: `${salesSummary.totals_month?.total_sales || 0} atendimento(s)`
    },
    {
      key: 'commission',
      label: 'Comissao total',
      value: money(salesSummary.total_commission || 0),
      hint: `${salesSummary.total_sales || 0} venda(s) no filtro`
    }
  ]
  const collaboratorTodayCommission = collaboratorMetrics.today?.commission ?? collaboratorMetrics.todayCommission ?? 0
  const collaboratorTodayAttendances = collaboratorMetrics.today?.appointments ?? collaboratorMetrics.todayAttendances ?? 0
  const lastPersonalSale = recentSales[0]
  const collaboratorDayCards = [
    {
      key: 'today-commission',
      label: 'Comissao de hoje',
      value: money(collaboratorTodayCommission),
      hint: 'Baseado nos atendimentos que voce lancou hoje'
    },
    {
      key: 'today-attendances',
      label: 'Atendimentos de hoje',
      value: `${collaboratorTodayAttendances}`,
      hint: 'Somente registros do seu perfil'
    },
    {
      key: 'last-sale',
      label: 'Ultimo atendimento lancado',
      value: lastPersonalSale?.service_name || 'Nenhum atendimento',
      hint: lastPersonalSale ? fullDate(lastPersonalSale.created_at) : 'Aguardando seu primeiro lancamento do dia'
    },
    {
      key: 'day-status',
      label: 'Status do dia',
      value: collaboratorTodayAttendances > 0 ? 'Em andamento' : 'Sem lancamentos',
      hint: collaboratorTodayAttendances > 0 ? 'Comissao pendente de fechamento' : 'Lance um atendimento para atualizar o saldo'
    }
  ]
  const paymentOptions = salePaymentOptions
  const saleWizardStepIndex = Math.max(0, saleWizardSteps.findIndex((step) => step.key === saleWizardStep))
  const effectiveSaleCollaboratorId = isCollaborator ? loggedInCollaboratorId : saleForm.collaboratorId
  const lockedCollaboratorLabel = collaboratorDisplayName(loggedInCollaborator) || user?.name || 'Voce'

  const goToSaleWizardStep = (stepKey) => {
    setError('')
    setSaleWizardStep(stepKey)
  }

  const goToNextSaleStep = () => {
    if (saleWizardStep === 'start' && !effectiveSaleCollaboratorId) {
      setError(isCollaborator ? 'Nao foi possivel identificar o colaborador autenticado' : 'Selecione um colaborador')
      return
    }

    if (saleWizardStep === 'items' && saleItemsCount <= 0) {
      setError('Adicione ao menos um servico ou produto')
      return
    }

    if (saleWizardStep === 'payment' && isCashPayment && saleChangeDue < 0) {
      setError('Valor recebido menor que o total do atendimento')
      return
    }

    const nextStep = saleWizardSteps[Math.min(saleWizardStepIndex + 1, saleWizardSteps.length - 1)]
    goToSaleWizardStep(nextStep.key)
  }

  const goToPreviousSaleStep = () => {
    const previousStep = saleWizardSteps[Math.max(saleWizardStepIndex - 1, 0)]
    goToSaleWizardStep(previousStep.key)
  }

  const renderSaleWizardActions = (nextLabel = 'Continuar') => (
    <div className="barber-sales-wizard-actions">
      {saleWizardStepIndex > 0 ? (
        <BarberButton onClick={goToPreviousSaleStep} type="button" variant="ghost">
          Voltar
        </BarberButton>
      ) : <span />}
      <BarberButton onClick={goToNextSaleStep} type="button" variant="primary">
        {nextLabel}
      </BarberButton>
    </div>
  )

  if (useNewAtendimentoLayout) {
    const visibleServicesForAt = services.filter(s => s.is_active !== false)
    const visibleProductsForAt = products.filter(p => p.is_active !== false)
    const activeCollaboratorsForAt = collaborators.filter(c => c.is_active && !c.is_deleted)

    return (
      <AtendimentoWorkspace
        services={visibleServicesForAt}
        products={visibleProductsForAt}
        fridgeItems={fridgeItems}
        collaborators={activeCollaboratorsForAt}
        salesSummary={salesSummary}
        onSubmit={onSubmit}
        onRefresh={onRefresh}
        canManageCash={canManageCash}
        isCollaborator={isCollaborator}
        currentCollaboratorId={loggedInCollaboratorId}
      />
    )
  }

  return (
    <>
      {isCollaborator ? (
        <section className="barber-sales-control-panel barber-sales-control-panel-personal">
          <div className="barber-sales-summary-grid">
            {collaboratorDayCards.map((card) => (
              <BarberCard className="barber-sales-summary-kpi" key={card.key}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.hint}</small>
              </BarberCard>
            ))}
          </div>

          <BarberCard className="barber-sales-filter-card barber-sales-personal-balance">
            <div className="barber-table-header">
              <div>
                <h2>Seu saldo de comissoes hoje</h2>
                <p>Baseado nos atendimentos que voce lancou hoje, sem expor o faturamento da barbearia.</p>
              </div>
              <BarberButton onClick={() => loadData({ clearMessage: false })} type="button" variant="ghost">
                <BarberIcon name="refresh" />
                <span>Atualizar</span>
              </BarberButton>
            </div>
          </BarberCard>
        </section>
      ) : (
        <section className="barber-sales-control-panel">
          <div className="barber-sales-summary-grid">
            {salesSummaryCards.map((card) => (
              <BarberCard className="barber-sales-summary-kpi" key={card.key}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.hint}</small>
              </BarberCard>
            ))}
          </div>

          <BarberCard className="barber-sales-filter-card">
            <div className="barber-table-header">
              <div>
                <h2>Filtros de atendimentos</h2>
                <p>Resumo calculado no backend, sempre filtrado por empresa e vendas ativas.</p>
              </div>
              <BarberButton onClick={() => loadData({ clearMessage: false })} type="button" variant="ghost">
                <BarberIcon name="refresh" />
                <span>Atualizar</span>
              </BarberButton>
            </div>

            <div className="barber-sales-filter-grid">
              {canManageCash ? (
                <div className="barber-form-block">
                  <label htmlFor="sales-filter-collaborator">Colaborador</label>
                  <select className="barber-select" id="sales-filter-collaborator" name="collaboratorId" onChange={updateSalesFilters} value={saleFilters.collaboratorId}>
                    <option value="">Todos</option>
                    {activeCollaborators.map((collaborator) => (
                      <option key={collaborator.id} value={collaborator.id}>
                        {collaborator.name || collaborator.nickname}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="barber-form-block">
                <label htmlFor="sales-filter-period">Periodo</label>
                <select className="barber-select" id="sales-filter-period" name="period" onChange={updateSalesFilters} value={saleFilters.period}>
                  {periodOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {saleFilters.period === 'custom' ? (
                <>
                  <div className="barber-form-block">
                    <label htmlFor="sales-filter-start">Inicio</label>
                    <input className="barber-input" id="sales-filter-start" name="startDate" onChange={updateSalesFilters} type="date" value={saleFilters.startDate} />
                  </div>
                  <div className="barber-form-block">
                    <label htmlFor="sales-filter-end">Fim</label>
                    <input className="barber-input" id="sales-filter-end" name="endDate" onChange={updateSalesFilters} type="date" value={saleFilters.endDate} />
                  </div>
                </>
              ) : null}
            </div>
          </BarberCard>
        </section>
      )}

      {saleWizardStep === 'success' ? (
        <Card className="barber-sales-success-card barber-card-full" padding="md">
          <div className="barber-sales-success-icon">
            <Check />
          </div>
          <div>
            <span className="barber-overline">Atendimento finalizado</span>
            <h2>Registro salvo com sucesso</h2>
            <p>
              {isCollaborator
                ? 'Seu atendimento foi vinculado ao seu perfil e ja entra na sua comissao conforme as regras atuais.'
                : 'O atendimento ja entra no caixa, dashboard, relatorios e comissoes conforme as regras atuais.'}
            </p>
          </div>
          <div className="barber-inline-actions">
            <Button onClick={() => resetSaleWizard('start')} type="button" variant="primary">
              Novo atendimento
            </Button>
            <Button onClick={() => loadData({ clearMessage: false })} type="button" variant="ghost">
              Atualizar dados
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="barber-sales-steps barber-sales-wizard-steps">
            {saleWizardSteps.map((step, index) => (
              <button
                className={`barber-sales-step ${index === saleWizardStepIndex ? 'active' : ''} ${index < saleWizardStepIndex ? 'done' : ''}`}
                key={step.key}
                onClick={() => goToSaleWizardStep(step.key)}
                type="button"
              >
                <span>{index + 1}</span>
                <strong>{step.label}</strong>
              </button>
            ))}
          </div>

          <form className="barber-sales-workspace barber-sales-wizard-workspace" onSubmit={createSale}>
            <section className="barber-sales-main">
              {saleWizardStep === 'start' && (
                <BarberCard className="barber-sales-hero">
                  <div className="barber-sales-hero-copy">
                    <span className="barber-overline">{isCollaborator ? 'Modo colaborador' : 'Modo gestor'}</span>
                    <h2>Iniciar atendimento</h2>
                    <p>{isCollaborator ? 'Fluxo rapido para celular, com seu perfil fixo e sem dados administrativos.' : 'Escolha o responsavel e avance pelo atendimento em etapas.'}</p>
                  </div>

                  <div className="barber-sales-start-grid">
                    {canManageCash ? (
                      <div className="barber-form-block">
                        <label htmlFor="sale-collaborator">Colaborador</label>
                        <select className="barber-select" id="sale-collaborator" name="collaboratorId" onChange={updateSaleForm} value={saleForm.collaboratorId}>
                          <option value="">Selecione o colaborador</option>
                          {activeCollaborators.map((collaborator) => (
                            <option key={collaborator.id} value={collaborator.id}>
                              {collaborator.name || collaborator.nickname}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="barber-placeholder">
                        <strong>{lockedCollaboratorLabel}</strong>
                        <p>Colaborador fixo neste atendimento.</p>
                      </div>
                    )}

                    <div className="barber-sales-launcher-summary">
                      <span>Catalogo disponivel</span>
                      <strong>{services.filter(s => s.is_active !== false).length} servicos ativos</strong>
                      <small>{isCollaborator ? 'Sem faturamento bruto da barbearia' : `${activeCollaborators.length} colaborador(es) ativos`}</small>
                    </div>
                  </div>

                  {renderSaleWizardActions('Iniciar atendimento')}
                </BarberCard>
              )}

              {saleWizardStep === 'client' && (
                <BarberCard className="barber-sales-items-panel">
                  <div className="barber-table-header">
                    <div>
                      <h2>Cliente</h2>
                      <p>Identifique o cliente quando fizer sentido. O campo pode ficar vazio para atendimento rapido.</p>
                    </div>
                  </div>
                  <div className="barber-form-block">
                    <label htmlFor="sale-client-name">Cliente</label>
                    <input className="barber-input" id="sale-client-name" name="clientName" onChange={updateSaleForm} placeholder="Nome do cliente" value={saleForm.clientName} />
                  </div>
                  {renderSaleWizardActions('Continuar')}
                </BarberCard>
              )}

              {saleWizardStep === 'items' && (
                <>
                  <div className="barber-sales-launcher-bar">
                    <BarberButton className="barber-sales-launcher-button" onClick={openServicePicker} type="button" variant="secondary">
                      <BarberIcon name="plus" />
                      <span>Adicionar servico/produto</span>
                    </BarberButton>

                    <div className="barber-sales-launcher-summary">
                      <span>Resumo do atendimento</span>
                      <strong>{saleItemsCount > 0 ? `${saleItemsCount} item(ns)` : 'Nenhum item'}</strong>
                      <small>{isCollaborator ? money(saleEffectiveCommission) : money(saleEffectiveTotal)}</small>
                    </div>
                  </div>

                  <BarberCard className="barber-sales-items-panel">
                    <div className="barber-table-header">
                      <div>
                        <h2>Servicos/produtos</h2>
                        <p>Adicione itens do catalogo e ajuste quantidades antes do pagamento.</p>
                      </div>
                      <BarberBadge tone="admin">{saleItemsCount} item(ns)</BarberBadge>
                    </div>

                    {saleForm.items.length > 0 ? (
                      <div className="barber-sales-items-list">
                        {saleForm.items.map((item) => (
                          <div className="barber-sales-item-row" key={item.key}>
                            <div className="barber-sales-item-main">
                              <span className="barber-sales-item-icon">
                                {item.itemType === 'product'
                                  ? <BarberIcon name="product" />
                                  : <ServiceIcon icon={item.icon} serviceName={item.name} />}
                              </span>
                              <div>
                                <strong>{item.name}</strong>
                                <span>{isCollaborator ? lockedCollaboratorLabel : collaboratorDisplayName(activeSaleCollaborator) || 'Colaborador selecionado'}</span>
                              </div>
                            </div>

                            <div className="barber-sales-item-qty">
                              <button onClick={() => updateSaleItemQuantity(item.key, -1)} type="button">-</button>
                              <span>{item.quantity}</span>
                              <button onClick={() => updateSaleItemQuantity(item.key, 1)} type="button">+</button>
                            </div>

                            <div className="barber-sales-item-values">
                              <strong>{isCollaborator ? money(item.commissionAmount) : money(item.totalPrice)}</strong>
                              <span>{isCollaborator ? 'minha comissao estimada' : `${money(item.unitPrice)} unitario`}</span>
                            </div>

                            <button className="barber-sales-item-remove" onClick={() => removeSaleItem(item.key)} type="button">
                              <BarberIcon name="trash" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <BarberEmptyState
                        description="Use o botao acima para abrir o catalogo e adicionar servicos ou produtos."
                        title="Nenhum item no atendimento"
                      />
                    )}

                    {renderSaleWizardActions('Ir para pagamento')}
                  </BarberCard>
                </>
              )}

              {saleWizardStep === 'payment' && (
                <BarberCard className="barber-sales-items-panel">
                  <div className="barber-table-header">
                    <div>
                      <h2>Pagamento</h2>
                      <p>Escolha a forma de pagamento do atendimento.</p>
                    </div>
                    <BarberBadge tone="cash">{isCollaborator ? `${saleItemsCount} item(ns)` : money(saleEffectiveTotal)}</BarberBadge>
                  </div>

                  <div className="barber-form-block">
                    <label>Pagamento</label>
                    <div className="barber-sales-payment-grid">
                      {paymentOptions.map((option) => (
                        <button
                          className={`barber-sales-payment-card ${saleForm.paymentMethod === option.value ? 'active' : ''}`}
                          key={option.value}
                          onClick={() => updateSaleForm({ target: { name: 'paymentMethod', value: option.value } })}
                          type="button"
                        >
                          <BarberIcon name={option.icon} />
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {isCashPayment && (
                    <>
                      <div className="barber-form-block">
                        <label htmlFor="sale-amount-received">Valor recebido</label>
                        <input className="barber-input" id="sale-amount-received" min={saleEffectiveTotal || 0} name="amountReceived" onChange={updateSaleForm} step="0.01" type="number" value={saleForm.amountReceived} />
                      </div>

                      <div className="barber-sales-summary-highlight">
                        <span>Troco</span>
                        <strong>{money(Math.max(0, saleChangeDue))}</strong>
                      </div>
                    </>
                  )}

                  {isCashPayment && saleForm.amountReceived && saleChangeDue < 0 && (
                    <div className="barber-message barber-message-error">
                      Valor recebido menor que o total do atendimento.
                    </div>
                  )}

                  {renderSaleWizardActions('Continuar')}
                </BarberCard>
              )}

              {saleWizardStep === 'notes' && (
                <BarberCard className="barber-sales-items-panel">
                  <div className="barber-table-header">
                    <div>
                      <h2>Observacoes</h2>
                      <p>Inclua detalhes do atendimento, preferencia do cliente ou algo importante para o historico.</p>
                    </div>
                  </div>
                  <div className="barber-form-block">
                    <label htmlFor="sale-notes">Observacoes</label>
                    <textarea className="barber-textarea" id="sale-notes" name="notes" onChange={updateSaleForm} placeholder="Opcional" rows="5" value={saleForm.notes} />
                  </div>
                  {renderSaleWizardActions('Revisar')}
                </BarberCard>
              )}

              {saleWizardStep === 'review' && (
                <BarberCard className="barber-sales-items-panel">
                  <div className="barber-table-header">
                    <div>
                      <h2>Revisao</h2>
                      <p>Confira os dados antes de finalizar.</p>
                    </div>
                    <BarberBadge tone="cash">{isCollaborator ? money(saleEffectiveCommission) : money(saleEffectiveTotal)}</BarberBadge>
                  </div>

                  <div className="barber-sales-summary-list">
                    <div className="barber-sales-summary-row">
                      <span>Cliente</span>
                      <strong>{saleForm.clientName || 'Nao informado'}</strong>
                    </div>
                    <div className="barber-sales-summary-row">
                      <span>Colaborador</span>
                      <strong>{isCollaborator ? lockedCollaboratorLabel : collaboratorDisplayName(activeSaleCollaborator) || 'Nao selecionado'}</strong>
                    </div>
                    <div className="barber-sales-summary-row">
                      <span>Itens</span>
                      <strong>{saleItemsCount}</strong>
                    </div>
                    <div className="barber-sales-summary-row">
                      <span>Pagamento</span>
                      <strong>{getPaymentMethodLabel(saleForm.paymentMethod)}</strong>
                    </div>
                    <div className="barber-sales-summary-row">
                      <span>{isCollaborator ? 'Minha comissao prevista' : 'Comissao'}</span>
                      <strong>{money(saleEffectiveCommission)}</strong>
                    </div>
                    {!isCollaborator && (
                      <>
                        <div className="barber-sales-summary-row">
                          <span>Total</span>
                          <strong>{money(saleEffectiveTotal)}</strong>
                        </div>
                        <div className="barber-sales-summary-row">
                          <span>Total liquido</span>
                          <strong>{money(saleEffectiveNet)}</strong>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="barber-sales-wizard-actions">
                    <BarberButton onClick={goToPreviousSaleStep} type="button" variant="ghost">
                      Voltar
                    </BarberButton>
                    <BarberButton className="barber-sales-submit" disabled={submittingSale} type="submit" variant="primary">
                      <BarberIcon name="plus" />
                      <span>{submittingSale ? 'Finalizando...' : 'Finalizar atendimento'}</span>
                    </BarberButton>
                  </div>
                </BarberCard>
              )}
            </section>

            <aside className="barber-sales-sidebar">
              <BarberCard className="barber-sales-summary-card">
                <div className="barber-panel-header">
                  <div>
                    <h3>Resumo rapido</h3>
                    <p>{isCollaborator ? 'Somente seus itens e sua comissao prevista.' : 'Totais do atendimento atual.'}</p>
                  </div>
                  <BarberBadge tone="cash">{isCollaborator ? money(saleEffectiveCommission) : money(saleEffectiveTotal)}</BarberBadge>
                </div>

                <div className="barber-sales-summary-list">
                  <div className="barber-sales-summary-row">
                    <span>Itens</span>
                    <strong>{saleItemsCount}</strong>
                  </div>
                  <div className="barber-sales-summary-row">
                    <span>{isCollaborator ? 'Minha comissao' : 'Comissao'}</span>
                    <strong>{money(saleEffectiveCommission)}</strong>
                  </div>
                  {!isCollaborator && (
                    <>
                      <div className="barber-sales-summary-row">
                        <span>Subtotal</span>
                        <strong>{money(saleEffectiveTotal)}</strong>
                      </div>
                      <div className="barber-sales-summary-row">
                        <span>Total liquido</span>
                        <strong>{money(saleEffectiveNet)}</strong>
                      </div>
                    </>
                  )}
                </div>
              </BarberCard>
            </aside>
          </form>
        </>
      )}

      <BarberCard className="barber-sales-recent-panel">
        <div className="barber-table-header">
          <div>
            <h2>Atendimentos recentes</h2>
            <p>Ultimos atendimentos registrados no sistema, com pagamento e colaborador responsavel.</p>
          </div>
          <BarberBadge tone="admin">{sales.length} registros</BarberBadge>
        </div>

        {recentSales.length > 0 ? (
          <div className="barber-sales-recent-list">
            {recentSales.map((sale) => (
              <div className="barber-sales-recent-card" key={sale.id}>
                <div className="barber-sales-recent-main">
                  <strong>{sale.service_name || sale.client_name || 'Atendimento registrado'}</strong>
                  <span>{isCollaborator ? fullDate(sale.created_at) : `${sale.collaborator_name || 'Sem colaborador'} - ${fullDate(sale.created_at)}`}</span>
                </div>

                <div className="barber-sales-recent-meta">
                  {!isCollaborator && <BarberBadge tone={getPaymentMethodTone(sale.payment_method)}>
                    {getPaymentMethodLabel(sale.payment_method)}
                  </BarberBadge>}
                  <strong>{money(isCollaborator && sale.commission_effect === 'debit' ? -Math.abs(Number(sale.commission_amount || 0)) : (isCollaborator ? sale.commission_amount || 0 : sale.total_amount))}</strong>
                </div>

                {isAdmin ? (
                  <button className="barber-sales-recent-remove" onClick={() => startDeleteSale(sale.id)} type="button">
                    <BarberIcon name="trash" />
                  </button>
                ) : (
                  <span className="barber-sales-recent-id">{String(sale.id).slice(0, 8)}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <BarberEmptyState
            description="Assim que o primeiro atendimento for registrado, o historico aparece aqui automaticamente."
            title="Nenhum atendimento registrado"
          />
        )}
      </BarberCard>

      <BarberCard className="barber-sales-table-card barber-card-full">
        <div className="barber-table-header">
          <div>
            <h2>Lista de atendimentos</h2>
            <p>Vendas persistidas no banco, filtradas por periodo e colaborador.</p>
          </div>
          {!isCollaborator && <BarberBadge tone="cash">{money(salesSummary.total_amount || 0)}</BarberBadge>}
        </div>

        <BarberTable columns={isCollaborator ? ['Data', 'Servico', 'Cliente', 'Status', 'Minha comissao'] : ['Colaborador', 'Cliente', 'Data', 'Pagamento', 'Total', 'Comissao', 'Status', 'Acoes']}>
          {sales.length > 0 ? (
            sales.map((sale) => {
              const commissionAmount = Number(sale.item_commission_amount ?? sale.commission_amount ?? 0)
              const displayCommission = sale.commission_effect === 'debit'
                ? -Math.abs(commissionAmount)
                : commissionAmount
              const saleStatus = sale.status || 'active'

              return isCollaborator ? (
                <tr key={sale.id}>
                  <td>{fullDate(sale.created_at)}</td>
                  <td>{sale.service_name || 'Atendimento registrado'}</td>
                  <td>{sale.customer_name || sale.client_name || 'Nao informado'}</td>
                  <td>
                    <BarberBadge tone={saleStatus === 'canceled' ? 'danger' : 'approved'}>
                      {saleStatus === 'canceled' ? 'Cancelado' : 'Ativo'}
                    </BarberBadge>
                  </td>
                  <td>{money(displayCommission)}</td>
                </tr>
              ) : (
                <tr key={sale.id}>
                  <td>
                    <strong>{sale.collaborator_name || 'Sem colaborador'}</strong>
                    <span>{sale.service_name || 'Atendimento registrado'}</span>
                  </td>
                  <td>
                    <strong
                      style={sale.customer_id ? { cursor: 'pointer', color: 'var(--barber-accent)' } : {}}
                      onClick={sale.customer_id ? () => setCrmDrawerCustomer({
                        id: sale.customer_id,
                        name: sale.customer_name || sale.client_name,
                        phone: sale.customer_phone,
                        status: 'active'
                      }) : undefined}
                    >{sale.customer_name || sale.client_name || 'Nao informado'}</strong>
                    <span>{sale.customer_phone || sale.notes || '-'}</span>
                  </td>
                  <td>{fullDate(sale.created_at)}</td>
                  <td>
                    <BarberBadge tone={getPaymentMethodTone(sale.payment_method)}>
                      {getPaymentMethodLabel(sale.payment_method)}
                    </BarberBadge>
                  </td>
                  <td>{money(sale.total_amount)}</td>
                  <td>{money(displayCommission)}</td>
                  <td>
                    <BarberBadge tone={saleStatus === 'canceled' ? 'danger' : 'approved'}>
                      {saleStatus === 'canceled' ? 'Cancelado' : 'Ativo'}
                    </BarberBadge>
                  </td>
                  <td>
                    {isAdmin && saleStatus !== 'canceled' ? (
                      <BarberButton onClick={() => startDeleteSale(sale.id)} type="button" variant="danger">
                        <BarberIcon name="trash" />
                        <span>Cancelar atendimento</span>
                      </BarberButton>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={isCollaborator ? '5' : '8'}>
                <BarberEmptyState
                  description="Nenhum atendimento encontrado para os filtros atuais."
                  title="Sem registros no periodo"
                />
              </td>
            </tr>
          )}
        </BarberTable>
      </BarberCard>

      <BarberModal
        onClose={closeServicePicker}
        open={servicePickerOpen}
        subtitle="Busque no catalogo e adicione servicos ou produtos sem poluir a tela principal."
        title="Adicionar servico ao atendimento"
      >
        <div className="barber-modal-content">
          <div className="barber-sales-picker-toolbar">
            <div className="barber-form-block barber-sales-search">
              <label htmlFor="sales-search-modal">Buscar</label>
              <input
                className="barber-input"
                id="sales-search-modal"
                onChange={(event) => setSaleCatalogSearch(event.target.value)}
                placeholder="Buscar servico ou produto..."
                value={saleCatalogSearch}
              />
            </div>

            <div className="barber-sales-filter-group" role="tablist" aria-label="Filtros do catalogo">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'service', label: 'Servicos' },
                { key: 'product', label: 'Produtos' }
              ].map((filter) => (
                <button
                  className={`barber-sales-filter ${saleCatalogFilter === filter.key ? 'active' : ''}`}
                  key={filter.key}
                  onClick={() => setSaleCatalogFilter(filter.key)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {saleCatalogItems.length > 0 ? (
            <div className="barber-sales-picker-grid">
              {saleCatalogItems.map((item) => (
                <div className="barber-sales-picker-card" key={`${item.type}-${item.id}`}>
                  <div className="barber-sales-picker-main">
                    <span className="barber-sales-catalog-icon">
                      {item.type === 'product'
                        ? <BarberIcon name="product" />
                        : <ServiceIcon icon={item.icon} serviceName={item.name} />}
                    </span>

                    <div className="barber-sales-catalog-copy">
                      <div className="barber-sales-catalog-name">{formatServiceName(item.name)}</div>
                      <div className="barber-sales-catalog-type">
                        {item.type === 'product' ? item.category || 'Produto' : item.category === 'combo' ? 'Combo' : 'Servico'}
                      </div>
                    </div>
                  </div>

                  <div className="barber-sales-picker-side">
                    <strong className="barber-sales-catalog-price">{money(item.price)}</strong>
                    <BarberButton onClick={() => appendSaleItemFromCatalog(item, item.type, 1, { closeAfterAdd: true })} type="button" variant="secondary">
                      <BarberIcon name="plus" />
                      <span>Adicionar</span>
                    </BarberButton>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <BarberEmptyState
              description="Nenhum item encontrado para este filtro. Ajuste a busca ou o tipo do catalogo."
              title="Catalogo vazio"
            />
          )}

          <div className="barber-modal-actions">
            <BarberButton onClick={closeServicePicker} type="button" variant="ghost">
              Fechar
            </BarberButton>
          </div>
        </div>
      </BarberModal>
    </>
  )
}
