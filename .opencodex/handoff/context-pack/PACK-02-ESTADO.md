# PACK 02 — Estado Atual

> ⚠️ **ARQUIVO GERADO — NÃO EDITAR À MÃO.** Fonte: `.opencodex/brain/01-CURRENT-STATE.md`.
> **Gerado em:** 2026-07-04 · **state_version de origem:** 25

---

## Fase atual

Pós-sprint P0 autônomo (técnico + Core), **aguardando release gate humano** para ir a produção.
Nada do trabalho abaixo tem efeito real até o push ser autorizado e o deploy acontecer.

## Os dois índices vigentes (não somar, não confundir)

| Índice | Nota | Mede | Fonte |
|---|---:|---|---|
| Enterprise Maturity Index | **57/100** (era 44,5 em 26/06) | Pronto para vender o BarberGestor hoje | `audits/2026-07-03-due-diligence-enterprise.md` |
| Core Completion Index | **52/100** (medido antes da correção D-017 — reavaliar) | Pronto para virar plataforma multi-nicho | `audits/2026-07-03-core-vs-nicho-audit.md` |

## Commits pendentes de deploy

- **34 commits locais em `main`, 0 no `origin/main`.** Um merge de `origin/main` já foi feito e
  testado localmente (commit `e661259`) — está pronto para push, aguardando só a autorização
  humana explícita ("APROVADO PUSH").
- Blocos principais: writes de tenant roteados para role sem bypass de RLS · rotação e revogação
  de refresh token · migrations recuperadas e versionadas · CSP habilitado · verificação de
  certificado TLS (código pronto, inativo até configurar) · 3 correções de acoplamento
  Core×Nicho (decisão D-017) · feature de produto (geladeira) nunca deployada · 2 auditorias
  completas + especificação oficial da plataforma.
- Evidência de teste no estado atual: suíte completa **678/678** · integração dedicada **98/98**
  · lint frontend **0 erros** · build ok · backup pré-deploy verificado (local + cópia externa).

## Missão atual / próxima

| Campo | Valor |
|---|---|
| Atual | `release/push-p0-batch` — aguardando confirmação humana explícita para push |
| Depois do push | Observar canário de produção por 24h antes de declarar a release concluída |
| Depois do canário | `core/billing-gating-self-service` (P0 Receita) — **bloqueada até o gate acima fechar** |

## Riscos ativos (vigentes)

| Risco | Severidade | Detalhe |
|---|---|---|
| Push pendente | 🔴 P0 | Nada do sprint técnico vale até deployar |
| Webhook não atualiza `plan_type` | 🔴 P0 | Já causou 1 incidente real (D-016); qualquer novo cliente pago sofreria o mesmo |
| Tabela `plans` vazia em produção | 🔴 P0 | Bloqueia checkout self-service |
| WhatsApp mock em produção | 🟡 P1 | Lembretes de agendamento não chegam de verdade |
| Sem alertas ativos de queda | 🟡 P1 | Ninguém é avisado se o sistema cair |
| ClimaGestor sem decisão de destino | 🟡 P1 | Condiciona o próximo P1 do Core (registry de rotas) |

## Achado de governança (transparência)

O documento-fonte `01-CURRENT-STATE.md` tem seções recentes (topo, 2026-07-03) precisas e
seções antigas (base do arquivo, ~2026-06-24) desatualizadas que ainda não foram removidas —
uma tabela de "Identificação" antiga cita `state_version 21` e um HEAD de commit de junho.
Este pack usa apenas as seções recentes/precisas. Recomenda-se uma missão de limpeza para
remover o conteúdo duplicado/stale do arquivo-fonte.
