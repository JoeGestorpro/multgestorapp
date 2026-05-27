# Mobile Conversion — Conversão Mobile-First

## Visão Geral
Engine especializada em conversão em dispositivos móveis. Com 60-80% do tráfego vindo de mobile, a experiência mobile não é opcional — é o principal canal de conversão.

## Princípios
- **Mobile-first**: projetar para mobile, expandir para desktop
- **Polegar**: ações principais no alcance do polegar (terço inferior)
- **Velocidade**: Core Web Vitals — LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Foco**: uma ação por tela, sem excesso de informação

## Estrutura Mobile
```
[Status bar]
[Header compacto (logo + menu hamburguer)]
[Hero vertical — headline + CTA full-width]
[Scroll para próxima seção]
[CTA sticky no bottom após 60% scroll]
[Footer simplificado]
```

## Regras de Conversão Mobile
| Regra | Explicação |
|-------|-----------|
| CTA sempre visível | Sticky bottom CTA após rolagem |
| Formulário curto | Máx 3 campos no mobile |
| Botões grandes | Mín 48px altura, fácil de tocar |
| Sem hover | Elementos que dependem de hover não funcionam |
| Accordion | Conteúdo colapsável economiza espaço |
| Swipe | Depoimentos e planos em carrossel horizontal |

## Otimizações de Performance Mobile
- Imagens WebP com lazy loading
- CSS crítico inline, resto assíncrono
- Fontes em woff2, subset para latim
- JavaScript code splitting

## Touch UX
- Alvo de toque mínimo 44x44px (Apple HIG)
- Espaçamento entre alvos de toque: 8px+
- Gestos: swipe para carrossel, pull para refresh
- Feedback tátil em ações (vibrar no clique)

## Integração
| Componente | Como se integra |
|------------|-----------------|
| **High Conversion Layouts** | Layouts mobile-first |
| **CTA Engine** | CTA sticky mobile |
| **Premium SaaS Design** | Design adaptado para mobile |
| **Futuristic UI Engine** | Efeitos leves para mobile |
