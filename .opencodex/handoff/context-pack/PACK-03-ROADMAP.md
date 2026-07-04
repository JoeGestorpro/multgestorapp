# PACK 03 — Roadmap e Release Gate

> ⚠️ **ARQUIVO GERADO — NÃO EDITAR À MÃO.** Fonte: `.opencodex/brain/EXECUTION-PLAYBOOK-PRODUCAO.md`.
> **Gerado em:** 2026-07-04 · **state_version de origem:** 25

---

## Release Gate — antes de QUALQUER deploy

```
☑ Migrations idempotentes testadas contra banco de teste local
☑ Smoke local completo
☑ Backup pré-deploy verificado
☑ Kill-switch/rollback documentado e testado
☑ Suíte completa (unit + integration) verde
☐ Merge origin/main resolvido                    ← HUMANO decide
☐ Push autorizado + canário pós-deploy observado ← HUMANO valida
```
Só declarar "release OK" com evidência, nunca com presunção. Rollback principal: remover
`APP_RUNTIME_URL` no Render reverte o isolamento de writes ao pool único.

---

## Roadmap P0 → P4 (produto/comercial)

| Prio | Item | Bloqueia |
|---|---|---|
| P0 | Merge + push + deploy do batch | Venda — nada vale sem deploy |
| P0 | Webhook seta `plan_type`+`trial_ends_at` | Self-service |
| P0 | `plans` em prod + produtos Kiwify + env Vercel | Self-service |
| P0 | Auto-ativar módulo no registro | Self-service |
| P0 | Termos de Uso + Política de Privacidade | Jurídico |
| P0 | Pagamento real/sandbox ponta a ponta | Confiança no circuito |
| P1 | CA TLS ativo no Render | Segurança |
| P1 | WhatsApp provider real | Promessa ao cliente |
| P1 | Alertas ativos (Sentry/uptime) | Detectar queda |
| P1 | FAQ + suporte + cancelamento no produto | Escala/LGPD |
| P1 | Restore drill agendado | Disaster recovery |
| P2 | Redis em prod · billing avançado · E2E · refactor | Escala/qualidade |
| P3 | Segundo nicho piloto | Crescimento |
| P4 | API pública / franquia / white-label | Decisão estratégica |

## Roadmap do Core (trilha paralela — não bloqueia venda do BarberGestor)

| Prio | Item | Status |
|---|---|---|
| P0 | Limpar acoplamento de nicho em `company.service.js` | ✅ CONCLUÍDO (D-017) |
| P0 | Corrigir guard de auth de `clima.routes.js` | ✅ CONCLUÍDO (D-017) |
| P0 | Generalizar scopes hardcoded no frontend | ✅ CONCLUÍDO (D-017) |
| P1 | Registry dinâmico de rotas por módulo | Pendente — maior alavanca de extensibilidade |
| P1 | Migration-template parametrizável para nicho | Pendente |
| P1 | Ativação automática de módulo por `niche_type` | Pendente |
| P2 | Contrato genérico Bookable/Provider | Pendente |
| — | Decisão: ClimaGestor piloto real ou congelado | Pendente (D-005) |

## Ordem de execução — próximos 30 dias

```
Semana 1 — Circuito de receita
  merge+deploy → webhook plan_type → plans/Kiwify/env Vercel
  → auto-ativação registro → termos/LGPD rascunho → 1 pagamento real

Semana 2 — Confiança e compliance
  publicar termos/LGPD → FAQ/suporte → alertas ativos → restore drill

Semana 3 — Self-service sem sustos
  WhatsApp real → cancelamento/exclusão no produto → limpeza de artefatos

Semana 4 — Preparar escala
  Redis prod → CA TLS → métricas reais de billing → decisão: escalar ou consolidar
```

## Critério objetivo para "Enterprise Ready"

1. Release Gate 100% ✔ na coluna comercial/legal.
2. Um cliente externo completa o funil sozinho (registro → pagamento → ativação → 1º
   agendamento) sem toque humano.
3. Alerta ativo notifica queda de produção em <5 minutos.
4. Restore de backup re-testado nos últimos 90 dias.
5. Termos de Uso e Política de Privacidade publicados e linkados no registro.
6. Enterprise Maturity Index > 75/100.
7. Core Completion Index > 75/100.

Até lá, o estado correto para comunicação externa é **"pronto para operação assistida"**, nunca
"Enterprise Ready".
