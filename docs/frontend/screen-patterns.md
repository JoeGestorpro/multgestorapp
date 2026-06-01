# Screen Patterns — Templates de Tela

> Padrões reutilizáveis de estrutura de tela. Toda tela nova deve nascer de um destes templates.
> Se a tela não cabe em nenhum, **discuta antes de criar um padrão novo**.

---

## Índice

1. [CRUD (lista + criar/editar)](#1-crud)
2. [Dashboard (KPIs + gráficos)](#2-dashboard)
3. [Configurações](#3-configurações)
4. [Lista + filtros](#4-lista--filtros)
5. [Detalhe](#5-detalhe)
6. [Onboarding](#6-onboarding)
7. [Página vazia (empty)](#7-página-vazia)
8. [Erro](#8-erro)
9. [Carregamento](#9-carregamento)

---

## 1. CRUD

**Quando usar:** Cadastrar/listar/editar/excluir entidades (clientes, serviços, colaboradores).

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ PageHeader: "Clientes" + [+ Novo cliente]                   │
├─────────────────────────────────────────────────────────────┤
│ Filtros (search + select status)                            │
├─────────────────────────────────────────────────────────────┤
│ <Table>                                                      │
│   Coluna 1 | Coluna 2 | … | Status | Ações (✏️ 🗑️)         │
│   …                                                          │
│ </Table>                                                     │
│ Paginação                                                    │
└─────────────────────────────────────────────────────────────┘

Criação/edição: <Drawer side="right"> ou <Modal> com formulário
```

**Componentes obrigatórios:**
- `<PageHeader>` com ação primária
- Search + filtros (Input + Select do DS)
- `<Table>` com colunas alinhadas (status à direita, ações no final)
- Estados: Loading (skeleton de tabela), Empty (`<Empty>`), Error
- Drawer/Modal de criação com `<Input>`, `<Select>`, validação inline

**Mobile:** Lista vira cards expansíveis em vez de tabela. Drawer de edição abre como BottomSheet ou fullscreen.

**Exemplo no codebase:** `pages/barber/Clientes.jsx`, `features/barber/views/TeamView.jsx`.

---

## 2. Dashboard

**Quando usar:** Tela de abertura de módulo / vertical (entrada do usuário no produto).

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ HeroCard: saudação + KPI principal do dia                   │
├─────────────────────────────────────────────────────────────┤
│ Grid de StatCards (4 KPIs)                                  │
│ [Hoje] [Semana] [Mês] [Meta]                                │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┬──────────────────────────────────┐ │
│ │ ChartCard            │ ActivityList                     │ │
│ │ (faturamento 7d)     │ (últimas vendas)                 │ │
│ └──────────────────────┴──────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ RankingList (top serviços / top colaboradores)              │
└─────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `<HeroCard>` para boas-vindas + métrica principal
- 4 `<StatCard>` em grid responsivo (4/3/2/1 colunas)
- `<ChartCard>` + componentes Recharts (LineChart, BarChart) com `<ChartTooltip>`
- `<ActivityList>` para últimas N transações
- `<RankingList>` para top performers

**Regras:**
- Métricas mais importantes **no topo, à esquerda**
- Cards de KPI devem ter delta vs período anterior ("+12% vs ontem")
- Charts devem ter loading skeleton (`<ChartLoadingState>`)
- Empty state amigável quando ainda não há dados

**Exemplo:** `features/barber/views/DashboardView.jsx`.

---

## 3. Configurações

**Quando usar:** Telas com múltiplas seções de ajustes (perfil, branding, plano, segurança).

**Layout (desktop):**

```
┌──────────────────────┬──────────────────────────────────────┐
│ Sidebar interna      │ Conteúdo da seção ativa              │
│ • Geral              │                                      │
│ • Identidade         │ <SectionHeader>Identidade visual</…> │
│ • Plano              │                                      │
│ • Segurança          │ <Card><Input> <Input> …</Card>       │
│ • Notificações       │                                      │
│ • Integrações        │ [Salvar]                             │
└──────────────────────┴──────────────────────────────────────┘
```

**Layout (mobile):** sidebar vira lista; ao tocar, navega para a seção (fullscreen).

**Componentes:**
- Sub-navegação lateral (lista de seções)
- `<Card>` agrupando campos relacionados
- `<Input>`, `<Select>`, `<Textarea>` do DS
- Botão "Salvar" sticky no rodapé do form (mobile) ou no topo direito (desktop)
- Toast / inline `<Alert>` confirmando salvamento

**Regras:**
- Cada seção salva independentemente (não tela inteira)
- Mudanças não salvas: aviso ao tentar sair (`beforeunload`)
- Validação inline em cada campo
- Help text abaixo do label, não como tooltip

**Exemplo:** `features/barber/views/SettingsView.jsx`.

---

## 4. Lista + filtros

**Quando usar:** Visualização de dados com necessidade de filtragem (vendas, agendamentos, relatórios).

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ PageHeader: "Atendimentos" + [Exportar]                     │
├─────────────────────────────────────────────────────────────┤
│ FilterBar:                                                   │
│   Período: [Hoje ▾]  Colaborador: [Todos ▾]  Status: [▾]   │
├─────────────────────────────────────────────────────────────┤
│ KPIs do filtro (3-4 stat cards pequenos)                    │
├─────────────────────────────────────────────────────────────┤
│ Tabela ou lista de itens                                    │
└─────────────────────────────────────────────────────────────┘
```

**Regras:**
- Filtros visíveis (não escondidos atrás de "Mais filtros") quando ≤ 4
- Filtros aplicam **imediatamente** (sem botão "Aplicar")
- KPIs refletem o filtro atual ("Vendas no período filtrado")
- Empty state distingue: "nenhum dado" vs "nenhum resultado para o filtro"
- URL sincroniza com filtros (querystring) — permite compartilhar / voltar

**Exemplo:** `features/barber/views/SalesView.jsx`, `pages/master/Subscriptions.jsx`.

---

## 5. Detalhe

**Quando usar:** Visualização aprofundada de uma entidade (cliente específico, venda específica).

**Layout (split view):**

```
┌────────────────────┬───────────────────────────────────────┐
│ Header da entidade │ Tabs: [Dados] [Histórico] [Notas]    │
│ Avatar + nome      ├───────────────────────────────────────┤
│ Stats rápidas      │                                       │
│                    │ Conteúdo da tab                       │
│ Ações rápidas      │                                       │
│ (WhatsApp, Email)  │                                       │
└────────────────────┴───────────────────────────────────────┘
```

**Mobile:** stack vertical (header → tabs → conteúdo). Ou Drawer overlay.

**Componentes:**
- Avatar / identificador visual (CollaboratorAvatar, PremiumCustomerAvatar)
- Stats inline (StatCards pequenos ou métricas em linha)
- `<Tabs>` para seções de detalhe
- Ações primárias visíveis (não escondidas em menu ⋯)

**Exemplo:** `components/premium/CustomerSidePanel.jsx`.

---

## 6. Onboarding

**Quando usar:** Primeiro acesso do usuário no sistema (após cadastro / aceitação de convite).

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ ProgressBar (1 de 5)                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         Ilustração / vídeo                                  │
│                                                             │
│         Título do passo                                     │
│         Subtítulo (1 frase)                                 │
│                                                             │
│         Formulário curto (1-3 campos)                       │
│                                                             │
│         [Pular]              [Continuar →]                  │
└─────────────────────────────────────────────────────────────┘
```

**Regras:**
- Máximo 5 passos
- Cada passo pede 1 informação (ou conjunto coeso)
- Botão "Pular" sempre visível (não forçar)
- "Continuar" desabilitado se obrigatório não preenchido (mas explicar por que)
- Permitir voltar
- Animação suave entre passos (slide)

**Exemplo:** `components/onboarding/SetupWizard.jsx`.

---

## 7. Página vazia

**Quando usar:** Quando uma tela não tem dados ainda (lista vazia, sem agendamentos, etc).

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                  Ilustração / ícone grande                  │
│                                                             │
│                  Título amigável                            │
│                  "Você ainda não tem clientes cadastrados"  │
│                                                             │
│                  Texto explicativo curto                    │
│                                                             │
│                  [+ Cadastrar primeiro cliente]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Componente:** `<Empty title="…" description="…" icon={…} action={<Button>…</Button>} />`

**Regras:**
- Tom positivo: "Você ainda não" vs "Não há"
- Sempre ter CTA principal (criar primeiro item)
- Ilustração / ícone do Lucide (não foto)
- Não confundir com erro (Empty = tudo certo, só vazio)

**Não usar para:** loading inicial (use Skeleton), erro de fetch (use estado de erro).

---

## 8. Erro

**Quando usar:** Falha técnica (fetch falhou, 500, network down).

**Layout:** mesmo do empty, mas:

- Ícone com tom danger (`<AlertCircle />`)
- Título: "Não foi possível carregar"
- Descrição: o que aconteceu em linguagem humana
- Ação: "Tentar novamente"
- Opcional: link "Reportar problema" (Sentry)

```jsx
<Empty
  title="Não foi possível carregar os clientes"
  description="Verifique sua conexão e tente novamente."
  icon={<AlertCircle />}
  tone="danger"
  action={<Button onClick={refetch}>Tentar novamente</Button>}
/>
```

**Erros de página inteira** (rota não existe, sem permissão): usar `<ErrorBoundary>` fallback ou rota 404 dedicada.

---

## 9. Carregamento

**Quando usar:** Aguardando dados / processo demorado.

**Variações:**

| Contexto | Componente |
|---|---|
| Primeira carga de página | `<PageLoader>` (em `Suspense` fallback) |
| Tabela carregando | `<Skeleton>` em linhas |
| Card específico | `<Skeleton>` no card |
| Chart carregando | `<ChartLoadingState>` |
| Botão processando | Button com prop `loading` (spinner inline) |
| Form salvando | Botão "Salvando…" desabilitado |

**Regra:** **Nunca tela branca**. Sempre algo visual ≤ 100ms após interação.

---

## Como usar este documento

1. Antes de criar uma tela, identifique qual padrão se aplica
2. Comece pelo template — não invente layout
3. Use componentes do DS para preencher
4. Se precisar de algo que não está no template, **discuta antes** de criar variação
5. Se acabar criando padrão novo, **documente aqui** ao final
