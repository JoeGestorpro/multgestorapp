# Módulo: BarberGestor

## Visão Geral

| Campo | Valor |
|-------|-------|
| **Nome** | BarberGestor |
| **Status** | ✅ Ativo e operacional |
| **Público-alvo** | Barbearias de pequeno e médio porte |
| **Propósito** | Gestão completa de barbearias: agenda, vendas, caixa, comissões, colaboradores, relatórios e agendamento online |
| **Primeiro deploy** | Maio 2026 |
| **Rota base frontend** | `/barber/*` |
| **Rota base API** | `/barber/*` |
| **Rota pública** | `/agendamento/:slug` |

---

## Stack do Módulo

O BarberGestor **compartilha 100% da stack base** do MultGestor:

- Frontend: React 19 + Vite 6 (em `frontend/`)
- Backend: Node.js + Express CommonJS (em `backend/`)
- Banco: Supabase PostgreSQL (multi-tenant isolado por `company_id`)
- Storage: Supabase Storage (logos, banners, galeria)
- E-mail: Resend (confirmações, primeiro acesso, reset de senha)
- Deploy frontend: Vercel
- Deploy backend: Render

### Componentes Específicos do Módulo

Os componentes visuais específicos do BarberGestor ficam em:

```
frontend/src/components/barber/
frontend/src/pages/Barber.jsx        # Página principal (orquestra views)
frontend/src/pages/Barber.css        # Estilos específicos
frontend/src/pages/booking/          # Booking público
```

---

## Arquitetura do Módulo

### Rotas Backend

```
/barber/agenda/*           → CRUD de agendamentos
/barber/vendas/*           → Vendas e atendimentos
/barber/caixa/*            → Caixa diário e fechamento
/barber/comissoes/*        → Comissões de colaboradores
/barber/acertos/*          → Acertos financeiros
/barber/colaboradores/*    → CRUD de colaboradores
/barber/servicos/*         → Catálogo de serviços
/barber/produtos/*         → Catálogo de produtos
/barber/clientes/*         → Clientes
/barber/relatorios/*       → Relatórios por período/colaborador/serviço
/barber/company/*          → Configurações da empresa (dados, branding, agenda online)
```

### Rotas Frontend

```
/barber/dashboard          → Visão geral do dia
/barber/agenda             → Agenda visual
/barber/clientes           → Clientes
/barber/servicos           → Serviços
/barber/produtos           → Produtos
/barber/vendas             → Atendimentos
/barber/caixa              → Caixa
/barber/acertos            → Acertos
/barber/colaboradores      → Equipe
/barber/relatorios         → Relatórios
/barber/configuracoes      → Configurações
```

### Tabelas Tenant Específicas

Todas com `company_id` como chave de isolamento:

- `users` — usuários da barbearia
- `services` — serviços oferecidos (corte, barba, etc.)
- `products` — produtos para venda
- `sales` — vendas/atendimentos realizados
- `collaborators` — barbeiros/colaboradores
- `appointments` — agendamentos
- `schedule_blocks` — bloqueios de agenda
- `working_hours` — horários de funcionamento
- `advances` — vales/adiantamentos
- `settlements` — acertos financeiros
- `company_settings` — configurações da empresa
- `company_branding` — identidade visual

---

## Features do Módulo

### Ativas

| Feature | Status | Arquivo |
|---------|--------|---------|
| Agenda visual (list/calendar) | ✅ Operacional | `features/agenda-online.md` |
| Slots de horário configuráveis | ✅ Operacional | `features/agenda-online.md` |
| Bloqueios manuais de horário | ✅ Operacional | `features/agenda-online.md` |
| Horários de funcionamento por dia | ✅ Operacional | `features/agenda-online.md` |
| Agendamento online público | ✅ Operacional | `features/public-booking.md` |
| Vendas por serviço e produto | ✅ Operacional | — |
| Caixa diário com formas de pagamento | ✅ Operacional | — |
| Múltiplas formas de pagamento | ✅ Operacional | — |
| Comissão de colaboradores | ✅ Operacional | — |
| Acertos e fechamento financeiro | ✅ Operacional | — |
| Cadastro de colaboradores com permissões | ✅ Operacional | — |
| Relatórios por período/colaborador/serviço | ✅ Operacional | — |
| Gráficos de faturamento | ✅ Operacional | — |
| Identidade visual personalizável | ✅ Operacional | — |
| Configurações da empresa | ✅ Operacional | — |
| Topbar premium (UserMenu, notificações, busca) | ✅ Operacional | — |
| Sidebar com navegação e logo | ✅ Operacional | — |
| Favicon/PWA icons | ✅ Operacional | — |
| Preview em tempo real da agenda online | ✅ Operacional | — |
| Planos (Free, Premium) | ✅ Operacional | — |

### Planejadas

| Feature | Status | Arquivo |
|---------|--------|---------|
| WhatsApp API (notificações) | 🔶 Planejado | `features/whatsapp-api.md` |
| Landing pages públicas | 🔶 Planejado | `features/landing-pages.md` |
| Módulo financeiro avançado | 🔶 Planejado | `features/modulo-financeiro.md` |
| Lembretes automáticos | 🔶 Planejado | `features/agenda-online.md` |
| Gateway de pagamento | 🔶 Planejado | — |
| SMS | 🔶 Planejado | — |
| PWA (instalação mobile) | 🔶 Planejado | — |
| Testes automatizados | 🔶 Planejado | — |

---

## Regras de Negócio do Nicho (Barbearia)

### Agenda
- Agendamentos têm duração baseada no serviço selecionado
- Colaborador pode ter múltiplos agendamentos no mesmo horário? Não (conflito)
- Cliente pode agendar online sem cadastro no sistema
- Antecedência mínima configurável (ex: 30 min antes)
- Horário de funcionamento configurável por dia da semana

### Vendas
- Venda pode conter múltiplos serviços e produtos
- Formas de pagamento: PIX, dinheiro, crédito, débito, permuta
- Comissão do colaborador: percentual sobre serviço ou valor fixo
- Caixa diário registra abertura, movimentações e fechamento

### Colaboradores
- Perfis: admin (dono) e colaborador (barbeiro)
- Colaborador vê apenas seus próprios agendamentos e comissões
- Admin vê tudo

### Financeiro
- Acertos: cálculo de comissão por período
- Relatórios filtrados por colaborador, serviço, período
- Gráficos de faturamento diário/mensal

---

## Roadmap do Módulo

### Curto Prazo
1. WhatsApp API — notificações e confirmações
2. Landing pages públicas personalizadas
3. Lembretes automáticos (WhatsApp + e-mail)

### Médio Prazo
4. Módulo financeiro avançado (DRE, fluxo de caixa)
5. Gateway de pagamento
6. PWA (instalação mobile)

### Longo Prazo
7. Testes automatizados
8. Cache (Redis)
9. Rate limiting
10. Performance e escalabilidade

---

## Decisões Técnicas Específicas

- Datas em UTC no banco, convertidas para `America/Cuiaba` no frontend
- Agenda online usa slug único por empresa (não UUID)
- Preview em tempo real das configurações visuais
- Tema escuro premium como padrão visual do módulo

---

## Próximos Passos

- [ ] Iniciar implementação WhatsApp API
- [ ] Conectar busca e notificações com backend real
- [ ] Criar landing pages públicas
- [ ] Implementar lembretes automáticos
