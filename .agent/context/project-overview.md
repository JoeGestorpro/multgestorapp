# Project Overview — MultGestor / BarberGestor

## O que é MultGestor?

MultGestor é uma plataforma SaaS multi-tenant que oferece módulos de gestão especializados por nicho de mercado. Cada módulo é independente, mas compartilha a mesma infraestrutura de autenticação, banco multi-tenant e deploy.

## O que é BarberGestor?

BarberGestor é o primeiro módulo do MultGestor. É um sistema completo de gestão para barbearias, incluindo:

- Agenda visual com slots, bloqueios e horários de funcionamento
- Registro de vendas por serviço/produto
- Caixa diário com resumo por forma de pagamento
- Comissão de colaboradores (percentual ou fixa)
- Acertos e fechamento financeiro
- Relatórios por período, colaborador, serviço
- Agendamento online público (cliente marca horário)
- Colaboradores com perfis e permissões
- Identidade visual personalizável (logo, cores)
- Múltiplos planos (Free, Premium, etc.)

## Objetivo Comercial

Oferecer uma ferramenta acessível e profissional para pequenas e médias barbearias organizarem suas operações, reduzirem falhas de comunicação e aumentarem a rentabilidade.

## Usuários do Sistema

### Master Admin
- Acessa painel administrativo master (`/master`)
- Gerencia todos os tenants (empresas)
- Visualiza métricas globais
- NÃO acessa dados operacionais dos tenants
- NÃO usa os módulos de gestão

### Dono da Empresa / Tenant Admin
- Acessa o módulo contratado (ex.: `/barber/dashboard`)
- Gerencia colaboradores, serviços, produtos, finanças
- Configura identidade visual e agenda online
- Cria e deleta registros

### Colaborador
- Acessa o módulo com permissões limitadas
- Registra vendas, visualiza comissões
- Pode ou não gerenciar agenda
- Perfil definido pelo dono da empresa

### Cliente Final
- Acessa apenas o link público de agendamento
- Não faz login no sistema
- Marca, remarca ou cancela horários
- Visualiza serviços e horários disponíveis

## Visão de Produto

O MultGestor foi projetado para se expandir para outros nichos:
- Clínicas de estética
- Salões de beleza
- Oficinas mecânicas
- Consultórios

Cada módulo novo compartilha a base multi-tenant existente e adiciona regras de negócio específicas do nicho.
