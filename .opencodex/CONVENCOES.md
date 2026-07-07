# Convenções — Regras da Casa

Como contribuir com o Knowledge OS sem bagunçar.

---

## 1. Onde colocar cada coisa

| Tipo de conteúdo | Onde colocar |
|---|---|
| Conhecimento profundo (arquitetura, produto, engenharia) | [[brain/]] (organizado por camada) |
| Missões e tarefas | [[queue/]] |
| Regras vinculantes | [[rules/]] |
| Prompts prontos para IA | [[prompts/]] |
| Modelos reutilizáveis | [[templates/]] |
| Auditorias e verificações | [[audits/]] |
| Passagem de contexto entre fases | [[handoff/]] |
| Automações e políticas | [[automation/]] |
| Operação e deploy | [[ops/]] |
| Agentes e definições | [[agents/]] |

## 2. Quando usar [[brain/]] vs raiz

Se existe uma pasta com o mesmo nome na raiz e em [[brain/]]:

- O conteúdo **organizado** (com wikilinks, índices, navegação por camada) vai em [[brain/]].
- O conteúdo **direto** (arquivo avulso, sem camada de organização) vai na raiz.
- Se um arquivo existe em ambos, o [[brain/]] referencia o da raiz via [[../caminho/arquivo]].

## 3. Como nomear arquivos

- Use `snake_case.md` (ex: meu-arquivo.md → meu_arquivo.md)
- Prefixo numérico para ordem: `00-HOME.md`, `01-CURRENT-STATE.md`, `02-EXECUTIVE-DASHBOARD.md`
- Use letras maiúsculas para siglas: `RLS.md`, `CSP.md`, `ADR.md`
- Seja descritivo mas conciso: `auditoria-completa-2026-06-18.md`

## 4. Como escrever wikilinks

- Link relativo ao arquivo atual
- Use `[[arquivo]]` para links no mesmo diretório
- Use `[[pasta/arquivo]]` para subdiretórios
- Use `[[../pasta/arquivo]]` para diretórios acima
- Adicione alias: `[[arquivo|Texto Amigável]]`

## 5. Como documentar uma decisão

Use o template em [[brain/decisions/TEMPLATE-DECISION.md]]. Toda decisão deve ter:

- Contexto (por que a decisão foi necessária)
- Decisão (o que foi escolhido)
- Consequências (o que muda com essa decisão)
- Alternativas consideradas (e por que foram descartadas)

## 6. Checklist de contribuição

Antes de criar ou alterar um arquivo:

- [ ] O conteúdo está na pasta certa?
- [ ] O nome do arquivo segue `snake_case`?
- [ ] Adicionou wikilinks para documentos relacionados?
- [ ] Se é regra vinculante, está em [[rules/]]?
- [ ] Se é conhecimento profundo, está em [[brain/]] na camada certa?
- [ ] Verificou se já existe conteúdo similar em outra pasta?
- [ ] Atualizou o [[brain/INDEX.md]] se adicionou documento novo?

## 7. O que evitar

- **Não criar pastas novas** sem antes consultar o [[MAPA-DAS-PASTAS.md]]
- **Não duplicar conteúdo** — se algo já existe, referencie via wikilink
- **Não misturar responsabilidades** — cada pasta responde uma pergunta
- **Não usar maiúsculas sem necessidade** — `snake_case.md`, não `Meu Arquivo.md`
- **Não quebrar wikilinks** — se mover/renomear, atualize todas as referências
