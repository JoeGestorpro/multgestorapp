# Plano de Reorganização — Academia do Desenvolvedor

> **Objetivo:** Transformar o Estúdio da Criação de 12 pastas genéricas em wikis especializados, cada um com uma única responsabilidade. ChatJoe evolui de orquestrador para **mentor técnico**.
> **Data:** 2026-07-16
> **Status:** PLANEJAMENTO — aguarda aprovação humana

---

## Problema Atual

O vault `C:\ChatJoe\Estudio-da-Criacao` tem 12 pastas numeradas com mistura de:
- Documentação técnica
- Templates de negócio
- Fluxos operacionais
- Decisões
- Memória filtrada
- Instruções de uso

Resultado: ninguém sabe onde procurar depois de alguns meses.

## Solução Proposta

Criar **wikis especializados**, cada um respondendo UMA pergunta. Agrupados sob a **Academia do Desenvolvedor** (4 áreas: Pensar, Construir, Operar, Evoluir) + 5 wikis de referência.

---

## Estrutura Nova

```
C:\ChatJoe\Estudio-da-Criacao\
│
├── LEIA-ME.md                         ← atualizado
├── 00_ACADEMIA_HOME.md                ← NOVO: índice principal
├── 00_COMANDOS_DO_CHATJOE.md          ← mantido
├── 00_MANUAL_MESTRE_DO_CHATJOE.md     ← mantido
├── 00_MAPA_DO_COFRE.md                ← reescrito
│
├── 01_MENTALIDADE/                    ← "Como um dev PENSA"
│   ├── LEIA-ME-MENTALIDADE.md
│   ├── COMO_ENXERGAR_PROJETOS.md
│   ├── ESTADOS_DO_PROJETO.md
│   ├── ESTADOS_DO_GIT.md
│   ├── FLUXO_DE_DESENVOLVIMENTO.md
│   ├── COMO_DIVIDIR_FUNCIONALIDADES.md
│   ├── COMO_REDUZIR_RISCOS.md
│   ├── COMO_REVISAR_CODIGO.md
│   ├── COMO_INVESTIGAR_BUGS.md
│   ├── COMO_PENSAR_EM_ARQUITETURA.md
│   ├── COMO_DECIDIR_FRONTEND_BACKEND.md
│   ├── COMO_ESCOLHER_ONDE_IMPLEMENTAR.md
│   ├── COMO_FUNCIONA_INFRA_COMPLETA.md
│   └── COMO_EVITAR_BAGUNCA_PROJETOS_GRANDES.md
│
├── 02_CONSTRUIR/                      ← "Como um dev CONSTRÓI"
│   ├── LEIA-ME-CONSTRUIR.md
│   ├── GIT.md
│   ├── GITHUB.md
│   ├── BRANCHES_COMMITS_PR.md
│   ├── CI_CD.md
│   ├── API_REST.md
│   ├── FRONTEND.md
│   ├── BACKEND.md
│   ├── BANCO_DE_DADOS.md
│   ├── DOCKER.md
│   ├── TESTES.md
│   ├── DEBUG.md
│   └── PROMPTS_EXECUCAO.md            ← migra de 07_PROMPTS_DE_EXECUCAO/
│
├── 03_OPERAR/                         ← "Como um dev OPERA"
│   ├── LEIA-ME-OPERAR.md
│   ├── FLUXO_DIA_A_DIA.md             ← migra de 05_FLUXOS/
│   ├── FLUXO_IDEIA_PARA_EXECUCAO.md   ← migra de 05_FLUXOS/
│   ├── FLUXO_EXECUCAO_PARA_AUDITORIA.md ← migra de 05_FLUXOS/
│   ├── FLUXO_ATUALIZAR_CEREBRO.md     ← migra de 05_FLUXOS/
│   ├── DEPLOY.md
│   ├── LOGS.md
│   ├── MONITORAMENTO.md
│   ├── ALERTAS.md
│   ├── INCIDENTES.md
│   ├── ROLLBACK.md
│   ├── MIGRACOES.md
│   └── COMO_INICIAR_DIA.md
│
├── 04_EVOLUIR/                        ← "Como um dev EVOLUI"
│   ├── LEIA-ME-EVOLUIR.md
│   ├── ROADMAP.md
│   ├── FEATURE_GENOME.md              ← migra de .opencodex areas/produto-roadmap
│   ├── IMPACT_GRAPH.md                ← migra de .opencodex
│   ├── SIMULATION_CENTER.md           ← migra de .opencodex
│   ├── STATUS_MULTGESTOR.md
│   ├── STATUS_IA_OPERACIONAL.md
│   ├── STATUS_BARBERGESTOR.md
│   ├── STATUS_NICHOS.md
│   ├── AUDITORIAS_TEMPLATE.md         ← migra de 04_AUDITORIAS/
│   └── CHECKLIST_AUDITORIA.md         ← migra de 04_AUDITORIAS/
│
├── 05_DIAGNOSTICO/                    ← "Deu problema. Por onde começo?"
│   ├── LEIA-ME-DIAGNOSTICO.md
│   ├── ARVORE_DECISAO_MODELO.md
│   ├── API_NAO_RESPONDE.md
│   ├── SITE_NAO_ABRE.md
│   ├── LOGIN_FALHOU.md
│   ├── DEPLOY_FALHOU.md
│   ├── BANCO_CAIU.md
│   ├── MIGRACAO_ERRO.md
│   ├── BUILD_QUEBROU.md
│   ├── CI_FALHOU.md
│   └── TOKEN_EXPIROU.md
│
├── 06_ARQUITETURA/                    ← "Como desenhar sistemas"
│   ├── LEIA-ME-ARQUITETURA.md
│   ├── CLEAN_ARCHITECTURE.md
│   ├── SEPARAR_RESPONSABILIDADES.md
│   ├── EVITAR_ACOPLAMENTO.md
│   ├── ORGANIZAR_MODULOS.md
│   ├── ESTRUTURAR_PROJETOS_GRANDES.md
│   ├── PADROES_REUTILIZAVEIS.md
│   └── MAPA_SISTEMA_MULTGESTOR.md     ← migra de 09_MAPA_DO_SISTEMA/
│
├── 07_ERROSREAIS/                     ← "Lições de erros reais"
│   ├── LEIA-ME-ERROSREAIS.md
│   ├── MODELO_REGISTRO_ERRO.md
│   ├── INC-001-MIGRACAO_MANUAL.md     ← migra de .opencodex incidentes
│   ├── INC-002-XSS_COMPANIES.md       ← migra de .opencodex
│   ├── INC-003-XSS_USERS.md           ← migra de .opencodex
│   └── [novos registros são adicionados aqui]
│
├── 08_STACK/                          ← "Como funciona a NOSSA stack"
│   ├── LEIA-ME-STACK.md
│   ├── STACK_ATUAL.md                 ← migra de 01_STACK_ATUAL/
│   ├── FRONTEND_ATUAL.md              ← migra
│   ├── BACKEND_ATUAL.md               ← migra
│   ├── SUPABASE_ATUAL.md              ← migra
│   ├── VERCEL_ATUAL.md                ← migra
│   ├── RENDER_ATUAL.md                ← migra
│   ├── SERVICOS_EXTERNOS.md           ← migra
│   ├── UPGRADE_STACK.md               ← migra de 02_UPGRADE/
│   ├── PLANO_VERCEL.md                ← migra
│   ├── PLANO_RENDER.md                ← migra
│   ├── PLANO_SUPABASE.md              ← migra
│   ├── CUSTOS_E_LIMITES.md            ← migra
│   ├── QUANDO_ESCALAR.md              ← migra
│   └── STACK_MULTGESTOR.md            ← NOVO: mapa completo da stack
│
├── 09_OPERACIONAL/                    ← "SOPs e procedimentos"
│   ├── LEIA-ME-OPERACIONAL.md
│   ├── COMO_CRIAR_MISSAO.md
│   ├── COMO_ABRIR_BRANCH.md
│   ├── COMO_REVISAR_CODIGO.md
│   ├── COMO_FAZER_AUDITORIA.md
│   ├── COMO_ENCERRAR_MISSAO.md
│   ├── COMO_ATUALIZAR_SEGUNDO_CEREBRO.md
│   ├── FLUXO_DECISAO_TECNICA.md       ← migra de 05_FLUXOS/
│   └── COMANDOS_CHATJOE.md            ← migra de 00_COMANDOS_DO_CHATJOE
│
├── 10_IA/                             ← "Como funciona a IA Operacional"
│   ├── LEIA-ME-IA.md
│   ├── PROMPTS.md
│   ├── FERRAMENTAS.md
│   ├── MCPS.md
│   ├── CONECTORES.md
│   ├── MEMORIA_IA.md
│   ├── AGENTES.md
│   ├── ORQUESTRACAO.md
│   ├── CUSTOS_IA.md
│   ├── SEGURANCA_IA.md
│   ├── LIMITES.md
│   └── AVALIACAO_RESPOSTAS.md
│
├── 11_BOASPRATICAS/                   ← "Checklist permanente"
│   ├── LEIA-ME-BOASPRATICAS.md
│   ├── CHECKLIST_NOVA_FEATURE.md
│   ├── CHECKLIST_PR.md
│   ├── CHECKLIST_DEPLOY.md
│   ├── CHECKLIST_SEGURANCA.md
│   ├── CHECKLIST_PERFORMANCE.md
│   └── CHECKLIST_BANCO_DADOS.md
│
├── 12_NICHOS/                         ← "Como criar nichos"
│   ├── LEIA-ME-NICHOS.md              ← migra de 03_CRIADOR_DE_NICHOS/
│   ├── MODO_CRIADOR_DE_NICHOS.md
│   ├── TEMPLATE_NICHO.md
│   ├── CHECKLIST_NICHO.md
│   ├── FLUXO_CRIAR_NICHO.md
│   ├── PRD_TEMPLATE.md
│   ├── MVP_TEMPLATE.md
│   └── PLANO_EXECUCAO_TEMPLATE.md
│
├── 13_AGENTES/                        ← "Agentes do ChatJoe"
│   ├── LEIA-ME-AGENTES.md             ← migra de 11_AGENTES_OPERACIONAIS/
│   ├── INDEX_AGENTES.md
│   ├── MATRIZ_DE_AGENTES.md
│   ├── COMO_ESCOLHER_AGENTES.md
│   ├── FLUXO_MULTIAGENTE.md
│   ├── ORQUESTRACAO_CHATJOE.md
│   └── CONSULTOR_GLOBAL/              ← mantido
│
├── 14_REGISTROS/                      ← "Histórico datado"
│   ├── README.md                      ← migra de 12_REGISTROS/
│   └── CONSULTAS_GLOBAIS/             ← mantido
│
└── 15_CONTEXTO/                       ← "Segundo Cérebro filtrado"
    ├── LEIA-ME-CONTEXTO.md
    ├── MEMORIAS_IMPORTANTES.md        ← migra de 06_SEGUNDO_CEREBRO/
    ├── DECISOES_ATUAIS.md             ← migra
    ├── CONTEXTO_MULTGESTOR.md         ← migra
    ├── CONTEXTO_CHATJOE.md            ← migra
    └── CONTEXTO_NICHOS.md             ← migra
```

---

## Mapeamento: Atual → Novo

### O que se move (migração)

| Origem | Destino | Arquivos |
|---|---|---|
| `01_STACK_ATUAL/` (7 arquivos) | `08_STACK/` | Todos |
| `02_UPGRADE_DA_STACK/` (6 arquivos) | `08_STACK/` | Todos |
| `03_CRIADOR_DE_NICHOS/` (7 arquivos) | `12_NICHOS/` | Todos |
| `04_AUDITORIAS/` (7 arquivos) | `04_EVOLUIR/` + `11_BOASPRATICAS/` | Templates → Evoluir, Checklists → BoasPraticas |
| `05_FLUXOS_OPERACIONAIS/` (5 arquivos) | `03_OPERAR/` + `09_OPERACIONAL/` | Fluxos diários → Operar, Fluxo decisão → Operacional |
| `06_SEGUNDO_CEREBRO_FILTRADO/` (6 arquivos) | `15_CONTEXTO/` | Todos |
| `07_PROMPTS_DE_EXECUCAO/` (5 arquivos) | `02_CONSTRUIR/` | Todos |
| `08_DECISOES_DO_PROJETO/` (4 arquivos) | Mantido em `.opencodex/decisoes/` | Referenciado por link |
| `09_MAPA_DO_SISTEMA/` (5 arquivos) | `06_ARQUITETURA/` | Todos |
| `10_INSTRUTORES_DE_USO/` (10 arquivos) | Distribuído: mentalidade, construir, operar | Cada instrutor vai para a wiki correspondente |
| `11_AGENTES_OPERACIONAIS/` (7+ files) | `13_AGENTES/` | Todos |
| `12_REGISTROS/` (1+1 subdir) | `14_REGISTROS/` | Mantido |

### O que é NOVO (não existe ainda)

| Wiki | Conteúdo novo a criar |
|---|---|
| `01_MENTALIDADE/` | 13 arquivos — todo conteúdo de "mentalidade do desenvolvedor" |
| `05_DIAGNOSTICO/` | 10 arquivos — árvores de decisão para problemas comuns |
| `06_ARQUITETURA/` | 6 arquivos novos de padrões (mapeando só o mapa do sistema) |
| `07_ERROSREAIS/` | Modelo + 3 registros migrados de `.opencodex/incidentes/` |
| `09_OPERACIONAL/` | 5 SOPs novos + 1 migrado |
| `10_IA/` | 12 arquivos novos — guia completo da IA operacional |
| `11_BOASPRATICAS/` | 6 checklists novos |

### O que Some (consolidado)

| Arquivo | Destino final |
|---|---|
| `00_COMANDOS_DO_CHATJOE.md` | `09_OPERACIONAL/COMANDOS_CHATJOE.md` |
| `00_MAPA_DO_COFRE.md` | Reescrito com nova estrutura |
| `LEIA-ME.md` | Atualizado com nova estrutura |

---

## Papel do `.opencodex/` (manter separado)

O `.opencodex/` continua sendo o **cérebro operacional** (estado, decisões, fila, regras). Não vira wiki de aprendizado.

Manter em `.opencodex/`:
- `queue/` — fila de missões
- `decisoes/` — ADRs e decisões arquiteturais
- `rules/` — regras vinculantes
- `chatJoe/` — espaço operacional do chatJoe
- `automation/` — políticas de automação
- `projetos/` — estado dos projetos
- `handoff/` — passagem de contexto

Referenciar do Estúdio para `.opencodex/` via links:
- Wiki de Arquitetura → `.opencodex/projetos/multgestor/arquitetura`
- Wiki de Erros Reais → `.opencodex/projetos/multgestor/incidentes/`
- Wiki de Evoluir → `.opencodex/projetos/multgestor/roadmap/`
- Wiki de IA → `.opencodex/chatJoe/`

---

## Atualização do `.opencodex/`

### Atualizar `00-HOME.md`

Adicionar seção "Academia do Desenvolvedor" com links para o Estúdio:

```markdown
## Academia do Desenvolvedor

> Base de conhecimento técnico do ChatJoe. Cada wiki tem uma única responsabilidade.

- [[academia:MENTALIDADE| Mentalidade]] — Como um desenvolvedor pensa
- [[academia:CONSTRUIR| Construir]] — Como um desenvolvedor constrói
- [[academia:OPERAR| Operar]] — Como um desenvolvedor opera
- [[academia:EVOLUIR| Evoluir]] — Como um desenvolvedor evolui
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

### Atualizar `01-MAPA-GERAL.md`

Adicionar referência ao Estúdio da Criação como fonte de conhecimento técnico.

### Limpar `.opencodex/`

Remover conteúdo que migrou para o Estúdio:
- `areas/produto-roadmap/feature-genome/` → referenciar Estúdio
- `areas/produto-roadmap/impact-graph/` → referenciar Estúdio
- `areas/produto-roadmap/simulation-center/` → referenciar Estúdio

Manter apenas o estado operacional, não a documentação de aprendizado.

---

## Ordem de Execução

### Fase 1: Estrutura física (estimar 30 min)
1. Criar as 15 novas pastas no Estúdio
2. Criar `LEIA-ME-*.md` em cada pasta
3. Criar `00_ACADEMIA_HOME.md` como índice principal
4. Reescrever `00_MAPA_DO_COFRE.md`

### Fase 2: Migração de conteúdo (estimar 45 min)
1. Mover arquivos existentes para os destinos corretos
2. Atualizar links internos (wikilinks)
3. Consolidar duplicatas

### Fase 3: Conteúdo novo (estimar 60 min)
1. Criar `01_MENTALIDADE/` — 13 arquivos
2. Criar `05_DIAGNOSTICO/` — 10 arquivos
3. Criar `06_ARQUITETURA/` — 6 arquivos
4. Criar `07_ERROSREAIS/` — modelo + registros
5. Criar `09_OPERACIONAL/` — SOPs
6. Criar `10_IA/` — 12 arquivos
7. Criar `11_BOASPRATICAS/` — checklists

### Fase 4: Integração (estimar 20 min)
1. Atualizar `LEIA-ME.md` do Estúdio
2. Atualizar `00-HOME.md` do `.opencodex`
3. Atualizar `01-MAPA-GERAL.md` do `.opencodex`
4. Remover conteúdo migrado do `.opencodex`

### Fase 5: Verificação (estimar 15 min)
1. Verificar que todos os links funcionam
2. Verificar que não há arquivos órfãos
3. Verificar que cada wiki tem UMA responsabilidade
4. Criar relatório de auditoria da reorganização

---

## Perguntas Abertas (precisa de decisão humana)

1. **Conteúdo novo**: Quer que eu crie TODO o conteúdo novo (13 arquivos de Mentalidade, 10 de Diagnóstico, etc.) ou prefere criar só a estrutura e ir preenchendo depois?

2. **Conteúdo existente**: Quer que eu migre os arquivos existentes (mover fisicamente) ou prefere criar a nova estrutura com links para os arquivos antigos?

3. **Prioridade**: Quer começar pela wiki que considera mais importante (Mentalidade do Desenvolvedor) ou prefere a estrutura completa primeiro?

4. **Naming**: Os nomes das pastas devem ser em português (`01_MENTALIDADE`) ou inglês (`01_MINDSET`)?

5. **Profundidade**: Cada arquivo da wiki Mentalidade deve ter ~1 parágrafo (resumo) ou ~1 seção completa (tutorial)?

---

## Estimativa de Esforço

| Fase | Tempo | Dificuldade |
|---|---|---|
| Fase 1: Estrutura | 30 min | Baixa |
| Fase 2: Migração | 45 min | Média |
| Fase 3: Conteúdo novo | 60 min | Alta |
| Fase 4: Integração | 20 min | Baixa |
| Fase 5: Verificação | 15 min | Baixa |
| **Total** | **~2.5h** | |

> **Nota**: Fase 3 (conteúdo novo) é a mais demorada porque envolve criar 60+ arquivos de conhecimento. Se optar por criar só a estrutura, o tempo cai para ~1.5h.
