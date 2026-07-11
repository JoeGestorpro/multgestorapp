# Comandos do chatJoe

> Todos os comandos funcionam como instrucoes em markdown.
> Voce digita o comando na conversa com o agente IA, e ele segue o fluxo documentado.

## Inicializacao

### \chatJoe iniciar\

Carrega o estado atual do chatJoe, identifica o projeto ativo e mostra o briefing completo.

Fluxo:
1. ler \estado-atual.md\
2. ler \inbox.md\ e \ideias-pendentes.md\
3. identificar projeto ativo
4. carregar contexto do projeto (se houver)
5. verificar ideias orfas (>7 dias)
6. verificar alertas e bloqueios
7. mostrar briefing: projeto, onde paramos, ideias pendentes, missoes pendentes, bloqueios, proxima acao

### \chatJoe status\

Mostra o painel completo do estado atual.

Fluxo:
1. ler \estado-atual.md\
2. exibir: projeto ativo, missao atual, risco, modo, timeline, pendencias, alertas, ideias pendentes

### \chatJoe estado\

(Alias para \chatJoe status\)

## Projetos

### \chatJoe listar projetos\

Lista todos os projetos registrados no chatJoe.

Fluxo:
1. listar pastas em \projetos/\
2. exibir nome, status (do \contexto.md\ de cada projeto), ultima missao

### \chatJoe criar projeto <nome>\

Cria um novo projeto interno no chatJoe.

Fluxo:
1. criar pasta \projetos/<nome>/
2. copiar template de \projetos/_template/\
3. perguntar objetivo inicial
4. atualizar \estado-atual.md\ com projeto ativo

### \chatJoe abrir projeto <nome>\

Entra em um projeto existente.

Fluxo:
1. verificar se pasta \projetos/<nome>/\ existe
2. carregar \contexto.md\, \decisoes.md\, \backlog.md\, ultima compactacao
3. atualizar \estado-atual.md\ com projeto ativo

## Missoes

### \chatJoe preparar missao <objetivo>\

Prepara uma missao completa.

Fluxo:
1. entender o objetivo
2. classificar tipo de missao (ver [[roteador.md]])
3. medir risco (1 a 5)
4. ROTEADOR sugere skills automaticamente (ver [[roteador.md|SkillGate]])
5. ROTEADOR sugere agentes automaticamente (ver [[roteador.md|SkillGate]])
6. usuario CONFIRMA ou AJUSTA skills e agentes
7. JUSTIFICATIVA registrada (por que cada skill/agente foi escolhido)
8. verificar minimos por risco (SkillGate)
9. decidir se precisa auditoria (risco 4 ou 5 exige)
10. gerar plano

### \chatJoe medir risco\

Calcula ou reavalia o nivel de risco da missao atual.

Fluxo:
1. carregar missao atual
2. aplicar criterios do roteador (1 a 5)
3. exibir resultado e justificativa
4. atualizar \estado-atual.md\

### \chatJoe sugerir skills\

Lista skills uteis para a missao atual.

Fluxo:
1. ler tipo de missao e risco
2. consultar \skills/registry.md\
3. listar skills recomendadas

### \chatJoe sugerir agentes\

Lista agentes uteis para a missao atual.

Fluxo:
1. ler tipo de missao e risco
2. consultar \agentes/registry.md\
3. listar agentes recomendados

### \chatJoe passar SkillGate\

Executa a verificacao do SkillGate na missao atual.

Fluxo:
1. verificar skills definidas e justificadas
2. verificar agentes definidos e justificados
3. verificar minimos por risco
4. se aprovado: registrar em \estado-atual.md\ e liberar para gerar plano
5. se reprovado: listar o que falta

### \chatJoe gerar plano\

Gera o plano detalhado da missao apos o SkillGate aprovado.

Fluxo:
1. carregar missao preparada (skills, agentes, risco)
2. gerar passos detalhados
3. exibir plano para confirmacao
4. registrar em \estado-atual.md\

### \chatJoe gerar prompt executor\

Gera um prompt completo para o Executor.

**SkillGate:** Antes de gerar, verifica:
- skills definidas e justificadas?
- agentes definidos e justificados?
- minimos por risco respeitados?
Se algo faltar, bloqueia e avisa.

Fluxo:
1. executar verificacao do SkillGate
2. se bloqueado: exibir mensagem e listar o que falta
3. se aprovado: carregar missao preparada
4. usar \executor/modelo-prompt-executor.md\
5. preencher contexto, escopo, restricoes, criterios de aceite, justificativas
6. incluir checklist pre-execucao
7. exibir prompt para copiar

### \chatJoe analisar relatorio executor\

Analisa o relatorio do Executor apos a execucao.

Fluxo:
1. receber relatorio colado pelo usuario
2. comparar com prompt original
3. verificar riscos
4. registrar decisoes
5. sugerir proxima acao
6. atualizar \estado-atual.md\

### \chatJoe gerar auditoria final\

Gera prompt de auditoria para revisar entrega do Executor.

Fluxo:
1. carregar prompt original e relatorio
2. usar modelo de missao de auditoria
3. gerar prompt com criterios de aceite
4. indicar riscos para o Auditor revisar

## Contexto

### \chatJoe compactar\

Resume a conversa atual e salva uma compactacao.

Fluxo:
1. usar \compactacoes/modelo-compactacao.md\
2. resumir: projeto, objetivo, decisoes, pendencias, proximo passo
3. salvar em \projetos/<ativo>/compactacoes/\
4. atualizar \estado-atual.md\

### \chatJoe fechar contexto\

Finaliza a sessao atual.

Fluxo:
1. gerar compactacao final
2. registrar decisoes em \decisoes.md\ do projeto
3. registrar pendencias
4. se aplicavel, escrever missao preparada em \../queue/next-task.md\ (com confirmacao)
5. atualizar \estado-atual.md\


## Nichos

### \chatJoe arquitetar nicho <nome>\

Cria a arquitetura completa de um nicho novo do zero.

**Quando usar:** nicho novo, sem nada criado ainda
**Modo:** PLAN_ONLY
**Risco:** 2
**Skills:** documentacao, produto
**Agentes:** Product Manager, Technical Writer
**Documentos de referencia:** Nichos/00-INSTRUTOR-GERADOR-DE-NICHOS.md, Nichos/01-TEMPLATE-ARQUITETURA-DE-NICHO.md, Nichos/02-PROMPTS-PARA-CODE-NICHO.md

Fluxo:
1. carregar Nichos/00-INSTRUTOR-GERADOR-DE-NICHOS.md
2. copiar Nichos/01-TEMPLATE-ARQUITETURA-DE-NICHO.md para Nichos/<nome>/
3. usar Prompt 1 (planejamento) de Nichos/02-PROMPTS-PARA-CODE-NICHO.md para pensar a arquitetura sem codar
4. preencher secoes 1 a 17 do template (entendimento, core vs nicho, MVP, telas, botoes, rotas, banco, permissoes, contrato)
5. gerar nivel de confianca
6. Se "Pronto para Code": recomendar gerar contrato de implementacao
7. Se nao: listar pendencias e duvidas

**Regras de seguranca:**
- Nao implementar codigo — modo PLAN_ONLY
- Nao inventar funcionalidades fora do MVP (regras anti-alucinacao do instrutor)
- Nao duplicar recursos do Core (login, tenant, usuarios, permissoes)
- Nao alterar areas proibidas sem autorizacao

**Saida esperada:**
- Pasta Nichos/<nome>/ criada com template preenchido
- Nivel de confianca definido
- Recomendacao de proximo passo

---

### \chatJoe revisar nicho <nome> existente\

Audita um nicho que ja existe parcialmente (como BarberGestor) sem alterar codigo.

**Quando usar:** nicho ja tem codigo criado, precisa revisar o que existe antes de continuar
**Modo:** PLAN_ONLY + READ_ONLY
**Risco:** 2
**Skills:** documentacao, code-review
**Agentes:** Platform Architect, Technical Writer
**Documentos de referencia:** Nichos/00-INSTRUTOR-GERADOR-DE-NICHOS.md, Nichos/03-CHECKLIST-AUDITORIA-DE-NICHO.md

Fluxo:
1. ativar modo READ_ONLY — nao alterar codigo nem arquivos
2. explorar codigo do nicho: telas, rotas frontend, rotas backend/API, entidades
3. mapear tela por tela:
   - nome da tela, rota, objetivo
   - botoes: acao real? loading? erro? integracao com API?
4. verificar permissoes por rota e por botao
5. verificar isolamento tenant (company_id) em cada rota/entidade
6. classificar cada item como:
   - **real** — funciona com dados verdadeiros
   - **parcial** — existe mas incompleto
   - **mock** — so visual, sem integracao real
   - **ausente** — nao existe
7. separar problemas:
   - **P0:** bloqueia ou traz risco de seguranca
   - **P1:** importante para o MVP funcionar bem
   - **P2:** melhoria visual, organizacao ou refinamento
8. gerar relatorio de auditoria
9. definir nivel de confianca atual do nicho
10. recomendar plano de correcao por fases

**Regras de seguranca:**
- Modo READ_ONLY: nao alterar nada
- Nao mexer em areas proibidas (login, billing, RLS, tenant, core, deploy)
- Se algo nao estiver claro, registrar duvida — nao inventar

**Saida esperada:**
- Relatorio com telas, botoes, rotas, permissoes e tenant
- Classificacao real/parcial/mock/ausente
- Problemas P0/P1/P2
- Nivel de confianca atual
- Plano de correcao por fases

---

### \chatJoe auditar nicho <nome>\

Auditoria focada em riscos antes de implementar ou liberar um nicho.

**Quando usar:** antes de implementar, para validar que a arquitetura esta segura
**Modo:** PLAN_ONLY (modo auditor)
**Risco:** 2
**Skills:** code-review, seguranca
**Agentes:** Platform Architect, Security Auditor
**Documentos de referencia:** Nichos/02-PROMPTS-PARA-CODE-NICHO.md (Prompt 4 — Modo auditor), Nichos/03-CHECKLIST-AUDITORIA-DE-NICHO.md

Fluxo:
1. ativar modo auditor (Prompt 4 de Nichos/02-PROMPTS-PARA-CODE-NICHO.md)
2. procurar:
   - escopo inchado (coisas fora do MVP)
   - falta de MVP claro
   - duplicacao do Core
   - rotas mal definidas
   - entidades desnecessarias
   - permissoes fracas
   - risco multi-tenant
   - funcionalidades inventadas
   - pontos que podem quebrar o MultGestor
3. classificar problemas em P0, P1, P2
4. gerar veredito: aprovado ou nao aprovado para implementacao
5. definir nivel de confianca

**Regras de seguranca:**
- Nao implementar nada em modo auditor
- Nao sugerir alteracoes em areas proibidas sem autorizacao

**Saida esperada:**
- Problemas P0/P1/P2
- Veredito final
- Nivel de confianca
- Recomendacoes

---

### \chatJoe gerar contrato implementacao <nicho> fase <n>\

Gera um contrato fechado para o Cloud Code executar apenas uma fase especifica.

**Quando usar:** template preenchido, auditoria aprovada, pronto para codar uma fase
**Modo:** PLAN_ONLY
**Risco:** 2
**Skills:** documentacao, skill do dominio do nicho
**Agentes:** Technical Writer, Platform Architect
**Documentos de referencia:** Nichos/01-TEMPLATE-ARQUITETURA-DE-NICHO.md (secao 17 — Contrato de implementacao), Nichos/02-PROMPTS-PARA-CODE-NICHO.md (Prompt 2)

Fluxo:
1. carregar template preenchido do nicho (Nichos/<nome>/)
2. carregar fases de implementacao (secao 10 do template)
3. isolar apenas a fase N:
   - o que sera implementado
   - o que sera criado (arquivos, migrations, testes)
   - o que sera alterado
4. aplicar contrato (secao 17):
   - o que pode mexer
   - o que nao pode mexer
   - o que precisa preservar
5. listar areas proibidas que NAO podem ser tocadas nesta fase
6. listar criterios de aceite da fase
7. gerar prompt para Cloud Code usando Prompt 2 de Nichos/02-PROMPTS-PARA-CODE-NICHO.md
8. exibir prompt para copiar

**Regras de seguranca:**
- Contrato deve ser explícito: o que pode e o que nao pode
- Areas proibidas devem estar listadas no inicio do prompt
- Se a fase tocar area proibida, bloquear e pedir aprovacao humana
- Nao gerar prompt para mais de uma fase por vez

**Saida esperada:**
- Prompt completo para Cloud Code
- Contrato: pode/não pode/precisa preservar
- Criterios de aceite da fase
- Areas proibidas listadas

---

### \chatJoe atualizar segundo cerebro do nicho <nome>\

Mantém os arquivos de governança do nicho sincronizados com o estado real.

**Quando usar:** apos cada fase de implementacao, auditoria ou decisao importante
**Modo:** PLAN_ONLY (prepara, Executor executa)
**Risco:** 2
**Skills:** documentacao
**Agentes:** Technical Writer
**Documentos de referencia:** Nichos/01-TEMPLATE-ARQUITETURA-DE-NICHO.md

Fluxo:
1. carregar estado atual do nicho
2. atualizar arquivos de governanca:
   - **STATUS.md:** nivel de confianca, fase atual, semaforo de maturidade
   - **HISTORICO.md:** registro cronologico do que foi feito
   - **DECISOES.md:** decisoes travadas com data, motivo e impacto
   - **BACKLOG.md:** itens futuros fora do MVP
3. verificar se arquivos estao coerentes entre si
4. gerar prompt para Executor aplicar as atualizacoes
5. usuario copia prompt e leva ao Executor
6. usuario cola relatorio: \chatJoe analisar relatorio executor\

**Saida esperada:**
- STATUS.md, HISTORICO.md, DECISOES.md, BACKLOG.md atualizados
- Prompt para Executor gerado

---
## Caixa de entrada e ideias

### \chatJoe registrar ideia <descricao>\

Registra uma nova ideia na caixa de entrada.

Fluxo:
1. perguntar origem (conversa, observacao, leitura, etc.)
2. registrar em \inbox.md\ com status pendente
3. perguntar se quer classificar agora ou deixar para depois

### \chatJoe classificar inbox\

Percorre itens pendentes da caixa de entrada e classifica um por um.

Fluxo:
1. ler \inbox.md\
2. para cada item pendente, perguntar:
   - vira missao?
   - vira backlog?
   - vira decisao?
   - vira aprendizado?
   - arquivar?
3. mover item para o destino correspondente
4. atualizar \inbox.md\

### \chatJoe revisar ideias\

Mostra o painel de ideias pendentes e orfas.

Fluxo:
1. ler \ideias-pendentes.md\
2. exibir lista com idade e prioridade
3. alertar se houver ideias orfas (>7 dias)

## Segundo cerebro

### \chatJoe atualizar segundo cerebro\

Sincroniza todos os arquivos Markdown ativos do projeto com o estado operacional mais recente.

**Modo:** PLAN_ONLY (chatJoe prepara, Executor executa)
**Risco:** 2 (ajuste simples sem banco/producao)
**Skills:** documentacao
**Agentes:** Technical Writer
**SkillGate:** documentacao + risco 2 = minimo 1 skill, 1 agente

Fluxo:
1. ler \projetos/<ativo>/contexto.md\ para entender estrutura do projeto
2. listar todos os arquivos .md ativos do projeto (projetos/<ativo>/, ../.../)
3. comparar cada arquivo com o estado real:
   - \estado-atual.md\ esta refletindo a missao atual?
   - \inbox.md\ tem itens nao processados?
   - \ideias-pendentes.md\ tem ideias orfas?
   - \missoes/modelo.md\ esta sendo seguido?
   - \projetos/<ativo>/decisoes.md\ tem decisoes recentes?
   - \projetos/<ativo>/backlog.md\ existe e esta atualizado?
   - \projetos/<ativo>/diario.md\ tem registros dos ultimos dias?
   - \memoria/aprendizados.md\ tem aprendizados recentes?
   - \projetos/<ativo>/roadmap.md\ reflete o progresso real?
   - \projetos/<ativo>/prompts/\ tem prompts versionados?
4. gerar relatorio de desatualizacao (quais arquivos, o que falta)
5. gerar plano de atualizacao (ordem, conteudo, prioridade)
6. gerar prompt para Executor com:
   - contexto do projeto
   - escopo (quais arquivos alterar)
   - restricoes (nao quebrar links, nao alterar codigo, nao inventar informacao)
   - skills (documentacao)
   - agentes (Technical Writer)
   - checklist pre-execucao
   - criterios de aceite (links intactos, informacao fiel ao estado real)
7. usuario copia prompt e leva ao Executor
8. usuario cola relatorio: \chatJoe analisar relatorio executor\
9. chatJoe compara relatorio com prompt original
10. registrar decisoes e aprendizados
11. atualizar \estado-atual.md\ com nova compactacao

**Comando relacionado no briefing:**

Ao executar \chatJoe iniciar\, se o Segundo Cerebro nao foi atualizado ha mais de 7 dias, o chatJoe deve alertar:
`
Atencao:
O Segundo Cerebro nao e atualizado ha X dias.
Recomendo rodar:
chatJoe atualizar segundo cerebro
`

### \chatJoe verificar saude do segundo cerebro\

Verifica rapidamente se os arquivos do projeto estao sincronizados com o estado real.

Fluxo:
1. comparar data da ultima modificacao de cada arquivo com a data da ultima missao
2. listar arquivos desatualizados
3. estimar tempo necessario para atualizar
4. recomendar ou nao executar \chatJoe atualizar segundo cerebro\

## Decisoes

### \chatJoe registrar decisao <decisao>\

Registra uma decisao no projeto ativo ou global.

Fluxo:
1. perguntar se e local (projeto) ou global
2. se local: salvar em \projetos/<ativo>/decisoes.md\
3. se global: salvar em \memoria/decisoes-globais.md\


