# chatJoe — Central de planejamento e contexto do OpenCode

> chatJoe pensa, organiza e gera prompt.
> Executor executa.
> Auditor revisa.
> chatJoe registra, compacta e prepara a próxima missão.

## O que é

O chatJoe é a central local de conversa, planejamento, contexto, skills, agentes, compactação e geração de prompts dentro do OpenCode.

Ele funciona como um "ChatGPT interno do projeto": entende a estrutura, os documentos e o código do repositório para orientar decisões.

## Regra de ouro

**Nunca começar pela execução.**

Sempre:
1. entender o projeto;
2. carregar contexto;
3. classificar a missão;
4. escolher skills;
5. escolher agentes;
6. medir risco;
7. decidir se precisa auditoria;
8. só então gerar prompt para executor.

## Papéis do sistema

| Papel | Responsabilidade |
|---|---|
| **chatJoe** | planejar, organizar, classificar missão, gerar prompt, compactar, registrar decisões |
| **Executor** | receber prompt pronto, executar, gerar relatório |
| **Auditor** | revisar entrega, verificar riscos, validar critérios, aprovar ou pedir correções |

## Modo padrão

**PLAN_ONLY.** O chatJoe nunca executa código. Ele prepara. A execução fica com o Executor.

## Comandos principais

Veja [[comandos.md]] para a lista completa.

| Comando | O que faz |
|---|---|
| \chatJoe iniciar\ | carrega estado, mostra próximo passo |
| \chatJoe estado\ | mostra projeto ativo e missão atual |
| \chatJoe preparar missão <objetivo>\ | classifica, mede risco, sugere skills/agentes |
| \chatJoe gerar prompt executor\ | gera prompt completo para colar no Executor |
| \chatJoe compactar\ | resume conversa e salva compactação |
| \chatJoe fechar contexto\ | finaliza sessão, registra pendências |

## Estrutura de pastas

`
chatJoe/
  README.md              ← você está aqui
  estado-atual.md        ← estado ativo do chatJoe
  comandos.md            ← todos os comandos
  fluxo.md               ← fluxo de operação
  roteador.md            ← classifica missão por tipo e risco
  projetos/              ← projetos internos
    _template/           ← template copiado ao criar projeto
  skills/                ← registry de skills
  agentes/               ← registry de agentes
  memoria/               ← regras, decisões e preferências globais
  executor/              ← modelo de prompt e checklists
  compactacoes/          ← modelo de compactação
  missoes/               ← templates por tipo de missão
`

## Links rápidos

- [[comandos.md|Comandos]]
- [[fluxo.md|Fluxo de operação]]
- [[roteador.md|Roteador de missão]]
- [[../HOME.md|OpenCodex Home]]
