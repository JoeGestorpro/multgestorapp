# PACK 04 — Plataforma (Core × Nicho)

> ⚠️ **ARQUIVO GERADO — NÃO EDITAR À MÃO.** Fonte: `.opencodex/brain/MULTGESTOR-PLATFORM-SPECIFICATION.md`.
> **Gerado em:** 2026-07-04 · **state_version de origem:** 25

---

## A pergunta que toda mudança de código precisa responder

**"Isto que estou editando é Core ou é Nicho?"** Se a resposta não for óbvia, o código
provavelmente está no lugar errado.

## Constituição do Core — princípios invioláveis (resumo)

1. O Core nunca importa/consulta nada com prefixo de nicho (`barber_*`, `clima_*`, helpers
   nomeados por nicho). Violação = achado P0.
2. Todo guard/middleware usado por mais de um módulo tem nome genérico, mesmo que hoje só
   exista uma implementação (ex.: `requireTenantAdminAuth`, não `requireBarberAdminAuth`,
   fora do módulo barber).
3. Toda constante de domínio (scope, feature flag, branding default) é nomeada, não literal
   solta no código.
4. Nenhuma mudança no Core altera comportamento de um módulo já vendido sem ser decisão
   explícita, testada e documentada.
5. O Core não inventa capacidade que não existe — se hoje só há um auth_scope genérico para
   todos os nichos, isso é documentado como está, não disfarçado.

## Contrato Core × Nicho

**O Core garante:** autenticação (JWT+refresh+revogação) · multi-tenant (RLS+GUC) ·
empresas/usuários/papéis · módulos (catálogo + ativação) · billing (webhooks idempotentes) ·
painel master · observabilidade/backup/deploy.

**Todo nicho novo deve entregar apenas:** regras de negócio · entidades de domínio · telas
específicas · fluxos · menus · campos · relatórios · landing · seeds próprios.

**Todo nicho novo não deveria precisar reescrever:** autenticação · isolamento multi-tenant ·
CRUD de empresa/usuário · billing/webhooks · observabilidade/backup/deploy.

**Exceção conhecida (dívida documentada, não escondida):** não existe ainda um motor de
agendamento genérico com estado — cada nicho com agenda ainda escreve o próprio. O "Booking
Engine compartilhado" hoje só é real nas funções puras de disponibilidade.

## Catálogo de nichos (não inflar status)

| Nicho | Status real |
|---|---|
| BarberGestor | ✅ Completo, vendido, em produção |
| ClimaGestor | 🔴 Backend ~50% (auth já corrigida); frontend ~1% (stub); nenhuma empresa real usando |
| Outros (Pet/Auto/Agro/Café/Fiscal) | **[VISÃO — não implementado]** — citados só em planejamento |

## Definition of Ready — para começar um nicho novo

O Core deve ter, antes de um nicho novo pago: registry de rotas dinâmico · guard de auth
genérico corrigido e em uso · service de empresa sem conhecimento de tabela de nicho (já
atendido) · pelo menos um contrato genérico de entidade agendável, se o nicho tiver agenda.

## Definition of Done — Core finalizado

Nenhum arquivo fora de módulo conhece tabela/helper de nicho · módulo novo registrável sem
editar arquivos centrais à mão · pelo menos um "Bookable/Provider" genérico usado por 2 nichos
reais · `company_modules` populada automaticamente · um segundo nicho real em produção com
empresa de verdade usando · Core Completion Index > 75/100.
