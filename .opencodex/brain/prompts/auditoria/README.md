# Prompts de Auditoria

> **Status:** VIVO
> **Relacionamentos:** [[prompts/README]] · [[ops/playbooks]] · [[incidents/README]] · [[rules/README]]

---

## Prompt: Auditar Missão

```
Execute a auditoria pós-missão para [MISSÃO].

1. O código implementa o que foi planejado?
2. Todos os critérios de aceite foram atendidos?
3. Testes passaram? Cobertura adequada?
4. EVENT CONTRACTS foram respeitados?
5. Rate limit aplicado em novas rotas?
6. RLS cobre novas tabelas?
7. Second Brain atualizado?
8. Algum risco novo identificado?
9. Lição aprendida registrada?
10. Veredito: APPROVE / REQUEST_CHANGES

Regras: [[rules/README]]
Fluxo: [[ops/mission-closing-protocol]]
```

## Referências

- [[rules/README]] — Regras
- [[ops/mission-closing-protocol]] — Protocolo de encerramento
- [[incidents/README]] — Incident Library
- [[lessons/README]] — Lessons Library
