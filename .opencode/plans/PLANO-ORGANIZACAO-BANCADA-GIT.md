# Plano Seguro de Organização da Bancada Git — MultGestor.v2

> **Gerado em:** 2026-07-11
> **Status:** PRONTO PARA EXECUÇÃO (Fases 0–4)
> **Modo:** Leitura + exceção Fase 1 (branches de proteção)

---

## 1. Objetivo

Organizar completamente a bancada Git sem perder código, documentação, histórico ou configurações importantes.

Ao final, a bancada deverá ter:

- `main` local sincronizada com `origin/main`;
- nenhuma alteração desconhecida;
- nenhum stash pendente;
- apenas branches necessárias;
- apenas worktrees de missões ativas;
- cada trabalho publicado por branch e PR;
- documentos importantes preservados;
- arquivos temporários removidos;
- nenhuma publicação direta ou deploy sem autorização.

---

## 2. Regras obrigatórias

Durante a organização:

- não executar `git push origin main`;
- não executar `git push --force`;
- não apagar branches sem comparação;
- não remover worktrees sujos com `--force`;
- não descartar stashes sem revisar o conteúdo;
- não apagar arquivos untracked em massa;
- não executar merge;
- não executar deploy;
- não alterar produção;
- registrar evidências antes e depois de cada fase.

Cada fase deve terminar com:

1. relatório do que foi encontrado;
2. comandos executados;
3. resultado dos testes;
4. riscos restantes;
5. solicitação de autorização para a próxima fase destrutiva.

---

# Fase 0 — Congelamento e inventário

## Objetivo

Registrar o estado exato da bancada antes de qualquer alteração.

## Comandos

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git log --oneline --decorate --graph --all -n 100
git branch -vv
git worktree list --porcelain
git stash list
git remote -v
```

Também registrar:

- todas as branches locais;
- seus upstreams;
- branches sem upstream;
- branches com PR;
- worktrees limpos e sujos;
- arquivos modificados;
- arquivos staged;
- arquivos untracked;
- commits exclusivos de cada branch;
- divergência entre `main` e `origin/main`.

## Resultado esperado

Um relatório chamado:

```
AUDITORIA-00-ESTADO-INICIAL-BANCADA.md
```

## Gate

Nenhuma alteração deve acontecer até o inventário estar salvo e revisado.

---

# Fase 1 — Criar pontos de proteção

## Objetivo

Garantir que nenhum commit ou arquivo desapareça durante a organização.

### 1.1 Proteger a `main` local

```bash
git branch backup/main-local-antes-organizacao-2026-07-11 main
```

Essa ação cria apenas uma referência local. Não altera arquivos nem histórico.

### 1.2 Proteger a `origin/main`

```bash
git branch backup/origin-main-antes-organizacao-2026-07-11 origin/main
```

### 1.3 Registrar hashes

```bash
git show --no-patch --oneline backup/main-local-antes-organizacao-2026-07-11
git show --no-patch --oneline backup/origin-main-antes-organizacao-2026-07-11
```

## Gate

Apresentar os hashes das duas proteções antes de continuar.

---

# Fase 2 — Preservar os arquivos não rastreados

## Objetivo

Impedir que roadmaps, auditorias e incidentes sejam apagados durante a limpeza.

### Classificação proposta

#### Preservar e versionar (Canônico)

- `.opencode/plans/separacao-14-commits-release-v2.2.md` — versão mais recente do plano de release
- `.opencode/plans/plano-reorganizacao-wikis.md` — plano de reorganização do vault
- `.opencode/plans/execucao-reorganizacao-wikis.md` — plano de execução da reorganização
- `.opencode/plans/auditoria-14-commits-completa.md` — auditoria completa dos 14 commits
- `.opencodex/auditorias/multgestor/2026-07-10-auditoria-readonly-mapa-mestre.md` — auditoria atual
- `.opencodex/projetos/multgestor/incidentes/INC-004-exposicao-credencial-runtime-scratch.md` — registro de incidente
- `.opencodex/projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md` — roadmap mestre

#### Comparar antes de preservar (possíveis substituídos)

- `.opencode/plans/separacao-14-commits-release.md` (v1) → subordinado por v2.2
- `.opencode/plans/separacao-14-commits-release-v2.md` → subordinado por v2.2
- `.opencode/plans/auditoria-lote-commits-pendentes.md` → escopo mais amplo mas commit-level substituído por `auditoria-14-commits-completa.md`

#### Ignorar ou remover (Temporário)

- `.opencodex/projetos/multgestor/roadmap/capacidades.md` — arquivo vazio (0 bytes)
- `.opencodex/Sem título.md` — arquivo com nome defeituoso (encoding)
- `.opencodex/projetos/multgestor/roadmap/.obsidian/` — configurações pessoais do Obsidian

### Regra de decisão

| Estado      | Tratamento                   |
| ----------- | ---------------------------- |
| Canônico    | Preservar e versionar        |
| Histórico   | Mover para arquivo histórico |
| Substituído | Remover após confirmação     |
| Temporário  | Ignorar ou remover           |

## Saída esperada

```
AUDITORIA-01-CLASSIFICACAO-UNTRACKED.md
```

## Gate

Nenhum arquivo untracked deve ser removido antes da aprovação dessa classificação.

---

# Fase 3 — Auditar e preservar os stashes

## Objetivo

Determinar se as mudanças guardadas já foram implementadas ou ainda precisam ser recuperadas.

### 3.1 stash@{0} — Configurações Obsidian

- **Data:** 2026-06-23 (18 dias)
- **Branch de origem:** feat/joefelipe-mission-builder
- **Conteúdo:** `.opencodex/.obsidian/graph.json` e `workspace.json`
- **Classificação:** Preferências visuais do Obsidian
- **Tratamento:** Registrar evidência. Provavelmente seguro para dropar após autorização.

```bash
git show --stat stash@{0}
```

### 3.2 stash@{1} — Código significativo

- **Data:** 2026-06-04 (37 dias)
- **Branch de origem:** fase2/wa-reminder
- **Conteúdo:** 13 arquivos com código real

#### Resultado da comparação com o código atual

| Arquivo | Status | Detalhe |
|---------|--------|---------|
| `auth.controller.js` | ✅ JÁ APLICADO | Forma evoluída com `REFRESH_COOKIE_NAMES` array |
| `rls_tenant_tables.sql` | ⚠️ NÃO APLICADO neste arquivo | RLS pode existir em migrações separadas |
| `whatsapp-webhook.js` | ❌ NÃO APLICADO | Validação HMAC-SHA256 ausente |
| `sale.repository.js` | ❌ NÃO APLICADO | Refactor `companyId` como parâmetro ausente |
| `barber.routes.js` | ❌ NÃO APLICADO | Rotas financeiras/loyalty/package ausentes |
| `consumers/index.js` | ⚠️ PARCIALMENTE APLICADO | Wallet sim, loyalty+package não |
| `barber/index.js` | ❌ NÃO APLICADO | Controllers financial/wallet/package/loyalty ausentes |

#### Conclusão

O stash contém trabalho **parcialmente aplicado**. A validação HMAC do webhook e as rotas financeiras/loyalty/package **não foram implementadas**.

#### Ação recomendada

Criar branch de recuperação (apenas quando autorizado):

```bash
git switch -c recovery/stash-wa-reminder origin/main
git stash apply 'stash@{1}'
```

Usar `apply`, não `pop`, pois o stash deve continuar preservado até os testes passarem.

## Gate

O stash só poderá ser descartado depois que:

- todas as mudanças válidas estiverem preservadas;
- a branch de recuperação estiver limpa;
- os testes tiverem passado;
- existir relatório comprovando a equivalência.

---

# Fase 4 — Auditar os worktrees temporários

## Objetivo

Comprovar que os quatro worktrees sujos não contêm trabalho exclusivo.

### Worktrees em análise

| Worktree | Branch | Arquivos alterados | Conclusão |
|----------|--------|-------------------|-----------|
| `C:/Users/Joefe/AppData/Local/Temp/mg-feat-mig-wt` | fix/feature-migrations-018-021 | 790 deletados | Artefato de criação PR |
| `C:/Users/Joefe/AppData/Local/Temp/mg-pr1` | test/joefelipe-agent-safety | 1094 deletados | Artefato de criação PR |
| `C:/Users/Joefe/AppData/Local/Temp/mg-pr2` | feat/backup-restore-b2 | 1101 deletados | Artefato de criação PR |
| `C:/Users/Joefe/AppData/Local/Temp/mg-security-wt` | security/rls-runtime-enforcement | 797 deletados | Artefato de criação PR |

### Padrão identificado

Todos mostram a **mesma assinatura** — centenas de arquivos como `D` (deleted):
- Diretório `.agent/` inteiro
- Todo o código backend/frontend
- Configurações, workflows CI, testes

Isso indica que foram criados a partir de um estado do repo que incluía o diretório `.agent/` e todo o código, possivelmente durante rebase ou criação de PR.

### Verificações adicionais necessárias

```bash
# Confirmar que as branches estão preservadas no remoto
git ls-remote origin fix/feature-migrations-018-021
git ls-remote origin test/joefelipe-agent-safety
git ls-remote origin feat/backup-restore-b2
git ls-remote origin security/rls-runtime-enforcement
```

### Condição para remoção

Um worktree só poderá ser removido se:

- não tiver arquivo exclusivo;
- não tiver commit local exclusivo;
- a branch estiver preservada no remoto;
- a PR correspondente estiver identificada;
- houver autorização explícita.

### Comando para remoção (após aprovação)

```bash
git worktree remove <caminho>
git worktree prune
```

Não usar `--force` sem verificação e autorização específicas.

## Gate

Relatório de confirmação de que nenhum trabalho exclusivo foi perdido.

---

# Fase 5 — Resolver a divergência da `main` (AGUARDA AUTORIZAÇÃO)

> Esta fase NÃO será executada agora. Documentada para referência futura.

## Estado atual

- `main` local: `e7343cb`
- `origin/main`: `94aa679`
- Históricos **divergentes** — não há relação de ancestralidade
- 14 commits exclusivos na `main` local

## Estratégia segura

Não alterar a `main` imediatamente. Trabalhar a partir da branch de proteção criada na Fase 1.

### Classificação dos 14 commits

| Lote | Commits | Área |
|------|---------|------|
| A | b03b808, ab3fcee, c835c3c, 19673be, b3095f8, 3d875f6 | Documentação e governança |
| B | 84ea895 | Agente JoeFelipe (fases 10-11) |
| C | bcf8fae, 3bc90e4 | Frontend (Vite/ESLint + card IA) |
| D | da28176, c286560 | IA operacional (previsão, churn, rotas, migration 031) |
| E | e7343cb | Dependências (npm audit fix) |
| F | f15b77c, 38a1a7b | Merge + configurações |

### Passos conceituais

```bash
# Para cada lote aprovado:
git switch -c release/<lote> origin/main
git cherry-pick <commits-aprovados>
# Testar
# Push da branch (não da main)
# Abrir PR
```

### Dependências entre lotes

- Frontend (C) depende das rotas de IA (D)?
- Migration 031 (D) precisa entrar com o backend?
- `npm audit fix` (E) altera lockfiles utilizados por outros lotes?

---

# Fase 6 — Comparar branches parecidas (AGUARDA AUTORIZAÇÃO)

> Documentada para referência futura.

### release/lote-a-documentacao vs -clean

- Base comum: `94aa679` (= origin/main)
- Commits idênticos com nomes iguais, hashes diferentes
- `-clean` é mais limpa: remove scripts temporários, adiciona .gitignore
- **Recomendação:** Manter `-clean`, descartar original após confirmação

### feat/backup-restore-b2 vs -v2

- Commits completamente diferentes
- Mesmo nome funcional, conteúdo divergente
- Não se pode presumir que v2 é melhor sem comparar diffs
- **Recomendação:** Comparar código linha a linha

### ops/backup-restore-check vs -main

- `check`: 3 commits de documentação (brain)
- `check-main`: 3 commits operacionais + fix
- **Recomendação:** Manter `-main` como funcional, renomear `check` se necessário

---

# Fase 7 — Corrigir arquivos inadequados (AGUARDA AUTORIZAÇÃO)

> Documentada para referência futura.

### _tmp_smoke_b.js

- Nome temporário
- Localizado dentro de `.opencodex/`
- ID de empresa fixo hardcoded
- Consultas diretas ao banco
- **Tratamento:** Parametrizar ou remover completamente

### frontend/.env.production

- Contém apenas `VITE_API_URL` (URL pública)
- Risco imediato baixo
- **Tratamento:** Confirmar que deploy usa essa config; avaliar `.env.production.example`

### .obsidian/

- **Política:** Versionar apenas configurações compartilhadas necessárias
- Ignorar `workspace.json` e estados pessoais

---

# Fase 8 — Publicação controlada por PR (AGUARDA AUTORIZAÇÃO)

> Documentada para referência futura.

Para cada branch:

1. Revisar diff
2. Executar testes
3. Verificar secrets
4. Verificar migrations
5. Verificar impacto CI/CD
6. Push somente da branch
7. Abrir PR
8. Aguardar CI
9. Auditar a PR
10. Obter autorização para merge

**Nunca usar:**
```bash
git push origin main
git push --force
git push --force-with-lease
```

---

# Fase 9 — Limpeza final (AGUARDA AUTORIZAÇÃO)

> Documentada para referência futura.

### Ordem de limpeza

1. Remover worktrees comprovadamente obsoletos
2. Executar `git worktree prune`
3. Descartar stashes já recuperados (índice maior primeiro)
4. Excluir branches duplicadas sem conteúdo exclusivo
5. Corrigir upstreams errados
6. Remover arquivos temporários
7. Limpar documentos substituídos
8. Sincronizar `main` local com `origin/main`

### Exclusão de branches

```bash
# Preferir sempre -d (seguro)
git branch -d <branch>
# -D requer autorização específica
```

### Descarte dos stashes

```bash
# Ordem importa: primeiro o maior índice
git stash drop 'stash@{1}'
git stash drop 'stash@{0}'
```

---

# Fase 10 — Auditoria de encerramento (AGUARDA AUTORIZAÇÃO)

> Documentada para referência futura.

```bash
git status --short --branch
git branch -vv
git worktree list --porcelain
git stash list
git log --oneline --decorate --graph --all -n 100
```

### Critérios de conclusão

A bancada só será considerada organizada quando:

- `main` local sincronizada com `origin/main`
- nenhum commit perdido
- nenhum push direto pendente
- diretório principal limpo
- todos os untracked classificados
- nenhum stash desconhecido
- nenhum worktree temporário abandonado
- branches ativas com missão e PR
- branches obsoletas removidas
- upstreams corretos
- documentos importantes preservados
- CI verde nas PRs publicadas
- nenhum merge ou deploy sem autorização

### Resultado final

```
AUDITORIA-FINAL-BANCADA-GIT-MULTGESTOR-V2.md
```

---

# Primeira execução autorizável

A primeira missão deve limitar-se às **Fases 0 a 4 em modo de leitura**, com uma única exceção opcional: criar as duas branches locais de proteção (Fase 1). Sem push, merge, rebase, cherry-pick, remoção, stash apply/drop ou alteração de arquivos.

## Checklist de execução

- [ ] Fase 0: Salvar `AUDITORIA-00-ESTADO-INICIAL-BANCADA.md`
- [ ] Fase 1: Criar branches de proteção
- [ ] Fase 2: Salvar `AUDITORIA-01-CLASSIFICACAO-UNTRACKED.md`
- [ ] Fase 3: Salvar `AUDITORIA-02-STASHES.md`
- [ ] Fase 4: Salvar `AUDITORIA-03-WORKTREES.md`
- [ ] Aguardar autorização para Fase 5+
