# Checklist Pré-Execução

> Verificações obrigatórias ANTES de enviar um prompt para o Executor.

## Contexto

- [ ] projeto ativo está definido em estado-atual.md
- [ ] contexto do projeto foi carregado
- [ ] decisões recentes foram consultadas
- [ ] última compactação foi revisada

## Missão

- [ ] tipo de missão foi classificado no roteador
- [ ] risco foi medido (1-5)
- [ ] risco 4 ou 5: auditoria final está marcada como obrigatória
- [ ] skills apropriadas foram selecionadas
- [ ] agentes apropriados foram selecionados

## Prompt

- [ ] prompt segue o modelo em executor/modelo-prompt-executor.md
- [ ] escopo está claramente delimitado (dentro x fora)
- [ ] restrições estão documentadas
- [ ] critérios de aceite estão definidos
- [ ] arquivos prováveis foram listados

## SkillGate

- [ ] skills foram definidas e justificadas?
- [ ] agentes foram definidos e justificados?
- [ ] mínimos por risco foram respeitados? (ver roteador.md)
- [ ] se risco 3+: QA ou Platform Architect presente?
- [ ] se risco 4+: Security Auditor presente?
- [ ] se risco 5+: Security Auditor + Platform Architect presentes?

## Segurança

- [ ] nenhum secret ou credencial está no prompt
- [ ] não está pedindo alteração em produção sem auditoria
- [ ] não está misturando contexto de outro projeto
- [ ] operação pode ser desfeita se algo der errado

## Queue

- [ ] queue/current-task.md está idle (se aplicável)
- [ ] se relevante, missão será registrada em queue/next-task.md (com confirmação)

