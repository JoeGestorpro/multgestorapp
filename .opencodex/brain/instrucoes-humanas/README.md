---
tipo: instrucao-humana
status: draft
requires_human_action: false
pode_conter_segredo: false
pode_executar_comando: false
---

# Índice de Instruções Humanas — MultGestor

> **Criado:** 2026-06-19
> **Propósito:** Centralizar documentos de instrução para toda intervenção humana necessária no projeto.
> Cada documento explica em português simples o que fazer, onde clicar, o que preencher e como validar.

## Missão ativa

| Documento | Missão | Prioridade | Status |
|---|---|---|---|
| [`backup-external-copy-b2.md`](backup-external-copy-b2.md) | `ops/backup-external-copy` — Cópia cloud do dump diário (Backblaze B2) | P1 | draft |
| [`register-backup-scheduler.md`](register-backup-scheduler.md) | `ops/register-daily-backup-scheduler` — Registrar agendamento diário no Windows | P0 | concluída (referência) |

## Instruções futuras (placeholder)

> Quando estas missões forem promovidas na fila, criar o documento correspondente.

- `secrets-rotation` — Rotação de secrets (Supabase, Render, GitHub, Vercel). Bloqueada por decisão humana.
- `runtime-role-staging-prod` — Troca da role de runtime no banco (Fase 2 staging / Fase 3 produção). PLAN_ONLY.
- `autopilot-runner-approval` — Aprovação das fases do Autopilot Runner. Requer revisão de segurança.

## Regras para usar estas instruções

1. Leia o documento inteiro antes de começar.
2. Nunca cole tokens, application keys, senhas ou connection strings no chat.
3. Siga a ordem dos passos — cada um tem pré-requisito.
4. Use o checklist final para confirmar que tudo foi feito.
5. O prompt seguro no final de cada documento é o único texto que pode ir no chat.
