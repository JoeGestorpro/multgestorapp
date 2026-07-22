# MISSÃO 0C — DUPLICIDADES E PLACEHOLDERS

**Dependência:** Missão 0B concluída
**Risco:** Alto
**Decisões humanas necessárias:** D01-D04, D09, D10, D12
**Exclusões/redirecionamentos/renomeações:** Permitido (após aprovação nominal de cada item)
**Commit/push:** Proibidos sem autorização

---

## Escopo

Resolver todas as duplicidades e placeholders identificados no Gate 3:
redirecionar cópias vazias, excluir arquivos placeholder, renomear documentos
com conflito de nome e decidir o padrão `visao-geral.md`.

---

## Decisões necessárias antes de iniciar

| ID | Decisão | Opções | Risco |
|----|---------|--------|-------|
| D01 | Padrão `visao-geral.md` ou migrar para nomes específicos (ex: README.md)? | Manter / Migrar / Híbrido | Médio |
| D02 | `chatJoe.md` (0 bytes) — preencher ou excluir? | Preencher / Excluir | Baixo |
| D03 | `prompts/product.md` (0 bytes) — preencher ou excluir? | Preencher / Excluir | Baixo |
| D04 | `areas/produto-roadmap/fluxos.md` — renomear para evitar conflito com raiz/FLUXOS.md? | Sim / Não | Médio |
| D09 | Excluir subdiretório `roadmap/roadmap/`? | Sim / Não | Alto |
| D10 | Excluir 5 arquivos vazios (chatJoe.md, Sem titulo.md, .canvas, agents/*.md)? | Sim / Não (individual) | Alto |
| D12 | Exclusão de `roadmap/roadmap/` (pasta com arquivos, irreversível)? | Sim / Não | Irreversível |

**Nota:** D09 e D12 são a mesma decisão (D09 é o que, D12 é o risco). Podem
ser agrupadas em uma única aprovação: "Excluir roadmap/roadmap/".

---

## Arquivos afetados

```
.opencodex/maps/multgestor-core/MAPA-MULTGESTOR-CORE.md          → redirecionar
.opencodex/living-os/riscos/riscos-ativos.md                     → redirecionar
.opencodex/agents/joefelipe-agent.md                              → redirecionar
.opencodex/agents/joefelipe-personal-operating-agent.md           → verificar/excluir
.opencodex/projetos/multgestor/roadmap/roadmap/                   → excluir (pasta)
.opencodex/projetos/multgestor/roadmap/capacidades.md (0 bytes)  → excluir
.opencodex/prompts/product.md (0 bytes)                           → decidir
.opencodex/chatJoe.md (0 bytes)                                   → decidir
.opencodex/Sem titulo.md (0 bytes)                                → excluir
.opencodex/Sem titulo.canvas                                      → excluir
.opencodex/HOME.md                                                → redirecionar
.opencodex/areas/produto-roadmap/fluxos.md                        → renomear (se D04=Sim)
37 arquivos visao-geral.md                                         → decidir padrão (D01)
```

---

## Ações

| ID | Ação | Risco |
|----|------|-------|
| A3.1 | Redirecionar `maps/multgestor-core/MAPA-MULTGESTOR-CORE.md` | 🔴 |
| A3.2 | Redirecionar `living-os/riscos/riscos-ativos.md` | 🔴 |
| A3.3 | Redirecionar `agents/joefelipe-agent.md` | 🔴 |
| A3.4 | Verificar/excluir `agents/joefelipe-personal-operating-agent.md` | 🔴 |
| A3.5 | Excluir subdiretório `roadmap/roadmap/` | 🔴 |
| A3.6 | Excluir `projetos/multgestor/roadmap/capacidades.md` (0 bytes) | 🔴 |
| A3.7 | Decidir `prompts/product.md` (populr ou excluir) | 🔴 |
| A3.8 | Decidir `chatJoe.md` (populr ou excluir) | 🔴 |
| A3.9 | Excluir `Sem titulo.md` | 🔴 |
| A3.10 | Excluir `Sem titulo.canvas` | 🔴 |
| A3.11 | Substituir conteúdo de `HOME.md` por redirecionamento | 🟢 |
| A3.12 | Renomear `areas/produto-roadmap/fluxos.md` (se D04=Sim) | 🟡 |
| A3.13 | Aplicar decisão D01 sobre padrão `visao-geral.md` | 🟡 |

---

## PRE-GATE

- [ ] Decisões D01-D04, D09/D12, D10 respondidas por humano (nominalmente,
      item a item)
- [ ] `git status` / `git diff` — branch limpa
- [ ] Confirmar que Missão 0B foi concluída e validada
- [ ] **Backup obrigatório** de toda a pasta `.opencodex/` antes de qualquer
      exclusão (git tag ou branch de segurança)
- [ ] Lista dos arquivos que poderão ser alterados (acima)

---

## POST-GATE

- [ ] `git diff` — restrito aos arquivos do escopo
- [ ] Verificar que nenhum arquivo excluído ainda é referenciado
- [ ] Verificar que todos os redirecionamentos apontam para destinos existentes
- [ ] Se D04=Sim: confirmar que `fluxos-produto.md` (ou novo nome) não conflita
- [ ] Se D01 definido: confirmar que a decisão foi aplicada consistentemente
- [ ] Relatório gerado em `.opencode/plans/MISSAO-0C-RELATORIO.md`
- [ ] Aguardar autorização explícita para Missão 0D

---

```
MISSAO_0C_STATUS: PLANO_CONCLUIDO
PRONTA_PARA_EXECUCAO: NAO
BLOQUEADA_POR: D01, D02, D03, D04, D09/D12, D10
```
