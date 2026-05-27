# REGISTRO OFICIAL — GITHUB MCP
# MULTGESTOR CORE • MASTER ORCHESTRATOR

**Status:** OFICIAL • ATIVO  
**Data de registro:** 2026-05-18  
**Versão:** 1.0.0  
**Tipo:** Capability Core Foundation  
**Responsabilidade:** Análise de repositório, histórico, branches, PRs, versionamento

---

## PROPÓSITO

O GitHub MCP é uma capability oficial do Core Foundation do projeto MultGestor.

Permite que agentes, workflows e sistemas consigam:
- analisar repositórios
- verificar commits
- validar branches
- revisar PRs
- comparar alterações
- investigar histórico
- conferir versionamento
- rastrear mudanças arquiteturais
- sincronizar contexto operacional do projeto

---

## LIMITES ARQUITETURAIS

GitHub MCP **NÃO substitui**:
- Filesystem/Workspace MCP (código local)
- Terminal MCP (execução)
- Supabase MCP (schema/banco)
- Playwright MCP (UX/frontend)

Cada capability possui responsabilidade distinta e complementar.

---

## MATRIZ DE RESPONSABILIDADES

| MCP | USAR PARA | NÃO USAR PARA |
|-----|-----------|---------------|
| **Filesystem/Workspace** | Ler código atual, analisar estrutura local, revisar workspace aberto, modificar arquivos locais | Ignorar estado local |
| **GitHub** | Commits, histórico, branches, PRs, comparar versões, validar sincronização, investigar regressões | Substituir leitura local, editar código já aberto |
| **Terminal** | Comandos, build, testes, migrations, lint, serviços, debug | Análise de código-fonte |
| **Supabase** | Schema, tabelas, migrations, RLS, índices, queries, estrutura multi-tenant | Editar código aplicação |
| **Playwright** | UX, fluxos, responsividade, erros visuais, páginas reais | Backend/infra |

---

## WORKFLOW PADRÃO

1. `master-orchestrator.md` — decisão estratégica
2. `context-discovery.md` — descoberta de contexto
3. `project-detection.md` — detecção do projeto
4. `brainstorm.md` — ideação
5. `architecture.md` — definição arquitetural
6. `feature-building.md` — construção
7. `systematic-debugging.md` — debug
8. `testing-patterns.md` — testes
9. `deployment-procedures/SKILL.md` — deploy

---

## PRIORIDADE DE LEITURA

1. Workspace local
2. Filesystem MCP
3. GitHub MCP
4. Supabase MCP
5. Terminal MCP
6. Playwright MCP

---

## REGRAS OPERACIONAIS

### REGRA 1
Antes de qualquer implementação:
- analisar contexto local
- identificar stack
- identificar arquitetura existente
- validar workflows necessários

### REGRA 2
Sempre selecionar agentes, workflows e skills necessárias antes de iniciar.

### REGRA 3
GitHub MCP deve ser usado para análise de histórico, evolução arquitetural e rastreabilidade — não para leitura de código que já existe no workspace local.

---

## REFERÊNCIAS

- Config: `C:\Users\Joefe\.config\opencode\opencode.json` → bloco `mcp.github`
- Package: `@modelcontextprotocol/server-github` v0.6.2
- Token: `GITHUB_MCP_TOKEN` (env var, escopos User + Machine)
- Repositório: `JoeGestorpro/multgestorapp`
- Stack: Node.js/Express + React/Vite + PostgreSQL (Supabase)
