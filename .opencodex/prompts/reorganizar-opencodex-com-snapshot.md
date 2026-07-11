# Prompt Executor — Reorganizar .opencodex (com snapshot)

**Projeto:** MultGestor / chatJoe
**Missão:** Executar reorganização do .opencodex com snapshot prévio
**Tipo:** Implementação controlada + Refatoração
**Risco:** 3
**Base:** `prompts/executor/reorganizar-opencodex.md`

---

## Fase 0 — Snapshot (antes de qualquer movimento)

```powershell
git add -A
git commit -m "wip: snapshot pre-reorganizacao .opencodex + fase 10-11 agent"
```

**Verificação:** `git status --short` deve estar limpo (exceto untrackeds que ainda não existiam no repositório).

---

## Fases 1-8 — Conforme plano original

Seguir exatamente o planejamento em `prompts/executor/reorganizar-opencodex.md`:

| Fase | O que faz | Destino |
|---|---|---|
| **Fase 1** | Criar estrutura de pastas + 3 arquivos raiz | raiz do `.opencodex/` |
| **Fase 2** | Mover MultGestor | `brain/` → `projetos/multgestor/` |
| **Fase 3** | Áreas transversais | `brain/` → `areas/` |
| **Fase 4** | Auditorias | `audits/` + `brain/audits/` → `auditorias/` |
| **Fase 5** | Decisões | `brain/decisions/` → `decisoes/` |
| **Fase 6** | Prompts | `brain/prompts/` + `prompts/` → `prompts/` |
| **Fase 7** | JoeFelipe Agent | → `projetos/joefelipe-agent/` |
| **Fase 8** | Limpeza | inbox, antigos, vazios |

**Regras:** Use `git mv` p/ tracked, `Move-Item` p/ untrackeds. Pare e valide após cada fase. Não apague conteúdo. Não mexa em `queue/`, `rules/`, `handoff/`, `templates/`, `chatJoe/`. Não mexa em `HOME.md`, `MAPA-DAS-PASTAS.md` (raiz). Atualize wikilinks.

### Itens não mapeados no plano original

| Arquivo | Decisão | Destino | Motivo |
|---|---|---|---|
| `brain/rules/README.md` | Mover | `areas/governanca/regras-brain.md` | Índice transversal de regras, não específico de um projeto |
| `brain/archive-index/agent-archive-index.md` | Mover | `_inbox/revisar/agent-archive-index.md` | Ponte histórica para `.agent/` — útil, mas precisa revisão futura |
| `brain/skills/` (vazia) | Ignorar/remover | — | Pasta vazia sem conteúdo. Pode deletar ou simplesmente não criar no destino |

---

## Fase 9 — Commit da reorganização

```powershell
git add -A
git commit -m "feat: reorganizar .opencodex por projetos e areas"
```

---

## Fase 10 — Pós-processamento (separação opcional)

```powershell
git rebase -i HEAD~2
# Marcar o primeiro commit (snapshot) como "edit"
# Depois:
git reset HEAD~1
git add -A tools/joefelipe-agent/
git commit -m "feat: fase 10-11 joefelipe-agent - execution core + llm providers"
git add -A .
git commit -m "chore: edicoes preexistentes .opencodex"
git rebase --continue
```

---

## Checklist de verificação

- [ ] `git status` limpo antes de começar Fase 1
- [ ] `git log --oneline -3` mostra o commit snapshot como HEAD
- [ ] Após Fases 2-8: nenhum arquivo ficou para trás em `brain/`
- [ ] `00-HOME.md`, `01-MAPA-GERAL.md` existem na raiz
- [ ] `chatJoe/`, `queue/`, `rules/`, `handoff/`, `templates/` intactos
- [ ] `HOME.md`, `MAPA-DAS-PASTAS.md` (raiz) intactos
- [ ] Nenhum arquivo foi apagado (só movido/copiado)

---

## Relatório esperado

1. Confirmação do snapshot (hash do commit)
2. Pastas criadas (lista)
3. Arquivos movidos (tabela origem → destino)
4. Links quebrados encontrados (se houver)
5. Status final do git

---

_Gerado por chatJoe em 2026-07-07 — Missao: reorganizar .opencodex (com snapshot)_
