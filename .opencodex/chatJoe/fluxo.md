# Fluxo de operação do chatJoe

> O ciclo completo: chatJoe planeja, Executor executa, Auditor revisa, chatJoe compacta.

## Fluxo diário

`
         ┌─────────────────────────────────┐
         │         USUÁRIO DIGITA           │
         │       chatJoe iniciar            │
         └──────────────┬──────────────────┘
                        ▼
         ┌─────────────────────────────────┐
         │     chatJoe carrega estado      │
         │   mostra projeto ativo e ação   │
         └──────────────┬──────────────────┘
                        ▼
         ┌─────────────────────────────────┐
         │  USUÁRIO: chatJoe preparar      │
         │  missão "<objetivo>"            │
         └──────────────┬──────────────────┘
                        ▼
         ┌─────────────────────────────────┐
         │    CHATJOE classifica missão    │
         │    mede risco                   │
         └──────────────┬──────────────────┘
                        ▼
         ┌─────────────────────────────────┐
         │    ROTEADOR sugere skills       │
         │    ROTEADOR sugere agentes      │
         └──────────────┬──────────────────┘
                        ▼
         ┌─────────────────────────────────┐
         │   SKILLGATE: usuario confirma   │
         │   ou ajusta skills/agentes      │
         │   + justificativa registrada    │
         └──────────────┬──────────────────┘
                        ▼
         ┌─────────────────────────────────┐
         │  chatJoe gera plano             │
         └──────────────┬──────────────────┘
                        ▼
         ┌─────────────────────────────────┐
         │  chatJoe gerar prompt executor  │
         │  (bloqueado se gate falhou)     │
         └──────────────┬──────────────────┘
                        ▼
         ┌─────────────────────────────────┐
         │   USUÁRIO copia prompt e vai    │
         │   para sala do EXECUTOR         │
         └──────────────┬──────────────────┘
                        ▼
         ┌─────────────────────────────────┐
         │     EXECUTOR executa e          │
         │     gera relatório              │
         └──────────────┬──────────────────┘
                        ▼
         ┌─────────────────────────────────┐
         │ USUÁRIO cola relatório:         │
         │ chatJoe analisar relatório      │
         └──────────────┬──────────────────┘
                        ▼
         ┌─────────────────────────────────┐
         │    CHATJOE analisa relatório    │
         │    compara com prompt original  │
         └──────────────┬──────────────────┘
                        ▼
      ┌────────────────────────────────────┐
      │     Risco 4 ou 5?                  │
      │     ─► gerar auditoria final       │
      │     ─► AUDITOR revisa              │
      │     ─► aprova ou pede correções    │
      └────────────────────────────────────┘
                        ▼
         ┌─────────────────────────────────┐
         │  chatJoe fechar contexto        │
         │  compacta, registra, encerra    │
         └─────────────────────────────────┘
`

## Modos de operação

| Modo | Quando usar | O que acontece |
|---|---|---|
| **PLAN_ONLY** | padrão, risco 1-3 sem auditoria | só planeja, não executa |
| **PLAN_ONLY + AUDIT** | risco 4-5 | planeja + gera auditoria |
| **EXECUTOR** | sala separada | executa o prompt |
| **AUDITOR** | após execução de risco 4-5 | revisa e aprova |

## Regras do fluxo

1. nunca começar pela execução
2. sempre medir risco antes de gerar prompt
3. risco 4 ou 5 sempre exige auditoria final
4. sempre compactar antes de fechar contexto
5. nunca misturar contexto de projetos diferentes
6. todo prompt para executor deve ter skills, agentes e critérios de aceite
7. toda missão deve passar pelo SkillGate antes de gerar prompt executor
8. mínimos de skills/agentes por risco devem ser respeitados (SkillGate)
9. toda skill e agente deve ter justificativa registrada


