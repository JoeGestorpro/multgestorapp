# Comandos do chatJoe

> Todos os comandos funcionam como instruções em markdown.
> Você digita o comando na conversa com o agente IA, e ele segue o fluxo documentado.

## Inicialização

### \chatJoe iniciar\

Carrega o estado atual do chatJoe, identifica o projeto ativo e mostra a próxima ação recomendada.

Fluxo:
1. ler \estado-atual.md\
2. identificar projeto ativo
3. carregar contexto do projeto (se houver)
4. mostrar resumo e próximo passo

### \chatJoe estado\

Mostra o projeto ativo, missão atual, risco atual, última compactação e próxima ação.

Fluxo:
1. ler \estado-atual.md\
2. exibir informações formatadas

## Projetos

### \chatJoe criar projeto <nome>\

Cria um novo projeto interno no chatJoe.

Fluxo:
1. criar pasta \projetos/<nome>/\
2. copiar template de \projetos/_template/\
3. perguntar objetivo inicial
4. atualizar \estado-atual.md\ com projeto ativo

### \chatJoe entrar projeto <nome>\

Entra em um projeto existente.

Fluxo:
1. verificar se pasta \projetos/<nome>/\ existe
2. carregar \contexto.md\, \decisoes.md\, última compactação
3. atualizar \estado-atual.md\ com projeto ativo

## Missões

### \chatJoe preparar missão <objetivo>\

Prepara uma missão completa.

Fluxo:
1. entender o objetivo
2. classificar tipo de missão (ver [[roteador.md]])
3. medir risco (1 a 5)
4. ROTEADOR sugere skills automaticamente (ver [[roteador.md|SkillGate]])
5. ROTEADOR sugere agentes automaticamente (ver [[roteador.md|SkillGate]])
6. usuário CONFIRMA ou AJUSTA skills e agentes
7. JUSTIFICATIVA registrada (por que cada skill/agente foi escolhido)
8. verificar mínimos por risco (SkillGate)
9. decidir se precisa auditoria (risco 4 ou 5 exige)
10. gerar plano

### \chatJoe gerar prompt executor\

Gera um prompt completo para o Executor.

**SkillGate:** Antes de gerar, verifica:
- skills definidas e justificadas?
- agentes definidos e justificados?
- mínimos por risco respeitados?
Se algo faltar, bloqueia e avisa.

Fluxo:
1. executar verificação do SkillGate
2. se bloqueado: exibir mensagem e listar o que falta
3. se aprovado: carregar missão preparada
4. usar \executor/modelo-prompt-executor.md\
5. preencher contexto, escopo, restrições, critérios de aceite, justificativas
6. incluir checklist pré-execução
7. exibir prompt para copiar

### \chatJoe analisar relatório executor\

Analisa o relatório do Executor após a execução.

Fluxo:
1. receber relatório colado pelo usuário
2. comparar com prompt original
3. verificar riscos
4. registrar decisões
5. sugerir próxima ação

### \chatJoe gerar auditoria final\

Gera prompt de auditoria para revisar entrega do Executor.

Fluxo:
1. carregar prompt original e relatório
2. usar modelo de missão de auditoria
3. gerar prompt com critérios de aceite
4. indicar riscos para o Auditor revisar

## Contexto

### \chatJoe compactar\

Resume a conversa atual e salva uma compactação.

Fluxo:
1. usar \compactacoes/modelo-compactacao.md\
2. resumir: projeto, objetivo, decisões, pendências, próximo passo
3. salvar em \projetos/<ativo>/compactacoes/\
4. atualizar \estado-atual.md\

### \chatJoe fechar contexto\

Finaliza a sessão atual.

Fluxo:
1. gerar compactação final
2. registrar decisões em \decisoes.md\ do projeto
3. registrar pendências
4. se aplicável, escrever missão preparada em \../queue/next-task.md\ (com confirmação)
5. atualizar \estado-atual.md\

## Decisões e sugestões

### \chatJoe registrar decisão <decisão>\

Registra uma decisão no projeto ativo ou global.

Fluxo:
1. perguntar se é local (projeto) ou global
2. se local: salvar em \projetos/<ativo>/decisoes.md\
3. se global: salvar em \memoria/decisoes-globais.md\

### \chatJoe sugerir skills\

Lista skills úteis para a missão atual.

Fluxo:
1. ler tipo de missão e risco
2. consultar \skills/registry.md\
3. listar skills recomendadas

### \chatJoe sugerir agentes\

Lista agentes úteis para a missão atual.

Fluxo:
1. ler tipo de missão e risco
2. consultar \agentes/registry.md\
3. listar agentes recomendados


