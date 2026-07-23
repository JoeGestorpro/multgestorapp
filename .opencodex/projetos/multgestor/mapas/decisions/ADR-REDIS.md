---
tipo: decisao
area: infra
status: aprovado
progresso: 0
criticidade: alta
bloqueia_producao: true
bloqueia_venda: false
ultima_revisao: 2026-07-20
---

# ADR-REDIS — Provisionar Redis/Valkey gerenciado

> **Status:** APROVADA (Decisão D-M1-REDIS, 2026-07-20). Nenhum provisionamento ou alteração de infraestrutura autorizada.

## O que é

Decisão de provisionar um serviço Redis/Valkey gerenciado para rate limiting distribuído, cache compartilhado entre instâncias e coordenação futura (locks, filas).

## Contexto

O sistema atualmente opera sem Redis em produção. O health check em 2026-07-16 confirmou:
```
"redis": { "status": "degraded", "message": "Redis nao configurado — fallback in-memory ativo" }
```

Impactos conhecidos:
- Rate limit é local à instância (fallback in-memory via `cache-manager.js`)
- Contadores de rate limit desaparecem em restart ou spin-down (free tier do Render hiberna após 15min)
- Cache é perdido em cold start (observado: 33s)
- Múltiplas instâncias não compartilham estado de rate limit nem cache
- `cache-manager.js` e `rate-limit.middleware.js` já têm suporte completo a Redis — o código está pronto

**Ressalva:** rotação de IP pode contornar rate limit baseado em IP mesmo com Redis. O problema resolvido aqui é o compartilhamento entre instâncias e a volatilidade do armazenamento local — não a limitação intrínseca do critério por IP.

## Decisão

```text
REDIS_DECISION: PROVISIONAR

Objetivo prioritário:
- rate limiting compartilhado e consistente.

Objetivos secundários:
- cache;
- locks;
- filas ou coordenação futura, se necessário.

Requisitos:
- Redis/Valkey gerenciado;
- conexão por variável de ambiente (REDIS_URL);
- TLS;
- política de falha definida (fail-open documentado);
- health check no /api/health/deep;
- métricas de cache hit/miss;
- fallback controlado (já implementado em cache-manager.js);
- testes de indisponibilidade (já existem parcialmente).

Observação:
- confirmar custo e plano antes da contratação (não fixar US$ 15-30/mês sem cotação);
- não usar cache persistente como fonte primária de dados;
- Render Key Value é opção a considerar.
```

## Estado atual

| Aspecto | Hoje | Com Redis |
|---------|------|-----------|
| Rate limit | In-memory, local à instância, volátil | Compartilhado, consistente, persistente |
| Cache | In-memory (Map, 10k max), perdido em restart | Redis, compartilhado entre instâncias |
| Dependência | Nenhuma | REDIS_URL configurada |
| Código | cache-manager.js + redis-client.js prontos | Nenhuma alteração de código necessária |
| Risco de falha | Perda total de cache + rate limit em restart | Degradação controlada (fallback in-memory) |

## Relações

### Depende de
- Contratação do serviço Redis/Valkey (Render ou outro provider)

### Bloqueia
- OPS-001 (Redis não configurado em produção)

### Usa
- `cache-manager.js` · `redis-client.js` · `rate-limit.middleware.js`

## Próximas ações

1. ✅ Decisão tomada (2026-07-20).
2. Pesquisar planos e custos do Redis/Valkey gerenciado (Render ou equivalente).
3. Criar missão de provisionamento com variáveis de ambiente, TLS e health check.
4. Nenhum provisionamento, contratação ou alteração de infra está autorizada sem missão própria.

## Links
- [[08-ARQUITETURA-CANONICA-CORE-MULTGESTOR]] — seção DECISÕES TOMADAS
- [[../07-debitos-conflitos-lacunas]] — OPS-001
- `backend/src/shared/core/cache/cache-manager.js`
- `backend/src/shared/core/cache/redis-client.js`
- `backend/src/middlewares/rate-limit.middleware.js`
