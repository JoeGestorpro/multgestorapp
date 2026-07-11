# AUDITORIA-00 — Estado Inicial da Bancada Git

> **Data:** 2026-07-11
> **Fase:** 0 — Congelamento e inventário (modo leitura)
> **Plano:** `.opencode/plans/PLANO-ORGANIZACAO-BANCADA-GIT.md`

---

## 1. Ponteiros principais

| Referência | Hash |
|------------|------|
| `HEAD` / `main` local | `e7343cb989883f60b65ccda3685584ec8aa6c0c5` |
| `origin/main` | `94aa679be4ecb848c0ac8575092c4aec48ce8572` |
| `merge-base main origin/main` | `94aa679…` (= `origin/main`) |

## 2. ⚠️ Correção crítica ao plano (Fase 5)

O plano assume, na Fase 5, que `main` e `origin/main` têm **históricos divergentes sem ancestralidade**. **Isso está INCORRETO.**

Evidências:

- `git status` reporta `## main...origin/main [ahead 14]` — **sem "behind"**.
- `git merge-base main origin/main` = `94aa679` = **o próprio `origin/main`**.
- `git log origin/main --not main` retorna **vazio** — nenhum commit em `origin/main` está fora de `main`.

**Conclusão:** `main` é um *fast-forward* limpo, 14 commits à frente de `origin/main`. Não há divergência. A publicação futura pode, em tese, ser um fast-forward — mas **continua sujeita à separação em lotes/PR e à autorização humana** (Fases 5+). A premissa de "reconstruir a partir de branch de proteção por divergência" não se aplica.

## 3. Os 14 commits exclusivos de `main`

```
e7343cb fix(deps): npm audit fix - 13 de 14 vulnerabilidades resolvidas
38a1a7b chore: ignorar scratch/debug e config local de ferramentas de agente
c286560 feat(ai): integrar feature de IA (rotas, migration 031, evento, env vars)
3d875f6 chore: atualizar configs, docs de governanca e planos de execucao
3bc90e4 feat(frontend): card de insights de IA no dashboard do barbeiro
da28176 feat(ai): IA operacional - previsao de demanda + alertas de churn
b3095f8 docs(opencodex): reorganizacao ingles->portugues + limpeza de templates
f15b77c Merge branch 'main' of https://github.com/JoeGestorpro/multgestorapp
bcf8fae fix(frontend): configurar porta Vite via process e resolver lint ESLint 9
19673be feat: governanca documental do vault (MOC + 8 documentos canonicos)
c835c3c feat: reorganizar .opencodex por projetos e areas
ab3fcee chore: sincroniza edicoes preexistentes do .opencodex + fase 1 da reorganizacao
84ea895 feat: fase 10-11 joefelipe-agent - execution core + llm cost safety
b03b808 docs(handoff): create canonical context pack for claude project
```

## 4. Arquivos modificados / staged / untracked

**Modificados (não staged):**
- `.opencodex/projetos/multgestor/indice.md`
- `.opencodex/projetos/multgestor/status-atual.md`

**Staged:** nenhum.

**Untracked (16 itens):** ver `AUDITORIA-01-CLASSIFICACAO-UNTRACKED.md`.

## 5. Branches locais (25) — com upstream

| Branch | Head | Upstream / estado |
|--------|------|-------------------|
| `main` * | e7343cb | origin/main: ahead 14 |
| `backup/joefelipe-mission-builder-before-main-rebase` | b450ecb | — (local) |
| `backup/principal-before-commit3` | f089222 | — (local) |
| `backup/principal-before-commit6` | 221dd81 | — (local) |
| `backup/main-local-antes-organizacao-2026-07-11` | e7343cb | — (criada Fase 1) |
| `backup/origin-main-antes-organizacao-2026-07-11` | 94aa679 | origin/main (criada Fase 1) |
| `chore/brain-queue-cleanup` | 943b400 | origin: ahead 2 |
| `chore/supabase-agent-skills` | 24621e5 | origin (sync) |
| `docs/opencodex-publication-review` | ffd5787 | origin (sync) — wt `C:/multgestor-clean-tmp` |
| `docs/roadmap-joefelipe-agent` | 4fea416 | origin (sync) |
| `fase-1/estabilizacao` | a1daad3 | origin (sync) |
| `fase1/b1b-gate-poolconnect` | af58c63 | origin: ahead 6 |
| `feat/backup-restore-b2` | bff4df0 | **origin: gone** — wt `mg-pr2` |
| `feat/backup-restore-b2-v2` | 590a04a | origin/main: ahead 1, behind 1 |
| `feat/joefelipe-agent-foundation-clean` | b2ef16e | origin (sync) |
| `feat/joefelipe-agent-v1` | 75b7227 | — (local) |
| `feat/joefelipe-llm-core-mock` | 9b16e38 | origin (sync) |
| `feat/joefelipe-mission-builder` | bfab924 | — (local) |
| `feat/joefelipe-mission-builder-clean` | 2edd701 | origin (sync) |
| `feat/joefelipe-prompt-generator-mode` | 224e475 | — (local) — wt `C:/mg-v4-prompt-generator` |
| `fix/backup-last-status-hardening` | ebb5f9b | origin (sync) — wt `C:/MultGestor-backup` |
| `fix/ci-migrate-hang` | 18519cc | origin (sync) — wt `C:/mg-ci-fix` |
| `fix/feature-migrations-018-021` | cad8ade | origin (sync) — wt `mg-feat-mig-wt` |
| `fix/xss-register-hardening-clean` | 9224a2a | origin (sync) |
| `ops/backup-restore-check` | e2faada | — (local) |
| `ops/backup-restore-check-main` | d62beba | — (local) — wt `C:/multgestor-v2-backup-restore-check` |
| `release/lote-a-documentacao` | 4f70ff8 | origin: ahead 7, behind 7 — wt `C:/mg-lote-a` |
| `release/lote-a-documentacao-clean` | f0db933 | origin/main: ahead 7 — wt `C:/mg-lote-a-clean` |
| `security/rls-runtime-enforcement` | 79c1234 | origin (sync) — wt `mg-security-wt` |
| `security/secrets-rotation` | f6e920f | — (local) |
| `test/joefelipe-agent-safety` | ddf6795 | origin (sync) — wt `mg-pr1` |

**Branches sem upstream (candidatas a revisão):** `feat/joefelipe-agent-v1`, `feat/joefelipe-mission-builder`, `feat/joefelipe-prompt-generator-mode`, `ops/backup-restore-check`, `ops/backup-restore-check-main`, `security/secrets-rotation`, os 3 `backup/*` antigos.

## 6. Worktrees (12) — ver `AUDITORIA-03-WORKTREES.md`

Principal: `C:/MultGestor.v2` (main). 11 worktrees adicionais, dos quais **4 temporários sujos** em `%TEMP%` são alvo de limpeza.

## 7. Stashes (2) — ver `AUDITORIA-02-STASHES.md`

```
stash@{0}: On feat/joefelipe-mission-builder: temp-stash-obsidian
stash@{1}: On fase2/wa-reminder: safety-stash-before-b1b-gate-poolconnect
```

## 8. Remote

```
origin  https://github.com/JoeGestorpro/multgestorapp.git (fetch/push)
```

## 9. Riscos restantes após Fase 0

- `feat/backup-restore-b2` (bff4df0) **não existe no remoto** (upstream "gone"). O commit está preservado apenas no ref local da branch. **Não apagar essa branch** sem recuperação prévia.
- `stash@{1}` contém 31 arquivos com código real (não 13 como o plano estimou) — ver AUDITORIA-02.
- `main` 14 commits à frente, ainda **sem push** — nenhuma ação de publicação nesta missão.
