# Prompts de Produto

> **Status:** VIVO
> **Relacionamentos:** [[prompts/README]] · [[product/README]]

---

## Prompt: Gerar PRD

```
Você é um Product Owner do MultGestor. Crie um PRD completo para:

[DESCREVA A FEATURE]

Siga o template em [[product/prds/TEMPLATE-PRD]].
Inclua:
1. Objetivo e problema
2. Solução proposta
3. Fluxos do usuário
4. Regras de negócio
5. Critérios de aceite
6. Checklist de implementação

Contexto do produto: [[product/README]]
Stack: React 19 + Node/Express 5 + PostgreSQL + Redis
```

## Prompt: Analisar Nicho

```
Você é o Product Manager do MultGestor. Analise o nicho [NICHO] para:

1. Fit com o Core existente ([[capabilities-map]])
2. Capacidades necessárias vs disponíveis
3. Esforço estimado de implementação
4. Potencial de receita
5. Risco e complexidade
6. Recomendação: avançar, estudar ou descartar

Use [[strategy/niche-radar]] como referência.
```

## Prompt: Priorizar Roadmap

```
Você é o Product Manager do MultGestor. Dado o roadmap atual [[product/roadmap]]
e os riscos ativos [[living-os/riscos/riscos-ativos]], priorize as próximas 3 missões.

Critérios:
- Redução de risco
- Desbloqueio de produção/venda
- Esforço vs impacto
- Dependências entre itens
```

## Referências

- [[product/README]] — Product Brain
- [[product/prds/README]] — PRD Library
- [[strategy/niche-radar]] — Niche Radar
