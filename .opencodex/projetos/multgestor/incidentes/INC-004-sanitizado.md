# INC-004 (SANITIZADO) — Exposição de credencial de runtime em scripts de scratch

> **Status:** CONTIDO · **Severidade:** Média (credencial não autentica) · **Registrado:** 2026-07-10
> **Versão:** sanitizada para governança interna (host/role/project-ref substituídos por placeholders).
> **Original:** mantido apenas localmente (não versionado). Esta cópia não reproduz valores sensíveis.

## Tipo da exposição
Credencial de banco embutida (hardcoded) em **script de diagnóstico**: role de runtime de aplicação (`<internal-role>`) com **senha fraca** [redigida] apontando para o **host de produção** `<db-host>` (`<project-ref>` não reproduzido). Connection string completa **não** reproduzida neste registro.

## Arquivos envolvidos
- Um script de scratch continha connection string de produção hardcoded (`<scratch-script>`).
- Dois scripts temporários correlatos (sem credencial de prod, fora de escopo de versionamento).
- Origem no histórico: adicionados num commit de sincronização do `.opencodex` (`<sha-origem>`), renomeados por `<sha-rename>`.
- Exposição adicional pré-existente (host/`<project-ref>` em prosa, **não** desta ação): presente em alguns docs já em `origin/main` (ver débito de redação).

## Período
- Presente em commits locais não publicados por semanas.
- **Publicado no remoto** em 2026-07-10 (push inicial de uma branch de release).
- **Contido no mesmo dia** (2026-07-10) via reescrita de histórico + `--force-with-lease`.

## Confirmação de que a credencial não autentica
Teste de conexão em 2026-07-10 (saída mascarada, sem exibir a string): resultado **`SASL authentication failed` (code 08P01)** — o servidor de produção **rejeitou a autenticação**. A senha exposta **não concede acesso** (já foi trocada). Não há acesso vivo pela credencial vazada.

## Contenção realizada
- Reconstruída a branch de release a partir de `origin/main`, com os scripts **removidos desde o commit de origem** (não apenas no commit final).
- Verificação por commit: os scripts **ausentes de todo o histórico exclusivo** da branch.
- Regras de `.gitignore` adicionadas (`**/_tmp_*` e os scripts identificados; sem ignorar diretórios legítimos).
- `git push --force-with-lease` substituiu o tip remoto (histórico limpo).
- **Nenhuma alteração no Supabase** foi feita (gate humano).

## Débito futuro (missão de redação)
1. **Redigir o `<project-ref>`/host de produção** de docs pré-existentes em `origin/main` — substituir por placeholder.
2. **Confirmar com o responsável** que a senha do role `<internal-role>` de produção é forte e distinta (o teste indica que já não é a fraca exposta).
3. Avaliar **purga dos SHAs pendurados** no remoto (commits antigos acessíveis por SHA até GC do GitHub); risco incremental baixo (credencial inválida, host já público), decisão humana.
4. Considerar **varredura recorrente de secrets no CI** para `.opencodex/**` (padrões de connection string).

---
*Registro sanitizado; placeholders: `<internal-role>`, `<db-host>`, `<project-ref>`, `<scratch-script>`, `<sha-*>`. Detalhes operacionais completos permanecem apenas no registro local não versionado.*
