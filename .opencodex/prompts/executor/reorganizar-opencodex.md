# Prompt Executor — Reorganizar .opencodex

**Projeto:** MultGestor / chatJoe
**Missao:** Reorganizar .opencodex/ por projetos e areas
**Tipo:** Implementacao controlada + Refatoracao
**Risco:** 3
**Skills:** documentacao, produto, code-review
**Agentes recomendados:** Platform Architect, Technical Writer, QA Engineer

---

## Contexto

O .opencodex/ cresceu organicamente e mistura conteudos de varios projetos (MultGestor, JoeFelipe Agent) e areas (banco, seguranca, produto) tudo dentro da pasta brain/. O Obsidian exibe uma bagunca de ~260 arquivos sem separacao clara.

O objetivo e reorganizar fisicamente os arquivos dentro do proprio .opencodex/ para que:
1. Cada projeto tenha sua pasta propria em projetos/
2. Conhecimento transversal (banco, seguranca, deploy) va para areas/
3. Auditorias, decisoes, prompts e missoes tenham pastas proprias
4. A raiz do .opencodex/ fique limpa (so 3 arquivos + pastas)

## Escopo

**Dentro do escopo:**
- Criar nova estrutura de pastas
- Mover arquivos existentes para os novos locais
- Criar 00-HOME.md, 01-MAPA-GERAL.md, 02-COMO-USAR.md na raiz
- Criar projetos/<cada-projeto>/HOME.md com links para seus arquivos
- Atualizar wikilinks que quebrarem com a movimentacao
- Mover arquivos incertos para _inbox/revisar/

**Fora do escopo:**
- Nao apagar nenhum arquivo
- Nao alterar conteudo de nenhum arquivo (exceto atualizar links)
- Nao mexer na pasta queue/, rules/, handoff/, templates/, chatJoe/
- Nao mexer em HOME.md, MAPA-DAS-PASTAS.md, CONVENCOES.md, FLUXOS.md, GLOSSARIO.md, ATLAS.md (raiz)
- Nao mexer em automation/, ops/playbooks.md
- Nao alterar codigo da aplicacao
- Nao criar scripts

## Regras obrigatorias

1. Nunca apague conteudo. So mova ou copie.
2. Nunca mova queue/, rules/, handoff/, templates/, chatJoe/.
3. Nunca mova HOME.md, MAPA-DAS-PASTAS.md, CONVENCOES.md, FLUXOS.md, GLOSSARIO.md, ATLAS.md (raiz).
4. Nunca mova automation/, ops/playbooks.md.
5. Wikilinks: atualize caminhos antigos para novos em todos os arquivos afetados.
6. Fases: execute uma fase de cada vez. Apos cada fase, pare e valide.

## Fases de execucao

### Fase 1 — Criar estrutura (seguro)
Criar todas as pastas da estrutura alvo e os 3 arquivos raiz.

### Fase 2 — Mover MultGestor (brain/ -> projetos/multgestor/)
- brain/project-state.md -> projetos/multgestor/status-atual.md
- brain/01-CURRENT-STATE.md -> projetos/multgestor/status-dinamico.md
- brain/implementation-log.md -> projetos/multgestor/historico/implementacao-log.md
- brain/EXECUTION-PLAYBOOK-PRODUCAO.md -> projetos/multgestor/execucao-producao.md
- brain/MULTGESTOR-PLATFORM-SPECIFICATION.md -> projetos/multgestor/plataforma.md
- brain/constitution.md -> projetos/multgestor/constituicao.md
- brain/capabilities-map.md -> projetos/multgestor/capacidades.md
- brain/knowledge-dna.md -> projetos/multgestor/dna.md
- brain/knowledge-health.md -> projetos/multgestor/saude.md
- brain/knowledge-memory.md -> projetos/multgestor/memoria.md
- brain/KNOWLEDGE-GRAPH.md -> projetos/multgestor/grafo-conhecimento.md
- brain/KNOWLEDGE-OS.md -> projetos/multgestor/knowledge-os.md
- brain/context-confidence-engine.md -> projetos/multgestor/confianca-contexto.md
- brain/INDEX.md -> projetos/multgestor/INDEX.md
- brain/02-EXECUTIVE-DASHBOARD.md -> projetos/multgestor/painel-executivo.md
- brain/03-TIMELINE.md -> projetos/multgestor/historico/linha-do-tempo.md
- brain/technical/* -> projetos/multgestor/
- brain/maps/multgestor-core/* -> projetos/multgestor/mapas/
- brain/nichos/* -> projetos/multgestor/nichos/
- brain/living-os/* -> projetos/multgestor/living-os/
- brain/incidents/* -> projetos/multgestor/incidentes/
- brain/agents/* (MultGestor) -> projetos/multgestor/agentes/
- brain/roadmaps/* -> projetos/multgestor/roadmap.md
- brain/README.md -> _inbox/antigos/
- brain/00-HOME.md -> _inbox/antigos/

### Fase 3 — Areas transversais (brain/ -> areas/)
- brain/product/* -> areas/produto-roadmap/
- brain/strategy/* -> areas/produto-roadmap/
- brain/runbooks/* -> areas/operacao/
- brain/ops/* -> areas/operacao/
- brain/instrucoes-humanas/* -> areas/operacao/
- brain/security-secrets-rotation.md -> areas/seguranca/
- brain/commercial-readiness.md -> areas/produto-roadmap/
- brain/production-readiness.md -> areas/operacao/
- brain/source-of-truth.md -> areas/governanca/
- brain/lessons-learned.md -> _inbox/revisar/
- brain/lessons/* -> _inbox/revisar/

### Fase 4 — Auditorias
- audits/* (MultGestor) -> auditorias/multgestor/
- audits/* (joefelipe-agent) -> auditorias/joefelipe-agent/
- brain/audits/* (MultGestor) -> auditorias/multgestor/

### Fase 5 — Decisoes
- brain/decisions/* -> decisoes/
- brain/architecture-decisions.md -> decisoes/

### Fase 6 — Prompts
- prompts/frontend.md -> prompts/frontend/
- brain/prompts/* -> prompts/

### Fase 7 — JoeFelipe Agent
- agents/joefelipe-agent.md -> projetos/joefelipe-agent/agentes/
- brain/agents/joefelipe-personal-operating-agent.md -> projetos/joefelipe-agent/arquitetura.md
- brain/fase-10-llm-cost-safety.md -> projetos/joefelipe-agent/fases/
- brain/fase-11b1-e2e-foundation.md -> projetos/joefelipe-agent/fases/

### Fase 8 — Limpeza
- brain/constitution-knowledge-os.md -> _inbox/revisar/ (duplicata)
- brain/check-rls.js -> _inbox/revisar/
- brain/check-rls2.js -> _inbox/revisar/
- brain/ops/_tmp_smoke_b.js -> _inbox/revisar/
- brain/2026-06-26-audit-completo.md -> _inbox/revisar/
- archive/* -> _inbox/antigos/
- state/* -> _inbox/antigos/
- segundo cerebro/* -> _inbox/antigos/
- prompts.md (vazio) -> Apagar
- rules.md (vazio) -> Apagar

## Checklist pre-execucao
- [ ] Configuracao "Atualizar links internos automaticamente" ativada no Obsidian?
- [ ] Git working tree limpa ou staged antes de comecar?
- [ ] Leu todas as fases e entendeu os destinos?
- [ ] Identificou os arquivos congelados que nao podem ser movidos?

## Relatorio esperado
1. Pastas criadas (lista completa)
2. Arquivos movidos (tabela origem -> destino)
3. Wikilinks corrigidos (lista de alteracoes)
4. Links quebrados encontrados (se houver)
5. Status final

---

_Gerado por chatJoe em 2026-07-07 — Missao: reorganizar .opencodex_
