# Roteador de missão — chatJoe

> Classifica toda missão por tipo e nível de risco.
> Define se pode seguir simples, precisa de testes, auditoria ou bloqueio.

## Tipos de missão

| Tipo | Código | Descrição |
|---|---|---|
| Conversa | \CONV\ | bate-papo sobre o projeto |
| Planejamento | \PLAN\ | organizar ideias, criar plano |
| Auditoria READ_ONLY | \AUDIT_RO\ | verificar código sem modificar |
| Implementação controlada | \IMP_CTRL\ | implementar com escopo fechado |
| Bugfix | \BUG\ | corrigir erro |
| Refatoração | \REFACT\ | melhorar código sem mudar comportamento |
| PRD/MVP | \PRD\ | criar PRD ou MVP |
| Roadmap | \ROAD\ | definir ou atualizar roadmap |
| Frontend/UI | \FE\ | criar ou alterar interface |
| Backend/API | \BE\ | criar ou alterar API |
| Banco de dados | \DB\ | migração, schema, query |
| Segurança | \SEC\ | auditoria de segurança, RLS, auth |
| Produção/Deploy | \PROD\ | deploy, rollback, produção |
| LLM/Agentes | \LLM\ | prompt, skill, agente, LLM |
| Documentação | \DOC\ | criar ou atualizar docs |
| Code review | \CR\ | revisar código |
| Compactação | \COMPACT\ | resumir conversa |

## Níveis de risco

| Risco | Descrição | Exige |
|---|---|---|
| **1** | documentação apenas — sem alteração de código | plano simples |
| **2** | frontend isolado ou texto visual — sem backend | plano simples |
| **3** | backend sem banco sensível — sem dados críticos | testes claros |
| **4** | banco, autenticação, billing, LLM provider ou integrações críticas | auditoria obrigatória |
| **5** | produção, pagamento, dados reais, segurança crítica, deploy ou rollback | auditoria final obrigatória |

## Matriz de decisão

TIPO MISSÃO × RISCO → AÇÃO RECOMENDADA

                 Risco 1   Risco 2   Risco 3   Risco 4   Risco 5
                 -------   -------   -------   -------   -------
CONV              plano     plano     plano     plano     plano
PLAN              plano     plano     plano     plano     plano
AUDIT_RO          plano     plano     plano     plano     plano
IMP_CTRL          —         plano     testes    AUDIT     AUDIT
BUG               —         plano     testes    AUDIT     AUDIT
REFACT            —         plano     testes    AUDIT     AUDIT
PRD               plano     plano     plano     plano     plano
ROAD              plano     plano     plano     plano     plano
FE                —         plano     —         —         —
BE                —         —         testes    AUDIT     AUDIT
DB                —         —         —         AUDIT     AUDIT
SEC               —         —         —         AUDIT     AUDIT
PROD              —         —         —         —         AUDIT
LLM               plano     plano     testes    AUDIT     AUDIT
DOC               plano     plano     plano     plano     plano
CR                —         —         plano     plano     plano
COMPACT           plano     plano     plano     plano     plano

Legenda:
plano  → pode seguir com plano simples
testes → precisa de testes claros no prompt
AUDIT  → auditoria final obrigatória
—      → combinação improvável (se ocorrer, usar bom senso)

## Como usar

Ao preparar uma missão:

1. identificar o tipo principal (e subtipo se misto)
2. estimar o nível de risco
3. consultar a matriz para saber o que é exigido
4. se risco 4 ou 5: incluir auditoria final obrigatória
5. gerar prompt seguindo as exigências da matriz

## Sugestão automática de skills (SkillGate)

Por tipo de missão + nível de risco:

| Tipo | Risco 1-2 | Risco 3 | Risco 4-5 |
|---|---|---|---|
| FE | frontend, ux-ui | + testes | + seguranca |
| BE | backend | + testes, api-design | + seguranca, auth-review |
| DB | banco-de-dados | banco-de-dados, testes | banco-de-dados, rls-review, seguranca |
| SEC | seguranca | seguranca, auth-review | seguranca, auth-review, rls-review |
| BUG | skill do dominio | skill do dominio + testes | skill do dominio + seguranca + testes |
| IMP_CTRL | skill do dominio | skill do dominio + testes | skill do dominio + seguranca + testes |
| PROD | — | producao, devops | producao, devops, seguranca |
| LLM | llm, prompt-engineering | llm, prompt-engineering, agent-architecture | llm, agent-architecture, seguranca |
| PRD | produto, prd-mvp | produto, prd-mvp | produto, prd-mvp |
| AUDIT_RO | code-review | code-review + skill do dominio | code-review + seguranca |
| CR | code-review | code-review + skill do dominio | code-review + seguranca |
| DOC | documentacao | documentacao | documentacao |

## Sugestão automática de agentes (SkillGate)

Por tipo de missão:

| Tipo | Agentes sugeridos |
|---|---|
| FE | Frontend Specialist |
| BE | Backend Specialist, Platform Architect (risco 4+) |
| DB | Database Architect, Security Auditor (risco 4+) |
| SEC | Security Auditor, Platform Architect (risco 4+) |
| BUG | Especialista do dominio, QA Engineer (risco 3+) |
| IMP_CTRL | Especialista do dominio, QA Engineer (3+), Platform Arch. (4+), Security Auditor (4+) |
| PROD | DevOps Engineer, Platform Architect (4+), Security Auditor (4+) |
| LLM | LLM Engineer, Prompt Architect |
| PRD | Product Manager, Product Owner |
| AUDIT_RO | Platform Architect, Security Auditor (4+) |
| CR | Platform Architect, QA Engineer (3+) |
| DOC | Technical Writer |

## Minimos obrigatorios por risco (SkillGate)

| Risco | Min. skills | Min. agentes | Exige |
|---|---|---|---|
| 1 | 1 | 0 | — |
| 2 | 1 | 1 | — |
| 3 | 2 | 1 | QA ou Platform Architect |
| 4 | 3 | 2 | Security Auditor incluso |
| 5 | 3 | 2 | Security Auditor + Platform Architect |

## SkillGate

Ver [[../skillgate/README.md]] para detalhes completos.
