# MISSÃO 0D — CONSOLIDAÇÃO DOCUMENTAL DA ARQUITETURA

**Dependência:** Missão 0C concluída
**Risco:** Médio
**Decisões humanas necessárias:** D06, D11
**Alterações permitidas:** Atualização de documentos arquiteturais desatualizados identificados no Gate 4. **Não modifica arquitetura, código ou comportamento do sistema.**
**Commit/push:** Proibidos sem autorização

---

## Escopo

Atualizar a **representação documental** da arquitetura do MultGestor para
refletir o estado real do sistema, eliminando os conflitos de estado
identificados no Gate 4 (C3, C4). Esta missão **prepara o terreno** para a
Missão 1 — Arquitetura Canônica do Core MultGestor, sem antecipar decisões
arquiteturais.

---

## Decisões necessárias antes de iniciar

| ID | Decisão | Impacto | Risco |
|----|---------|---------|-------|
| D06 | `projetos/multgestor/capacidades.md` — atualizar com dados do Gate 4 (40 capacidades, 21 LOCALMENTE) ou manter como conceitual? | 40 capacidades mapeadas no código vs documento desatualizado | Médio |
| D11 | Atualizar 4 documentos arquiteturais (AUDIT_REPORT, capabilities-map, runtime-map, PLATFORM_ARCHITECTURE)? | Remover objeções descartadas, marcar itens como implementados | Médio |

---

## Arquivos afetados

**Fora de `.opencodex/` (raiz do repositório):**

```
docs/AUDIT_REPORT.md
docs/capabilities-map.md
docs/core/runtime-map.md
docs/PLATFORM_ARCHITECTURE.md
```

**Dentro de `.opencodex/`:**

```
.opencodex/projetos/multgestor/capacidades.md
.opencodex/projetos/multgestor/matriz-consolidacao-core.md  (opcional — avaliar divisão)
```

---

## Ações

| ID | Ação | Arquivo | Risco |
|----|------|---------|-------|
| A4.1 | Remover 5 objeções descartadas do relatório de auditoria | `docs/AUDIT_REPORT.md` | 🟡 |
| A4.2 | Marcar Repository/EventBus como implementados | `docs/capabilities-map.md` | 🟡 |
| A4.3 | Adicionar refresh token ao runtime map | `docs/core/runtime-map.md` | 🟡 |
| A4.4 | Remover risco R9 sobre migrations | `docs/PLATFORM_ARCHITECTURE.md` | 🟡 |
| A4.5 | Alinhar capacidades.md com matriz do Gate 4 | `.opencodex/projetos/multgestor/capacidades.md` | 🟡 |
| A4.6 | Avaliar divisão da matriz de consolidação (72,5 KB) | `.opencodex/projetos/multgestor/matriz-consolidacao-core.md` | 🟢 |
| A4.7 | Verificar separação entre A e O em living-os/ | `.opencodex/projetos/multgestor/living-os/` | 🟢 |
| A4.8 | Verificar que plataforma.md não mistura estado com arquitetura | `.opencodex/projetos/multgestor/plataforma.md` | 🟡 |

---

## PRE-GATE

- [ ] Decisões D06 e D11 respondidas por humano
- [ ] `git status` / `git diff` — branch limpa
- [ ] Confirmar que Missão 0C foi concluída e validada
- [ ] Backup dos 4 arquivos em `docs/` (fora de `.opencodex/`)
- [ ] Lista dos arquivos que poderão ser alterados (acima)
- [ ] Nota: esta é a primeira missão que mexe em `docs/` na raiz do repositório

---

## POST-GATE

- [ ] `git diff` — restrito aos arquivos do escopo
- [ ] Validar que AUDIT_REPORT.md não contém mais objeções descartadas
- [ ] Validar que capabilities-map.md reflete estado real (Repository/EventBus implementados)
- [ ] Validar que runtime-map.md inclui refresh token
- [ ] Validar que PLATFORM_ARCHITECTURE.md não menciona R9
- [ ] Relatório gerado em `.opencode/plans/MISSAO-0D-RELATORIO.md`
- [ ] Aguardar autorização explícita para Missão 0E

---

```
MISSAO_0D_STATUS: PLANO_CONCLUIDO
PRONTA_PARA_EXECUCAO: NAO
BLOQUEADA_POR: D06, D11
```
