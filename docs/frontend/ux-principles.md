# UX Principles — MultGestor

> Princípios profundos (UX psychology, color theory, typography, animação, motion graphics)
> vivem em **`.agent/skills/frontend-design/`** — não duplicar aqui.
> Este documento define apenas o que é **específico do MultGestor**.

---

## 1. Persona e contexto

O MultGestor atende **micro e pequenas empresas brasileiras** — começando por barbearias.
O usuário típico:

- Tem pouco tempo (atende cliente enquanto opera o sistema)
- Não é técnico (não conhece jargões de SaaS)
- Usa muito mobile (celular do balcão / no salão)
- Pode ter conexão lenta ou intermitente
- Confia no produto se ele **parece simples e funciona rápido**

Toda decisão visual deve respeitar essa realidade. Não estamos construindo para CTOs de fintech.

## 2. Os 6 princípios do MultGestor

### 2.1 Poucos cliques
Tarefas frequentes (cadastrar venda, consultar agenda, fechar caixa) **em no máximo 3 cliques**
desde a tela inicial. Atalhos via `QuickActionsFAB` em mobile.

### 2.2 Clareza > beleza
Texto direto, sem jargão. "Atendimentos hoje" em vez de "Ocorrências do dia".
Botões com verbo claro ("Salvar", "Excluir") — nunca "OK" / "Confirmar".

### 2.3 Mobile-first (não mobile-friendly)
Toda tela é desenhada para mobile **primeiro**, e adaptada para desktop depois.
Se uma feature não funciona em 320px, ela não existe.

### 2.4 Feedback visual em toda ação
Nenhum botão pode parecer travado. Estados obrigatórios:
- **Hover**: mudança sutil de cor/elevação (desktop)
- **Active**: estado pressionado visível (touch)
- **Loading**: spinner inline ou skeleton (nunca tela branca)
- **Success/Error**: confirmação visível (toast ou inline)

### 2.5 Linguagem simples (PT-BR coloquial)
- "Adicionar cliente" — não "Criar registro"
- "Vendas de hoje" — não "Receita diária"
- "Tudo certo!" — não "Operação concluída com êxito"
- Datas: "Hoje", "Ontem", "23/05" — não ISO 8601 cru

### 2.6 Foco no negócio do cliente
A tela inicial mostra **o que importa para a barbearia agora**:
- Vendas do dia + meta
- Próximos agendamentos
- Comissão acumulada
- Alertas de caixa

Nunca o sistema. Nunca métricas técnicas. Sempre o negócio.

## 3. Leis de UX (resumo operacional)

A skill `.agent/skills/frontend-design/ux-psychology.md` cobre profundamente. Resumo prático:

| Lei | Aplicação no MultGestor |
|---|---|
| **Hick's Law** (mais opções = mais lentidão) | Menus enxutos. Configurações em sidebar interna por sessão (não tudo aberto) |
| **Fitts' Law** (alvo maior = mais fácil) | Touch targets ≥ 44×44px. CTAs primários grandes |
| **Miller's Law** (~7 itens em memória) | Limitar cards visíveis no dashboard. Paginar listas longas |
| **Von Restorff** (diferente = memorável) | Apenas UMA cor de destaque na tela (--accent-primary). Use com parcimônia |
| **Serial Position** (primeiro/último importam) | KPIs principais nos cantos. Última coluna de tabelas para ações |
| **Lei de Jakob** (familiaridade) | Padrões conhecidos: ☰ para menu, ⋯ para "mais ações", ✕ para fechar |

## 4. Identidade visual e tom

- **Dark mode default** — clientes operam em ambiente de salão (luz baixa/foco em monitor)
- **Cor de destaque do tenant** (`--theme-primary`) sobrescreve `--accent-primary` em runtime
- **Tom de voz**: profissional, direto, próximo. Sem condescendência. Sem "rei" / "campeão" / "guerreiro"
- **Emoji**: zero no produto. Aceitável em e-mails de marketing apenas

## 5. Acessibilidade — mínimo viável

- **Contraste**: WCAG AA (4.5:1 para texto pequeno, 3:1 para grande) — verificar nos tokens
- **Teclado**: toda interação possível sem mouse. `Tab` percorre em ordem lógica
- **Foco visível**: outline em `--accent-primary` (`outline: 2px solid var(--accent-primary); outline-offset: 2px`)
- **ARIA labels**: em ícones-only, modais, drawers
- **`prefers-reduced-motion`**: respeitar — desativar animações decorativas
- **Semântica**: `<button>` para ação, `<a>` para navegação. **Nunca** `<div onClick>`

## 6. Estados de tela obrigatórios

Toda tela que carrega dados precisa de **3 estados implementados**:

| Estado | Quando | Componente |
|---|---|---|
| **Loading** | Durante fetch inicial | `<Skeleton>` ou `<PageLoader>` |
| **Empty** | Sem dados | `<Empty title="…" description="…" action={…} />` |
| **Error** | Falha de fetch | `<Empty>` com tom danger + ação "Tentar novamente" |

Adicionalmente:
- **Loading parcial** (refresh sem trocar tela): spinner inline
- **Saving** (formulário): botão desabilitado com label "Salvando…"
- **Optimistic updates** (quando seguro): atualizar UI antes da resposta, reverter em erro

## 7. Performance percebida

Velocidade percebida importa mais que real. Truques aceitos:
- **Skeleton screens** > spinners
- **Lazy loading de páginas** (`React.lazy()` — já implementado)
- **Prefetch** de rotas prováveis (não implementado ainda)
- **Cache de plan / company** (já implementado no backend)
- **Code splitting** por rota (vite faz por padrão)

Métricas-alvo (a serem instrumentadas):
- LCP < 2.5s em 4G
- INP < 200ms
- CLS < 0.1

## 8. Anti-padrões (não fazer)

- ❌ Modais aninhadas (modal abre modal)
- ❌ Tooltips em mobile (não há hover)
- ❌ Confirmações "Tem certeza?" para ações reversíveis (use undo + toast)
- ❌ Tabela com 10+ colunas em mobile (use cards expansíveis)
- ❌ Cores piscando para chamar atenção
- ❌ Sons / vibrações sem permissão
- ❌ Modais para feedback que poderia ser toast
- ❌ Textos em ALL CAPS (acessibilidade + leitura)
- ❌ Lorem ipsum em produção

## 9. Quando precisar decidir algo novo

1. Leia [`ux-psychology.md`](../../.agent/skills/frontend-design/ux-psychology.md) na skill — princípios profundos
2. Verifique se o problema não é resolvido pelo Design System atual
3. Se for visual: consulte [`color-system.md`](../../.agent/skills/frontend-design/color-system.md), [`typography-system.md`](../../.agent/skills/frontend-design/typography-system.md)
4. Se for animação: [`animation-guide.md`](../../.agent/skills/frontend-design/animation-guide.md)
5. Em caso de dúvida: **pergunte ao usuário** — não default para suas preferências

## 10. Pós-implementação

Depois de implementar, rodar a skill `web-design-guidelines`:
```
4. AUDIT → web-design-guidelines (acessibilidade, performance, best practices)
```

Ver fluxo completo em `.agent/skills/frontend-design/SKILL.md` → seção "Post-Design Workflow".
