# Módulo: ClimaGestor

## Visão Geral

| Campo | Valor |
|-------|-------|
| **Nome** | ClimaGestor |
| **Status** | 📋 Backlog (não iniciado) |
| **Público-alvo** | Clínicas de estética, salões de beleza |
| **Propósito** | Gestão de clínicas e salões: agendamento de procedimentos, fichas de clientes, controle de produtos, comissão por procedimento |
| **Base multi-tenant** | Compartilhada com MultGestor |
| **Primeiro deploy** | A definir |

---

## Relação com a Base Compartilhada

O ClimaGestor **compartilha** com o MultGestor:

| Componente | Uso |
|------------|-----|
| Autenticação (JWT) | Mesmo sistema, novas roles |
| Multi-tenant (`company_id`) | Mesmo isolamento |
| Supabase PostgreSQL | Mesmo banco, novas tabelas |
| Supabase Storage | Mesmo bucket |
| Resend (e-mail) | Mesmo provedor |
| Frontend (React + Vite) | Novas páginas em `frontend/` |
| Backend (Express) | Novas rotas em `backend/` |
| Vercel (frontend deploy) | Mesma plataforma |
| Render (backend deploy) | Mesma plataforma |

**Não compartilha** com BarberGestor:

- Tabelas de negócio (são específicas do nicho)
- Regras de negócio (procedimentos estéticos ≠ cortes de cabelo)
- Componentes visuais (outro layout, outra identidade)
- Fluxos de agendamento (duração variável, fichas de anamnese)

---

## Público-Alvo

### Clínicas de Estética
- Procedimentos: depilação, limpeza de pele, laser, massagem, drenagem
- Necessidades: ficha do cliente, contraindicações, evolução do tratamento, fotos antes/depois
- Comissão: percentual sobre procedimento, meta mensal

### Salões de Beleza
- Serviços: corte, coloração, escova, unhas, maquiagem, penteados
- Necessidades: múltiplos profissionais por serviço, catálogo de cores/marcas, agendamento simultâneo
- Comissão: percentual ou valor fixo por serviço

---

## Features Previstas

### Essentials (compartilhadas com a base)

| Feature | Fonte | Observação |
|---------|-------|------------|
| Autenticação com JWT | Base MultGestor | Adaptar roles para clínica/salão |
| Multi-tenant por `company_id` | Base MultGestor | Reutilizar sem alterações |
| Envio de e-mail (Resend) | Base MultGestor | Reutilizar templates |
| Upload de imagens | Base MultGestor | Bucket compartilhado |

### Específicas do ClimaGestor

| Feature | Prioridade | Descrição |
|---------|-----------|-----------|
| Agenda de procedimentos | P0 — Crítica | Agendamento visual com duração variável por procedimento |
| Ficha do cliente (anamnese) | P0 — Crítica | Histórico, contraindicações, alergias, evolução |
| Catálogo de procedimentos | P0 — Crítica | Serviços com duração, valor, materiais necessários |
| Controle de produtos usados | P1 — Alta | Estoque de cosméticos, materiais descartáveis |
| Comissão por procedimento | P1 — Alta | Percentual diferenciado por tipo de procedimento |
| Fotos antes/depois | P1 — Alta | Galeria por cliente com privacidade |
| Relatórios por procedimento | P2 — Média | Procedimentos mais realizados, ticket médio |
| Agendamento online público | P2 — Média | Booking com seleção de procedimento e profissional |
| Lembretes automáticos | P2 — Média | WhatsApp + e-mail |
| Contrato de fidelidade | P3 — Baixa | Pacotes de procedimentos |

---

## Regras de Negócio do Nicho (Clínicas e Salões)

### Agenda
- Duração do procedimento varia (ex: depilação 30 min, massagem 1h)
- Profissional pode ter múltiplos agendamentos se houver salas separadas?
  - Depende da config: blocking por professional OU por sala
- Anamnese obrigatória antes do primeiro procedimento
- Intervalo entre procedimentos do mesmo cliente

### Ficha do Cliente
- Dados pessoais + contato de emergência
- Alergias, condições médicas, contraindicações
- Histórico de procedimentos realizados
- Fotos antes/depois (privacidade)
- Consentimento informado (termo digital)

### Produtos
- Controle de estoque de cosméticos e materiais
- Baixa automática ao realizar procedimento
- Validade dos produtos
- Fornecedores

### Financeiro
- Comissão variável por tipo de procedimento
- Meta mensal por profissional
- Pacotes de fidelidade (10 sessões com desconto)
- Recebimento recorrente (assinatura de planos)

---

## Roadmap do Módulo

### Fase 1 — MVP (essenciais)
1. Estrutura de tabelas tenant para clínicas
2. Agenda de procedimentos
3. Ficha do cliente (anamnese)
4. Catálogo de procedimentos
5. Autenticação e permissões

### Fase 2 — Operacional
6. Controle de produtos e estoque
7. Comissão por procedimento
8. Fotos antes/depois
9. Relatórios básicos

### Fase 3 — Expansão
10. Agendamento online público
11. Lembretes automáticos
12. Pacotes de fidelidade
13. Gateway de pagamento

---

## Tabelas Tenant Previstas

Todas com `company_id`:

- `clinic_users` — profissionais da clínica/salão
- `procedures` — catálogo de procedimentos
- `client_medical_records` — fichas de anamnese
- `client_photos` — fotos antes/depois (privadas)
- `procedure_appointments` — agendamentos
- `procedure_products` — produtos usados por procedimento
- `inventory` — estoque de produtos
- `inventory_movements` — movimentação de estoque
- `commissions_config` — regras de comissão por procedimento

---

## Riscos Conhecidos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Ficha de anamnese exige conformidade LGPD | Alto | Criptografia, consentimento explícito, política de retenção |
| Fotos de clientes são dados sensíveis | Alto | Bucket privado, acesso controlado por role |
| Procedimentos têm validade de preços | Médio | Histórico de preços, tabela de vigência |
| Múltiplas salas por estabelecimento | Médio | Modelagem de recursos (salas) como entidade separada |

---

## Próximos Passos

- [ ] Aguardar maturidade do BarberGestor antes de iniciar
- [ ] Definir estrutura exata de tabelas
- [ ] Modelar ficha de anamnese digital
- [ ] Planejar migração multi-módulo no frontend (seleção de módulo no login)
