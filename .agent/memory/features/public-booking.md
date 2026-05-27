# Feature: Public Booking (Agendamento Online Público)

## Estado Atual
✅ Implementado e operacional

## Descrição
Página pública de agendamento acessível via `/agendamento/:slug`. Clientes podem selecionar serviço, horário e colaborador sem necessidade de login.

## Regras de Negócio
- Rota pública (sem autenticação)
- Slug único por empresa (identifica o tenant)
- Cliente seleciona: serviço → horário disponível → colaborador
- Respeita horários de funcionamento, bloqueios, duração do serviço
- Antecedência mínima configurável (evita agendamento em cima da hora)
- Confirmação por e-mail via Resend
- Preview em tempo real nas configurações da empresa
- Identidade visual da empresa aplicada (logo, cores, banner)

## Próximos Passos
- Lembretes automáticos (WhatsApp + e-mail)
- Confirmação pelo cliente via link
- Reagendamento online
- Cancelamento com regras de antecedência
