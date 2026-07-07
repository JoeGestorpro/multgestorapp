# 📐 Planner — Geração de Planos

> **Status:** OFICIAL • VIVO
> **Camada:** 3 — Inteligência
> **Propósito:** Documentar como os planos de execução são gerados a partir das missões do MultGestor.
> **Relacionamentos:** [[agents/README]] · [[agents/mission-builder]] · [[agents/agent-skill-matrix]] · [[context-confidence-engine]]

---

## O que é o Planner

O **Planner** é o processo que transforma uma missão (definida pelo Mission Builder) em um **plano de execução detalhado**. Ele define:
- Passos sequenciais
- Dependências
- Documentos a consultar
- Riscos a mitigar
- Checklist de verificação

## Estrutura de um Plano

```
PLANO: [Título]

MISSÃO: [Link para a missão]

CHECK 0 (Context Confidence): [score]

PASSOS:
1. [Passo 1]
   - Ação:
   - Documentos consultar:
   - Documentos atualizar:
   - Risco:

2. [Passo 2]
   ...

DEPENDÊNCIAS:
- [Dependência 1]
- [Dependência 2]

DOCUMENTOS A CONSULTAR:
- [Documento]

DOCUMENTOS A ATUALIZAR:
- [Documento]

RISCOS:
- [Risco] → [Mitigação]

VERIFICAÇÃO:
- [ ] Passo 1 concluído
- [ ] Passo 2 concluído
- [ ] Testes passando
- [ ] Documentação atualizada

APROVAÇÃO:
- [ ] Plano aprovado
```

## Fluxo de Planejamento

```
MISSÃO DEFINIDA (Mission Builder)
  ↓
CHECK 0 — Context Confidence
  ├── Score ≥ 95 → Executar
  ├── Score 80-94 → Planejar apenas
  ├── Score 70-79 → Investigar
  └── Score < 70 → PARAR e perguntar
  ↓
CONSULTA AO GRAFO DE CONHECIMENTO
  ├── Digital Twin (estado atual do módulo)
  ├── Decision Graph (decisões anteriores)
  ├── Impact Graph (impacto de alterações)
  ├── Incident Library (problemas anteriores)
  └── Lessons Library (lições aprendidas)
  ↓
GERAÇÃO DOS PASSOS
  ├── Sequência lógica
  ├── Dependências
  └── Risco por passo
  ↓
ESTIMATIVA DE ESFORÇO
  ↓
CHECKLIST DE VERIFICAÇÃO
  ↓
APROVAÇÃO DO PLANO (humana ou automática)
  ↓
EXECUÇÃO
```

## Tipos de Plano

| Tipo | Descrição | Complexidade | CHECK 0 Mínimo |
|---|---|---|---|
| **Plano Simples** | 1-3 passos, baixo risco | 🟢 Baixa | 85 |
| **Plano Moderado** | 4-8 passos, risco médio | 🟡 Média | 90 |
| **Plano Complexo** | 9+ passos, alto risco | 🔴 Alta | 95 |
| **Plano Estratégico** | Múltiplas fases, incerteza | 🔴 Alta | 95 |

## Regras

1. **CHECK 0 < 70**: plano NÃO pode ser executado — pedir mais contexto
2. **CHECK 0 70-79**: apenas investigação, sem execução
3. **CHECK 0 80-94**: planejar mas revisar antes de executar
4. **CHECK 0 ≥ 95**: executar conforme plano
5. Todo plano deve ter verificação pós-execução
6. Planos com `EXECUTE_WITH_REVIEW` exigem auditoria explícita

## Boas Práticas

1. Passos pequenos e verificáveis
2. Cada passo deve ter critério de "pronto" claro
3. Riscos identificados antes da execução
4. Documentos a atualizar listados explicitamente
5. Tempo estimado por passo (quando aplicável)

## Referências

- [[agents/README]] — AI Brain
- [[agents/mission-builder]] — Construção de missões
- [[agents/agent-skill-matrix]] — Matriz de agentes
- [[context-confidence-engine]] — Context Confidence
- [[ops/mission-closing-protocol]] — Protocolo de encerramento
- [[constitution-knowledge-os]] — Constituição do Knowledge OS
