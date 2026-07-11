# AUDITORIA-01 — Classificação dos Arquivos Não Rastreados

> **Data:** 2026-07-11
> **Fase:** 2 — Preservar arquivos não rastreados (modo leitura, sem remoção)

---

## 1. Inventário completo (16 itens untracked)

| Arquivo | Tamanho | Classificação | Tratamento proposto |
|---------|---------|---------------|---------------------|
| `.opencode/plans/PLANO-ORGANIZACAO-BANCADA-GIT.md` | (este plano) | Canônico | Preservar e versionar |
| `.opencode/plans/separacao-14-commits-release-v2.2.md` | 19.179 B | Canônico | Preservar (versão vigente) |
| `.opencode/plans/plano-reorganizacao-wikis.md` | 15.668 B | Canônico | Preservar |
| `.opencode/plans/execucao-reorganizacao-wikis.md` | 21.866 B | Canônico | Preservar |
| `.opencode/plans/auditoria-14-commits-completa.md` | 9.685 B | Canônico | Preservar |
| `.opencodex/auditorias/multgestor/2026-07-10-auditoria-readonly-mapa-mestre.md` | 16.397 B | Canônico | Preservar |
| `.opencodex/projetos/multgestor/incidentes/INC-004-exposicao-credencial-runtime-scratch.md` | 3.390 B | Canônico | Preservar (registro de incidente) |
| `.opencodex/projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md` | 37.002 B | Canônico | Preservar (roadmap mestre) |
| `.opencode/plans/separacao-14-commits-release.md` (v1) | 14.122 B | Substituído | Remover após confirmação (superado por v2.2) |
| `.opencode/plans/separacao-14-commits-release-v2.md` | 15.957 B | Substituído | Remover após confirmação (superado por v2.2) |
| `.opencode/plans/auditoria-lote-commits-pendentes.md` | 11.784 B | Histórico | Preservar como histórico OU arquivar (escopo amplo, commit-level superado por auditoria-14-commits-completa) |
| `.opencodex/projetos/multgestor/roadmap/capacidades.md` | **0 B** | Temporário | Remover (arquivo vazio) |
| `.opencodex/Sem título.md` | **0 B** | Temporário | Remover (nome defeituoso, vazio) |
| `.opencodex/Sem título.canvas` | **2 B** | Temporário | Remover (canvas Obsidian vazio; **não listado no plano**, detectado agora) |
| `.opencodex/projetos/multgestor/roadmap/.obsidian/` (5 arquivos) | — | Temporário | Ignorar (config pessoal Obsidian) |

## 2. Observações importantes

### 2.1 Descoberta adicional: `Sem título.canvas`
Além do `Sem título.md` (0 B) previsto no plano, há também **`.opencodex/Sem título.canvas` (2 B)** — canvas Obsidian vazio com o mesmo nome defeituoso (encoding). Ambos devem ser removidos na Fase 9. O plano listava apenas o `.md`.

### 2.2 `.obsidian/` do roadmap — já ignorado, mas aparece como untracked
`git check-ignore` confirma que `.opencodex/projetos/multgestor/roadmap/.obsidian/` casa com `.gitignore:114`. Ainda assim `git status` o lista como `??`. Discrepância a investigar (possível cache de índice ou padrão com barra final). **Não requer ação nesta fase**; na prática o Git não o versionará. Recomendação: confirmar o padrão do `.gitignore` na Fase 7.

### 2.3 Arquivos modificados (não untracked, mas parte do estado sujo)
- `.opencodex/projetos/multgestor/indice.md` (M)
- `.opencodex/projetos/multgestor/status-atual.md` (M)

Estes são edições de documentação de governança já rastreada. Tratamento sugerido: revisar diff e versionar junto com o lote de documentação (Lote A da Fase 5), **não** descartar.

## 3. Regra de decisão aplicada

| Estado | Tratamento | Itens |
|--------|-----------|-------|
| Canônico | Preservar e versionar | 8 arquivos |
| Histórico | Arquivar ou preservar | `auditoria-lote-commits-pendentes.md` |
| Substituído | Remover após confirmação | `separacao-14-commits-release.md`, `-v2.md` |
| Temporário | Remover / ignorar | `capacidades.md`, `Sem título.md`, `Sem título.canvas`, `.obsidian/` |

## 4. Gate

🔒 **Nenhum arquivo untracked foi removido.** Remoção só após aprovação humana desta classificação (Fase 9).
