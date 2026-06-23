# 🛡️ PREFLIGHT CHECK — Protocolo obrigatório antes de `/next-task`

> **Quem executa:** o OpenCode Executor (Big Pickle), ANTES de espelhar `next-task.md` → `current-task.md`
> e antes de criar qualquer branch. Origem do incidente que motivou esta regra: 2026-06-04, um `git clean`
> apagou a `.opencodex/` untracked → divergência Claude Code ↔ OpenCode.
>
> **Princípio:** falha em QUALQUER checagem = **ABORTAR** antes de executar. Explicar (o quê / por que é
> perigoso / ação segura). **NUNCA** corrigir automaticamente.

---

## 🪟 AMBIENTE OFICIAL — Windows + PowerShell (regra permanente, OBRIGATÓRIA)

> Estabelecida em 2026-06-04. Vale para **todo** prompt, `next-task`, auditoria e comando operacional
> destinado ao OpenCode. É parte do preflight: **antes de executar qualquer `next-task`, confirmar o shell**.

- **Shell padrão = PowerShell (Windows).** Todo comando operacional deve ser **compatível com PowerShell por padrão**.
- **PROIBIDO** usar comandos Unix/Linux — `head`, `tail`, `grep`, `sed`, `awk`, `xargs` (e similares) —
  **salvo** quando o executor **confirmar explicitamente** que está em **Git Bash, WSL ou Linux**.
- Se um card/missão trouxer comandos Unix sem essa confirmação → **traduzir para PowerShell** ou **PARAR e reportar**.

### Equivalências PowerShell (referência canônica)
| Unix | PowerShell |
|------|------------|
| `head -n N` | `Select-Object -First N` |
| `tail -n N` | `Select-Object -Last N` |
| `grep "x"` | `Select-String "x"` |
| `cat arquivo` | `Get-Content arquivo` |
| `rm -rf caminho` | `Remove-Item -Recurse -Force caminho` |

> Demais: `which` → `(Get-Command nome).Source` · `ls` → `Get-ChildItem` · `2>/dev/null` → `2>$null` ·
> variáveis `$VAR` → `$env:VAR`. Pipeline `|` existe, mas passa **objetos**, não texto.

---

## Regras invioláveis (o runner NUNCA faz automaticamente)
- ❌ NUNCA `git stash`.
- ❌ NUNCA `git checkout`/troca de branch.
- ❌ NUNCA `git clean` (com governança untracked, NUNCA mesmo).
- ❌ NUNCA criar branch sem autorização humana explícita.
- ❌ NUNCA executar missão em branch errada.
- ✅ Em caso de problema: **PARAR** e pedir ação humana.

---

## CHECK 0 — CONTEXT CONFIDENCE (obrigatório, ANTES de tudo)

> Estabelecido pelo Segundo Cérebro V3 (`.opencodex/brain/`). Roda **antes** dos checks 1–5.
> Objetivo: nenhuma missão inicia sem contexto suficiente (evita drift/regressão).

Obrigatório, nesta ordem:
1. Ler [`.opencodex/brain/source-of-truth.md`](../brain/source-of-truth.md) — hierarquia de autoridade.
2. Ler [`.opencodex/brain/project-state.md`](../brain/project-state.md) — estado atual real.
3. Ler [`.opencodex/brain/capabilities-map.md`](../brain/capabilities-map.md) — o que já existe.
4. Ler as **regras aplicáveis** (`.opencodex/rules/` + `constitution.md`; se tocar eventos → `event-contracts.md`).
5. **Pesquisar o workspace** (grep/leitura dos arquivos reais do escopo).
6. Gerar o **CONTEXT CONFIDENCE REPORT** ([`brain/context-confidence-engine.md`](../brain/context-confidence-engine.md)).

Decisão por score:
- **< 70** → ⛔ **IMPLEMENTAÇÃO PROIBIDA** — PARAR e perguntar ao humano.
- **70–79** → 🟠 apenas investigação (não implementar).
- **≥ 80** → permitir planejamento (execução com riscos declarados).
- **≥ 95** → execução normal.

> Se `brain/project-state.md` estiver **desatualizado** (ex.: `origin_main` ≠ hash real de `main`), o item 3 não pode ser marcado ✅ → o score cai → trava a missão até a memória ser corrigida.

---

## As 5 checagens bloqueantes (rodam APÓS o CHECK 0)

### CHECK 1 — Working tree limpo (de CÓDIGO)
```bash
git status --short -- . ':(exclude).opencodex/' ':(exclude)docs/private/'
```
- **Bloqueia se** houver QUALQUER saída (arquivos modificados/untracked **fora** de `.opencodex/` e `docs/private/`).
- **Por que é perigoso:** trabalho não-commitado contamina o commit da missão (scope drift — foi o que
  aconteceu no B3). A missão deve começar de um tree limpo de código.
- **Ação segura:** humano commita/reverte o trabalho pendente OU explica por que pode coexistir. NÃO stashear.
- **Exceções (não bloqueiam):** `.opencodex/**` (governança, muda no fluxo) e `docs/private/**`
  (privado — nunca bloqueia, **mas nunca entra em commit**).

### CHECK 2 — Branch combina com a missão
```bash
git branch --show-current
# Derivar a branch esperada do task_id do next-task.md:
#   task_id: fase1-b1b-gate-poolconnect-tenant-context
#   → branch sugerida no card (campo "criar branch"): fase1/b1b-gate-poolconnect
```
- **Bloqueia se** a branch atual ≠ branch esperada da missão (definida nas "Instruções para o OpenCode
  Executor" do `next-task.md`, passo "criar branch `...`").
- **Por que é perigoso:** executar na branch errada mistura a missão com outro trabalho / commita no lugar errado.
- **Ação segura:** humano cria/entra na branch esperada **manualmente** (o runner NÃO troca/cria branch sozinho).

### CHECK 3 — `next-task.md` é uma missão válida
```bash
test -f .opencodex/queue/next-task.md
grep -q "^status: pending" .opencodex/queue/next-task.md
grep -q "^task_id: .\+"      .opencodex/queue/next-task.md
grep -q "^title: .\+"        .opencodex/queue/next-task.md
grep -q "ALLOWLIST"          .opencodex/queue/next-task.md
grep -qi "Critérios de aceite" .opencodex/queue/next-task.md
```
- **Bloqueia se** o arquivo não existir, ou `status: empty`, ou faltar `task_id`, `title`, **ALLOWLIST** ou
  **Critérios de aceite**.
- **Por que é perigoso:** sem allowlist/critérios, o executor improvisa escopo (causa de drift e de missões
  ambíguas). `status: empty` significa que não há missão — executar seria inventar trabalho.
- **Ação segura:** aguardar o Claude Code gravar uma missão completa em `next-task.md`.

### CHECK 4 — Não há missão em andamento
```bash
grep -E "^status: (running|claimed)" .opencodex/queue/current-task.md
# E o ciclo anterior deve estar fechado:
grep -E "^status: (audited)" .opencodex/queue/completed-task.md   # ou awaiting-audit/awaiting-decision = PENDENTE
```
- **Bloqueia se** `current-task.md` estiver `running`/`claimed`, OU se o ciclo anterior estiver
  `awaiting-audit`/`awaiting-decision` (auditoria/decisão do Claude pendente).
- **Por que é perigoso:** iniciar nova missão por cima de uma em andamento corrompe a regra
  uma-missão-por-vez e perde rastreabilidade.
- **Ação segura:** terminar `/complete-task` + `/audit-task` da missão atual e aguardar a decisão do Claude Code.

### CHECK 5 — Untracked fora de áreas permitidas
```bash
git status --short | grep '^??' | grep -vE '^\?\? (\.opencodex/|docs/private/)'
```
- **Bloqueia se** houver untracked **fora** de `.opencodex/` e `docs/private/`.
- **Por que é perigoso:** arquivos órfãos podem entrar no commit da missão (drift) ou ser apagados por um
  `git clean` futuro. `docs/private/` é tolerado mas **nunca deve ser commitado**.
- **Ação segura:** humano decide rastrear, ignorar (`.gitignore`) ou remover manualmente.

### CHECK 6 — Abuso / Custo (missões de nova rota/feature)
> Estabelecido pela diretriz de Proteção de Rotas (`../brain/constitution.md` §7 + `../rules/route-protection-abuse-control.md`).

- **Bloqueia se** a missão cria/altera rota ou funcionalidade **exposta** e o card de `next-task.md` **não** traz a seção
  "Avaliação de Abuso/Custo" nos Critérios de Aceite, respondendo: **(1) pode gerar abuso? (2) gera custo? (3) precisa de
  rate limit? (4) precisa de limite por tenant/usuário?** — com a proteção aplicada ou a isenção justificada por escrito.
- **Por que é perigoso:** rota sem teto = vetor de abuso/custo (ex.: `POST /public/:slug/appointments` hoje sem limite).
- **Ação segura:** Claude Code completa a "Avaliação de Abuso/Custo" no card **antes** de promover a missão.

---

## Resultado do preflight
- **CHECK 0 (score ≥ 95) + TODAS as 5 + CHECK 6 (quando aplicável) passaram** → ✅ permitir `/next-task` (espelhar `current-task.md` `running`, criar branch
  conforme o card, executar).
- **CHECK 0 entre 80–94** → planejar com riscos declarados; **70–79** só investigação; **< 70** → ⛔ PARAR e perguntar.
- **QUALQUER um (CHECK 0 ou 1–5) falhou** → ⛔ ABORTAR. Imprimir, para cada falha: **qual problema · por que é perigoso · ação
  segura recomendada**. Não executar nada. Não mexer no git.

## Bloco de saída padrão (quando aborta)
```
⛔ PREFLIGHT FALHOU — execução abortada.
- CHECK <n>: <problema encontrado>
  Risco: <por que é perigoso>
  Ação segura: <o que o humano deve fazer> (o runner NÃO faz isso sozinho)
Repita /next-task após corrigir manualmente.
```
