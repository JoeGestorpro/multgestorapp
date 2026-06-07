# 🎯 CONTEXT CONFIDENCE ENGINE

> **Status:** OFICIAL • VINCULANTE · **Criado:** 2026-06-07
> Toda missão gera um **CONTEXT CONFIDENCE REPORT** antes de planejar/executar. Aplicado pelo **CHECK 0** do preflight.
> Objetivo: impedir que a IA implemente sem contexto suficiente (causa-raiz de drift e regressão).

## CONTEXT CONFIDENCE REPORT (campos obrigatórios)
Cada item: ✅ (feito) / ❌ (não) — e cada ✅ vale pontos.

| # | Item | Pontos |
|---|------|:---:|
| 1 | `brain/constitution.md` lido? | 10 |
| 2 | `brain/source-of-truth.md` lido? | 10 |
| 3 | `brain/project-state.md` lido? | 15 |
| 4 | `brain/capabilities-map.md` lido? | 10 |
| 5 | `brain/architecture-decisions.md` lido (ADRs relevantes)? | 10 |
| 6 | Regras aplicáveis lidas (`.opencodex/rules/` + event-contracts se tocar eventos)? | 15 |
| 7 | Workspace pesquisado (grep/leitura dos arquivos reais do escopo)? | 15 |
| 8 | Arquivos relacionados encontrados e listados? | 5 |
| 9 | Riscos conhecidos consultados (`project-state.open_risks` + `lessons-learned`)? | 5 |
| 10 | Lacunas de conhecimento declaradas explicitamente? | 5 |
| | **TOTAL** | **100** |

## Score → ação permitida
| Score | Ação |
|---|---|
| **95–100** | ✅ **APTO PARA PLANEJAR E EXECUTAR** (execução normal) |
| **80–94** | 🟡 **APTO PARA PLANEJAR, EXECUÇÃO COM RISCOS DECLARADOS** (listar riscos no card) |
| **70–79** | 🟠 **APENAS INVESTIGAÇÃO** — não implementar |
| **< 70** | 🔴 **IMPLEMENTAÇÃO PROIBIDA** — a IA **PARA e pergunta** ao humano |

## Modelo do report (colar no início do plano/missão)
```
CONTEXT CONFIDENCE REPORT — <task_id>
[x] constitution.md (10)
[x] source-of-truth.md (10)
[x] project-state.md (15)
[x] capabilities-map.md (10)
[ ] architecture-decisions.md (0)  ← ADR de RLS não revisada
[x] regras aplicáveis (15)
[x] workspace pesquisado (15)
[x] arquivos relacionados (5)
[x] riscos conhecidos (5)
[x] lacunas declaradas (5): "sem Postgres local p/ validar integração"
SCORE: 90/100 → APTO PARA PLANEJAR, EXECUÇÃO COM RISCOS DECLARADOS
```

## Regras
- O report é **rastreável**: vai no card (`next-task.md`) ou no parecer de auditoria.
- Subestimar o score para liberar execução é violação de governança (o Auditor pode reabrir).
- Itens "lidos" significam **consultados nesta missão**, não "existem".
