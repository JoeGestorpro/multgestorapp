# Instrutor Gerador de Nichos

> Metodologia para transformar ideias confusas em arquiteturas prontas para implementação.
> Leia uma vez, consulte em dúvidas.

---

## 1. O que é um nicho no MultGestor

Um nicho é uma **vertical especializada** construída sobre o Core do MultGestor.

`
MultGestor Core (login, tenant, usuários, agenda, financeiro, segurança)
    ↓               ↓               ↓
BarberGestor   PetGestor       ClínicaGestor
(barbearias)   (petshops)      (clínicas)
`

O Core fornece: autenticação · usuários · empresas · tenant · permissões · dashboard base · agendamentos · clientes · serviços · financeiro · notificações · configurações · layout base · componentes reutilizáveis.

O nicho **adapta** esses recursos para uma realidade específica. No Core existe "cliente". No PetGestor, cliente vira "tutor" e "pet" vira uma entidade vinculada.

---

## 2. Regra principal

Nunca começar pela implementação. A ordem correta é:

`
Ideia do nicho
↓
Problema que ele resolve
↓
Usuário principal
↓
MVP
↓
Telas
↓
Fluxos
↓
Botões
↓
Dados
↓
Rotas/API
↓
Regras de negócio
↓
Permissões
↓
Reaproveitamento do core
↓
Prompt de implementação para o Code
`

---

## 3. Responsabilidades (humano vs IA)

`
┌──────────────────────────────────────────────────────────────┐
│ JOE (humano)                                                 │
│ • Tem a ideia de nicho                                       │
│ • Preenche 01-TEMPLATE (perguntas do instrutor)              │
│ • Revisa plano gerado pela IA                                │
│ • Autoriza cada fase                                         │
│ • Valida auditoria final                                     │
├──────────────────────────────────────────────────────────────┤
│ IA OPERACIONAL (agente de código)                            │
│ • Lê template preenchido                                     │
│ • GERA PLANO DE EXECUÇÃO (fases, arquivos, riscos)           │
│ • Apresenta plano para aprovação                             │
│ • Executa fase autorizada                                    │
│ • Reporta resultado                                          │
│ • Gera relatório de auditoria                                │
├──────────────────────────────────────────────────────────────┤
│ SKILLS que a IA DEVE carregar                                │
│ • .agent/skills/create-vertical/SKILL.md                     │
│ • .agent/skills/multi-tenant-patterns/SKILL.md               │
│ • .agent/skills/backend-seguro-multgestor/SKILL.md           │
│ • brain/plans/PLANO-IA-OPERACIONAL-NICHOS.md (pós-MVP)      │
└──────────────────────────────────────────────────────────────┘
`

---

## 4. Semáforo de maturidade

| Cor | Significado |
|---|---|
| 🔴 | Ideia bruta — conceito inicial, sem definição |
| 🟡 | Arquitetura em construção — preenchendo template |
| 🟢 | Pronto para implementar — template completo, plano aprovado |
| 🔵 | Em implementação — código sendo gerado por fases |
| 🟣 | Em auditoria — verificando se entregou o que foi planejado |
| ✅ | Validado — nicho em produção, funcionando |

---

## 5. Nível de confiança

| Nível | Quando usar |
|---|---|
| Baixo | Ainda tem muitas dúvidas. Não implementar. |
| Médio | MVP entendido, mas faltam rotas/regras. Completar template. |
| Alto | Telas, rotas, dados e permissões definidos. Quase lá. |
| Pronto para Code | Pode implementar com baixo risco. |

Se o nível não for "Pronto para Code", a IA **não deve implementar**.

---

## 6. Regras anti-alucinação (fixas)

A IA não pode:

1. Inventar funcionalidades fora do MVP
2. Criar tabelas sem justificar no documento
3. Duplicar recursos do core (login, tenant, usuários)
4. Alterar autenticação ou estrutura de tenant
5. Alterar RLS existente sem autorização
6. Criar layout novo se já existe padrão visual no core
7. Criar rotas públicas sem explicar segurança
8. Criar status novos sem registrar no glossário
9. Mudar nomes de entidades já aprovadas no template
10. Se algo não estiver claro, não inventar — parar e registrar dúvida

---

## 7. Áreas proibidas sem autorização

❌ Login · Billing · Planos · RLS global · Middleware de autenticação
❌ Core de usuários · Core de empresas · Deploy · Variáveis de ambiente
❌ Banco de produção · Estrutura de tenant global

---

## 8. Pipeline completo

`
┌─────────────────────────────────────────────────────────────────────┐
│ JOE                                                                 │
│ 1. Abre Nichos/README.md                                            │
│ 2. Lê 00-INSTRUTOR.md (primeira vez)                                │
│ 3. Copia 01-TEMPLATE.md → Nichos/MeuNicho/                         │
│ 4. Preenche seções 1-17 (dados do nicho)                            │
│ 5. Abre 02-PROMPTS.md → copia PROMPT 2 (implementação)             │
│ 6. Cola na IA: template preenchido + prompt 2                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ IA OPERACIONAL                                                      │
│ 1. Lê template preenchido                                           │
│ 2. Carrega skills: create-vertical, multi-tenant-patterns           │
│ 3. GERA SEÇÃO 18 (plano de execução: fases, arquivos, riscos)      │
│ 4. APRESENTA PLANO para Joe                                         │
└──────────────────────────┬──────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ JOE revisa plano                                                    │
│ ├── Aprova → IA executa fase 1                                      │
│ │            → IA reporta resultado                                  │
│ │            → Joe autoriza fase 2                                   │
│ └── Rejeita → Joe ajusta template ou plano                          │
└─────────────────────────────────────────────────────────────────────┘
       │ (após MVP completo + dados reais)
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ JOE                                                                 │
│ 7. Verifica seção 19 do template (pré-requisitos de IA)             │
│ 8. Se dados suficientes → ativa IA Operacional                      │
│ 9. Abre 02-PROMPTS.md → copia PROMPT 5 (IA operacional)            │
│ 10. Cola na IA com referência ao PLANO-IA-OPERACIONAL               │
└──────────────────────────┬──────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ IA OPERACIONAL (pós-MVP)                                            │
│ 1. Lê brain/plans/PLANO-IA-OPERACIONAL-NICHOS.md                   │
│ 2. Porta LLM Engine (se não existir)                                │
│ 3. Ativa features de IA para o nicho (previsão, churn, etc.)        │
│ 4. Dashboard ganha card "Insights IA"                               │
│ 5. Reporta resultado                                                │
└─────────────────────────────────────────────────────────────────────┘
`

---

## 9. Referência técnica obrigatória

Antes de implementar, a IA DEVE carregar também:

| Documento | O que contém |
|---|---|
| \.agent/skills/create-vertical/SKILL.md\ | Estrutura de diretórios, migrations, anti-patterns |
| \.agent/skills/multi-tenant-patterns/SKILL.md\ | Regras de isolamento por company_id |
| \.agent/skills/backend-seguro-multgestor/SKILL.md\ | Padrões de segurança do backend |
| \rain/plans/PLANO-IA-OPERACIONAL-NICHOS.md\ | Camada de IA pós-MVP (se aplicável) |

---

## 10. Regra de ouro

> Este nicho precisa nascer como produto, mas ser implementado como extensão do core.

Produto para o cliente. Extensão para o código. Essa é a mentalidade correta.
