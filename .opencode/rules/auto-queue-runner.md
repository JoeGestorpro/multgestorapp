# 🤖 AUTO QUEUE RUNNER — Regra do OpenCode Executor

> Regra de governança do executor (Big Pickle). Define o comportamento OBRIGATÓRIO ao receber `/next-task`.

## Regra #1 — PREFLIGHT obrigatório antes de qualquer `/next-task`
Antes de ler/espelhar/executar a missão, o runner **DEVE** executar o protocolo
[`.opencodex/templates/preflight-check.md`](../../.opencodex/templates/preflight-check.md) na íntegra.

- Se **todas** as 5 checagens passarem → prosseguir normalmente.
- Se **qualquer** falhar → **ABORTAR**, imprimir o bloco de saída padrão (problema · risco · ação segura)
  e **parar**. Não executar a missão.

## Regra #2 — Nunca corrigir o ambiente automaticamente
O runner **NUNCA**: `git stash`, `git checkout`/troca de branch, `git clean`, criar branch sem autorização
humana, nem executar missão em branch errada. Em problema → pedir ação humana.

## Regra #3 — `git clean` é proibido enquanto houver governança untracked
Incidente 2026-06-04: `git clean` apagou `.opencodex/` (na época untracked) → divergência. Hoje `.opencodex/`
é **rastreada**, mas o runner **continua proibido** de rodar `git clean -fd`/`-x` (apagaria `docs/private/`,
`.opencode/command/` e qualquer governança nova ainda não commitada).

## Regra #4 — Fonte da verdade e namespace
- Fila/governança canônica: **`.opencodex/`** (rastreada no git).
- O runner lê **do disco** a partir da **branch correta** (CHECK 2). Se OpenCode e Claude divergem, a causa
  provável é branch/working-copy diferente ou `.opencodex/` não mergeada para a branch lida.

## Regra #5 — Disciplina de commit (espelha o card)
Stage **seletivo**: `git add` apenas dos arquivos da ALLOWLIST do `next-task.md`; conferir
`git diff --cached --name-only` 1:1 antes de commitar. Nunca `git add -A`/`.`.

## Regra #6 — Ciclo da missão
`/next-task` (preflight ✅ → `current-task.md` running) → implementar → `/complete-task`
(preencher `completed-task.md`) → se `EXECUTE_WITH_REVIEW`: `/audit-task` → devolver ao Claude Code para
**decisão final**. Só então o Claude promove a próxima do `backlog.md`.

## Regra #7 — Ambiente oficial: Windows + PowerShell
Todo comando operacional do runner é **compatível com PowerShell por padrão**. **PROIBIDO** `head`, `tail`,
`grep`, `sed`, `awk`, `xargs` (e similares Unix), **salvo** confirmação explícita de **Git Bash / WSL / Linux**.
Usar as equivalências da seção "Ambiente Oficial" do preflight (`head→Select-Object -First`,
`tail→Select-Object -Last`, `grep→Select-String`, `cat→Get-Content`, `rm -rf→Remove-Item -Recurse -Force`).
Card com comando Unix sem confirmação → traduzir para PowerShell ou **PARAR e reportar**.
