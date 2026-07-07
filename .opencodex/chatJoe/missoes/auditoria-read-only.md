# Modelo de Missão — Auditoria READ_ONLY

> Para missões que envolvem apenas verificar código sem modificar nada.
> Risco típico: 1-5 (depende do que está sendo auditado).
> Skills típicas: backend, segurança, banco-de-dados, rls-review, auth-review, billing
> Agentes típicos: Platform Architect, Security Auditor, QA Engineer

## Prompt de Auditoria

### Objetivo da auditoria

[O que está sendo auditado e por quê]

### Escopo

**Dentro:**
- [arquivos/pastas para revisar]
- [aspectos para verificar]

**Fora:**
- [o que NÃO deve ser alterado]
- [o que está fora do escopo desta auditoria]

### Checklist de verificação

- [ ] lógica de negócio está correta?
- [ ] segurança: há vazamento de dados?
- [ ] isolamento multi-tenant: company_id está sendo respeitado?
- [ ] validação de entrada está presente?
- [ ] tratamento de erros está adequado?
- [ ] testes existentes cobrem os cenários?
- [ ] documentação está atualizada?
- [ ] riscos identificados?

### Riscos a observar

- [risco específico 1]
- [risco específico 2]

### Formato do relatório

1. resumo da auditoria
2. problemas encontrados (críticos, médios, leves)
3. recomendações
4. aprova ou pede correções
