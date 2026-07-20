# Plano de Execução — Reorganização Academia do Desenvolvedor

> **Data:** 2026-07-16
> **Status:** PRONTO PARA EXECUÇÃO
> **Vault:** `C:\ChatJoe\Estudio-da-Criacao`
> **Total de arquivos:** 83 existentes + ~32 novos = ~115 ao final

---

## REGRAS DE EXECUÇÃO (OBRIGATÓRIO)

1. Criar estrutura completa das 15 wikis
2. Conteúdo completo SOMENTE para: `01_MENTALIDADE`, `05_DIAGNOSTICO`, `08_STACK`, `09_OPERACIONAL`
3. Demais wikis: apenas README.md com objetivo, pergunta, índice e links
4. Nomes e textos em português do Brasil
5. Mover fisicamente SOMENTE arquivos de classificação inequívoca
6. Em caso de dúvida: não mover, criar link na wiki correspondente
7. ANTES de mover: gerar inventário (este documento)
8. Preservar todos os links internos do Obsidian (wikilinks)
9. NÃO apagar arquivos nem conteúdos existentes
10. NÃO duplicar documentos completos — usar fonte principal + referências
11. `.opencodex/` = cérebro operacional (estado, missão, decisões, fila)
12. Estúdio = base de conhecimento permanente e educacional
13. Adicionar `Academia do Desenvolvedor` no `00-HOME.md` do `.opencodex`
14. Criar `MAPA-DAS-WIKIS.md` no Estúdio
15. Gerar relatório ao final

---

## INVENTÁRIO: ARQUIVOS EXISTENTES → DESTINO

### A) MIGRAÇÃO INEQUÍVOCA (arquivo move fisicamente)

#### 01_STACK_ATUAL/ (7 arquivos) → 08_STACK/

| # | Arquivo atual | Destino | Motivo |
|---|---|---|---|
| 1 | `01_STACK_ATUAL/STACK_ATUAL.md` | `08_STACK/STACK_ATUAL.md` | Documentação da stack atual |
| 2 | `01_STACK_ATUAL/FRONTEND_ATUAL.md` | `08_STACK/FRONTEND_ATUAL.md` | Documentação do frontend |
| 3 | `01_STACK_ATUAL/BACKEND_ATUAL.md` | `08_STACK/BACKEND_ATUAL.md` | Documentação do backend |
| 4 | `01_STACK_ATUAL/SUPABASE_ATUAL.md` | `08_STACK/SUPABASE_ATUAL.md` | Documentação do Supabase |
| 5 | `01_STACK_ATUAL/VERCEL_ATUAL.md` | `08_STACK/VERCEL_ATUAL.md` | Documentação do Vercel |
| 6 | `01_STACK_ATUAL/RENDER_ATUAL.md` | `08_STACK/RENDER_ATUAL.md` | Documentação do Render |
| 7 | `01_STACK_ATUAL/SERVICOS_EXTERNOS.md` | `08_STACK/SERVICOS_EXTERNOS.md` | Serviços de apoio |

**Links impactados:** `00_INDEX_GERAL.md` (seção "01 — Stack Atual"), `00_MAPA_DO_COFRE.md`

#### 02_UPGRADE_DA_STACK/ (6 arquivos) → 08_STACK/

| # | Arquivo atual | Destino | Motivo |
|---|---|---|---|
| 8 | `02_UPGRADE_DA_STACK/UPGRADE_STACK.md` | `08_STACK/UPGRADE_STACK.md` | Plano de evolução |
| 9 | `02_UPGRADE_DA_STACK/PLANO_VERCEL.md` | `08_STACK/PLANO_VERCEL.md` | Plano Vercel |
| 10 | `02_UPGRADE_DA_STACK/PLANO_RENDER.md` | `08_STACK/PLANO_RENDER.md` | Plano Render |
| 11 | `02_UPGRADE_DA_STACK/PLANO_SUPABASE.md` | `08_STACK/PLANO_SUPABASE.md` | Plano Supabase |
| 12 | `02_UPGRADE_DA_STACK/CUSTOS_E_LIMITES.md` | `08_STACK/CUSTOS_E_LIMITES.md` | Custos |
| 13 | `02_UPGRADE_DA_STACK/QUANDO_ESCALAR.md` | `08_STACK/QUANDO_ESCALAR.md` | Critérios de escala |

**Links impactados:** `00_INDEX_GERAL.md` (seção "02 — Upgrade da Stack"), `00_MAPA_DO_COFRE.md`

#### 03_CRIADOR_DE_NICHOS/ (7 arquivos) → 12_NICHOS/

| # | Arquivo atual | Destino | Motivo |
|---|---|---|---|
| 14 | `03_CRIADOR_DE_NICHOS/MODO_CRIADOR_DE_NICHOS.md` | `12_NICHOS/MODO_CRIADOR_DE_NICHOS.md` | Instrutor gerador |
| 15 | `03_CRIADOR_DE_NICHOS/TEMPLATE_NICHO.md` | `12_NICHOS/TEMPLATE_NICHO.md` | Template de nicho |
| 16 | `03_CRIADOR_DE_NICHOS/CHECKLIST_NICHO.md` | `12_NICHOS/CHECKLIST_NICHO.md` | Checklists |
| 17 | `03_CRIADOR_DE_NICHOS/FLUXO_CRIAR_NICHO.md` | `12_NICHOS/FLUXO_CRIAR_NICHO.md` | Fluxo de criação |
| 18 | `03_CRIADOR_DE_NICHOS/PRD_TEMPLATE.md` | `12_NICHOS/PRD_TEMPLATE.md` | Template PRD |
| 19 | `03_CRIADOR_DE_NICHOS/MVP_TEMPLATE.md` | `12_NICHOS/MVP_TEMPLATE.md` | Template MVP |
| 20 | `03_CRIADOR_DE_NICHOS/PLANO_EXECUCAO_TEMPLATE.md` | `12_NICHOS/PLANO_EXECUCAO_TEMPLATE.md` | Plano de execução |

**Links impactados:** `00_INDEX_GERAL.md` (seção "03 — Criador de Nichos"), `00_MAPA_DO_COFRE.md`

#### 04_AUDITORIAS/ (5 arquivos) → 11_BOASPRATICAS/

| # | Arquivo atual | Destino | Motivo |
|---|---|---|---|
| 21 | `04_AUDITORIAS/AUDITORIA_BACKEND.md` | `11_BOASPRATICAS/AUDITORIA_BACKEND.md` | Checklist de auditoria |
| 22 | `04_AUDITORIAS/AUDITORIA_FRONTEND.md` | `11_BOASPRATICAS/AUDITORIA_FRONTEND.md` | Checklist de auditoria |
| 23 | `04_AUDITORIAS/AUDITORIA_SUPABASE.md` | `11_BOASPRATICAS/AUDITORIA_SUPABASE.md` | Checklist de auditoria |
| 24 | `04_AUDITORIAS/AUDITORIA_SEGURANCA.md` | `11_BOASPRATICAS/AUDITORIA_SEGURANCA.md` | Checklist de auditoria |
| 25 | `04_AUDITORIAS/AUDITORIA_DEPLOY.md` | `11_BOASPRATICAS/AUDITORIA_DEPLOY.md` | Checklist de auditoria |

**Links impactados:** `00_INDEX_GERAL.md` (seção "04 — Auditorias"), `00_MAPA_DO_COFRE.md`

#### 04_AUDITORIAS/ (2 arquivos) → 04_EVOLUIR/

| # | Arquivo atual | Destino | Motivo |
|---|---|---|---|
| 26 | `04_AUDITORIAS/MODO_AUDITORIA.md` | `04_EVOLUIR/MODO_AUDITORIA.md` | Como conduzir auditoria |
| 27 | `04_AUDITORIAS/CHECKLIST_AUDITORIA_GERAL.md` | `04_EVOLUIR/CHECKLIST_AUDITORIA_GERAL.md` | Checklist geral |

**Links impactados:** Mesmos da seção acima

#### 05_FLUXOS_OPERACIONAIS/ (4 arquivos) → 03_OPERAR/

| # | Arquivo atual | Destino | Motivo |
|---|---|---|---|
| 28 | `05_FLUXOS_OPERACIONAIS/FLUXO_DIA_A_DIA.md` | `03_OPERAR/FLUXO_DIA_A_DIA.md` | Fluxo operacional diário |
| 29 | `05_FLUXOS_OPERACIONAIS/FLUXO_IDEIA_PARA_EXECUCAO.md` | `03_OPERAR/FLUXO_IDEIA_PARA_EXECUCAO.md` | Fluxo de execução |
| 30 | `05_FLUXOS_OPERACIONAIS/FLUXO_EXECUCAO_PARA_AUDITORIA.md` | `03_OPERAR/FLUXO_EXECUCAO_PARA_AUDITORIA.md` | Fluxo pós-entrega |
| 31 | `05_FLUXOS_OPERACIONAIS/FLUXO_ATUALIZAR_SEGUNDO_CEREBRO.md` | `03_OPERAR/FLUXO_ATUALIZAR_CEREBRO.md` | Sincronização |

**Links impactados:** `00_INDEX_GERAL.md` (seção "05 — Fluxos Operacionais"), `00_MAPA_DO_COFRE.md`

#### 05_FLUXOS_OPERACIONAIS/ (1 arquivo) → 09_OPERACIONAL/

| # | Arquivo atual | Destino | Motivo |
|---|---|---|---|
| 32 | `05_FLUXOS_OPERACIONAIS/FLUXO_DECISAO_TECNICA.md` | `09_OPERACIONAL/FLUXO_DECISAO_TECNICA.md` | Procedimento de decisão |

**Links impactados:** Mesmos da seção acima

#### 06_SEGUNDO_CEREBRO_FILTRADO/ (6 arquivos) → 15_CONTEXTO/

| # | Arquivo atual | Destino | Motivo |
|---|---|---|---|
| 33 | `06_SEGUNDO_CEREBRO_FILTRADO/SEGUNDO_CEREBRO_FILTRADO.md` | `15_CONTEXTO/SEGUNDO_CEREBRO_FILTRADO.md` | Definição do conceito |
| 34 | `06_SEGUNDO_CEREBRO_FILTRADO/MEMORIAS_IMPORTANTES.md` | `15_CONTEXTO/MEMORIAS_IMPORTANTES.md` | Memórias filtradas |
| 35 | `06_SEGUNDO_CEREBRO_FILTRADO/DECISOES_ATUAIS.md` | `15_CONTEXTO/DECISOES_ATUAIS.md` | Decisões vigentes |
| 36 | `06_SEGUNDO_CEREBRO_FILTRADO/CONTEXTO_MULTGESTOR.md` | `15_CONTEXTO/CONTEXTO_MULTGESTOR.md` | Contexto do projeto |
| 37 | `06_SEGUNDO_CEREBRO_FILTRADO/CONTEXTO_CHATJOE.md` | `15_CONTEXTO/CONTEXTO_CHATJOE.md` | Contexto do ChatJoe |
| 38 | `06_SEGUNDO_CEREBRO_FILTRADO/CONTEXTO_NICHOS.md` | `15_CONTEXTO/CONTEXTO_NICHOS.md` | Contexto dos nichos |

**Links impactados:** `00_INDEX_GERAL.md` (seção "06 — Segundo Cérebro Filtrado"), `00_MAPA_DO_COFRE.md`

#### 07_PROMPTS_DE_EXECUCAO/ (5 arquivos) → 02_CONSTRUIR/

| # | Arquivo atual | Destino | Motivo |
|---|---|---|---|
| 39 | `07_PROMPTS_DE_EXECUCAO/PROMPT_OPEN_CODE_EXECUTAR.md` | `02_CONSTRUIR/PROMPT_OPEN_CODE_EXECUTAR.md` | Prompt de execução |
| 40 | `07_PROMPTS_DE_EXECUCAO/PROMPT_OPEN_CODE_AUDITAR.md` | `02_CONSTRUIR/PROMPT_OPEN_CODE_AUDITAR.md` | Prompt de auditoria |
| 41 | `07_PROMPTS_DE_EXECUCAO/PROMPT_CLOUD_CODE_EXECUTAR.md` | `02_CONSTRUIR/PROMPT_CLOUD_CODE_EXECUTAR.md` | Prompt Cloud Code |
| 42 | `07_PROMPTS_DE_EXECUCAO/PROMPT_CLOUD_CODE_CORRIGIR.md` | `02_CONSTRUIR/PROMPT_CLOUD_CODE_CORRIGIR.md` | Prompt correção |
| 43 | `07_PROMPTS_DE_EXECUCAO/PROMPT_ATUALIZAR_OBSIDIAN.md` | `02_CONSTRUIR/PROMPT_ATUALIZAR_OBSIDIAN.md` | Prompt atualização |

**Links impactados:** `00_INDEX_GERAL.md` (seção "07 — Prompts de Execução"), `00_MAPA_DO_COFRE.md`

#### 09_MAPA_DO_SISTEMA/ (5 arquivos) → 06_ARQUITETURA/

| # | Arquivo atual | Destino | Motivo |
|---|---|---|---|
| 44 | `09_MAPA_DO_SISTEMA/MAPA_MULTGESTOR.md` | `06_ARQUITETURA/MAPA_MULTGESTOR.md` | Mapa do ecossistema |
| 45 | `09_MAPA_DO_SISTEMA/MAPA_CORE.md` | `06_ARQUITETURA/MAPA_CORE.md` | O que o core oferece |
| 46 | `09_MAPA_DO_SISTEMA/MAPA_BARBERGESTOR.md` | `06_ARQUITETURA/MAPA_BARBERGESTOR.md` | Mapa do nicho |
| 47 | `09_MAPA_DO_SISTEMA/MAPA_CHATJOE.md` | `06_ARQUITETURA/MAPA_CHATJOE.md` | Mapa do planejador |
| 48 | `09_MAPA_DO_SISTEMA/MAPA_ROTAS_E_MODULOS.md` | `06_ARQUITETURA/MAPA_ROTAS_E_MODULOS.md` | Rotas e módulos |

**Links impactados:** `00_INDEX_GERAL.md` (seção "09 — Mapa do Sistema"), `00_MAPA_DO_COFRE.md`

#### 10_INSTRUTORES_DE_USO/ (10 arquivos) → distribuído

| # | Arquivo atual | Destino | Motivo |
|---|---|---|---|
| 49 | `10_INSTRUTORES_DE_USO/INSTRUTOR_GERAL_DO_ESTUDIO.md` | `09_OPERACIONAL/INSTRUTOR_GERAL.md` | Instrutor operacional |
| 50 | `10_INSTRUTORES_DE_USO/INSTRUTOR_FLUXO_DIA_A_DIA.md` | `01_MENTALIDADE/INSTRUTOR_FLUXO_DIARIO.md` | Mentalidade do fluxo |
| 51 | `10_INSTRUTORES_DE_USO/INSTRUTOR_DECISOES_DO_PROJETO.md` | `01_MENTALIDADE/INSTRUTOR_DECISOES.md` | Mentalidade de decisão |
| 52 | `10_INSTRUTORES_DE_USO/INSTRUTOR_AUDITORIA.md` | `04_EVOLUIR/INSTRUTOR_AUDITORIA.md` | Instrutor de auditoria |
| 53 | `10_INSTRUTORES_DE_USO/INSTRUTOR_PROMPTS_PARA_CODE.md` | `02_CONSTRUIR/INSTRUTOR_PROMPTS.md` | Instrutor de prompts |
| 54 | `10_INSTRUTORES_DE_USO/INSTRUTOR_CRIADOR_DE_NICHOS.md` | `12_NICHOS/INSTRUTOR_CRIADOR.md` | Instrutor de nichos |
| 55 | `10_INSTRUTORES_DE_USO/INSTRUTOR_STACK_E_INFRA.md` | `08_STACK/INSTRUTOR_STACK.md` | Instrutor de stack |
| 56 | `10_INSTRUTORES_DE_USO/INSTRUTOR_COMO_USAR_CHATGPT.md` | `02_CONSTRUIR/INSTRUTOR_CHATGPT.md` | Instrutor ChatGPT |
| 57 | `10_INSTRUTORES_DE_USO/INSTRUTOR_CONSULTOR_GLOBAL.md` | `13_AGENTES/INSTRUTOR_CONSULTOR.md` | Instrutor do consultor |
| 58 | `10_INSTRUTORES_DE_USO/INSTRUTOR_ATUALIZAR_OBSIDIAN.md` | `09_OPERACIONAL/INSTRUTOR_ATUALIZAR.md` | Instrutor de atualização |

**Links impactados:** `00_INDEX_GERAL.md` (seção "10 — Instrutores de Uso"), `00_MAPA_DO_COFRE.md`

#### 11_AGENTES_OPERACIONAIS/ (14 arquivos) → 13_AGENTES/

| # | Arquivo atual | Destino | Motivo |
|---|---|---|---|
| 59 | `11_AGENTES_OPERACIONAIS/INDEX_AGENTES.md` | `13_AGENTES/INDEX_AGENTES.md` | Índice de agentes |
| 60 | `11_AGENTES_OPERACIONAIS/MATRIZ_DE_AGENTES.md` | `13_AGENTES/MATRIZ_DE_AGENTES.md` | Tabela completa |
| 61 | `11_AGENTES_OPERACIONAIS/AGENTES_POR_TIPO_DE_DEMANDA.md` | `13_AGENTES/AGENTES_POR_TIPO.md` | Classificação |
| 62 | `11_AGENTES_OPERACIONAIS/AGENTES_PRIORITARIOS.md` | `13_AGENTES/AGENTES_PRIORITARIOS.md` | Prioridades |
| 63 | `11_AGENTES_OPERACIONAIS/COMO_ESCOLHER_AGENTES.md` | `13_AGENTES/COMO_ESCOLHER.md` | Fluxo de decisão |
| 64 | `11_AGENTES_OPERACIONAIS/FLUXO_MULTIAGENTE.md` | `13_AGENTES/FLUXO_MULTIAGENTE.md` | Orquestração |
| 65 | `11_AGENTES_OPERACIONAIS/ORQUESTRACAO_CHATJOE.md` | `13_AGENTES/ORQUESTRACAO_CHATJOE.md` | Regra central |
| 66 | `11_AGENTES_OPERACIONAIS/CONSULTOR_GLOBAL/AGENTE_CONSULTOR_GLOBAL.md` | `13_AGENTES/CONSULTOR_GLOBAL/AGENTE_CONSULTOR_GLOBAL.md` | Definição |
| 67 | `11_AGENTES_OPERACIONAIS/CONSULTOR_GLOBAL/CONTRATO_CONSULTOR_GLOBAL.md` | `13_AGENTES/CONSULTOR_GLOBAL/CONTRATO_CONSULTOR_GLOBAL.md` | Contrato |
| 68 | `11_AGENTES_OPERACIONAIS/CONSULTOR_GLOBAL/CONTRATO_DE_CONSULTA.md` | `13_AGENTES/CONSULTOR_GLOBAL/CONTRATO_DE_CONSULTA.md` | Formato E/S |
| 69 | `11_AGENTES_OPERACIONAIS/CONSULTOR_GLOBAL/FLUXO_DE_CONSULTA.md` | `13_AGENTES/CONSULTOR_GLOBAL/FLUXO_DE_CONSULTA.md` | Fluxo interno |
| 70 | `11_AGENTES_OPERACIONAIS/CONSULTOR_GLOBAL/FONTES_DE_EVIDENCIA.md` | `13_AGENTES/CONSULTOR_GLOBAL/FONTES_DE_EVIDENCIA.md` | Hierarquia de provas |
| 71 | `11_AGENTES_OPERACIONAIS/CONSULTOR_GLOBAL/MAPA_DE_DOMINIOS.md` | `13_AGENTES/CONSULTOR_GLOBAL/MAPA_DE_DOMINIOS.md` | Domínios |
| 72 | `11_AGENTES_OPERACIONAIS/CONSULTOR_GLOBAL/TEMPLATE_RELATORIO_CONSULTA.md` | `13_AGENTES/CONSULTOR_GLOBAL/TEMPLATE_RELATORIO_CONSULTA.md` | Template |

**Links impactados:** `00_INDEX_GERAL.md` (seção "11 — Agentes Operacionais"), `00_MAPA_DO_COFRE.md`

#### 12_REGISTROS/ (2 arquivos) → 14_REGISTROS/

| # | Arquivo atual | Destino | Motivo |
|---|---|---|---|
| 73 | `12_REGISTROS/README.md` | `14_REGISTROS/README.md` | Readme dos registros |
| 74 | `12_REGISTROS/CONSULTAS_GLOBAIS/README.md` | `14_REGISTROS/CONSULTAS_GLOBAIS/README.md` | Readme das consultas |

**Links impactados:** `00_INDEX_GERAL.md` (seção "12 — Registros"), `00_MAPA_DO_COFRE.md`

---

### B) MANTIDOS NO LOCAL (com links criados)

#### 08_DECISOES_DO_PROJETO/ (4 arquivos) → NÃO MOVE

| Arquivo | Motivo de não mover | Link a criar |
|---|---|---|
| `08_DECISOES_DO_PROJETO/DECISOES_TECNICAS.md` | Duplicata de `.opencodex/decisoes/` | Link em `04_EVOLUIR/README.md` |
| `08_DECISOES_DO_PROJETO/DECISOES_DE_INFRAESTRUTURA.md` | Duplicata parcial | Link em `04_EVOLUIR/README.md` |
| `08_DECISOES_DO_PROJETO/DECISOES_DE_NEGOCIO.md` | Duplicata parcial | Link em `04_EVOLUIR/README.md` |
| `08_DECISOES_DO_PROJETO/DECISOES_DE_PRODUTO.md` | Duplicata parcial | Link em `04_EVOLUIR/README.md` |

**Ação:** Manter no local. Criar `04_EVOLUIR/README.md` com links para `[[08_DECISOES_DO_PROJETO/DECISOES_TECNICAS]]`.

#### Arquivos-raiz (5 arquivos) → ATUALIZADOS

| Arquivo | Ação |
|---|---|
| `00_COMANDOS_DO_CHATJOE.md` | Manter. Referenciar de `09_OPERACIONAL/` |
| `00_INDEX_GERAL.md` | REESCREVER com nova estrutura |
| `00_MANUAL_MESTRE_DO_CHATJOE.md` | Manter inalterado |
| `00_MAPA_DO_COFRE.md` | REESCREVER com nova estrutura |
| `LEIA-ME.md` | ATUALIZAR com nova estrutura |

---

### C) CONTEÚDO NOVO A CRIAR

#### Fase 1: Estrutura (15 diretórios + READMEs)

| # | Diretório | README a criar |
|---|---|---|
| 1 | `01_MENTALIDADE/` | `LEIA-ME-MENTALIDADE.md` |
| 2 | `02_CONSTRUIR/` | `LEIA-ME-CONSTRUIR.md` |
| 3 | `03_OPERAR/` | `LEIA-ME-OPERAR.md` |
| 4 | `04_EVOLUIR/` | `LEIA-ME-EVOLUIR.md` |
| 5 | `05_DIAGNOSTICO/` | `LEIA-ME-DIAGNOSTICO.md` |
| 6 | `06_ARQUITETURA/` | `LEIA-ME-ARQUITETURA.md` |
| 7 | `07_ERROSREAIS/` | `LEIA-ME-ERROSREAIS.md` |
| 8 | `08_STACK/` | `LEIA-ME-STACK.md` |
| 9 | `09_OPERACIONAL/` | `LEIA-ME-OPERACIONAL.md` |
| 10 | `10_IA/` | `LEIA-ME-IA.md` |
| 11 | `11_BOASPRATICAS/` | `LEIA-ME-BOASPRATICAS.md` |
| 12 | `12_NICHOS/` | `LEIA-ME-NICHOS.md` |
| 13 | `13_AGENTES/` | `LEIA-ME-AGENTES.md` |
| 14 | `14_REGISTROS/` | `LEIA-ME-REGISTROS.md` |
| 15 | `15_CONTEXTO/` | `LEIA-ME-CONTEXTO.md` |

#### Fase 2: Arquivos-raiz novos

| Arquivo | Conteúdo |
|---|---|
| `00_ACADEMIA_HOME.md` | Índice principal da Academia do Desenvolvedor |
| `MAPA-DAS-WIKIS.md` | Mapa de cada wiki: para que serve, quando consultar, o que NÃO armazenar, relação com outras |

#### Fase 3: Conteúdo completo (4 wikis prioritárias)

**01_MENTALIDADE/** — 13 arquivos novos:

| # | Arquivo | Pergunta que responde |
|---|---|---|
| 1 | `COMO_ENXERGAR_PROJETOS.md` | Como um desenvolvedor enxerga um projeto? |
| 2 | `ESTADOS_DO_PROJETO.md` | Quais são os estados de um projeto? |
| 3 | `ESTADOS_DO_GIT.md` | Quais são os estados do Git? |
| 4 | `FLUXO_DE_DESENVOLVIMENTO.md` | Qual é o fluxo completo de desenvolvimento? |
| 5 | `COMO_DIVIDIR_FUNCIONALIDADES.md` | Como dividir funcionalidades? |
| 6 | `COMO_REDUZIR_RISCOS.md` | Como reduzir riscos em um projeto? |
| 7 | `COMO_REVISAR_CODIGO.md` | Como revisar código? |
| 8 | `COMO_INVESTIGAR_BUGS.md` | Como investigar bugs? |
| 9 | `COMO_PENSAR_EM_ARQUITETURA.md` | Como pensar em arquitetura? |
| 10 | `COMO_DECIDIR_FRONTEND_BACKEND.md` | Como decidir entre frontend e backend? |
| 11 | `COMO_ESCOLHER_ONDE_IMPLEMENTAR.md` | Como escolher onde implementar? |
| 12 | `COMO_FUNCIONA_INFRA_COMPLETA.md` | Como funciona uma infraestrutura completa? |
| 13 | `COMO_EVITAR_BAGUNCA_PROJETOS_GRANDES.md` | Como evitar bagunça em projetos grandes? |

**05_DIAGNOSTICO/** — 10 arquivos novos:

| # | Arquivo | Sintoma que diagnostica |
|---|---|---|
| 1 | `ARVORE_DECISAO_MODELO.md` | Modelo de árvore de decisão |
| 2 | `API_NAO_RESPONDE.md` | API não responde |
| 3 | `SITE_NAO_ABRE.md` | Site não abre |
| 4 | `LOGIN_FALHOU.md` | Login falhou |
| 5 | `DEPLOY_FALHOU.md` | Deploy falhou |
| 6 | `BANCO_CAIU.md` | Banco caiu |
| 7 | `MIGRACAO_ERRO.md` | Migration deu erro |
| 8 | `BUILD_QUEBROU.md` | Build quebrou |
| 9 | `CI_FALHOU.md` | CI falhou |
| 10 | `TOKEN_EXPIROU.md` | Token expirou |

**08_STACK/** — 1 arquivo novo:

| # | Arquivo | Conteúdo |
|---|---|---|
| 1 | `STACK_MULTGESTOR.md` | Mapa completo: Frontend → Vercel → Render → Supabase → Storage → IA → Gateway → Observabilidade |

**09_OPERACIONAL/** — 7 arquivos novos:

| # | Arquivo | Procedimento |
|---|---|---|
| 1 | `COMO_CRIAR_MISSAO.md` | Passo a passo para criar uma missão |
| 2 | `COMO_ABRIR_BRANCH.md` | Passo a passo para abrir uma branch |
| 3 | `COMO_REVISAR_CODIGO.md` | Passo a passo para revisar código |
| 4 | `COMO_FAZER_AUDITORIA.md` | Passo a passo para auditar |
| 5 | `COMO_ENCERRAR_MISSAO.md` | Passo a passo para encerrar |
| 6 | `COMO_ATUALIZAR_CEREBRO.md` | Passo a passo para atualizar o segundo cérebro |
| 7 | `COMO_INICIAR_DIA.md` | Passo a passo para iniciar o dia |

#### Fase 4: Wikis com apenas README (11 wikis)

Cada uma recebe apenas `LEIA-ME-*.md` com:
- Objetivo da wiki
- Pergunta que ela responde
- Índice inicial (links para arquivos que já existem ou foram movidos)
- Links para conteúdos ainda não criados (marcados como `[A SER CRIADO]`

| Wiki | Arquivos existentes para linkar |
|---|---|
| `02_CONSTRUIR/` | 5 prompts migrados + instrutores |
| `03_OPERAR/` | 4 fluxos migrados |
| `04_EVOLUIR/` | 2 auditorias migradas + 4 decisões (linkadas) |
| `06_ARQUITETURA/` | 5 mapas migrados |
| `07_ERROSREAIS/` | Nenhum existente (modelo + referências a `.opencodex/incidentes/`) |
| `10_IA/` | Nenhum existente |
| `11_BOASPRATICAS/` | 5 auditorias migradas |
| `12_NICHOS/` | 7 arquivos migrados |
| `13_AGENTES/` | 14 arquivos migrados |
| `14_REGISTROS/` | 2 arquivos migrados |
| `15_CONTEXTO/` | 6 arquivos migrados |

---

## RESUMO DE MOVIMENTAÇÃO

| Tipo | Quantidade |
|---|---|
| Arquivos movidos fisicamente | 74 |
| Arquivos mantidos no local | 4 (decisões) + 5 (raiz) = 9 |
| Diretórios novos criados | 15 |
| READMEs novos criados | 15 |
| Arquivos-raiz novos | 2 (`00_ACADEMIA_HOME.md`, `MAPA-DAS-WIKIS.md`) |
| Arquivos de conteúdo completo novos | 31 (13 Mentalidade + 10 Diagnóstico + 1 Stack + 7 Operacional) |
| **Total de arquivos ao final** | **~115** |

---

## ATUALIZAÇÃO DO `.opencodex/`

### `00-HOME.md` — Adicionar seção

```markdown
## Academia do Desenvolvedor

> Base de conhecimento técnico do ChatJoe. Cada wiki tem uma única responsabilidade.

**Pensar:**
- [[academia:MENTALIDADE| Mentalidade]] — Como um desenvolvedor pensa

**Construir:**
- [[academia:CONSTRUIR| Construir]] — Como um desenvolvedor constrói

**Operar:**
- [[academia:OPERAR| Operar]] — Como um desenvolvedor opera

**Evoluir:**
- [[academia:EVOLUIR| Evoluir]] — Como um desenvolvedor evolui

**Referência:**
- [[academia:DIAGNOSTICO| Diagnóstico]] — Deu problema, por onde começo?
- [[academia:ARQUITETURA| Arquitetura]] — Como desenhar sistemas
- [[academia:ERROSREAIS| Erros Reais]] — Lições de erros reais
- [[academia:STACK| Stack]] — Como funciona a nossa stack
- [[academia:OPERACIONAL| Operacional]] — SOPs e procedimentos
- [[academia:IA| IA]] — Como funciona a IA operacional
- [[academia:BOASPRATICAS| Boas Práticas]] — Checklists permanentes
- [[academia:NICHOS| Nichos]] — Como criar nichos
- [[academia:AGENTES| Agentes]] — Agentes do ChatJoe
- [[academia:REGISTROS| Registros]] — Histórico datado
- [[academia:CONTEXTO| Contexto]] — Segundo Cérebro filtrado
```

---

## ORDEM DE EXECUÇÃO (para o executor)

### Passo 1: Criar diretórios (15 pastas novas)
```
01_MENTALIDADE/
02_CONSTRUIR/
03_OPERAR/
04_EVOLUIR/
05_DIAGNOSTICO/
06_ARQUITETURA/
07_ERROSREAIS/
08_STACK/
09_OPERACIONAL/
10_IA/
11_BOASPRATICAS/
12_NICHOS/
13_AGENTES/
14_REGISTROS/
15_CONTEXTO/
```

### Passo 2: Criar READMEs das 15 wikis (apenas estrutura)

### Passo 3: Criar `00_ACADEMIA_HOME.md` e `MAPA-DAS-WIKIS.md`

### Passo 4: Mover arquivos (74 arquivos, seguindo inventário acima)
- Usar `Move-Item` do PowerShell
- NÃO usar `edit` (permission denied para maioria dos caminhos)

### Passo 5: Criar conteúdo completo das 4 wikis prioritárias
- `01_MENTALIDADE/` — 13 arquivos
- `05_DIAGNOSTICO/` — 10 arquivos
- `08_STACK/` — 1 arquivo novo
- `09_OPERACIONAL/` — 7 arquivos novos

### Passo 6: Atualizar arquivos-raiz
- `00_INDEX_GERAL.md` — reescrever
- `00_MAPA_DO_COFRE.md` — reescrever
- `LEIA-ME.md` — atualizar

### Passo 7: Atualizar `.opencodex/00-HOME.md`
- Adicionar seção "Academia do Desenvolvedor"

### Passo 8: Gerar relatório final

---

## RISCOS E MITIGAÇÕES

| Risco | Mitigação |
|---|---|
| Links quebrados após mover | Criar arquivos de redirecionamento nas pastas antigas (opcional) |
| PowerShell corrompe UTF-8 | Usar Node.js `fs` para escrever arquivos com acentos |
| Mover arquivo que outro vault referencia | Verificar referências em `.opencodex/` antes de mover |
| Pastas antigas ficam vazias | Remover após confirmação humana |

---

## ESTIMATIVA DE TEMPO

| Fase | Tempo |
|---|---|
| Passo 1-2: Diretórios + READMEs | 15 min |
| Passo 3: Arquivos-raiz novos | 10 min |
| Passo 4: Mover 74 arquivos | 20 min |
| Passo 5: Conteúdo completo (31 arquivos) | 45 min |
| Passo 6: Atualizar raiz | 10 min |
| Passo 7: Atualizar .opencodex | 5 min |
| Passo 8: Relatório | 10 min |
| **Total** | **~2h** |
