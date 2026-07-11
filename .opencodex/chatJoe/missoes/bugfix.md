# Modelo de Missão — Bugfix

> Para missões que corrigem um erro específico.
> Risco típico: 2-4.
> Skills típicas: backend, frontend, banco-de-dados, testes, segurança
> Agentes típicos: Backend Specialist, QA Engineer

## Prompt de Bugfix

### Descrição do bug

[O que está acontecendo de errado]

### Passos para reproduzir

1. [passo 1]
2. [passo 2]
3. [resultado esperado x resultado atual]

### Comportamento esperado

[O que deveria acontecer]

### Causa provável (se conhecida)

[O que pode estar causando o bug]

### Escopo

**Dentro:**
- [corrigir o bug]
- [adicionar teste se não existir]

**Fora:**
- [não refatorar código adjacente]
- [não implementar novas features]

### Critérios de aceite

- [ ] bug não reproduz mais
- [ ] teste cobre o cenário
- [ ] sem regressão em funcionalidades próximas

### Checklist

- [ ] entendeu a causa raiz
- [ ] corrigiu sem quebrar outras coisas
- [ ] adicionou teste para o cenário
- [ ] verificou se não há outros lugares com o mesmo erro

### Relatório esperado

1. causa raiz identificada
2. o que foi alterado
3. como foi testado
4. riscos de regressão
