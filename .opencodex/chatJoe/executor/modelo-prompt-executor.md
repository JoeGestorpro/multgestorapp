# Modelo de Prompt para Executor

> Template completo para gerar prompts que serão executados pelo Executor.
> Preencha todas as seções obrigatórias antes de entregar ao Executor.

---

## Prompt para Executor

### Contexto do projeto

Projeto: [nome do projeto]
Repositório: [caminho]
Branch: [branch]
Missão: [título da missão]

### Contexto da missão

[Resumo do que levou a esta missão. O problema a ser resolvido. 2-4 frases.]

### Escopo

**Dentro do escopo:**
- [item 1]
- [item 2]

**Fora do escopo:**
- [item 1]
- [item 2]

### Restrições

- [restrição técnica 1]
- [restrição técnica 2]
- [restrição de segurança 1]
- [restrição de arquitetura 1]

### Skills selecionadas (SkillGate — obrigatório)

Cada skill deve incluir justificativa.

- [skill 1] — [o que verificar] — justificativa: [por que essa skill]
- [skill 2] — [o que verificar] — justificativa: [por que essa skill]

### Agentes selecionados (SkillGate — obrigatório)

Cada agente deve incluir justificativa.

- [agente 1] — [papel na missão] — justificativa: [por que esse agente]
- [agente 2] — [papel na missão] — justificativa: [por que esse agente]

### Risco

Nível: [1-5]

[Se risco 3+, incluir seção de atenção]
[Se risco 4+, incluir alerta de auditoria obrigatória]

### SkillGate — aprovação

```
Skills:    [skills definidas + justificativas]
Agentes:   [agentes definidos + justificativas]
Mínimos:   [ok / ajustado manualmente]
Aprovado:  chatJoe + usuário
Data:      [data]
```

### Checklist pré-execução

- [ ] CHECK 0: carregou contexto do projeto?
- [ ] CHECK 1: entendeu escopo e restrições?
- [ ] CHECK 2: leu arquivos relevantes?
- [ ] CHECK 3: missão não existe em queue/current-task.md?
- [ ] CHECK 4: não tem perigo de alterar código fora do escopo?

### Critérios de aceite

- [ ] [critério 1]
- [ ] [critério 2]
- [ ] [critério 3]

### Arquivos prováveis

- [arquivo 1] — [propósito]
- [arquivo 2] — [propósito]

### Relatório esperado

Após executar, o Executor deve entregar:
1. resumo do que foi feito
2. arquivos alterados (se aplicável)
3. o que foi testado
4. riscos identificados
5. pendências ou próximos passos

