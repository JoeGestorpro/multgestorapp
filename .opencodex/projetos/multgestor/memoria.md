# 📚 Knowledge Memory — Memória do Conhecimento

> **Status:** OFICIAL • VIVO
> **Camada:** 7 — Memória
> **Propósito:** Registro evolutivo do conhecimento do MultGestor — lições, problemas recorrentes, padrões, anti-patterns, evolução do conhecimento.
> **Relacionamentos:** [[dna]] · [[saude]] · [[lessons-learned]] · [[incidents/README]] · [[linha-do-tempo]] · [[decisions/README]]

---

## Lições Aprendidas (Consolidadas)

Fonte primária: [[lessons-learned]]

| ID | Lição | Área | Data |
|---|---|---|---|
| L-01 | git clean apaga governança — proibido | Governança | 2026-06-04 |
| L-02 | Dois cérebros desconectados — fonte única necessária | Documentação | 2026-06-07 |
| L-03 | Eventos críticos na outbox | Eventos | 2026-06-07 |
| L-04 | Migração não pode dropar comportamento consumido | Migração | 2026-06-07 |
| L-05 | Hardcode sem validação | Eventos | 2026-06-07 |
| L-06 | Auditor automático subestima regra nova | Auditoria | 2026-06-07 |
| L-07 | BYPASSRLS inerte | Segurança | 2026-06-05 |
| L-08 | Formato único de evento | Eventos | 2026-06-07 |
| L-09 | Mocks escondem bug | Testes | 2026-06-07 |
| L-10 | Normalização defensiva | Backend | 2026-06-07 |
| L-93 | Migração manual em main | Deploy | 2026-06-23 |
| A-002 | Conexão direta essencial para dump estável | Backup | 2026-06-22 |

## Problemas Recorrentes

| Problema | Ocorrências | Padrão | Solução Proposta |
|---|---|---|---|
| Schema drift por migrations manuais | 3+ | Migração em prod via MCP sem CI | CI/CD obrigatório para migrations |
| Logs com dados sensíveis | 2 | Variáveis de contexto no log | Filter no logger |
| Acoplamento entre serviços | 2+ | Service chamando service diretamente | Event-driven + outbox |
| Documentação desatualizada | Recorrente | Missão termina sem atualizar brain | Mission Closing Protocol V3 |

## Padrões Identificados

| Padrão | Descrição | Onde Aplicar |
|---|---|---|
| **Company-first** | Toda operação começa com company_id | Todos os services |
| **Outbox + EventBus** | Eventos vão para outbox + in-memory publish | Todas as mutações |
| **Unit of Work** | Transação que coordena DB + eventos | Services que criam/alteram dados |
| **RLS em profundidade** | RLS no banco + validação na app | Toda nova tabela |
| **Rate limit em rotas públicas** | Proteção contra abuso | Toda rota pública |
| **Digital Twin** | Visão macro de cada módulo | Todo novo nicho/módulo |
| **Feature Genome** | DNA de cada funcionalidade | Toda nova funcionalidade complexa |

## Anti-Patterns

| Anti-Pattern | Problema | Alternativa |
|---|---|---|
| **BYPASSRLS** | Anula segurança do RLS | app_runtime role sem BYPASSRLS |
| **git add -A** | Inclui arquivos não intencionais | Stage seletivo (1:1) |
| **Migração manual em main** | Schema drift, perda de rastreabilidade | CI/CD + PR |
| **Duas fontes da verdade** | Informação divergente | `.opencodex/brain` como fonte única |
| **Mock que esconde bug** | Testes passam, produção quebra | Testes de integração reais |
| **Documentação só em conversas** | Conhecimento perdido | Knowledge OS |

## Evolução do Conhecimento

| Data | Marco | Descrição |
|---|---|---|
| 2026-06-07 | Brain V1 | Criação `.opencodex/brain/` com 8 documentos fundacionais |
| 2026-06-15 | Auditoria Fundamental | 24 seções auditadas, veredito APROVADO C/ BLOQUEIOS |
| 2026-06-19 | Auditoria Roadmap | Roadmap auditado, divergências corrigidas |
| 2026-06-22 | Backup validado | Backup B2 validado, P1 rebaixado |
| 2026-06-23 | Fase C fechada | Consolidação do Second Brain, D-015 criada |
| 2026-06-24 | Brain V2 | Product Brain, Technical Brain, Decision Center, Incident Library, Agents, Prompts, Ops, Knowledge Graph |
| 2026-06-24 | **Knowledge OS 3.0** | 7 camadas, Digital Twin, Feature Genome, Impact Graph, Simulation Center, AI Brain, Constitution |

## Histórico de Mudanças Importantes no Knowledge OS

| Data | Mudança | Impacto |
|---|---|---|
| 2026-06-24 | Novo INDEX.md por camadas | Navegação mais intuitiva |
| 2026-06-24 | Mission Closing Protocol V3 | 3 novos steps obrigatórios |
| 2026-06-24 | Constitution Knowledge OS | Governança formal do conhecimento |
| 2026-06-24 | Digital Twin | Visão macro de cada módulo |
| 2026-06-24 | Feature Genome | DNA de funcionalidades |
| 2026-06-24 | Impact Graph | Matriz de impacto entre áreas |
| 2026-06-24 | Simulation Center | Cenários "What If" |
| 2026-06-24 | AI Brain | Ecossistema de IA documentado |
| 2026-06-24 | Agent × Skill Matrix | Mapeamento completo |
| 2026-06-24 | Knowledge Health | Scorecards de conhecimento |
| 2026-06-24 | Knowledge DNA | Identidade do projeto |
| 2026-06-24 | Decision Graph | Grafo de decisões |

## Referências

- [[lessons-learned]] — Fonte primária de lições
- [[incidents/README]] — Biblioteca de incidentes
- [[linha-do-tempo]] — Timeline cronológica
- [[decisions/README]] — Decision Center
- [[dna]] — DNA do conhecimento
- [[saude]] — Saúde do conhecimento
- [[grafo-conhecimento]] — Grafo de conhecimento
