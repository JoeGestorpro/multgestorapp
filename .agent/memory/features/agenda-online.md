# Feature: Agenda Online

## Estado Atual
✅ Implementada e operacional

## Descrição
Agenda visual para barbearias com suporte a múltiplos colaboradores, bloqueios de horário, horários de funcionamento configuráveis por dia da semana e agendamento online público.

## Regras de Negócio
- Slots de horário configuráveis por intervalo de minutos
- Bloqueios manuais de horário (dia inteiro ou período)
- Horários de funcionamento por dia da semana
- Cada agendamento tem: cliente, serviço, colaborador, data/hora, status
- Duração do serviço respeitada no cálculo de disponibilidade
- Antecedência mínima configurável para agendamento online
- Conflitos de horário validados no backend
- Datas em UTC no banco, convertidas para timezone do frontend

## Próximos Passos
- Lembretes automáticos (WhatsApp + e-mail)
- Confirmação pelo cliente via link
- Reagendamento online
- Cancelamento com regras de antecedência
- Validações adicionais de conflito
