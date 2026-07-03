# EXECUTION PLAYBOOK — Produção MultGestor

> **Status:** OFICIAL • VIVO — este é o manual único de execução para levar o MultGestor a
> um SaaS totalmente comercializável. Atualizar a cada release gate, não recriar do zero.
> **Última sincronização:** 2026-07-03 · **state_version:** 23
> **Fontes:** [[../01-CURRENT-STATE]] · [[../../audits/2026-07-03-due-diligence-enterprise]] ·
> [[../roadmaps/ROADMAP-MESTRE-MULTGESTOR-2026]]
> **Regra de honestidade:** nada aqui é aspiracional sem estar marcado. Ver escala de evidência
> na due diligence. Este arquivo cita fatos; não reargumenta o diagnóstico.

---

## 1. Estado atual (sincronizado com a última auditoria)

**Enterprise Maturity Index: 57/100** (2026-06-26 estava 44,5). Ver scorecard completo dos
20 domínios em [[../../audits/2026-07-03-due-diligence-enterprise]].

- Engenharia: 🟢 · Produto: 🟡 · Comercial: 🟡 · Self-Service: 🔴 · Compliance/LGPD: 🔴
- 29 commits locais em `main` prontos e testados, **zero push** (`ace2d05`..`7038f89`)
- `main` local diverge de `origin/main` (8 commits só no origin — PRs #20/#21, mesmo conteúdo
  recomitado). Dry-run de merge: 3 conflitos pequenos mapeados.
- Gargalo central: webhook de pagamento não atualiza `companies.plan_type` → cliente pago é
  bloqueado no fim do trial (causou o incidente real D-016 em 2026-06-29).

---

## 2. Production Readiness Gate

```
Arquitetura        ✔      Billing (gating)        ❌  P0-1
Banco              ✔      Checkout (env/plans)     ❌  P0-2/3
Segurança (código) ✔      Onboarding self-service  ❌  P0-4
RLS (reads prod)   ✔      LGPD/Termos              ❌  P0-5
RLS (writes)       ✔*     Suporte/FAQ              ❌  P1
Deploy/CI          ✔      Monitoramento/Alertas    ❌  P1
Backup/Restore     ✔      WhatsApp real            ❌  P1
Billing (técnico)  ✔      Cancelamento no produto  ❌  P1
Landing            ✔

* pronto no código local, aguardando deploy — ver Release Gate
```

**Leitura:** técnico pronto, comercial/legal não. Não confundir "está no código" com "está em
produção" — só o segundo conta para o veredito de venda.

---

## 3. Release Gate — antes de QUALQUER deploy

```
☑ Migrations idempotentes testadas contra banco de teste local
☑ Smoke local (roteiro completo — ver §7)
☑ Backup pré-deploy verificado
☑ Kill-switch/rollback documentado e testado
☑ Suíte completa (unit + integration) verde
☐ Merge origin/main resolvido                    ← HUMANO decide
☐ Canário pós-deploy observado (24h sem erro novo) ← HUMANO valida
```

Só declarar "release OK" quando as duas últimas linhas virarem ☑ com evidência (não com
presunção). Rollback: remover `APP_RUNTIME_URL` no Render reverte o RLS de writes ao pool único.

---

## 4. Roadmap P0 → P4

| Prio | Item | IA | Humano | Bloqueia | Esforço |
|---|---|---|---|---|---|
| P0 | Merge + push + deploy do batch | assiste | **decide/executa** | venda (nada vale sem deploy) | 1-2h |
| P0 | Webhook seta `plan_type`+`trial_ends_at` | ✅ | revisa | self-service | 2-4h |
| P0 | `plans` em prod + produtos Kiwify + env Vercel | ✅ SQL/código | ✅ contas | self-service | 2h |
| P0 | Auto-ativar módulo barber no registro | ✅ | revisa | self-service | 2h |
| P0 | Termos de Uso + Política de Privacidade (LGPD) | ✅ rascunho | **✅ revisão/advogado** | jurídico | 1-3d |
| P0 | Pagamento real/sandbox ponta a ponta | assiste | ✅ | confiança no circuito | 1h |
| P1 | CA TLS ativo no Render | ❌ | ✅ | segurança | 30min |
| P1 | WhatsApp provider real (Meta) | código pronto | ✅ conta | promessa ao cliente | 0.5-2d |
| P1 | Alertas (Sentry/UptimeRobot ativos) | config | ✅ contas | detectar queda | 2h |
| P1 | FAQ + tutoriais + página de suporte | ✅ | revisa | escala | 1-2d |
| P1 | Cancelamento/exclusão de conta no produto | ✅ | revisa | escala/LGPD | 2-3d |
| P1 | Restore drill agendado | ✅ | ✅ | DR | 2h |
| P2 | Redis em prod (rate limit distribuído) | config | ✅ addon | multi-instância | 1h |
| P2 | Upgrade/downgrade/dunning no billing | ✅ | revisa | escala | 3-5d |
| P2 | E2E Playwright do funil | ✅ | — | qualidade | 2-3d |
| P2 | Refactor Barber.jsx + warnings react-hooks | ✅ | — | manutenibilidade | 3-5d |
| P3 | 2º nicho piloto | ✅ | decide nicho | crescimento | 1-2sem |
| P4 | API pública / franquia / white-label | — | decisão estratégica | plataforma | — |

Critérios de aceite por item: ver [[../../audits/2026-07-03-due-diligence-enterprise]] §Matriz de
Responsabilidades e §Roadmap Executivo (não duplicar aqui — citar).

---

## 5. Ordem exata de execução (próximos 30 dias)

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

---

## 6. Checklists de validação (reaproveitar a cada deploy)

**Gates obrigatórios (código):**
```
npm run lint · npm run build · npm test · npm run test:integration
backend health check · public booking flow · auth flow · RLS isolation tests
```

**Smoke manual mínimo (produto):** login master · empresa ativa/inativa · plano premium ·
agenda pública · agendamento com serviceId · colaborador · cliente · atendimento · caixa ·
dashboard · logout/login · isolamento entre empresas. Roteiro completo:
[[../../audits/2026-07-02-auditoria-completa-e-sprint-p0]] §6.

---

## 7. Plano de rollback

| Componente | Ação de rollback |
|---|---|
| RLS de writes (app_runtime) | Remover `APP_RUNTIME_URL` no Render → volta ao pool único |
| Migrations | `continue-on-error` no deploy; se falhar, rodar `npm run migrate` manualmente com revisão |
| Refresh token rotation | Reverter para `main..f03af4d^` restaura o fluxo anterior (não recomendado sem motivo) |
| Deploy geral | Render permite rollback para o deploy anterior pela dashboard |
| Backup/dados | Restore do dump mais recente (local + B2), ver runbook de backup |

---

## 8. Histórico de auditorias

| Data | Documento | Maturity Index |
|---|---|---|
| 2026-06-18 | `auditoria-completa-2026-06-18.md` | — (24 achados) |
| 2026-06-26 | `2026-06-26-audit-completo.md` | 44,5/100 |
| 2026-07-02 | `2026-07-02-auditoria-completa-e-sprint-p0.md` | — (sprint técnico) |
| 2026-07-03 | `2026-07-03-due-diligence-enterprise.md` | **57/100** |

---

## 9. Critério objetivo para "Enterprise Ready"

O MultGestor será declarado **Enterprise Ready** quando, com evidência (não presunção):

1. Production Readiness Gate (§2) tiver 100% ✔ na coluna comercial/legal.
2. Um cliente externo (não JoeFelipe) completar o funil sozinho: registro → pagamento →
   ativação → primeiro agendamento recebido — sem qualquer toque humano.
3. Houver alerta ativo que notifique queda de produção em menos de 5 minutos.
4. Restore de backup tiver sido re-testado nos últimos 90 dias.
5. Termos de Uso e Política de Privacidade estiverem publicados e linkados no registro.
6. Maturity Index ultrapassar 75/100 no próximo ciclo de due diligence.

Até lá, o estado correto é **"pronto para operação assistida"**, não "Enterprise Ready" —
usar essa linguagem em qualquer comunicação externa (investidor, sócio, cliente grande).

---

## 10. Regras de manutenção deste arquivo

- Atualizar §1, §2 e §8 a cada auditoria nova ou release gate — não deixar divergir do código.
- Não apagar histórico de §8; adicionar linha nova.
- Mudança de escopo do roadmap (§4) exige nova entrada em §8 explicando o porquê.
- Este arquivo não substitui a due diligence detalhada — é o resumo operacional que aponta
  para ela. Detalhe técnico de cada achado fica nas auditorias (não duplicar aqui).
