# AUDITORIA-03 — Worktrees

> **Data:** 2026-07-11
> **Fase:** 4 — Auditar worktrees temporários (modo leitura, sem remoção)

---

## 1. Todos os worktrees (12)

| Caminho | Branch | HEAD | Categoria |
|---------|--------|------|-----------|
| `C:/MultGestor.v2` | main | e7343cb | **Principal** |
| `C:/mg-ci-fix` | fix/ci-migrate-hang | 18519cc | Ativo (sync remoto) |
| `C:/mg-lote-a` | release/lote-a-documentacao | 4f70ff8 | Ativo (release) |
| `C:/mg-lote-a-clean` | release/lote-a-documentacao-clean | f0db933 | Ativo (release) |
| `C:/mg-v4-prompt-generator` | feat/joefelipe-prompt-generator-mode | 224e475 | Ativo (local) |
| `C:/MultGestor-backup` | fix/backup-last-status-hardening | ebb5f9b | Ativo (task de backup) |
| `C:/multgestor-clean-tmp` | docs/opencodex-publication-review | ffd5787 | Ativo (sync remoto) |
| `C:/multgestor-v2-backup-restore-check` | ops/backup-restore-check-main | d62beba | Ativo (local) |
| `C:/Users/Joefe/AppData/Local/Temp/mg-feat-mig-wt` | fix/feature-migrations-018-021 | cad8ade | **Temporário sujo** |
| `C:/Users/Joefe/AppData/Local/Temp/mg-pr1` | test/joefelipe-agent-safety | ddf6795 | **Temporário sujo** |
| `C:/Users/Joefe/AppData/Local/Temp/mg-pr2` | feat/backup-restore-b2 | bff4df0 | **Temporário sujo** |
| `C:/Users/Joefe/AppData/Local/Temp/mg-security-wt` | security/rls-runtime-enforcement | 79c1234 | **Temporário sujo** |

## 2. Análise dos 4 worktrees temporários (`%TEMP%`)

| Worktree | Branch | Estado working tree | Untracked | Commits não pushados | Branch no remoto? |
|----------|--------|--------------------|-----------|----------------------|-------------------|
| `mg-feat-mig-wt` | fix/feature-migrations-018-021 | 790 arquivos `D` | 0 | 0 | ✅ Sim (cad8ade) |
| `mg-pr1` | test/joefelipe-agent-safety | 1094 arquivos `D` | 0 | 0 | ✅ Sim (ddf6795) |
| `mg-pr2` | feat/backup-restore-b2 | 1101 arquivos `D` | 0 | 0 | ❌ **NÃO (gone)** |
| `mg-security-wt` | security/rls-runtime-enforcement | 797 arquivos `D` | 0 | 0 | ✅ Sim (79c1234) |

### Interpretação

- O estado sujo é **exclusivamente deleções** (`D`) do working tree — nenhum arquivo untracked, nenhum commit local exclusivo. As deleções são artefato da criação dos worktrees (repo foi materializado e depois esvaziado). **Não há trabalho a perder no working tree.**
- O HEAD de cada worktree é **idêntico** ao tip da respectiva branch, que por sua vez (3 de 4) coincide com o hash no remoto. Remover o worktree **não apaga a branch** — o ref local sobrevive.

### ⚠️ Exceção crítica: `feat/backup-restore-b2` (mg-pr2)

> **Correção ao plano.** O plano assumia que as 4 branches estavam "preservadas no remoto". **Falso para `feat/backup-restore-b2`:**
> - `git ls-remote origin feat/backup-restore-b2` → **vazio**.
> - `git branch -vv` marca o upstream como **`gone`**.
> - O commit `bff4df0` existe **apenas** no ref local da branch `feat/backup-restore-b2`.
>
> **Implicação:** remover o *worktree* `mg-pr2` é seguro (o ref da branch permanece). Mas a **branch `feat/backup-restore-b2` NÃO pode ser apagada** (Fase 9) até que `bff4df0` seja confirmado como recuperado/publicado — ou comparado com `feat/backup-restore-b2-v2` (590a04a), que é conteúdo divergente (ver Fase 6 do plano).

## 3. Condições de remoção (recap do plano) e veredito

| Condição | mg-feat-mig-wt | mg-pr1 | mg-pr2 | mg-security-wt |
|----------|:---:|:---:|:---:|:---:|
| Sem arquivo exclusivo (untracked) | ✅ | ✅ | ✅ | ✅ |
| Sem commit local exclusivo | ✅ | ✅ | ✅ | ✅ |
| Branch preservada no remoto | ✅ | ✅ | ❌ | ✅ |
| PR/branch identificada | ✅ | ✅ | ⚠️ v2 divergente | ✅ |
| **Worktree removível com segurança** | ✅ | ✅ | ✅ (branch fica) | ✅ |
| **Branch removível** | ✅ (via -d) | ✅ (via -d) | 🚫 **NÃO** | ✅ (via -d) |

## 4. Comando de remoção (apenas após autorização — Fase 9)

```bash
git worktree remove "C:/Users/Joefe/AppData/Local/Temp/mg-feat-mig-wt"
git worktree remove "C:/Users/Joefe/AppData/Local/Temp/mg-pr1"
git worktree remove "C:/Users/Joefe/AppData/Local/Temp/mg-pr2"
git worktree remove "C:/Users/Joefe/AppData/Local/Temp/mg-security-wt"
git worktree prune
```

Como o working tree só contém deleções (não modificações valiosas), `git worktree remove` pode recusar por "modificações". Nesse caso, **revalidar** que são só `D` e obter autorização específica antes de considerar `--force`. **Não usar `--force` sem verificação.**

## 5. Gate

🔒 **Nenhum worktree foi removido.** Confirmado que os 4 temporários **não contêm trabalho exclusivo**. Pendência: `feat/backup-restore-b2` (bff4df0) só existe local — proteger a branch.
