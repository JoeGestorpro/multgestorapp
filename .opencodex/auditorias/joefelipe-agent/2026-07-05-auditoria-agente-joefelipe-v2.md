# Auditoria — Agente JoeFelipe (V2: Kernel + LLM Core + Mission Builder + Events)

**Data:** 2026-07-05
**Modo:** READ_ONLY (nenhuma escrita fora deste relatório; nenhum commit; nenhum push)
**Escopo:** `tools/joefelipe-agent/` — não cobre produção/RLS/backend do MultGestor (fora do escopo desta ferramenta local)
**Auditor:** Claude Code, análise local com execução de `tsc`, `npm test` e reprodução isolada de bugs
**Referência anterior:** [`AUDITORIA-AGENTE-JOEFELIPE-V1-LLM-CORE-2026-06-19.md`](../brain/audits/AUDITORIA-AGENTE-JOEFELIPE-V1-LLM-CORE-2026-06-19.md) — recomendava "Fase 1: LLM Core Mock" como próximo passo seguro.

---

## 1. Resumo executivo

| Item | Estado |
| --- | --- |
| Build (`tsc --noEmit`) | 🔴 **crítico** — falha com 3 erros de tipo |
| Testes (`npm test`) | 🟡 **parcial** — 39/40 passam isoladamente, mas o runner trava (sintoma do achado A-001) |
| LLM Core (mock + OpenRouter) | 🟢 saudável, bem testado (9 testes unitários no OpenRouterProvider) |
| Kernel/Permissions | 🟡 **parcial** — matriz de permissões existe mas não é aplicada nas chamadas de LLM |
| Servidor HTTP local (`:3333`) | 🔴 **crítico** — rotas de escrita sem proteção, escuta em todas as interfaces |
| Runtime (`runtime/events.jsonl`) | 🔴 **crítico** — 4,5 GB / 30 milhões de linhas, sem rotação, recarregado inteiro a cada request |
| Governança/segredos | 🟢 saudável — `.env`/`.env.*` ignorados, chave nunca aparece em erro (testado) |
| Pronto para próxima fase? | **Não sem corrigir os P0 primeiro** |

O agente evoluiu muito além da recomendação da auditoria de 19/06 (que pedia só "Fase 1: LLM Core Mock"). Hoje já existem: Kernel completo (Permissions/Registry/Lifecycle/EventBus/AgentContext), LLM Core com MockProvider **e** OpenRouterProvider real (com retry, timeout, sanitização e testes), Mission Builder (classificação de risco determinística + escopo), GoalPlanner com estratégia LLM e fallback por regras, e um pipeline de eventos operacionais (EventStore/EventClassifier/EventConsumer). Isso é uma quantidade grande de escopo entregue (Fases 1–3 do roadmap anterior, essencialmente).

O problema não é a arquitetura — é que **o projeto não fecha os próprios gates que ele mesmo definiu como critério de aceite** ("`npm run build` passa sem erros", "modo READ_ONLY não executa nada real") e tem **um bug de recurso não limitado que já derrubou a própria ferramenta** (arquivo de eventos de 4,5 GB, recarregado do disco inteiro, de forma síncrona, a cada requisição HTTP).

---

## 2. O que mudou desde 19/06 (evidência: `git diff --stat` + arquivos novos)

```
tools/joefelipe-agent/package.json          |   4 +-
tools/joefelipe-agent/src/index.ts          | 453 +++++++++++++++++++++++-----
tools/joefelipe-agent/src/llm/LlmEngine.ts  |  69 ++++-
tools/joefelipe-agent/src/llm/llm-config.ts |  35 ++-
tools/joefelipe-agent/src/server.ts         | 234 ++++++++++++--
tools/joefelipe-agent/src/state.ts          |  44 +--
tools/joefelipe-agent/src/types.ts          |   7 +-
tools/joefelipe-agent/src/watcher.ts        |   9 +-
```

Diretórios inteiramente novos (não versionados ainda, `git status` = `??`... na verdade já staged/modified conforme diff acima, mas os módulos abaixo são novos arquivos dentro da árvore já rastreada):

- `src/kernel/` — Kernel, Permissions, Registry, EventBus, Lifecycle, AgentContext, types (7 arquivos)
- `src/llm/` — LlmEngine, LlmProvider, llm-config, DriverManager, DriverRegistry, sensitive.ts, providers/MockProvider, providers/OpenRouterProvider (+ 2 arquivos de teste)
- `src/mission/` — MissionBuilder, classify, scope, templates, render, mission-types (+ 3 arquivos de teste)
- `src/planner/` — GoalPlanner, PlanStore, QueueManager, PlanningStrategy, RuleBasedPlanningStrategy, LLMPlanningStrategy (+ 1 teste)
- `src/events/` — EventStore, EventClassifier, EventConsumer, types (+ 1 teste)

Isso corresponde a **muito mais que "Fase 1"** — na prática entrega Fases 1, 2 e parte da 3/6 do roadmap da auditoria anterior (LLM Core, Mission Builder, Governance/Kernel, e um pipeline de eventos que não estava nem no roadmap original).

---

## 3. Achados verificados (evidência real, não opinião)

| ID | Severidade | Área | Achado | Status |
| --- | --- | --- | --- | --- |
| B-001 | **P0** | Runtime/Recursos | `runtime/events.jsonl` = 4,5 GB / 30.012.393 linhas; `EventStore` lê e faz `JSON.parse` do arquivo **inteiro** de forma síncrona no construtor, e é reconstruído a **cada request HTTP** e a cada `buildState()` | aberto |
| B-002 | **P0** | Build | `tsc --noEmit` falha: `EventConsumer.ts:81` chama `this.llm.execute(...)`, método que não existe em `LlmEngine` (só existe `complete()`) | aberto |
| B-003 | P1 | Kernel/Segurança | `LlmEngine.complete()` nunca consulta `kernel.permissions.check()` — o modo do Kernel (READ_ONLY/PLAN_ONLY/...) exibido e alterável no painel **não tem nenhum efeito real** sobre se uma chamada externa (paga) ao OpenRouter acontece | aberto |
| B-004 | P1 | Servidor HTTP | `server.listen(port, ...)` sem `host` — escuta em todas as interfaces de rede, não só `127.0.0.1`. `POST /api/kernel/mode`, `POST /api/events/ingest`, `POST /api/events/process` não têm autenticação nem rate limit | aberto |
| B-005 | P1 | Build (tipos) | `server.ts:70-71` — `/api/kernel/mode` passa `string` onde o tipo exige `KernelMode`; guard em runtime existe (`.includes()`) mas o `tsc` não reconhece o narrowing | aberto |
| B-006 | P2 | Testes | `npm test` reporta 1 suíte falha (`MissionBuilder.test.ts`) sem nenhum teste individual rodar — é sintoma de B-001 (o teste chama `buildMission` → `buildState` → `new EventStore`), mascarado como "teste lento/flaky" | aberto |
| B-007 | P3 | LLM/Segurança | `detectSensitive()`/`SENSITIVE_RULES` é uma lista fixa de regex por palavra (push/deploy/delete/drop/...) aplicada só ao `task`; fácil de contornar (sinônimo, outro idioma, fragmentação da palavra) — hoje inofensivo porque `context` não é enviado à API externa, mas é a única barreira caso isso mude | aberto |
| B-008 | P3 | Documentação | Não existe `.env.example` para `JOEFELIPE_LLM_PROVIDER` / `JOEFELIPE_OPENROUTER_API_KEY` / `JOEFELIPE_OPENROUTER_MODEL`, apesar do `.gitignore` já prever `!.env.example` | aberto |

### Evidência de B-001 (crítico — causa raiz de B-006)

```
$ ls -la tools/joefelipe-agent/runtime
-rw-r--r-- 1 Joefe 197609 4801769106 Jul  5 00:27 events.jsonl
$ wc -l events.jsonl
30012393 events.jsonl
```

Reprodução isolada (script mínimo, timeout de 15-20s):
```
findRepoRoot        20ms
collectSources       43ms
getGitInfo          634ms
new EventStore(root)   >20000ms (nunca retornou — processo morto por timeout)
```

`EventStore.loadIndex()` (`src/events/EventStore.ts:21-36`) faz `readFileSync` do arquivo inteiro + `split("\n")` + `JSON.parse` linha a linha para um `Map` em memória, **sem limite de tamanho, sem paginação, sem leitura incremental**. Como `server.ts` cria `new EventStore(root)` dentro do handler de **toda** requisição HTTP (linha 20), e `state.ts`/`buildState()` também cria um `EventStore` a cada chamada, isso significa que o painel local (`http://localhost:3333`) e todo comando `status`/`mission`/`morning` ficam, na prática, **inutilizáveis** hoje — cada chamada tenta carregar 4,5 GB na memória do processo Node antes de responder.

Não há rotação, cap de linhas, nem truncamento em `EventStore.save()` (`appendFileSync` puro) — o arquivo só cresce. Isso também é risco de:
- Estourar memória do processo Node (OOM) quando o `Map` de 30M+ entradas for efetivamente montado.
- Encher o disco local (4,5 GB só desse arquivo, dentro de uma pasta com git status "sujo" que nem aparece no `git status` porque está no `.gitignore` — ou seja, **invisível para quem só olha `git status`**).

### Evidência de B-002/B-005 (build quebrado)

```
$ npm run build
src/events/EventConsumer.ts(81,35): error TS2339: Property 'execute' does not exist on type 'LlmEngine'.
src/server.ts(70,40): error TS2345: Argument of type 'string' is not assignable to parameter of type 'KernelMode'.
src/server.ts(71,36): error TS2345: Argument of type 'string' is not assignable to parameter of type 'KernelMode'.
```

Consequência prática de B-002: `EventConsumer.analyzeWithLlm()` (`src/events/EventConsumer.ts:69-93`) — a análise de eventos "com IA" — **nunca funciona**. Toda chamada lança `TypeError: this.llm.execute is not a function`, capturada pelo `try/catch` em `analyze()` (linha 57), que cai silenciosamente no `analyzeFallback()` baseado em regras. A feature está morta desde que foi escrita; os testes de `EventConsumer` passam porque testam só o fallback, nunca o caminho "com LLM real".

### Evidência de B-003/B-004 (permissões decorativas + rotas sem proteção)

- `LlmEngine.complete()` (`src/llm/LlmEngine.ts:70-90`): chama direto `this.manager.selectProvider()` → `provider.complete(request)`. Nenhuma chamada a `kernel.permissions.check(...)`.
- `DriverManager.selectProvider()` usa `this.config.activeProvider`, que vem de `loadLlmConfig()` — **fixado por variável de ambiente no boot do processo**, não pelo modo do Kernel.
- `PermissionManager`/`MODE_ACTION_MATRIX` (`src/kernel/Permissions.ts`) definem corretamente que `READ_ONLY` não deveria permitir `execute:llm` — mas nada no código chama esse `check()` antes de uma chamada de LLM.
- Ou seja: o seletor de modo no painel HTML (`<select id="modeSelect">`, botão "Alterar" → `POST /api/kernel/mode`) **muda só um rótulo visual** hoje. Isso contradiz a regra de segurança documentada na auditoria de 19/06 ("Modo padrão = READ_ONLY: a LLM opera dentro do modo atual do agente; se for READ_ONLY, só explica").
- `server.listen(port, () => {})` sem host: por padrão do Node, escuta em `0.0.0.0`/`::` (todas as interfaces), não só `localhost`. Combinado com zero autenticação em `POST /api/kernel/mode`, `POST /api/events/ingest` e `POST /api/events/process`, isso significa: **qualquer dispositivo na mesma rede** consegue mudar o modo do agente e/ou injetar eventos arbitrários e disparar processamento (que, uma vez corrigido B-002, chamaria a API paga da OpenRouter sem nenhum controle de custo, rate limit ou autenticação).

> Isso é exatamente o tipo de gap que a regra fixa do projeto (`CLAUDE.md` → "Proteção de rotas e controle de abuso") manda tratar antes de considerar uma rota pronta: **pode gerar abuso? gera custo? precisa rate limit? precisa limite por tenant/usuário?** Nenhuma das 3 rotas POST respondeu a essas 4 perguntas.

### O que está bem feito (não é só achado negativo)

- `OpenRouterProvider` tem 9 testes unitários passando cobrindo exatamente os pontos certos: bloqueio de termo sensível antes de chamar a API, erro HTTP sem retry indevido, timeout com erro específico, retry após falha transiente, **chave de API nunca aparece na mensagem de erro**, `canExecute` sempre `false`.
- `.env`/`.env.*` corretamente ignorados pelo git; nenhuma chave encontrada em código, commit ou markdown.
- `mission/scope.ts` fixa corretamente uma lista `ALWAYS_FORBIDDEN` (secrets, `.env`, `.opencodex/queue`, banco, migrations, RLS, deploy, push, merge) que não pode ser removida por hint externo — testado em `scope.test.ts`.
- `classify.ts` tem uma precedência determinística sólida (READ_ONLY < PLAN_ONLY < SAFE_WRITE < HUMAN_GATED < DANGEROUS) com teste explícito de "over-lock" (prefere errar para o lado seguro).

---

## 4. Plano de ação por prioridade

**Agora (antes de qualquer outra evolução do agente):**
1. Truncar/arquivar `runtime/events.jsonl` (mover para backup local e começar um arquivo novo) — ação local, não mexe em git nem produção.
2. Corrigir `EventStore` para nunca fazer `readFileSync` do arquivo inteiro em toda construção — ler de forma incremental (tail) ou limitar por tamanho/linhas, e adicionar rotação/cap em `save()`.
3. Corrigir `EventConsumer.ts:81` (`execute` → `complete`, com a assinatura correta de `LlmRequest`).
4. Corrigir os tipos de `server.ts:70-71` (`KernelMode` em vez de `string` solto) para `npm run build` voltar a passar limpo.
5. Decidir e implementar: `kernel.permissions.check('execute','llm')` deve ser consultado dentro de `LlmEngine.complete()` (ou o modo do Kernel deve alimentar `DriverManager`), senão o seletor de modo no painel é enganoso.
6. Adicionar autenticação mínima (token local) ou, no mínimo, `server.listen(port, "127.0.0.1", ...)` para não expor as rotas de escrita à rede local — e responder as 4 perguntas de proteção de rota do `CLAUDE.md` para `/api/kernel/mode`, `/api/events/ingest` e `/api/events/process`.

**Depois:**
- Reativar e validar de fato o caminho "análise de evento com LLM real" (hoje morto por B-002) com um teste que force o provider real (ou um double) e confirme que `EventAnalysis` vem do LLM, não do fallback.
- Adicionar `.env.example` documentando as variáveis `JOEFELIPE_LLM_*`.

**Futuro:**
- Se a intenção é mesmo permitir controle remoto do agente (outro device na rede), desenhar autenticação de verdade em vez de bloquear só por IP; caso contrário, deixar explícito que o agente é single-machine e fechar a escuta em loopback.
- Revisar `detectSensitive()` para cobrir `context` também, não só `task`, antes de qualquer provider futuro que decida serializar contexto na chamada externa.

---

## 5. Missões recomendadas (executáveis)

```
1. joefelipe-agent/fix-eventstore-unbounded-growth   (P0 — truncar arquivo + rotação/cap + leitura incremental)
2. joefelipe-agent/fix-build-type-errors              (P0 — EventConsumer.execute→complete; KernelMode em server.ts)
3. joefelipe-agent/wire-kernel-permissions-into-llm    (P1 — LlmEngine.complete() deve respeitar kernel.permissions)
4. joefelipe-agent/harden-local-http-server            (P1 — bind 127.0.0.1 + auth mínima nas rotas POST + avaliação de rate limit)
5. joefelipe-agent/add-env-example                     (P3 — documentar JOEFELIPE_LLM_* / JOEFELIPE_OPENROUTER_*)
```

---

## 6. Veredito

**VEREDITO: BLOQUEADO até corrigir os P0 (B-001, B-002).**

O agente não deve seguir para novas fases (execução controlada, mais integrações) enquanto:
- o próprio `npm run build` não passar limpo, e
- o arquivo de eventos continuar crescendo sem limite e travando o próprio painel/CLI que deveria estar ajudando o dono do projeto no dia a dia.

Nenhum dos achados envolve produção, banco ou dados de clientes — é tudo local, e o `.gitignore` já protege segredos e o `runtime/`. O risco é **operacional para o próprio JoeFelipe** (ferramenta que deveria ajudar virou uma ferramenta que trava sozinha) e **de exposição de rede local** (B-004), não de vazamento de dados de produção.

Depois de corrigir B-001/B-002 (rápido, mecânico) e decidir conscientemente sobre B-003/B-004 (arquitetural — precisa de uma decisão humana sobre "o painel deve ser acessível de outros dispositivos na rede ou não"), o agente está em boa forma para continuar evoluindo — o trabalho de Mission Builder, Kernel e Planner é sólido e bem testado onde foi testado.
