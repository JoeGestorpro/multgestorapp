# Modelo de Missão — Refatoração

> Para missões que melhoram código existente sem mudar comportamento externo.
> Risco típico: 2-4.
> Skills típicas: backend, frontend, testes, code-review
> Agentes típicos: Platform Architect, Backend Specialist, QA Engineer

## Prompt de Refatoração

### Objetivo da refatoração

[O que motivou — código duplicado, complexidade alta, dívida técnica]

### Escopo

**O que refatorar:**
- [arquivos/pastas]
- [padrões a melhorar]

**O que NÃO mudar:**
- [comportamento externo]
- [contratos de API]

### Comportamento que deve ser preservado

- [funcionalidade 1 deve continuar igual]
- [funcionalidade 2 deve continuar igual]
- [contrato de API não muda]

### Padrões desejados

- [padrão a seguir]
- [padrão a eliminar]

### Critérios de aceite

- [ ] comportamento externo idêntico
- [ ] código mais limpo/mantível
- [ ] testes passando (sem modificar testes de comportamento)
- [ ] sem regressão

### Checklist

- [ ] entendeu o código existente
- [ ] comportamento externo não mudou
- [ ] testes existentes continuam passando
- [ ] documentação atualizada se necessário

### Relatório esperado

1. o que foi refatorado
2. padrões aplicados
3. arquivos alterados
4. testes realizados
5. riscos de regressão
