# CTA Engine — Call to Action Engine

## Visão Geral
Engine responsável por posicionar, estilizar e otimizar todos os CTAs (Call to Action) das landing pages. Cada CTA é um ponto de decisão — cor, texto, posição e momento certos determinam a conversão.

## Princípios
- **Um CTA primário por viewport**: nunca competir com ele mesmo
- **Cor de alto contraste**: CTA deve ser o elemento mais visível
- **Texto orientado a benefício**: "Começar grátis" > "Cadastre-se"
- **Urgência no texto**: "Testar grátis por 7 dias" > "Saiba mais"

## Hierarquia de CTAs
| Tipo | Cor | Tamanho | Posição | Quando aparece |
|------|-----|---------|---------|----------------|
| Primário | Marca (alta saturação) | Large | Hero, CTA final | Sempre |
| Secundário | Outline / ghost | Medium | Abaixo de features | Scroll 50%+ |
| Terciário | Link | Small | Inline no texto | Contextual |
| Sticky Mobile | Marca | Full-width | Fixed bottom | Scroll 60%+ |

## Padrões de Texto para CTA
| Contexto | Texto | Gatilho |
|----------|-------|---------|
| Hero (free trial) | "Começar grátis por 7 dias" | Risco zero |
| Hero (demo) | "Ver demonstração ao vivo" | Curiosidade |
| Pricing | "Assinar agora" | Ação |
| Final | "Transformar minha barbearia" | Identidade |
| Mobile | "Testar grátis" | Simplificado |

## Friction Reduction
- CTA primário NUNCA abre modal ou formulário longo
- CTA leva direto para cadastro (max 3 campos)
- CTA sticky tem fechamento (X) para não irritar
- CTA secundário pode ser "Ver planos" (menos compromisso)

## Integração
| Componente | Como se integra |
|------------|-----------------|
| **Hero Engine** | Define CTA primário do hero |
| **Pricing Psychology** | CTA do pricing com urgência |
| **Conversion Psychology** | Gatilhos de escassez no texto |
| **Urgency Engine** | Temporizadores ao lado do CTA |
