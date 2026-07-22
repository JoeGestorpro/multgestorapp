# INC-004 — Exposição de credencial de runtime em scripts de scratch

> **Status:** CONTIDO · **Severidade:** Média (credencial não autentica) · **Registrado:** 2026-07-10
> **Relacionado:** auditoria da PR #25 · [[status-atual]] · missão futura de redação de secrets

## Tipo da exposição
Credencial de banco embutida (hardcoded) em **script de diagnóstico**: role de runtime de aplicação (`app_runtime`) com **senha fraca** [redigida] apontando para o **host de produção** `db.[PROJECT_REF].supabase.co` (project-ref não reproduzido aqui — ver débito de redação). Connection string completa **não** reproduzida neste registro.

## Arquivos envolvidos
- `.opencodex/_inbox/revisar/check-rls2.js` — connection string de produção hardcoded (arquivo de scratch).
- `.opencodex/_inbox/revisar/check-rls.js` e `.opencodex/areas/operacao/ops/_tmp_smoke_b.js` — scripts temporários correlatos (sem credencial de prod, mas fora de escopo de versionamento).
- Origem no histórico: adicionados no commit de sincronização do `.opencodex` (`ab3fcee`), renomeados por `c835c3c`.
- Exposição adicional pré-existente (host/project-ref em prosa, **não** desta ação): `AUDITORIA-MULTGESTOR-BARBERGESTOR-ATUAL.md`, `a001-rls-test-execute-evidence-2026-06-25.md`, `docs/DEPLOY_CHECKLIST.md`, `docs/SECURITY-TENANT-ISOLATION.md` — já presentes em `origin/main`.

## Período
- Presente nos commits locais do batch de 14 commits (não publicado por semanas).
- **Publicado no remoto** em 2026-07-10 no push inicial da PR #25 (branch `release/lote-a-documentacao`, tip `4f70ff8`).
- **Contido no mesmo dia** (2026-07-10) via reescrita de histórico + `--force-with-lease`.

## Confirmação de que a credencial não autentica
Teste de conexão em 2026-07-10 (saída mascarada, sem exibir a string): resultado **`SASL authentication failed` (code 08P01)** — o servidor de produção **rejeitou a autenticação**. A senha exposta **não concede acesso** (já foi trocada). Não há acesso vivo pela credencial vazada.

## Contenção realizada
- Reconstruída a branch do Lote A a partir de `origin/main`, com os 3 scripts **removidos desde o commit de origem** (`ab3fcee` e `c835c3c`), não apenas no commit final.
- Verificação por commit: os 3 scripts **ausentes de todo o histórico exclusivo** da branch.
- Regras de `.gitignore` adicionadas: `**/_tmp_*` e os dois `check-rls*.js` identificados (sem ignorar `_inbox/` inteira).
- `git push --force-with-lease` substituiu o tip remoto `4f70ff8` → `f0db933` (histórico limpo). PR #25 permaneceu aberta.
- **Nenhuma alteração no Supabase** foi feita (gate humano).

## Débito futuro (missão de redação)
1. **Redigir o project-ref/host de produção** dos docs pré-existentes em `origin/main` (`AUDITORIA-BARBERGESTOR`, `a001`, `docs/DEPLOY_CHECKLIST.md`, `docs/SECURITY-TENANT-ISOLATION.md`) — substituir por placeholder `[PROJECT_REF]`.
2. **Confirmar com o responsável** que a senha do role `app_runtime` de produção é forte e distinta do nome (o teste indica que já não é a fraca exposta).
3. Avaliar **purga dos SHAs pendurados** no remoto (commits antigos acessíveis por SHA até GC do GitHub); risco incremental baixo (credencial inválida, host já público), decisão humana.
4. Considerar varredura recorrente de secrets no CI para `.opencodex/**` (padrões de connection string).
