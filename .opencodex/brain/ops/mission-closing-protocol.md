# Mission Closing Protocol — Knowledge OS V3

> **Status:** OFICIAL • VINCULANTE
> **Atualizado:** 2026-06-24
> **Propósito:** Fluxo obrigatório de encerramento de toda missão — garantir que o Knowledge OS seja atualizado antes de APPROVE.
> **Base:** [[constitution-knowledge-os]] (Art. 2.4)

---

## Fluxo Obrigatório

Toda missão **deve** terminar executando os passos abaixo em ordem:

```
MISSÃO CONCLUÍDA
    │
    ▼
 1. IMPLEMENTAÇÃO VERIFICADA
    │ Testes passam? Código revisado?
    ▼
 2. TESTES VALIDADOS
    │ Unit + Integration + (se aplicável) E2E
    ▼
 3. AUDITORIA REALIZADA
    │ Regras seguidas? Critérios de aceite atendidos?
    ▼
 4. KNOWLEDGE OS ATUALIZADO
    │ constitution-knowledge-os respeitada?
    │ Documentação relevante atualizada?
    ▼
 5. KNOWLEDGE GRAPH ATUALIZADO
    │ Novos wikilinks? Relacionamentos mapeados?
    ▼
 6. MEMÓRIA ATUALIZADA
    │ Lições? Decisões? Timeline?
    ▼
 7. CURRENT STATE ATUALIZADO
    │ project-state.md + 01-CURRENT-STATE.md
    ▼
 8. ROADMAP ATUALIZADO
    │ Se mudou prioridade/escopo/prazos
    ▼
 9. BACKLOG ATUALIZADO
    │ Novos itens? Itens concluídos?
    ▼
10. PRÓXIMA MISSÃO GERADA
    │ next-task.md atualizado com a próxima ação
    ▼
11. CONTEXT PACK REGENERADO
    │ node scripts/generate-context-pack.js — avisar o Joe
    ▼
APPROVE / REQUEST_CHANGES
```

---

## Checklist Detalhado

### 1. Implementação Verificada
- [ ] Código implementa o que foi planejado?
- [ ] Código segue padrões do projeto? (CommonJS, async/await, company_id)
- [ ] Event contracts respeitados?
- [ ] Rate limit aplicado em novas rotas?
- [ ] RLS cobre novas tabelas?
- [ ] Sem secrets hardcoded?
- [ ] Logs sem dados sensíveis?

### 2. Testes Validados
- [ ] Unit tests passando?
- [ ] Integration tests passando?
- [ ] (Se aplicável) E2E validado?
- [ ] Testes novos adicionados para o código novo?

### 3. Auditoria Realizada
- [ ] Regras de governança seguidas? ([[rules/README]])
- [ ] Critérios de aceite atendidos?
- [ ] Context Confidence respeitado? ([[context-confidence-engine]])
- [ ] Stage seletivo (sem `git add -A`)?

### 4. Knowledge OS Atualizado
- [ ] [[constitution-knowledge-os]] respeitada?
- [ ] Documentação relevante atualizada?
- [ ] Wikilinks consistentes?
- [ ] Novos arquivos criados? (se necessário)
- [ ] Templates seguidos? (PRD, Decisão, Incidente, Lição)
- [ ] Índices atualizados? ([[INDEX]])
- [ ] Digital Twin atualizado? (se aplicável)
- [ ] Feature Genome criado? (se nova funcionalidade)
- [ ] Impact Graph criado? (se alteração cross-área)

### 5. Knowledge Graph Atualizado
- [ ] [[KNOWLEDGE-GRAPH]] atualizado com novos relacionamentos?
- [ ] [[KNOWLEDGE-OS]] atualizado com novas perguntas?
- [ ] Conectividade do grafo verificada?

### 6. Memória Atualizada
- [ ] Timeline atualizada? ([[03-TIMELINE]])
- [ ] Decisão registrada? ([[decisions/README]])
- [ ] Lição registrada? ([[lessons/README]])
- [ ] Incidente registrado? ([[incidents/README]])
- [ ] [[knowledge-memory]] atualizado?
- [ ] [[knowledge-health]] atualizado?

### 7. Current State Atualizado
- [ ] `project-state.md` atualizado? (state_version incrementado)
- [ ] `01-CURRENT-STATE.md` atualizado?
- [ ] Últimas missões registradas em [[03-TIMELINE]]?

### 8. Roadmap Atualizado
- [ ] Roadmap reflete novo estado?
- [ ] Itens concluídos marcados?
- [ ] Novos itens adicionados?

### 9. Backlog Atualizado
- [ ] `next-task.md` atualizado?
- [ ] `backlog.md` atualizado?
- [ ] Itens obsoletos removidos?

### 10. Próxima Missão
- [ ] `next-task.md` gerado com próxima ação?
- [ ] `current-task.md` limpo?
- [ ] Próxima missão tem contexto suficiente?

### 11. Context Pack Regenerado
- [ ] `node scripts/generate-context-pack.js` executado?
- [ ] Checagem de conteúdo sensível passou (exit 0)?
- [ ] Relatório final da missão avisa o Joe: **"Pack atualizado — substituir os arquivos no
      Claude Project"**? — obrigatório em TODA missão a partir de `knowledge/context-pack-padrao`
      (2026-07-04), é o elo humano que mantém o Claude Project sincronizado.

---

## Regras

1. **Pular etapas** requer justificativa por escrito no parecer de auditoria
2. **CHECK 0** deve ser refeito se a próxima missão for diferente da planejada
3. **Stage seletivo** — nunca `git add -A`
4. **Push** só com confirmação humana
5. **Migration** nunca direta em `main` sem PR
6. **Context Pack** (item 11) nunca é pulado silenciosamente — se a missão for PLAN_ONLY/
   read-only sem mudança de estado, registrar explicitamente "pack não regenerado: sem mudança
   de estado" em vez de simplesmente omitir o passo

## Referências

- [[constitution-knowledge-os]] — Constituição do Knowledge OS
- [[rules/auditor-flow]] — Fluxo de auditoria
- [[context-confidence-engine]] — Context Confidence
- [[00-HOME]] — Homepage
- [[01-CURRENT-STATE]] — Current state
- [[03-TIMELINE]] — Timeline
- [[KNOWLEDGE-GRAPH]] — Knowledge Graph
- [[KNOWLEDGE-OS]] — Knowledge OS
- [[decisions/README]] — Decision Center
- [[lessons/README]] — Lessons Library
- [[incidents/README]] — Incident Library
- [[knowledge-memory]] — Memória do conhecimento
- [[knowledge-health]] — Saúde do conhecimento
- [[knowledge-dna]] — DNA do conhecimento
