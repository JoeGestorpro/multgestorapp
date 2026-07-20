# Fluxos de Produto — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[product/funcionalidades]] · [[product/prds/README]] · [[maps/multgestor-core/flows/README]]

---

## Fluxos Principais

### 1. Onboarding do Cliente
```
Cadastro → First Access → Configurar Serviços → Configurar Colaboradores
  → Configurar Horários → Ativar Booking Público → Começar a Operar
```

### 2. Agendamento Online (Público)
```
Visitante → Escolhe Serviço → Escolhe Colaborador → Escolhe Horário
  → Informa Dados → Confirma → Recebe Confirmação
```

### 3. Atendimento (Dono/Colaborador)
```
Cliente Chega → Abre Agenda do Dia → Inicia Atendimento → Finaliza
  → Registra Pagamento → Avaliação (se ativada)
```

### 4. Pós-Atendimento
```
Finalização → Lembrete automático (job) para próximo agendamento
  → Webhook de pagamento (se aplicável) → Atualização de métricas
```

### 5. Financeiro
```
Venda → Caixa → Comissão do Colaborador → Relatório
  → (se assinatura) → Cobrança recorrente
```

### 6. Trial → Pago
```
Cadastro (trial) → Usa durante trial → Vencimento → Feature Gate
  → Escolhe Plano → Pagamento → Ativação Completa
```

## Fluxos por Nicho

- [[nichos/barbergestor/README]] — Fluxos específicos BarberGestor
- [[nichos/climagestor/README]] — Fluxos específicos ClimaGestor
- [[nichos/fiscalgestor/README]] — Fluxos específicos FiscalGestor

## Referências

- [[maps/multgestor-core/fluxos/fluxo-agendamento-publico]]
- [[maps/multgestor-core/fluxos/fluxo-login-cadastro]]
- [[maps/multgestor-core/fluxos/fluxo-pagamento]]
- [[maps/multgestor-core/fluxos/fluxo-whatsapp]]
