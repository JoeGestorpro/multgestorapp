# Prompts para Code — Nichos

> Prompts prontos para copiar e colar para a IA operacional.
> Cada prompt tem seu momento no ciclo do nicho.

---

## Prompt 1 — Planejamento (pensar a arquitetura sem codar)

**Quando usar:** Joe quer que a IA pense a arquitetura do nicho sem implementar nada.

**Instruções para copiar:**

`
Quero estruturar um novo nicho para o MultGestor.

Nicho: [NOME_DO_NICHO]
Tipo de negócio: [TIPO]

Antes de implementar qualquer código, pense como arquiteto sênior
de produto SaaS multi-tenant.

Considere que o MultGestor já possui core com autenticação, usuários,
empresas, tenant, permissões, dashboard base, agenda, clientes e serviços.

⚠️ Não implemente código.
⚠️ Não invente funcionalidades fora do MVP.
⚠️ Não duplique recursos do core.

Entregue:
1. Visão geral do nicho
2. Dor principal
3. Usuários/personas
4. MVP mínimo
5. O que fica fora do MVP
6. Telas internas e públicas
7. Fluxo principal
8. Entidades necessárias
9. O que reaproveita do core
10. O que é específico do nicho
11. Rotas/API
12. Permissões
13. Regras de negócio
14. Riscos técnicos
15. Ordem recomendada de implementação
`

---

## Prompt 2 — Implementação (gera plano automaticamente)

**Quando usar:** Template 01 preenchido (seções 1-17). Pronto para codar.

**Instruções para copiar:**

`
Você recebeu o template de arquitetura do nicho [NOME] preenchido.

SUA PRIMEIRA TAREFA NÃO É IMPLEMENTAR.

Sua primeira tarefa é:

1. LER o template completo abaixo (seções 1 a 17)
2. CARREGAR as skills obrigatórias:
   - .agent/skills/create-vertical/SKILL.md
   - .agent/skills/multi-tenant-patterns/SKILL.md
   - .agent/skills/backend-seguro-multgestor/SKILL.md
3. GERAR SEÇÃO 18 do template (plano de execução) com:
   - Fases ordenadas
   - Arquivos que serão criados em cada fase
   - Arquivos que serão alterados
   - Migrations necessárias
   - Testes a criar
   - Riscos de cada fase
   - Dependências entre fases
4. APRESENTAR O PLANO para aprovação
5. SÓ ENTÃO EXECUTAR a fase 1
6. AO FINAL DE CADA FASE, reportar resultado e aguardar autorização

### REGRAS OBRIGATÓRIAS

{COLE A SEÇÃO 17 — CONTRATO DE IMPLEMENTAÇÃO AQUI}

### REGRAS ANTI-ALUCINAÇÃO

1. Não inventar funcionalidades fora do MVP
2. Não criar tabelas sem justificar
3. Não duplicar recursos do core
4. Não alterar autenticação ou tenant
5. Não alterar RLS existente
6. Não criar layout novo se já existe padrão
7. Não criar rotas públicas sem explicar segurança
8. Não criar status novos sem registrar
9. Não mudar nomes de entidades já aprovadas
10. Se algo não estiver claro, parar e registrar dúvida

### ÁREAS PROIBIDAS

❌ Login · Billing · Planos · RLS global · Middleware de auth
❌ Core de usuários · Core de empresas · Deploy · Variáveis de ambiente
❌ Banco de produção · Estrutura de tenant global

### TEMPLATE PREENCHIDO

{COLE AS SEÇÕES 1 A 17 DO 01-TEMPLATE AQUI}
`

---

## Prompt 3 — Dúvida/Objeção

**Quando usar:** Joe travou em uma decisão e não sabe se cria tabela nova, adapta do core, ou deixa para depois.

**Instruções para copiar:**

`
Estou estruturando o nicho [NOME] no MultGestor.

Minha dúvida é:

[ESCREVER A DÚVIDA]

Responda pensando como arquiteto sênior SaaS multi-tenant.

Antes de sugerir criar algo novo, verifique:
1. Se isso já pode existir no core
2. Se isso é necessário para o MVP
3. Se isso é tela, modal, rota, entidade ou regra de negócio
4. Se isso deve ficar para fase futura

Entregue a resposta em:
- Decisão recomendada
- Por que
- Risco se fizer errado
- Como documentar no nicho
- Como mandar para o Code depois
`

---

## Prompt 4 — Modo auditor (criticar antes de implementar)

**Quando usar:** Antes de implementar, para a IA criticar a arquitetura.

**Instruções para copiar:**

`
Você agora está em modo auditor.

Analise este nicho como se fosse reprovar algo mal planejado.

Procure:
- Escopo inchado (coisas que não deveriam estar no MVP)
- Falta de MVP claro
- Duplicação do core
- Rotas mal definidas
- Entidades desnecessárias
- Permissões fracas
- Risco multi-tenant
- Falta de critérios de aceite
- Funcionalidades inventadas
- Pontos que podem quebrar o MultGestor
- Contrato de implementação desrespeitado

Não implemente nada.

Entregue:
- P0: problemas críticos (impedem implementação)
- P1: problemas importantes (devem ser resolvidos)
- P2: melhorias (podem ficar para depois)
- Veredito final: aprovado ou não aprovado para implementação
`

---

## Prompt 5 — IA Operacional (pós-MVP)

**Quando usar:** Nicho já tem dados reais (100+ agendamentos). Quer ativar features de IA.

**Instruções para copiar:**

`
O nicho [NOME] já está em produção com dados reais.

Siga o plano em brain/plans/PLANO-IA-OPERACIONAL-NICHOS.md.

Adapte para este nicho:

1. Feature de IA mais relevante: [previsão demanda / churn / sugestão]
2. Dados disponíveis: [quantos agendamentos, clientes, serviços]
3. O card de insights deve entrar no dashboard do nicho

Mantenha o design agnóstico — a engine LLM deve servir qualquer nicho.
`

---

## Resumo: qual prompt usar em cada momento

| Momento | Prompt |
|---|---|
| Joe tem ideia, quer pensar | Prompt 1 — Planejamento |
| Template preenchido, quer codar | Prompt 2 — Implementação |
| Joe travou em decisão | Prompt 3 — Dúvida |
| Antes de codar, quer validar | Prompt 4 — Modo auditor |
| Nicho em produção, quer IA | Prompt 5 — IA Operacional |
