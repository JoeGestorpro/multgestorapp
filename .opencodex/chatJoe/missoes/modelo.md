# Modelo de Missao — chatJoe

> Objeto formal de missao. Toda missao segue este modelo.
> Campos obrigatorios marcados com (*).

---

## Estrutura da missao

`
ID:            [identificador unico, ex: MSS-001] (*)
Projeto:       [nome do projeto] (*)
Objetivo:      [frase clara do que sera feito] (*)
Modo:          PLAN_ONLY | PLAN_ONLY + AUDIT
Risco:         [1-5] (*)
Status:        [ver lista abaixo] (*)
Tipo:          [ver tipos no roteador.md] (*)

Skills:        [lista de skills] (*)
Agentes:       [lista de agentes] (*)
Justificativa: [por que cada skill/agente foi escolhido] (*)

Plano:         [passos detalhados]
Prompt executor: [link ou referencia]
Relatorio executor: [link ou referencia]
Auditoria:     [link ou referencia]
Compactacao:   [link ou referencia]

Dependencias:  [missoes que precisam ser concluidas antes]
Blocos:        [missoes que dependem desta]

Timeline:
  - yyyy-mm-dd: missao criada
  - yyyy-mm-dd: risco calculado
  - yyyy-mm-dd: skillgate aprovado
  - yyyy-mm-dd: plano gerado
  - yyyy-mm-dd: prompt executor gerado
  - yyyy-mm-dd: executor concluiu
  - yyyy-mm-dd: relatorio analisado
  - yyyy-mm-dd: auditoria concluida
  - yyyy-mm-dd: compactacao final
`

## Status possiveis

| Status | Descricao |
|---|---|
| **rascunho** | Acabou de ser criada, sem classificacao |
| **aguardando_risco** | Tipo definido, risco ainda nao calculado |
| **aguardando_skillgate** | Risco calculado, aguardando confirmacao de skills/agentes |
| **plano_gerado** | Plano aprovado, pronto para prompt |
| **prompt_gerado** | Prompt executor criado, aguardando execucao |
| **em_execucao** | Executor recebeu o prompt |
| **relatorio_recebido** | Executor concluiu, relatorio disponivel |
| **aguardando_auditoria** | Risco 4-5 exige auditoria |
| **aprovado** | Missao concluida e aprovada |
| **correcao_necessaria** | Auditoria ou revisao pediu ajustes |
| **fechado** | Compactado e encerrado |
| **cancelado** | Nao sera executada |

## Template de missao (para copiar)

`
## Missao: MSS-XXX

**Projeto:** 
**Objetivo:** 
**Modo:** PLAN_ONLY
**Risco:** 
**Status:** rascunho
**Tipo:** 

### Skills e Agentes

**Skills:** 
**Agentes:** 
**Justificativa:** 

### Plano

1. 

### Timeline

- : missao criada
