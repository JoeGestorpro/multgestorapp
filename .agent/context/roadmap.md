# Roadmap — MultGestor / BarberGestor

## Estado Atual (Maio 2026)

O BarberGestor está operacional e em uso. Funcionalidades implementadas:

- ✅ Agenda visual (list/calendar)
- ✅ Vendas por serviço/produto
- ✅ Caixa diário com formas de pagamento
- ✅ Comissão de colaboradores
- ✅ Acertos financeiros
- ✅ Relatórios por período
- ✅ Agendamento online público
- ✅ Colaboradores com permissões
- ✅ Identidade visual personalizável
- ✅ Planos (Free, Premium)
- ✅ Autenticação com JWT + PIN
- ✅ E-mail transacional (Resend)
- ✅ Bucket de storage (logos)
- ✅ Master Admin isolado

## Próximos Passos Técnicos

### Curto Prazo

1. **WhatsApp API** — Integração para notificações e confirmações
   - ✅ **(2026-06-04)** Provider real Meta Cloud API + resolver per-tenant (token cifrado) + confirmação/cancelamento + **lembrete agendado** (commit `545282d`, APPROVE). ⚠️ em feature branch `fase2/wa-reminder`, ainda não em `main`. Pendência **ops**: token do tenant + template `appointment_reminder` aprovado na Meta. Follow-ups: durabilidade Outbox, multi-janela 24h+2h.
   - Criptografar access_token com `WHATSAPP_TOKEN_ENCRYPTION_KEY`
   - Enviar confirmação de agendamento via WhatsApp
   - Notificar colaborador sobre novo agendamento
   - GET da integração nunca retornar token real

2. **SMS** — Notificações por SMS para clientes sem WhatsApp

3. **Gateway de Pagamento** — Processar pagamentos online
   - Link de pagamento para agendamentos
   - Split de pagamento entre empresa e colaborador
   - Recibo digital

4. **Agenda Premium** — Melhorias na agenda online
   - Lembretes automáticos (WhatsApp + e-mail)
   - Confirmação pelo cliente
   - Reagendamento online
   - Cancelamento com regras de antecedência

### Médio Prazo

5. **Landing Pages Públicas** — Página personalizada para cada barbearia
   - Link público com identidade visual
   - Galeria de fotos
   - Serviços em destaque
   - Avaliações de clientes

6. **PWA (Progressive Web App)** — Instalação no celular do cliente
   - Funcionamento offline básico
   - Push notifications
   - Ícone e splash screen

7. **Módulo Financeiro Avançado** — Mais relatórios e projeções
   - Fluxo de caixa projetado
   - DRE simplificado
   - Comparativo mensal
   - Exportação para CSV/PDF

### Longo Prazo

8. **Novos Módulos** — Expandir para outros nichos
   - Clínicas de estética
   - Salões de beleza
   - Consultórios

9. **Escalabilidade**
   - Cache (Redis)
   - Rate limiting avançado
   - CDN para assets
   - Read replicas para relatórios pesados

10. **Melhorias de UX**
    - Modo escuro consistente
    - Animações refinadas
    - Tutorial interativo completo
    - Atalhos de teclado

11. **Melhorias de Segurança**
    - Auditoria de ações
    - 2FA (autenticação de dois fatores)
    - Rate limiting por IP
    - Web Application Firewall

## Próximos Passos Comerciais

- Onboarding automatizado para novos usuários
- Tour guiado na primeira vez
- Métricas de uso para retenção
- Integração com redes sociais
- Programa de indicação
