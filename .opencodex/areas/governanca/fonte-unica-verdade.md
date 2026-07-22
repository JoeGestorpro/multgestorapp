# ðŸ“œ SOURCE OF TRUTH â€” Hierarquia de Autoridade (canÃ´nico)

> **Status:** âš ï¸ **PARCIALMENTE INEXEQUÃVEL â€” requer decisÃ£o humana** Â· **Criado:** 2026-06-07
> **Ãšltima verificaÃ§Ã£o factual:** 2026-07-16 (missÃ£o 12.1A, commit `4c8ce847`)
> Resolve o cisma identificado na auditoria do Segundo CÃ©rebro (2026-06-07).

---

## âš ï¸ REGISTRO FACTUAL 2026-07-16 â€” a cadeia de autoridade aponta para arquivos inexistentes

VerificaÃ§Ã£o executada em `4c8ce847` (`find .opencodex/brain -type f`): **`.opencodex/brain/` contÃ©m apenas** `fila-de-implementacao.md`, `plans/PLANO-IA-OPERACIONAL-NICHOS.md` e `plans/push-p0-batch-plano.md`.

**Todos os seis arquivos citados como fonte canÃ´nica neste documento estÃ£o AUSENTES:**

| Referenciado | Existe? |
|---|---|
| `brain/constitution.md` | âŒ **AUSENTE** â€” e Ã© declarado **autoridade vinculante** pelo `CLAUDE.md`, carregado em toda sessÃ£o |
| `brain/project-state.md` | âŒ AUSENTE |
| `brain/capabilities-map.md` | âŒ AUSENTE |
| `brain/architecture-decisions.md` | âŒ AUSENTE |
| `brain/implementation-log.md` | âŒ AUSENTE |
| `brain/lessons-learned.md` | âŒ AUSENTE |

**ConsequÃªncia:** a "PrecedÃªncia em caso de conflito" declarada abaixo Ã© hoje **inexequÃ­vel** â€” os trÃªs primeiros nÃ­veis da cadeia nÃ£o existem. Na prÃ¡tica **nÃ£o hÃ¡ Ã¡rbitro resolvÃ­vel** para conflito de governanÃ§a.

**Substitutos existentes (candidatos, NÃƒO promovidos por esta missÃ£o):**
- `.opencodex/projetos/multgestor/constituicao.md` (constituiÃ§Ã£o do produto)
- `.opencodex/rules/constitution-knowledge-os.md` (nÃ£o revisado)
- `.opencodex/projetos/multgestor/status-atual.md` (estado vivo) â€” âš ï¸ com divergÃªncias registradas (D-06, D-07 da matriz)
- `.opencodex/projetos/multgestor/capacidades.md` (mapa de capacidades) â€” âš ï¸ com divergÃªncias D-02, D-03, D-04

**DecisÃ£o de substituiÃ§Ã£o:** â›” **NÃƒO TOMADA.** Eleger a autoridade mÃ¡xima de governanÃ§a Ã© decisÃ£o humana e estÃ¡ **fora do escopo** da missÃ£o 12.1A (que Ã© READ_ONLY e documental). Este bloco registra o fato; nÃ£o o resolve.

**AÃ§Ã£o requerida (humano):** escolher entre (a) promover `constituicao.md` a autoridade e corrigir o `CLAUDE.md`; (b) (re)criar `brain/constitution.md`; ou (c) promover `rules/constitution-knowledge-os.md`. Registrar a escolha como ADR.

> **Autoridade sobre o estado do Core:** enquanto a cadeia acima estiver quebrada, a fonte factual do **estado de consolidaÃ§Ã£o do Core** Ã© [[../../projetos/multgestor/matriz-consolidacao-core]] (missÃ£o 12.1A, ancorada em `4c8ce847`, com limitaÃ§Ãµes declaradas no ANEXO B).

---

## DeclaraÃ§Ã£o oficial

> âš ï¸ **A declaraÃ§Ã£o abaixo Ã© de 2026-06-07 e permanece registrada como intenÃ§Ã£o original.** Os itens 1, 6 e 7 dependem de arquivos que nÃ£o existem (ver Registro Factual acima). NÃ£o tratar como executÃ¡vel atÃ© a decisÃ£o humana.

1. **`.opencodex/brain/` Ã© o Segundo CÃ©rebro oficial** â€” fonte Ãºnica da verdade estratÃ©gica e de estado.
2. **`.agent/` Ã© biblioteca histÃ³rica**, NÃƒO autoridade operacional. Preservada e indexada em [`archive-index/agent-archive-index.md`](archive-index/agent-archive-index.md). Nenhuma decisÃ£o atual deve se basear nela sem revalidaÃ§Ã£o.
3. **`.opencodex/queue/`** continua sendo a **fila operacional** (next-task, current-task, completed-task, backlog).
4. **`.opencodex/rules/`** continua sendo a **governanÃ§a executÃ¡vel** (preflight, auditor-flow, event-contracts). O brain referencia; nÃ£o duplica.
5. **`docs/`** continua sendo **documentaÃ§Ã£o de produto/arquitetura**. DecisÃµes **operacionais** novas devem ser refletidas no brain (`architecture-decisions.md`, `capabilities-map.md`); `docs/` pode aprofundar, mas o brain Ã© o Ã­ndice canÃ´nico.
6. **Nenhuma missÃ£o pode iniciar sem consultar o brain** (CHECK 0 â€” Context Confidence).
7. **Nenhuma missÃ£o pode fechar sem atualizar o brain** quando houver mudanÃ§a relevante (Loop de Fechamento â€” `auditor-flow`).

## Mapa de autoridade por tipo de pergunta

> âš ï¸ Coluna "Existe?" verificada em 2026-07-16 (`4c8ce847`). Onde ausente, a coluna "Substituto factual" indica o que **de fato** responde a pergunta hoje â€” sem promover nada a autoridade (decisÃ£o humana pendente).

| Pergunta | Fonte declarada (2026-06-07) | Existe? | Substituto factual (2026-07-16) |
|---|---|---|---|
| "Qual o estado atual? branch? main?" | `brain/project-state.md` | âŒ | `git` â€” **verificar por comando** (`status-atual.md` divergiu: D-06/D-07) |
| "Posso fazer X? qual a regra?" | `brain/constitution.md` + `.opencodex/rules/` | âŒ / âœ… | `CLAUDE.md` + `.opencodex/rules/` + `projetos/multgestor/constituicao.md` â€” âš ï¸ **sem Ã¡rbitro eleito** |
| "Que capability faz Y? existe?" | `brain/capabilities-map.md` | âŒ | [[../../projetos/multgestor/matriz-consolidacao-core]] (factual) Â· `capacidades.md` (âš ï¸ D-02/03/04) |
| "Por que foi decidido Z?" | `brain/architecture-decisions.md` | âŒ | `.opencodex/decisoes/` (sÃ©rie `D-0XX`) |
| "O que jÃ¡ foi implementado?" | `brain/implementation-log.md` | âŒ | `projetos/multgestor/historico/implementacao-log.md` + `git log` |
| "Que erro nÃ£o posso repetir?" | `brain/lessons-learned.md` | âŒ | `projetos/multgestor/incidentes/` |
| "Qual o estado de consolidaÃ§Ã£o do Core?" | â€” | â€” | âœ… [[../../projetos/multgestor/matriz-consolidacao-core]] |
| "O que executar agora?" | `.opencodex/queue/next-task.md` | âœ… | mantido |
| "Como audito/promovo?" | `.opencodex/rules/auditor-flow.md` | âœ… | mantido |

## PrecedÃªncia em caso de conflito

> âš ï¸ **CADEIA QUEBRADA â€” os 3 primeiros nÃ­veis nÃ£o existem** (verificado 2026-07-16).

**Declarada (2026-06-07, inexequÃ­vel):**
`brain/constitution.md` > `brain/architecture-decisions.md` > `.opencodex/rules/` > `brain/project-state.md` > `docs/` > `.agent/`

**PraticÃ¡vel hoje (descritivo, NÃƒO promovido a norma):**
`CLAUDE.md` + `.opencodex/rules/` > `.opencodex/decisoes/` > **matriz de consolidaÃ§Ã£o (para estado do Core)** > demais documentos de `projetos/multgestor/` > `docs/` > `.agent/` (histÃ³rico).

**Regra que vale independentemente da cadeia:** onde documento e cÃ³digo discordarem, **o cÃ³digo Ã© o estado real**. As 7 divergÃªncias do ANEXO E da matriz mostram que a documentaÃ§Ã£o canÃ´nica errou **nos dois sentidos** â€” otimista e pessimista. Verificar por comando, nunca por leitura.

> Se `.agent/` contradiz o brain, **o brain prevalece** â€” o `.agent/` reflete o estado atÃ© 2026-06-04.
