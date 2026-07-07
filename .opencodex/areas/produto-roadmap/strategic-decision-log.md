---
tipo: estrategia
area: governanca
status: pronto
confianca: alta
ultima_revisao: 2026-06-19
---

# 📒 Strategic Decision Log — decisões de visão/crescimento

> **Escopo:** decisões **estratégicas** (nichos, mercados, produtos, internacionalização). 
> **NÃO duplica** o Living OS: decisões **operacionais/executivas** (RLS, Redis, WhatsApp, OutboxWorker, ClimaGestor congelar/investir) vivem em [[../living-os/decisoes/decisoes-executivas|Decisões Executivas]] — aqui apenas **referenciamos**.
> Cada entrada: ideia · score · decisão · motivo · riscos · próxima ação · aprovação humana.

## Decisões estratégicas iniciais (2026-06-19)

### SD-001 | Consolidar BarberGestor antes de multiplicar verticais
- **Score:** 4.6 (niche-radar) · **Confiança:** alta
- **Decisão:** **executar agora** (foco). 
- **Motivo:** vertical de prova; fundação P1 aberta. Multiplicar nichos sobre base frágil multiplica risco.
- **Riscos:** custo de oportunidade (segurar outros nichos). Mitigado: nichos ficam em "estudar/incubar".
- **Próxima ação:** fechar Camada 1 ([[../production-readiness|readiness]]).
- **Aprovação humana:** não requer (mantém o foco atual).

### SD-002 | BeautyGestor como 2º vertical comercial candidato
- **Score:** 4.5 · **Confiança:** média
- **Decisão:** **colocar no roadmap** (pós-fundação + boundary-map).
- **Motivo:** quase 1:1 com Barber (booking+clientes+billing) → maior reuso do Core.
- **Riscos:** sem `core-vs-vertical-boundary-map`, vira fork barber-hardcoded (A-024).
- **Próxima ação:** publicar boundary-map antes de iniciar.
- **Aprovação humana:** **requer** (novo vertical = investimento). Encaminhar quando fundação fechar.

### SD-003 | Portugal como primeiro estudo internacional
- **Score:** market-radar = estudar · **Confiança:** média
- **Decisão:** **estudar** (não executar).
- **Motivo:** mesma língua (pt) reduz fricção; porta de entrada EU-lite.
- **Riscos:** EUR + GDPR + transferência de dados (sa-east-1) + i18n inexistente.
- **Próxima ação:** i18n Fase 0 ([[internationalization-requirements]]) + benchmark Portugal ([[global-benchmark-memory]]).
- **Aprovação humana:** **requer** antes de qualquer build i18n.

### SD-004 | Clube de assinatura (barber/beauty)
- **Score:** futurist-engine · **Confiança:** média
- **Decisão:** **colocar no roadmap**.
- **Motivo:** fortalece Billing recorrente; aumenta LTV; baixo esforço (capability existe).
- **Riscos:** depende de [[../living-os/decisoes/decisoes-executivas|fluxo trial→pago E2E]] (A-022).
- **Próxima ação:** após billing E2E validado.
- **Aprovação humana:** requer (decisão de produto/receita).

### SD-005 | IA recepcionista (WhatsApp)
- **Score:** futurist-engine · **Confiança:** baixa
- **Decisão:** **estudar** — gated por compliance.
- **Motivo:** diferencial forte (WhatsApp-first), mas exige IA voltada ao cliente.
- **Riscos:** OWASP LLM Top 10 (prompt injection, PII), AI Act se UE, custo LLM. WhatsApp ainda mock (D-003).
- **Próxima ação:** passar por [[compliance-intelligence]]; depende de WhatsApp real.
- **Aprovação humana:** **requer** + revisão jurídica.

## Decisões operacionais relacionadas (referência — vivem no Living OS)
D-001 RLS · D-002 Redis · D-003 WhatsApp · D-004 OutboxWorker · D-005 ClimaGestor → [[../living-os/decisoes/decisoes-executivas|Decisões Executivas]]. Este log **não** as decide.

## Regra de promoção
Nenhuma decisão estratégica vira missão na fila automaticamente. Vira `next-task.md` só por **promoção humana/Claude Code** após a dependência satisfeita (auditor-flow). Decisões com `aprovação humana: requer` ficam pendentes até o humano decidir.

## Links
- [[global-vision-architect]] · [[niche-radar]] · [[product-futurist-engine]] · [[../living-os/decisoes/decisoes-executivas|Decisões Executivas]]
