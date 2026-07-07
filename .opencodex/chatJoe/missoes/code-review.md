# Modelo de Missão — Code Review

> Para missões que revisam código de uma implementação.
> Risco típico: 1-3.
> Skills típicas: code-review, backend, frontend, seguranca, testes
> Agentes típicos: Platform Architect, Security Auditor, QA Engineer

## Prompt de Code Review

### O que revisar

[PR, branch, commits, ou arquivos específicos]

### Contexto da mudança

[O que a implementação se propõe a fazer]

### Foco da revisão

- [aspecto 1: lógica de negócio]
- [aspecto 2: segurança]
- [aspecto 3: performance]
- [aspecto 4: padrões do projeto]
- [aspecto 5: testes]

### Checklist de revisão

- [ ] lógica está correta?
- [ ] boa cobertura de testes?
- [ ] segue padrões do projeto?
- [ ] segurança: vazamento de dados, validação?
- [ ] performance aceitável?
- [ ] tratamento de erros adequado?
- [ ] documentação atualizada?
- [ ] sem código morto/comentado?

### Riscos

- [risco identificado 1]
- [risco identificado 2]

### Formato do relatório

1. resumo da revisão
2. pontos positivos
3. problemas encontrados (críticos/médios/leves)
4. sugestões de melhoria
5. aprova ou solicita alterações
