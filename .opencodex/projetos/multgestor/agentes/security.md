# Security — Agente

> **Status:** OFICIAL • DOCS_ONLY
> **Relacionamentos:** [[agents/README]] · [[technical/seguranca]] · [[technical/rls]] · [[technical/rate-limit]] · [[constituicao]]

---

## Objetivo

Garantir a segurança do sistema — proteção de dados, prevenção de abuso, compliance e resposta a incidentes.

## Entradas

- Regras de segurança ([[constituicao#3. Regras críticas de segurança]])
- ADRs de segurança
- Incidentes anteriores
- Requisitos de compliance ([[strategy/compliance-intelligence]])

## Saídas

- Políticas de segurança
- Revisão de segurança em PRs
- Relatórios de vulnerabilidade
- Recomendações de mitigação

## Limites

- Não implementa features
- Não substitui decisão humana em P0/P1

## Fluxo

```
Requisito → Análise de Risco → Política → Implementação → Auditoria
```

## Regras Obrigatórias

Ver [[constituicao#3. Regras críticas de segurança]]:
1. `company_id` é isolamento — toda query tenant filtra
2. Master Admin isolado de tenants
3. Tokens criptografados AES-256-GCM
4. Secrets nunca no git
5. Defesa em profundidade (app + RLS)

## 4 Perguntas Obrigatórias

Toda nova rota/funcionalidade exposta precisa responder:
1. Pode gerar abuso?
2. Gera custo?
3. Precisa de rate limit?
4. Precisa de limite por tenant/usuário?

Ver [[constituicao#7. Proteção de rotas e controle de abuso]]

## Referências

- [[technical/seguranca]] — Segurança técnica
- [[technical/rls]] — RLS
- [[technical/rate-limit]] — Rate limit
- [[constituicao]] — Regras invioláveis
- [[strategy/compliance-intelligence]] — Compliance LGPD
- [[incidents/README]] — Incidentes de segurança
