# Feature: WhatsApp API

## Estado Atual
🔶 Planejado (não implementado)

## Descrição
Integração com WhatsApp Business API para envio de notificações e confirmações de agendamento.

## Regras de Negócio
- Access token criptografado no banco usando `WHATSAPP_TOKEN_ENCRYPTION_KEY`
- GET da integração NUNCA retorna o token real (apenas metadados)
- Envio de confirmação de agendamento via WhatsApp
- Notificação ao colaborador sobre novo agendamento
- Webhook para receber mensagens dos clientes
- Configuração por empresa (tenant)
- Token nunca exposto ao frontend

## Próximos Passos
- Planejar integração WhatsApp Business API
- Implementar criptografia do access_token
- Criar endpoint de configuração da integração
- Implementar webhook para mensagens
- Enviar confirmação de agendamento via WhatsApp
- Notificar colaborador sobre novo agendamento
