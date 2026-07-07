# 💈 BarberGestor — Digital Twin

> **Status:** 🟢 Produção · Completo
> **URL:** `barbergestor.com.br`
> **Camada:** 1 — Conhecimento
> **Relacionamentos:** [[nichos/barbergestor/README]] · [[product/README]] · [[technical/README]] · [[digital-twin/README]]

---

## Sumário Executivo

BarberGestor é o **vertical de prova** do MultGestor. É o único módulo em produção ativa, com clientes reais e booking público online. Serve como referência arquitetural para todos os outros nichos.

## PRDs Relacionados

- (PRDs específicos do BarberGestor — a serem criados em `product/prds/`)

## Arquitetura

| Componente | Tecnologia | Detalhe |
|---|---|---|
| Frontend | Next.js | 33 páginas, React |
| Backend | Node.js (Express) | 16 controllers, 30 services |
| Banco | PostgreSQL (Supabase) | Multi-tenant via company_id |
| Booking | Engine própria | 19 funções puras |
| Pagamentos | AbacatePay + Kiwify | Billing integrado |
| Eventos | EventBus + Outbox | Event-driven |
| Fila | In-memory | Jobs periódicos |
| Storage | Supabase Storage | Upload de arquivos |

## Banco (tabelas principais)

| Tabela | Propósito | RLS |
|---|---|---|
| `companies` | Dados da empresa | company_id |
| `users` | Usuários do sistema | company_id |
| `customers` | Clientes | company_id |
| `services` | Serviços oferecidos | company_id |
| `employees` | Colaboradores | company_id |
| `appointments` | Agendamentos | company_id |
| `sales` | Vendas (caixa) | company_id |
| `commissions` | Comissões | company_id |
| `inventory` | Estoque | company_id |
| `notifications` | Notificações | company_id |

## API (endpoints principais)

| Recurso | Métodos | Controller |
|---|---|---|
| `/api/auth` | POST | Auth |
| `/api/companies` | CRUD | Companies |
| `/api/customers` | CRUD | Customers |
| `/api/services` | CRUD | Services |
| `/api/employees` | CRUD | Employees |
| `/api/appointments` | CRUD | Appointments |
| `/api/sales` | CRUD | Sales |
| `/api/reports` | GET | Reports |
| `/api/public/booking` | GET, POST | Public Booking |

## Frontend (páginas)

| Rota | Componente | Propósito |
|---|---|---|
| `/` | Landing | Página inicial |
| `/dashboard` | Dashboard | Painel principal |
| `/agenda` | Agenda | Gestão de agendamentos |
| `/caixa` | Cashier | Registro de vendas |
| `/clientes` | Customers | CRM de clientes |
| `/colaboradores` | Employees | Gestão de equipe |
| `/servicos` | Services | Catálogo de serviços |
| `/relatorios` | Reports | Relatórios |
| `/public/booking` | BookingWidget | Agendamento público |
| `/config` | Settings | Configurações |

## Serviços

| Service | Responsabilidade |
|---|---|
| `AuthService` | Autenticação e autorização |
| `CompanyService` | Gestão de tenants |
| `CustomerService` | CRUD de clientes |
| `AppointmentService` | Booking engine (19 funções) |
| `SalesService` | Caixa e comissões |
| `NotificationService` | Lembretes e alertas |
| `ReportService` | Relatórios |
| `WhatsAppService` | Integração WhatsApp (mock) |

## Workers

| Worker | Frequência | Tarefa |
|---|---|---|
| `appointment-reminder` | A cada 30min | Lembrete de agendamentos |
| `notification-cleanup` | Diário | Limpeza de notificações antigas |

## Deploy

| Ambiente | URL | Status |
|---|---|---|
| Produção | `barbergestor.com.br` | 🟢 Online |
| Staging | — | 🔴 Não configurado |
| Preview | — | 🔴 Não configurado |

**CI/CD:** GitHub Actions (deploy manual via push em `main`)

## Auditorias

| Auditoria | Data | Resultado |
|---|---|---|
| Auditoria Fundamental | 2026-06-15 | ✅ |
| Auditoria Incidente L-93 | 2026-06-23 | ✅ |
| Auditoria Backup | 2026-06-22 | ✅ |

## Roadmap Imediato

- [ ] WhatsApp real (D-003)
- [ ] UX polishing
- [ ] Recuperação de no-show
- [ ] CRM de retorno

## Riscos

| Risco | Severidade | Status |
|---|---|---|
| RLS companies/users incompleto | P1 | 🟡 Em análise |
| Rate limit volátil (sem Redis) | P1 | 🔴 Pendente |
| Migration fail silencioso | P1 | 🔴 Pendente |

## Agentes Envolvidos

| Agente | Papel |
|---|---|
| [[agents/platform-architect\|Platform Architect]] | Arquitetura geral |
| [[agents/product-manager\|Product Manager]] | Definição de produto |
| [[agents/frontend-specialist\|Frontend Specialist]] | UI/UX |
| [[agents/database-architect\|Database Architect]] | Schema e RLS |
| [[agents/qa\|QA]] | Testes |
| [[agents/security\|Security]] | Segurança |

## Skills Utilizadas

- `customize-opencode` (configuração de agentes)
- (demais skills a serem mapeadas)

## Testes

| Tipo | Cobertura |
|---|---|
| Unit | Services (cobertura parcial) |
| Integration | API endpoints (cobertura parcial) |
| E2E | 🔴 Não implementado |

## Referências

- [[nichos/barbergestor/README]] — Visão do nicho
- [[maps/multgestor-core/nichos/barbergestor]] — Mapa vivo
- [[product/funcionalidades]] — Funcionalidades
- [[technical/arquitetura]] — Arquitetura
- [[technical/banco]] — Banco de dados
- [[technical/deploy]] — Deploy
