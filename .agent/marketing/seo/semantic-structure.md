# Semantic Structure — Estrutura Semântica

## Visão Geral
Engine de estruturação semântica de conteúdo para SEO avançado. O Google entende contexto, não apenas keywords — estrutura semântica correta melhora o ranqueamento para múltiplas variações de busca.

## Princípios de Semântica
- **Entidades**: pessoas, lugares, coisas mencionadas no conteúdo
- **Relacionamentos**: como as entidades se conectam
- **Contexto**: significado determinado pelo entorno
- **Intenção**: o que o usuário realmente quer encontrar

## Mapa de Entidades (BarberGestor)
```
Entidade principal: BarberGestor (software de gestão)
  ├── Relacionado a: barbearia, barbeiro
  ├── Resolve: agenda desorganizada, perda de clientes
  ├── Concorrente: [concorrentes]
  └── Nicho: beleza masculina, cuidados pessoais
  
Entidades secundárias: agendamento online, comissão, relatórios
```

## Estrutura de Conteúdo Semântico
```
Introdução: contexto do problema (barbearia, gestão)
  → Solução: como o software resolve
  → Benefícios: agenda, vendas, relatórios
  → Provas: números, depoimentos
  → FAQ: perguntas relacionadas
  → Conclusão: CTA
```

## FAQ Schema (Perguntas Frequentes)
Implementar FAQ com JSON-LD:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "O que é o BarberGestor?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "O BarberGestor é um sistema de gestão completo para barbearias..."
    }
  }]
}
```

## LSI Keywords (Latent Semantic Indexing)
Variações temáticas que o Google associa ao tópico principal:
- Gestão financeira para barbearia
- Controle de comissão de barbeiro
- Agenda digital para salão
- Relatório de faturamento

## Cluster de Conteúdo
```
Página principal: "Sistema para Barbearia" (pilar)
  ├── Post: "Como escolher sistema para barbearia"
  ├── Post: "Agenda online para barbearia: guia completo"
  ├── Post: "Precificação de serviços de barbearia"
  └── Post: "Comissão para barbeiros: como calcular"
```

## Integração
| Componente | Como se integra |
|------------|-----------------|
| **SEO Landing Pages** | Landing pages com estrutura semântica |
| **SEO Copywriting** | Copy com contextos semânticos |
| **Technical SEO** | Schema.org implementado |
