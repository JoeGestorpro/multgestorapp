# Visual Identity — Identidade Visual

## Visão Geral
Sistema de identidade visual do MultGestor e seus módulos. Define logos, cores, tipografia, iconografia e aplicações consistentes em todas as superfícies.

## Logotipo
- **MultGestor**: logo principal com tipografia customizada + ícone de gestão
- **BarberGestor**: logo com coroa dourada + barber pole (existente em `public/branding/`)
- **ClimaGestor**: a definir (sugestão: folha/estetoscópio + tipografia clean)

## Cores da Marca
| Marca | Cor Primária | Secundária | Acento |
|-------|-------------|-----------|--------|
| MultGestor | #070a0d | #1a1a2e | #d4a853 |
| BarberGestor | #0a0a0a | #1a1a1a | #d4a853 (dourado) |
| ClimaGestor | #0a1628 | #1a2a3e | #4ade80 (verde) |

## Tipografia
- **Headlines**: Plus Jakarta Sans (Bold, ExtraBold)
- **Body**: Inter (Regular, Medium, Semibold)
- **Números**: Inter (Tabular numbers)
- **Monospace**: JetBrains Mono (código, telas de API)

## Iconografia
- Biblioteca: Lucide React
- Tamanho padrão: 20px (UI), 24px (seções), 32px+ (destaques)
- Stroke-width: 1.5 (UI), 2.0 (destaques)
- Cor: currentColor (herda do texto)

## Consistência Visual
| Elemento | Regra |
|----------|-------|
| Border-radius | 8px (UI), 16px (cards), 9999px (badges) |
| Sombras | Box-shadow: 0 4px 20px rgba(0,0,0,0.3) |
| Gradientes | Linear 135°, sempre da cor base para tom mais claro |
| Glass | Backdrop-filter blur(12px), border 1px solid rgba white 0.1 |

## Integração
| Componente | Como se integra |
|------------|-----------------|
| **Premium SaaS Design** | Cores e estilos aplicados no design |
| **Color Psychology** | Psicologia por trás das cores |
| **Brand Authority** | Consistência gera autoridade |
