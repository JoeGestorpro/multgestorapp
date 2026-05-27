# Próximas Ações

## Curto Prazo

### Stitch — Protótipos Premium
- [ ] Revisar as 3 telas no Stitch web UI
- [ ] Criar versão mobile da Agenda Interna Premium
- [ ] Refinar aba "Financeiro" com gráficos de faturamento
- [ ] Após validação visual, implementar componentes React no OpenCode

### WhatsApp API
- [ ] Planejar integração WhatsApp Business API
- [ ] Implementar criptografia do access_token com WHATSAPP_TOKEN_ENCRYPTION_KEY
- [ ] Criar endpoint de configuração da integração
- [ ] Implementar webhook para receber mensagens
- [ ] Enviar confirmação de agendamento via WhatsApp
- [ ] Notificar colaborador sobre novo agendamento
- [ ] GET da integração nunca retornar token real

### Agenda Online
- [ ] Refinar fluxo de agendamento (UX do cliente)
- [ ] Implementar lembretes automáticos (WhatsApp + e-mail)
- [ ] Permitir confirmação pelo cliente
- [ ] Permitir reagendamento online
- [ ] Cancelamento com regras de antecedência
- [ ] Validações adicionais no backend (conflitos, horários)

### Frontend
- [ ] Integrar busca real com modal/command palette (Ctrl+K)
- [ ] Conectar notificações com dados reais do backend
- [ ] Melhorar responsivo mobile da sidebar
- [ ] Revisar acessibilidade geral

## Médio Prazo

### Gateway de Pagamento
- [ ] Avaliar provedores (Stripe, Asaas, Mercado Pago)
- [ ] Link de pagamento para agendamentos
- [ ] Split de pagamento entre empresa e colaborador
- [ ] Recibo digital

### Módulo Financeiro Avançado
- [ ] Fluxo de caixa projetado
- [ ] DRE simplificado
- [ ] Comparativo mensal de faturamento
- [ ] Exportação de relatórios para CSV/PDF

### SMS
- [ ] Integrar provedor de SMS
- [ ] Notificações para clientes sem WhatsApp

### Landing Pages
- [ ] Página pública personalizada para cada barbearia
- [ ] Galeria de fotos
- [ ] Serviços em destaque
- [ ] Avaliações de clientes

### PWA
- [ ] Service worker para funcionamento offline básico
- [ ] Push notifications
- [ ] Ícone e splash screen

## Longo Prazo

### Segurança
- [ ] Implementar logs de auditoria
- [ ] Rate limiting por IP
- [ ] 2FA (autenticação de dois fatores)
- [ ] Web Application Firewall

### Performance
- [ ] Cache com Redis
- [ ] Rate limiting avançado
- [ ] CDN para assets
- [ ] Read replicas para relatórios pesados

### Testes
- [ ] Testes unitários para regras de negócio críticas
- [ ] Testes de integração para API
- [ ] Testes de segurança multi-tenant

### Novos Módulos
- [ ] Clínicas de estética
- [ ] Salões de beleza
- [ ] Consultórios

### UX
- [ ] Tutorial interativo completo
- [ ] Atalhos de teclado
- [ ] Tour guiado na primeira vez
