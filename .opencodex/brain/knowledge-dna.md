# 🧬 Knowledge DNA — Identidade do Projeto

> **Status:** OFICIAL • VIVO
> **Camada:** 7 — Memória
> **Propósito:** Documentar a identidade do MultGestor — princípios, valores, padrões arquiteturais, naming, UX, código, governança, segurança, performance e qualidade.
> **Relacionamentos:** [[constitution]] · [[constitution-knowledge-os]] · [[knowledge-memory]] · [[knowledge-health]] · [[technical/README]]

---

## 1. Princípios do Produto

| Princípio | Descrição |
|---|---|
| **Multi-tenant por company_id** | NUNCA por `owner_id`. Isolamento completo entre tenants. |
| **Core compartilhado** | Lógica comum no core (`shared/`), nunca duplicada por nicho. |
| **API-first** | Tudo via REST; frontend é apenas um cliente. |
| **Event-driven** | Ação relevante emite evento imutável; sistemas reagem. |
| **Cirúrgico** | Alterar só o necessário. Não inventar. Não extrapolar escopo. |
| **Vertical de prova** | BarberGestor como prova antes de expandir para novos nichos. |

## 2. Valores Técnicos

| Valor | Prática |
|---|---|
| **Segurança em profundidade** | RLS + `company_id` na app + validação no backend |
| **Resiliência** | Outbox pattern, workers, filas |
| **Observabilidade** | Logs estruturados, tracing, métricas |
| **Performance** | Queries otimizadas, índices, cache (Redis planejado) |
| **Qualidade** | Testes unitários + integração + auditoria |
| **Rastreabilidade** | Decision Graph + Timeline + Knowledge Graph |

## 3. Padrões Arquiteturais

| Padrão | Onde | Descrição |
|---|---|---|
| **Multi-tenant** | Core | Isolamento por `company_id` |
| **Event Sourcing parcial** | Outbox | Eventos imutáveis na outbox |
| **Unit of Work** | Services | Transações atômicas |
| **Repository** | Banco | Abstração via services |
| **Middleware chain** | API | Validação, auth, rate limit |
| **MCP Architecture** | IA | Model → Context → Plugin |

## 4. Naming Conventions

### Backend (Node.js/Express)
| Item | Padrão | Exemplo |
|---|---|---|
| Arquivos | kebab-case | `appointment-service.js` |
| Classes | PascalCase | `AppointmentService` |
| Funções | camelCase | `createAppointment()` |
| Constantes | UPPER_SNAKE | `MAX_RETRIES` |
| Rotas | kebab-case | `/api/public/booking` |
| Tabelas | snake_case | `appointments` |
| Migrations | timestamp_desc | `1717000000000_create_appointments` |

### Frontend (Next.js/React)
| Item | Padrão | Exemplo |
|---|---|---|
| Componentes | PascalCase | `BookingWidget` |
| Páginas | kebab-case | `/public/booking` |
| Hooks | camelCase + use | `useBooking()` |
| Funções | camelCase | `formatDate()` |
| Estilos | CSS Modules | `BookingWidget.module.css` |

### Banco (PostgreSQL)
| Item | Padrão | Exemplo |
|---|---|---|
| Tabelas | snake_case plural | `appointments` |
| Colunas | snake_case | `company_id` |
| PKs | `id` (UUID) | `id UUID DEFAULT gen_random_uuid()` |
| FKs | `tabela_id` | `company_id`, `customer_id` |
| Índices | `idx_tabela_coluna` | `idx_appointments_company` |
| Policies RLS | `policyname_tabela` | `company_isolation_appointments` |

## 5. UX Patterns

| Pattern | Descrição |
|---|---|
| **Mobile-first** | Todo layout responsivo |
| **Loading states** | Skeleton loader em toda página |
| **Empty states** | Mensagem clara + CTA quando não há dados |
| **Error states** | Mensagem amigável + ação de retry |
| **Confirmation** | Confirmação antes de ações destrutivas |
| **Feedback** | Toast/notificação após ações |
| **Booking flow** | Wizard: serviço → profissional → horário → dados → confirmar |

## 6. Boas Práticas de Código

- **Async/await** sobre callbacks
- **Validação no backend** — frontend nunca é confiável
- **Event contracts** — todo evento tem schema + validação
- **Logs sem dados sensíveis** — nunca logar tokens, senhas, dados pessoais
- **Error handling** — sempre try/catch com fallback
- **Secrets** — nunca no código, sempre em variáveis de ambiente

## 7. Governança

| Regra | Descrição | Fonte |
|---|---|---|
| Uma missão por vez | Sempre | [[constitution]] |
| Stage seletivo | Nunca `git add -A` | [[constitution]] |
| Push só com confirmação humana | Aprovação requerida | [[constitution]] |
| CHECK 0 pré-missão | Score ≥ 95 para executar | [[context-confidence-engine]] |
| Loop de fechamento pós-missão | Atualizar Knowledge OS | [[ops/mission-closing-protocol]] |
| Rota exposta = proteção obrigatória | 4 perguntas de abuso | [[constitution]] (Art. 7) |

## 8. Segurança

| Prática | Detalhe |
|---|---|
| **company_id** | Chave de isolamento multi-tenant |
| **RLS** | Defesa em profundidade |
| **Input sanitization** | XSS, SQL injection |
| **Secrets criptografados** | AES-256-GCM para tokens |
| **Rate limit** | Toda rota pública |
| **Auditoria** | Após cada missão |

## 9. Performance

| Prática | Detalhe |
|---|---|
| **Índices** | Toda coluna de filtro/join |
| **Queries** | Sem N+1, sem select * |
| **Cache** | Redis planejado (in-memory enquanto não implementado) |
| **Workers** | Processamento assíncrono para tarefas pesadas |
| **Eventual consistency** | Para operações não críticas |

## 10. Qualidade

| Prática | Detalhe |
|---|---|
| **Testes unitários** | Services e funções puras |
| **Testes de integração** | API endpoints |
| **Auditoria** | Pós-missão |
| **CHECK 0** | Context Confidence ≥ 95 |
| **E2E** | Planejado para fluxos críticos |

## Referências

- [[constitution]] — Regras invioláveis do produto
- [[constitution-knowledge-os]] — Regras do Knowledge OS
- [[knowledge-memory]] — Memória evolutiva
- [[knowledge-health]] — Saúde do conhecimento
- [[technical/README]] — Technical Brain
- [[technical/frontend]] — Padrões de frontend
- [[technical/backend]] — Padrões de backend
- [[technical/banco]] — Padrões de banco
