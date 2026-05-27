# Premium SaaS Design — Design Premium para SaaS

## Visão Geral
Diretrizes de design visual premium para landing pages do ecossistema MultGestor. O design deve transmitir autoridade, confiança e inovação — características de um SaaS enterprise de alto valor.

## Princípios de Design Premium
- **Minimalismo funcional**: cada elemento tem um propósito
- **Espaço negativo**: 40%+ de white space
- **Tipografia hierárquica**: uma família, pesos contrastantes
- **Cores estratégicas**: cor de marca + 1 cor de acento + neutros
- **Glassmorphism**: cards com vidro fosco, bordas suaves
- **Micro-animações**: transições sutis em hover e scroll

## Paleta de Cores Premium (BarberGestor)
```
Background: #070a0d (preto azulado)
Superfície: rgba(255,255,255,0.05) (glass)
Texto primário: #ffffff
Texto secundário: rgba(255,255,255,0.7)
Acento: #d4a853 (dourado)
CTA: #d4a853 → hover mais claro
Borda: rgba(255,255,255,0.1)
Erro: #ef4444
Sucesso: #22c55e
```

## Tipografia Premium
- **Headlines**: fonte sans-serif bold (Inter, Plus Jakarta Sans)
- **Body**: mesma família, regular, 16-18px
- **Números**: tabular para preços e métricas
- **Tamanhos**: 48/36/24/18/16 (h1/h2/h3/body/small)

## Design System Visual
| Elemento | Estilo Premium |
|----------|---------------|
| Cards | Glass, border-radius 16px, backdrop-filter blur |
| Botões | Gradient sutil, border-radius 8px, shadow |
| Inputs | Glass, outline focus dourado |
| Divisores | Linha sutil rgba(255,255,255,0.1) |
| Ícones | Lucide, stroke-width 1.5, 20px |
| Imagens | Border-radius, shadow, sem bordas duras |

## Micro-animações
- Fade-in ao scroll (intersection observer)
- Hover: scale(1.02) + shadow increase em cards
- Botão: subtle gradient shift no hover
- Glass: backdrop-filter blur aumenta no hover
- Números: contagem animada em stats

## Mobile Adaptations
- Glass reduzido (backdrop-filter consome bateria)
- Micro-animações desligadas em low-performance
- Cards sem hover effect (touch não tem hover)
- Botões com padding maior (facilita toque)

## Integração
| Componente | Como se integra |
|------------|-----------------|
| **Visual Identity** | Cores e tipografia do módulo |
| **Futuristic UI Engine** | Efeitos visuais avançados |
| **Color Psychology** | Psicologia das cores escolhidas |
| **Brand Authority** | Design que transmite autoridade |
