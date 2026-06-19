# 📋 Command Allowlist — MultGestor Autopilot Runner

> **Status:** FASE 0 — DOCUMENTAÇÃO INERTE (não executável)
> **Criado:** 2026-06-19 · **Modo:** PLAN_ONLY
> **Complementa:** [`autopilot-policy.md`](autopilot-policy.md). Em conflito, a policy e os freios humanos vencem.

---

## 0. O que este documento é

Especificação **inerte** da lista branca de comandos que uma futura camada de automação (Fases 1+) poderia executar, **por nível de automação**. É um contrato, não um script. Nenhum comando aqui é executado por este arquivo.

**Regras de ouro:**
1. **Fail-closed:** comando fora desta lista → `BLOCKED`. Nunca "executar mesmo assim".
2. **Sem shell arbitrário:** apenas comandos parametrizados desta lista — nada de `Invoke-Expression`, string-eval ou comando montado dinamicamente a partir de input não confiável.
3. **Ambiente oficial:** Windows + PowerShell. Proibido `head`/`tail`/`grep`/`sed`/`awk`/`xargs` salvo confirmação de Git Bash/WSL/Linux (regra do preflight). Usar as equivalências PowerShell.
4. **Allowlist é por nível:** um comando permitido em `AUTO_WITH_REVIEW` pode ser proibido em `AUTO_SAFE`.

---

## 1. `AUTO_SAFE` — leitura + validação determinística (sem mutar git/estado)

Comandos **read-only** ou que produzem artefatos descartáveis. Não alteram tracked files nem o estado do git.

| Comando | Uso | Observação |
|---|---|---|
| `git status --short` | preflight CHECK 1/5 | leitura |
| `git branch --show-current` | preflight CHECK 2 | leitura |
| `git diff` / `git diff --stat` / `git diff --cached --name-only` | inspeção de escopo | leitura |
| `git log --oneline -n <N>` | contexto | leitura |
| `git show --stat <hash>` | contexto | leitura |
| `Get-Content <path>` | ler card/estado | leitura |
| `Get-ChildItem <path>` | listar arquivos | leitura |
| `Select-String <pattern> <path>` | busca (equiv. grep) | leitura |
| `Get-FileHash -Algorithm SHA1\|SHA256 <path>` | verificação de integridade | leitura |
| `npm test` / `npm run test:integration` | validação | rede de testes; sem efeito em prod |
| `npm run lint` / `npm run build` | validação | artefato de build descartável |
| `curl`/`Invoke-WebRequest` **GET** em endpoints públicos | validação read-only (e2e GET) | **somente GET**; nunca POST/PUT/DELETE |

> ❌ Em `AUTO_SAFE`: nenhum `git add`/`commit`, nenhum write em tracked files, nenhum SQL de escrita, nenhum POST.

---

## 2. `AUTO_WITH_REVIEW` — executa em branch, PARA antes do commit

Tudo de `AUTO_SAFE` **mais** mutações locais reversíveis. **O commit/promote NÃO é automático** — para em `HUMAN_GATE` para revisão.

| Comando | Uso | Restrição |
|---|---|---|
| edição de arquivos da **ALLOWLIST do card** | implementar a missão | só caminhos listados no card |
| `git add <path-da-allowlist>` | stage **seletivo** | nunca `git add -A`/`.` |
| `git diff --cached --name-only` | conferência de escopo 1:1 | obrigatório antes de parar p/ revisão |
| `npm ci` / `npm install` (sem alterar lockfile sem allowlist) | preparar ambiente de teste | local |

> Após preparar o stage, o Autopilot **para** e emite `HUMAN_GATE`/`PASS-pending-review`. **Quem commita/aprova é o humano/Claude Code.** Promoção de fila nunca é automática.

---

## 3. `HUMAN_REQUIRED` — PROIBIDO ao Autopilot (sempre)

Nenhum destes pode ser executado automaticamente — em qualquer nível. Tentativa → `HUMAN_GATE` imediato.

```
git push            git merge           git rebase          git checkout / switch
git branch (criar)  git stash           git clean           git reset --hard
git commit (auto em AUTO_SAFE)          deploy / render / vercel CLI
qualquer SQL de escrita em produção     apply_migration / DDL em prod
criar bucket/cloud storage              ler/escrever secrets ou .env
Remove-Item recursivo fora de tmp/      Set-Content em .env / secrets
Invoke-Expression / eval de string      comando montado de input não confiável
```

---

## 4. `PLAN_ONLY` — somente leitura + escrita de documentação inerte

Apenas comandos de leitura (seção 1, subconjunto read-only) e escrita de arquivos `.md` de governança/documentação dentro da ALLOWLIST do card. Zero mutação de código, git-commit ou estado operacional.

---

## 5. Tabela-resumo de permissão por nível

| Categoria de comando | AUTO_SAFE | AUTO_WITH_REVIEW | HUMAN_REQUIRED | PLAN_ONLY |
|---|---|---|---|---|
| git read-only | ✅ | ✅ | ✅ | ✅ |
| testes/lint/build | ✅ | ✅ | — | — |
| GET público | ✅ | ✅ | — | — |
| editar arquivo da allowlist | ❌ | ✅ | ❌ | ✅ (só `.md` doc) |
| `git add` seletivo | ❌ | ✅ | ❌ | ❌ |
| `git commit` | ❌ | ❌ (humano) | ❌ | ❌ |
| push/merge/branch/clean/stash | ❌ | ❌ | ❌ | ❌ |
| prod / secrets / cloud / `.env` | ❌ | ❌ | ❌ | ❌ |
| promover fila (backlog→next) | ❌ | ❌ | ❌ | ❌ |

> **Toda célula `❌` é fail-closed:** na dúvida sobre classificar um comando, ele é proibido até decisão humana.
