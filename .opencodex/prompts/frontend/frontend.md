# ?? Prompts — Frontend (React / Vite)

> **Status:** OFICIAL • VIVO
> **Propósito:** Prompts especializados para desenvolvimento frontend do MultGestor.
> **Atualizado:** 2026-07-04

## Stack

- React 19 + Vite
- JavaScript (JSX)
- Componentes reutilizáveis em src/components/
- Funcionalidades por domínio em src/features/
- Design System inspirado em Stripe (ver [[../PLAN.md]])

## Prompts Disponíveis

### Criar novo componente
Seguir padrão dos componentes existentes em src/components/. Usar Design System existente. Não duplicar BarberUI.jsx — preferir componentes genéricos.

### Criar nova página
Adicionar em src/pages/. Registrar rota no sistema de roteamento. Usar hooks customizados de src/hooks/.

### Criar nova feature
Adicionar em src/features/<nome>/. Incluir componente, lógica e estilos. Seguir o padrão das features existentes.

## Regras

- Zero erros de ESLint (verificado no CI)
- CSP (Content Security Policy) ativo — não usar inline scripts/styles
- Compatível com Vercel deploy
