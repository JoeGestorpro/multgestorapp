# Governança — MultGestor

> **Status:** OFICIAL • VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[areas/operacao/ops/visao-geral]] · [[constituicao]] · [[rules/README]] · [[fonte-unica-verdade]]

---

## Estrutura de Governança

```
Constitution (regras invioláveis)
  └── Source of Truth (hierarquia de autoridade)
      └── Rules (regras executáveis)
          └── Audit Flow (fluxo de auditoria)
              └── Mission Closing Protocol (encerramento)
```

## Documentos de Governança

| Documento | Função | Local |
|---|---|---|
| Constituição | Regras invioláveis | [[constituicao]] |
| Fonte da Verdade | Hierarquia de autoridade | [[fonte-unica-verdade]] |
| Context Confidence | CHECK 0 pré-missão | [[confianca-contexto]] |
| Auditor Flow | Fluxo de auditoria | [[rules/auditor-flow]] |
| Event Contracts | Contratos de eventos | [[rules/event-contracts]] |
| Route Protection | Proteção de rotas | [[rules/route-protection-abuse-control]] |
| Mission Closing | Encerramento de missões | [[ops/mission-closing-protocol]] |

## Princípios de Governança

1. **Uma missão por vez**
2. **Stage seletivo** (sem `git add -A`)
3. **Push só com confirmação humana**
4. **CHECK 0 antes, Loop de Fechamento depois**
5. **Segundo Cérebro sempre atualizado**

## Referências

- [[constituicao]] — Regras invioláveis
- [[fonte-unica-verdade]] — Hierarquia de autoridade
- [[rules/README]] — Índice de regras
- [[ops/mission-closing-protocol]] — Protocolo de encerramento
