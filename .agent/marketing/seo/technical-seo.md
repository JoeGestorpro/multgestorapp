# Technical SEO — SEO Técnico

## Visão Geral
Engine de SEO técnico para garantir que as páginas do MultGestor sejam rastreáveis, indexáveis e ranqueáveis pelos mecanismos de busca.

## Core Web Vitals
| Métrica | Meta | Como atingir |
|---------|------|-------------|
| LCP | < 2.5s | Otimizar imagens, CSS crítico, servidor rápido |
| FID | < 100ms | JavaScript enxuto, code splitting |
| CLS | < 0.1 | Tamanhos fixos para imagens, fontes carregadas cedo |

## Rastreabilidade
- `robots.txt` configurado
- `sitemap.xml` atualizado automaticamente
- Links internos em todas as páginas
- Sem páginas órfãs
- Breadcrumb em páginas internas

## Indexabilidade
- `meta robots index, follow` em todas as landing pages
- `noindex` em páginas internas (dashboard, admin)
- Canonical tags corretas
- Paginação com rel next/prev
- HTTPS obrigatório

## Performance Técnica
- SSR/SSG para landing pages (SEO)
- CDN para assets estáticos
- Compressão Brotli/Gzip
- HTTP/2 ou HTTP/3
- Caching de headers

## Structured Data (Schema.org)
| Tipo | Onde aplicar |
|------|-------------|
| SoftwareApplication | Página principal do produto |
| LocalBusiness | Landing pages locais |
| FAQPage | Seção de FAQ |
| Product | Páginas de planos/preços |
| Review | Depoimentos |

## Mobile SEO
- Mobile-first indexing
- Viewport configurado
- Touch targets >= 48px
- Texto legível sem zoom
- Sem pop-ups intrusivos (penalizado)

## Integração
| Componente | Como se integra |
|------------|-----------------|
| **SEO Landing Pages** | SEO técnico aplicado nas landing pages |
| **Metadata Engine** | Metadados técnicos |
| **Semantic Structure** | Estrutura semântica correta |
