# 💰 GENOME — Gestão de Caixa

> **Status:** 🟢 Completo · Produção
> **Digital Twin:** [[product/digital-twin/barbergestor]]

---

## 1. Identificação

| Campo | Valor |
|---|---|
| **Nome** | Gestão de Caixa |
| **Produto** | BarberGestor |
| **Módulo** | Caixa |
| **Status** | 🟢 Completo |
| **Digital Twin** | [[product/digital-twin/barbergestor]] |

## 2. Fluxo

| Etapa | Descrição | Ator |
|---|---|---|
| 1 | Colaborador finaliza serviço | Colaborador |
| 2 | Acessa registro de venda | Colaborador |
| 3 | Seleciona serviços realizados | Colaborador |
| 4 | Seleciona forma de pagamento | Colaborador |
| 5 | Calcula comissão (automático) | Sistema |
| 6 | Finaliza venda | Colaborador |
| 7 | Sistema registra e atualiza relatórios | Sistema |

## 3. Banco

| Tabela | Operação | Campos |
|---|---|---|
| `sales` | CREATE, READ, UPDATE | id, company_id, customer_id, employee_id, total, payment_method, status, created_at |
| `sale_items` | CREATE, READ | id, sale_id, service_id, price, commission |
| `commissions` | CREATE, READ | id, sale_item_id, employee_id, amount, status |

**RLS:** Filtro por `company_id`.

## 4. API

| Método | Endpoint | Função |
|---|---|---|
| GET | `/api/sales` | Listar vendas |
| POST | `/api/sales` | Registrar venda |
| GET | `/api/sales/:id` | Detalhes da venda |
| PUT | `/api/sales/:id` | Atualizar venda |
| DELETE | `/api/sales/:id` | Cancelar venda |
| GET | `/api/reports/sales` | Relatório de vendas |

## 5. Frontend

| Página | Componente | Propósito |
|---|---|---|
| `/caixa` | CashierRegister | Registro de vendas |
| `/caixa/historico` | SalesHistory | Histórico de vendas |
| `/relatorios` | SalesReport | Relatórios |

## 6. Backend

| Service | Função | Eventos |
|---|---|---|
| `SalesService` | CRUD + cálculo de comissão | `sale.created`, `sale.cancelled` |

## 7. UX

| Estado | Tela | Comportamento |
|---|---|---|
| Loading | CashierRegister | Skeleton |
| Empty | SalesHistory | "Nenhuma venda registrada" |
| Success | CashierRegister | Confirmação com resumo |
| Error | CashierRegister | Mensagem de erro |

## 8. Testes

| Tipo | Cenário | Obrigatório |
|---|---|---|
| Unit | Cálculo de comissão | Sim |
| Integration | Fluxo de venda + comissão | Sim |

## 9. Riscos

| Risco | Impacto | Probabilidade | Mitigação |
|---|---|---|---|
| Venda registrada errada | Alto | Média | Confirmação antes de finalizar |
| Comissão incorreta | Alto | Baixa | Cálculo automatizado |

## 10. Agentes

| Papel | Agente |
|---|---|
| Arquitetura | [[agents/platform-architect]] |
| Backend | — |
| Frontend | [[agents/frontend-specialist]] |
| QA | [[agents/qa]] |

---

> **Última atualização:** 2026-06-24
> **Links:** [[product/feature-genome/README]] · [[product/digital-twin/barbergestor]]
