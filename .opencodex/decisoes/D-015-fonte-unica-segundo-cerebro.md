# D-015 — Fonte Única do Segundo Cérebro

| Campo | Valor |
|---|---|
| **Decisão** | D-015 |
| **Data** | 2026-06-23 |
| **Status** | DECIDIDO e vigente |
| **Área** | governança |
| **Contexto** | Auditoria READ_ONLY revelou living-os fragmentado (4 committed, 12 untracked), `docs/private/` com secrets reais sem `.gitignore`, referências `[[living-os/...]]` quebradas no vault `.opencodex/` |

## Decisão

1. **`.opencodex/brain/living-os/`** é a fonte oficial única do Living OS. `living-os/` raiz contém apenas agent docs históricos e não é fonte executiva.
2. **Arquivos sensíveis bloqueados**: `docs/private/`, `vendas/`, `body-login.json`, `.opencodex/.obsidian/`, `.opencodex/segundo cerebro/` adicionados ao `.gitignore`. Nunca commitar.
3. **Links Obsidian corrigidos**: `[[living-os/...]]` → `[[brain/living-os/...]]` no `INDEX.md` para refletir vault root em `.opencodex/`.
4. **Living OS completo**: 12 arquivos oficiais (00, 01, 03, 04, README, gates, scorecards) adicionados ao git. Todo o Living OS agora está versionado em `main`.
5. **Missão Fase C oficialmente fechada**: PR #16 (paths-ignore), PR #15 (publicação .opencodex), e consolidação do Segundo Cérebro concluídos.

## Implicações

- Commits futuros não incluirão secrets nem ruído local
- Living OS no git está completo (16 arquivos no total)
- `[[living-os/README]]` no INDEX.md agora aponta para o Living OS real
- Fase C encerrada; próximas missões: cleanup de branches/worktrees e agent/joefelipe-consolidation

## Relações
- ADR-005 (Segundo Cérebro em `.opencodex/`)
- Auditoria READ_ONLY 2026-06-23
