# DiÃ¡rio do Projeto

> Responde: **"O que aconteceu?"**
> Registro cronolÃ³gico de eventos reais â€” o que foi feito, quando, e por quem
> (humano ou IA). NÃ£o Ã© o lugar para "por que decidimos" (isso sÃ£o as
> [[decisoes/visao-geral|DecisÃµes]]) nem para "como funciona" (isso Ã© a
> [[Base de Conhecimento]]).

## Template de entrada

```markdown
## AAAA-MM-DD

**Resumo:** uma frase sobre o dia.

**O que foi feito:**
- Item 1
- Item 2

**DecisÃµes tomadas:** (link para `decisoes/` se virou ADR formal)

**PendÃªncias para o prÃ³ximo dia:**
- Item 1
```

---

## 2026-07-07

**Resumo:** Fase 10/11 do JoeFelipe Agent implementadas e testadas; `.opencodex/brain/` reorganizado por projetos/Ã¡reas; camada de navegaÃ§Ã£o MOC e governanÃ§a documental estabelecidas.

**O que foi feito:**
- Fase 10 (LLM Cost Safety): `BudgetProvider`, `RateLimitProvider`, `CircuitBreakerProvider` envelopando o `LlmEngine`; custo real parseado da API; evento `llm:cost` persistido; card "LLM Cost" no painel.
- Fase 11-B.1 (E2E Foundation): endpoint `/api/llm/test` sem side effects; parser resiliente em `LLMPlanningStrategy`; suÃ­te `e2e.test.ts` com provider simulado.
- ReorganizaÃ§Ã£o do `.opencodex/brain/` (monolÃ­tico) em `projetos/`, `areas/`, `auditorias/`, `decisoes/`, `prompts/`, `_inbox/` â€” 324 arquivos movidos via `git mv`, 127 wikilinks corrigidos.
- Camada MOC: `00-HOME.md` reformulado, `BarberGestor - HOME.md`, `MultCriativos - HOME.md`, 6 Ã­ndices de Ã¡rea tÃ©cnica.
- GovernanÃ§a documental: [[Governanca-Documental]] com 8 documentos canÃ´nicos, [[Base de Conhecimento]] consolidada, [[Segundo CÃ©rebro]] indexado, este diÃ¡rio criado.

**DecisÃµes tomadas:**
- `knowledge-os.md` marcado como legado â€” conhecimento tÃ©cnico permanente migrado para [[Base de Conhecimento]].
- Mapa de correspondÃªncia entre pergunta canÃ´nica e arquivo real documentado em [[Governanca-Documental]] (inclui a resoluÃ§Ã£o da ambiguidade "Ãndice Geral" vs "Mapa do Projeto").

**PendÃªncias para o prÃ³ximo dia:**
- Os 6 arquivos-raiz protegidos (`ATLAS.md`, `CONVENCOES.md`, `FLUXOS.md`, `GLOSSARIO.md`, `HOME.md`, `MAPA-DAS-PASTAS.md`) ainda referenciam o antigo `brain/` e tÃªm links quebrados â€” precisam de revisÃ£o manual humana (nÃ£o podem ser editados por missÃ£o automatizada, por regra).
- `_inbox/revisar/` e `_inbox/antigos/` ainda tÃªm itens pendentes de classificaÃ§Ã£o final.

---

## 2026-07-15

**Resumo:** Limpeza completa de PRs obsoletos, auditoria da feature AI, auditoria completa do sistema (CHECKLIST_AUDITORIA_GERAL), e atualização do vault de conhecimento.

**O que foi feito:**
- **PR #4** (Frontend Foundation): Fechado como obsoleto, branch deletada
- **PR #5** (Supabase Skills): Fechado como obsoleto (diretório .agents/skills/ não existe; repo usa .agent/skills/, 67 commits atrás de main). 40 skills abandonadas.
- **PR #14** → **PR #24** (Backup): Recuperado, merge realizado (94aa679), CI ✅, migrations ✅, Render ✅, Vercel ✅. PR #14 fechado, branch antiga deletada.
- **Feature AI (IA Operacional)**: Auditoria completa — 18 arquivos, ~1500 linhas, 22 testes unitários, 7 topology guards. Migração 031 criada (idempotente, não aplicada ao Supabase). **Veredito: segura, pronta para staging.**
- **Auditoria de qualidade de código**: Coverage 61.9% geral; CC média 11.2; 4 CVEs altos (multer, nodemailer, ws, form-data) corrigíveis via 
pm audit fix.
- **Auditoria completa do sistema (CHECKLIST_AUDITORIA_GERAL)**: 6 blocos verificados. Veredito: **Aprovado com ressalvas**. 2 P0 (segredos de produção em disco; controlador eq.companyId indefinido). 5 P1. 12 P2.
- main sincronizado com origin/main (inclui merge PR #24)
- Vault de conhecimento atualizado (este diário, fila de missões, ADRs, relatório de auditoria)

**Decisões tomadas:**
- ADR-10: Skills Supabase rejeitadas — .agents/skills/ não existe no repo; .agent/skills/ já é o padrão
- Feature AI pronta para staging (decisão de deploy aguarda humano)
- 
pm audit fix disponível mas precisa de autorização

**Pendências para o próximo dia:**
- Decidir branch de staging para feature AI
- Autorizar 
pm audit fix para corrigir 4 CVEs altos
- Commit da reorganização .opencodex/ (341 arquivos sujos)
- Executar planos de atualização dos vaults (Obsidian + .opencodex/)
