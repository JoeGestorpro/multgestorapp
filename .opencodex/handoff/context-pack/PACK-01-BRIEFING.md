# PACK 01 — Briefing (identidade, protocolo, papéis)

> ⚠️ **ARQUIVO GERADO — NÃO EDITAR À MÃO.** Fonte: `BRIEFING-CLAUDE-CODE.md` (raiz do repo).
> **Gerado em:** 2026-07-04 · **state_version de origem:** 25
> Esta é a parte **durável** do briefing — muda raramente (o cabeçalho é atualizado a cada
> regeneração mesmo quando o conteúdo não muda). O estado atual está em `PACK-02-ESTADO.md`.

---

## O que é o MultGestor

SaaS multi-tenant, multi-nicho. Backend Node/Express no **Render**, frontend React/Vite no
**Vercel**, banco **Supabase Postgres 17**. Primeiro vertical vendido: **BarberGestor** (gestão
de barbearias), com clientes pagos reais em produção. Segundo vertical embrionário:
**ClimaGestor** (majoritariamente esqueleto — detalhe em `PACK-04`).

Visão estratégica: o **Core** (autenticação, multi-tenant, empresas, usuários, módulos, planos,
billing, painel master) deve ser genérico o suficiente para suportar novos nichos sem reescrever
a fundação a cada mercado — parcialmente realizado, medido por auditoria própria (`PACK-02`).

---

## Protocolo de trabalho humano × IA (vinculante)

Regras estabelecidas ao longo de várias sessões — valem para qualquer IA neste repositório:

1. **Nunca `git push`, merge para `main`, deploy ou migration em produção sem autorização
   humana explícita e inequívoca.** Uma recomendação em tom de análise ("eu recomendaria X")
   não é autorização — em caso de ambiguidade, perguntar diretamente antes de agir.
2. **SQL em produção só roda com o texto exato aprovado pelo humano**, palavra por palavra.
3. **Stage seletivo sempre.** Nunca `git add -A`, `git clean`, `git stash`, nem troca de branch
   automática — investigar estado inesperado antes de descartar qualquer coisa.
4. **Fronteira Core × Nicho (regra P10 / decisão D-017):** código fora de uma pasta de módulo
   (`barber/`, `clima/`) não pode importar helper de nicho, usar default hardcoded de um nicho,
   nem referenciar tabela com prefixo de nicho. Acoplamento só via `niche_type`/módulo ativo.
5. **Toda rota nova responde 4 perguntas antes de "pronta":** pode gerar abuso? gera custo?
   precisa de rate limit? precisa de limite por tenant/usuário?
6. **Escala de evidência em toda auditoria:** VALIDADO (produção real) · [FATO] (código/teste
   local) · [PARCIAL] (indício) · [HIPÓTESE] (inferência) · [INSUFICIENTE] (declarar, não inventar).
7. **`.opencodex/brain/` é a fonte de verdade da governança** — atualizar a cada missão relevante,
   nunca apagar histórico.
8. **Commits locais são livres após testes verdes** — autorização só é exigida para
   push/merge/deploy/migration em produção.

## Divisão de papéis

**Humano decide:** negócio (preços, prioridade estratégica, destino de um nicho), autorização de
ações irreversíveis ou de alto impacto (push, deploy, SQL em prod, contratos com terceiros),
validação final de auditorias antes de virarem plano de execução.

**IA executa:** diagnostica com evidência, implementa com o menor raio de mudança possível,
testa tudo antes de pedir aprovação, nunca presume autorização ambígua.

---

## Mapa de arquivos-chave

| Arquivo | Conteúdo |
|---|---|
| `CLAUDE.md` (raiz) | Instruções fixas, carregadas automaticamente em toda sessão |
| `.opencodex/brain/EXECUTION-PLAYBOOK-PRODUCAO.md` | Manual vivo — estado, gates, roadmap P0-P4 |
| `.opencodex/brain/MULTGESTOR-PLATFORM-SPECIFICATION.md` | Constituição do Core, contrato Core×Nicho |
| `.opencodex/brain/01-CURRENT-STATE.md` | Estado vivo sincronizado a cada missão |
| `.opencodex/brain/roadmaps/ROADMAP-MESTRE-MULTGESTOR-2026.md` | Roadmap estratégico de longo prazo |
| `.opencodex/brain/decisions/` | Todas as decisões (D-001 em diante) + grafo de decisões |
| `.opencodex/brain/runbooks/MODELO-AUDITORIA-NICHO.md` | Checklist para auditar qualquer nicho futuro |
| `.opencodex/audits/` | Auditorias completas com evidência |
| `.opencodex/queue/current-task.md` / `next-task.md` | Missão em execução / próxima missão |
| `.opencodex/brain/ops/mission-closing-protocol.md` | Fluxo obrigatório de fechamento de missão |
