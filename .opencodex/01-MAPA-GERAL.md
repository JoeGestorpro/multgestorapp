# 01-MAPA-GERAL — Estrutura do `.opencodex/` por projetos e áreas

> Mapa da reorganização física iniciada em 2026-07-07. Descreve o que cada pasta de topo significa.

## Pastas novas (desta reorganização)

| Pasta | Conteúdo |
|---|---|
| `projetos/multgestor/` | Tudo específico do produto MultGestor: status, plataforma, capacidades, mapas, nichos, living-os, incidentes, agentes, roadmap |
| `projetos/joefelipe-agent/` | Tudo específico da ferramenta interna JoeFelipe Agent: arquitetura, fases, agentes |
| `areas/produto-roadmap/` | Conhecimento de produto/estratégia que não é exclusivo de um projeto |
| `areas/operacao/` | Runbooks, playbooks operacionais, instruções humanas, production-readiness |
| `areas/seguranca/` | Segurança e rotação de segredos, transversal a projetos |
| `areas/governanca/` | Fonte da verdade e regras de governança do próprio Knowledge OS |
| `auditorias/multgestor/` | Auditorias do produto MultGestor |
| `auditorias/joefelipe-agent/` | Auditorias da ferramenta JoeFelipe Agent |
| `decisoes/` | Decisões arquiteturais (ADRs) e histórico de decisões |
| `prompts/frontend/` | Prompts específicos de frontend (subpasta de `prompts/`) |
| `_inbox/revisar/` | Arquivos cuja categoria final não estava clara na reorganização — precisam de decisão humana |
| `_inbox/antigos/` | Material congelado, mantido só por valor histórico |

## Pastas que não mudaram

| Pasta | Por quê |
|---|---|
| `queue/` | Fila de missões — fluxo operacional ativo, não é conhecimento estático |
| `rules/` | Regras vinculantes do projeto |
| `handoff/` | Passagem de contexto entre agentes |
| `templates/` | Modelos reutilizáveis |
| `chatJoe/` | Espaço próprio do chatJoe |
| `automation/` | Políticas de automação |
| `ops/playbooks.md` | Runbook operacional de referência direta |

## Arquivos-raiz clássicos (não tocados)

`HOME.md`, `MAPA-DAS-PASTAS.md`, `CONVENCOES.md`, `FLUXOS.md`, `GLOSSARIO.md`, `ATLAS.md`.

## Arquivos-raiz novos (desta reorganização)

`00-HOME.md` (este conjunto de 3 arquivos), `01-MAPA-GERAL.md` (você está aqui), `02-COMO-USAR.md`.
