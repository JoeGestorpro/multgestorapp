# Landing Architecture — Arquitetura de Landing Pages Premium SaaS

## Visão Geral
Arquitetura modular de landing pages para o ecossistema MultGestor, projetada para conversão máxima, percepção premium e escalabilidade multi-nicho. Cada landing page é composta por seções independentes orquestradas por uma engine central de conversão.

## Princípios
- **Mobile-first**: toda seção é projetada para mobile primeiro, expandida para desktop
- **Velocidade**: carregamento < 2s (core web vitals)
- **Hierarquia visual**: uma ação principal por viewport
- **Persuasão contínua**: cada seção leva naturalmente à próxima
- **Consistência de marca**: identidade visual única por módulo/nicho

## Estrutura Base de uma Landing Page
```
Hero (header + headline + CTA primário)
  → Social Proof (provas, números, logos)
  → Pain Points (dores do cliente)
  → Solution (como o produto resolve)
  → Features (diferenciais)
  → How It Works (3 passos simples)
  → Pricing (planos)
  → FAQ (objeções)
  → CTA Final (último call to action)
  → Footer (autoridade, links)
```

## Comportamento Esperado
- Viewport 0-100%: hero com CTA primário fixo
- Scroll suave entre seções com progressão lógica
- Sticky CTA mobile no rodapé após rolar 60% da página
- Cada seção ocupa no máximo 100vh (uma tela cada)

## Integração com o Ecossistema
| Engine | Função na landing |
|--------|------------------|
| **Hero Engine** | Headline, subheadline, CTA primário |
| **CTA Engine** | Todos os CTAs da página, cor, texto, posição |
| **Social Proof Engine** | Provas sociais, depoimentos, números |
| **Offer Structure** | Estrutura da oferta e argumentação |
| **Pricing Psychology** | Display de preços, comparação |

## Gatilhos de Conversão
- CTA primário visível SEMPRE no hero (acima da dobra)
- Segundo CTA aparece após rolagem de 50%
- CTA sticky no mobile após 60%
- Urgência no pricing (economia anual destacada)
- Prova social antes do pricing
- FAQ remove objeções antes do CTA final
