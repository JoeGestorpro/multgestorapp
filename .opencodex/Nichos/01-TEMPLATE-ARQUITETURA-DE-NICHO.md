# Arquitetura do Nicho: [NOME_DO_NICHO]

> Template preenchível para definir um novo nicho do MultGestor.
> Instruções: copie este arquivo para \Nichos/<Nome>/\ e preencha as seções 1 a 17.
> As seções 18 e 19 são preenchidas pela IA ou após o MVP.

---

## Status do nicho

🔴 Ideia bruta · 🟡 Arq. construção · 🟢 Pronto implementar · 🔵 Implementando · 🟣 Auditoria · ✅ Validado

Status atual: 🔴

## Nível de confiança

[ ] Baixo — ainda tem muitas dúvidas
[ ] Médio — MVP entendido, mas faltam rotas/regras
[ ] Alto — telas, rotas, dados e permissões definidos
[ ] Pronto para Code — pode implementar com baixo risco

---

## 1. Visão geral

**Nome do nicho:** [ex: PetGestor]

**Tipo de negócio:** [ex: Petshops, clínicas veterinárias, profissionais autônomos de cuidados pet]

**Frase de propósito:** [ex: Gestão completa para petshops — agendamento, histórico de pets e controle financeiro]

**Slug do módulo no banco:** [ex: pet]

---

## 2. Dor principal

O dono desse negócio:

- Perde dinheiro onde?
- Perde tempo com o quê?
- O que faz hoje no papel, WhatsApp ou planilha?
- O que ele esquece?
- O que ele não consegue medir?
- O que faria ele pagar por esse sistema?

**Resposta:**

`

`

---

## 3. Usuários

| Papel | O que faz | O que acessa |
|---|---|---|
| Dono | | |
| Gerente | | |
| Funcionário | | |
| Cliente público | | |

---

## 4. MVP — escopo mínimo

A menor versão que já entrega valor real:

1.
2.
3.
4.
5.

---

## 5. Fora do MVP (backlog)

Fica para fases futuras:

1.
2.
3.
4.
5.

---

## 6. Glossário do nicho

| Termo | Significado oficial |
|---|---|
| | |
| | |
| | |

---

## 7. Nomes oficiais

| Tipo | Nome oficial | Não usar |
|---|---|---|
| Tela | | |
| Entidade | | |
| Rota | | |
| Componente | | |

---

## 8. Mapa de reaproveitamento do core

| Recurso | Core já tem? | Usar como está? | Adaptar? | Criar novo? | Observação |
|---|---|---|---|---|---|
| Login | Sim | ☐ | ☐ | ☐ | |
| Usuários | Sim | ☐ | ☐ | ☐ | |
| Clientes | Sim | ☐ | ☐ | ☐ | |
| Agenda | Parcial | ☐ | ☐ | ☐ | |
| Serviços | Parcial | ☐ | ☐ | ☐ | |
| Financeiro | Sim | ☐ | ☐ | ☐ | |
| Permissões | Sim | ☐ | ☐ | ☐ | |
| Dashboard | Sim | ☐ | ☐ | ☐ | |
| Notificações | Sim | ☐ | ☐ | ☐ | |
| | | ☐ | ☐ | ☐ | |

---

## 9. Decisões travadas

Leis fixas do nicho. A IA não pode alterar sem nova decisão registrada.

- [ ] O nicho será uma extensão do MultGestor, não um sistema separado
- [ ] O login será reaproveitado do core
- [ ] O tenant será reaproveitado do core
- [ ] [outra decisão]
- [ ] [outra decisão]

---

## 10. Fases de implementação

### Fase 1 — Banco e backend base
- [ ] Migrations/tabelas
- [ ] Services/repositories
- [ ] Rotas protegidas
- [ ] Testes backend

### Fase 2 — Frontend interno
- [ ] Telas principais
- [ ] Componentes específicos
- [ ] Integração com API
- [ ] Estados (carregando, vazio, erro)

### Fase 3 — Fluxo público
- [ ] Página pública
- [ ] Agendamento sem login
- [ ] Confirmação

### Fase 4 — Auditoria
- [ ] Revisar tenant
- [ ] Revisar permissões
- [ ] Revisar testes
- [ ] Validar fluxo ponta a ponta

---

## 11. Telas internas

### Tela: [Nome]

**Objetivo:**

**Quem acessa:** [Dono / Gerente / Funcionário]

**Elementos visuais:**

**Botões:**

| Botão | Ação |
|---|---|

**Dados exibidos:**

---

## 12. Telas públicas

### Tela: [Nome]

**Objetivo:**

**Quem acessa:** [Cliente público / Sem login]

**Fluxo:**

**Dados coletados:**

---

## 13. Fluxo principal

Steps do início ao fim:

`

Step 1
  ↓
Step 2
  ↓
Step 3
  ↓
Resultado
`

---

## 14. Entidades

### Entidade: [nome]

**Campos:**

| Campo | Tipo | Regra |
|---|---|---|

**Regras de negócio:**

- [ ]
- [ ]

---

## 15. Rotas/API

| Método | Rota | Descrição | Permissão | Pública? |
|---|---|---|---|---|
| GET | | | | ☐ |
| POST | | | | ☐ |
| PUT | | | | ☐ |
| DELETE | | | | ☐ |

---

## 16. Permissões

| Papel | Acesso |
|---|---|
| Dono | Tudo |
| Gerente | |
| Funcionário | Só seus dados |
| Cliente público | Só link público |

---

## 17. Contrato de implementação

### Pode mexer

- [ ] Criar rotas específicas do nicho
- [ ] Criar componentes específicos
- [ ] Criar tabelas específicas aprovadas na seção 14
- [ ] Criar testes do fluxo principal

### Não pode mexer

- [ ] Login
- [ ] Estrutura global de tenant
- [ ] Sistema de permissões base
- [ ] Billing
- [ ] Core de empresas
- [ ] Core de usuários
- [ ] Layout global sem aprovação

### Precisa preservar

- [ ] Multi-tenant
- [ ] RLS
- [ ] Segurança
- [ ] Build
- [ ] Testes existentes
- [ ] Padrão visual do MultGestor

---

## 18. Plano de execução (gerado pela IA)

> Esta seção é PREENCHIDA PELA IA após ler as seções 1-17.
> A IA deve gerar o plano, apresentar para aprovação, e só então executar.

### Resumo do plano

| Item | Valor |
|---|---|
| Nicho | |
| Fases totais | |
| Risco estimado | |
| Arquivos a criar | |
| Arquivos a alterar | |
| Migrations | |
| Testes a criar | |
| Dependências entre fases | |

### Fase 1 — [nome]

**Arquivos a criar:**

**Arquivos a alterar:**

**Migrations:**

**Testes:**

**Riscos:**

### Fase 2 — [nome]

...

### Fase N — Auditoria

...

---

## 19. Camada de IA Operacional (pós-MVP)

> Siga [[../brain/plans/PLANO-IA-OPERACIONAL-NICHOS.md]] quando o nicho tiver dados reais.

### Pré-requisitos para ativar IA

| Feature | Requisito mínimo | Ativado? |
|---|---|---|
| Previsão de demanda | 100 agendamentos no nicho | [ ] |
| Churn detection | 50 clientes + 30 dias de histórico | [ ] |
| Sugestão de serviços | 200 serviços realizados | [ ] |
| [específico do nicho] | — | [ ] |

### Semáforo de IA para este nicho

🔴 Nicho sem dados
🟡 Nicho com 100+ agendamentos
🟢 Nicho com 500+ interações
🔵 Nicho maduro

Status atual: 🔴
