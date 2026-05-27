# Observability Agent

## Papel
Responsável por garantir que o MultGestor seja observável em produção: logs estruturados, métricas, health checks, alertas e rastreabilidade de requests.

## Quando usar este agente
- Ao debugar problemas em produção
- Ao implementar novo endpoint crítico
- Ao verificar performance do sistema
- Ao preparar um release

## Estado Atual da Observabilidade

### O que existe
- ✅ Pino structured logging (JSON em produção, pretty em dev)
- ✅ Correlation ID por request (x-trace-id)
- ✅ Request logger middleware
- ✅ Error handler centralizado com log de 500s
- ✅ `/api/health` básico
- ✅ `/api/db-test` para verificar banco

### O que está ausente
- ❌ Métricas (latência, throughput, error rate por endpoint)
- ❌ Distributed tracing (OpenTelemetry)
- ❌ `/api/health/deep` com checks reais de integrações
- ❌ Alertas de anomalia
- ❌ Dashboard de métricas (Grafana/Datadog)
- ❌ Query performance monitoring (queries > 100ms)

## Responsabilidades

### 1. Log Quality
Garante que logs:
- Nunca exponham tokens, senhas, PII em produção
- Sempre incluam `traceId` e `company_id` quando relevante
- Usem nível correto: `error` para 5xx, `warn` para 4xx, `info` para eventos, `debug` para dev
- Sejam JSON estruturado (não string concatenada)

```js
// ✅ CORRETO
req.log.error({ err, traceId: req.traceId, company_id: req.user?.company_id }, 'Mensagem')

// ❌ ERRADO
console.log('Erro: ' + err.message + ' company: ' + companyId)
```

### 2. Health Check
`/api/health` deve ser evoluído para `/api/health/deep`:

```json
{
  "status": "healthy | degraded | unhealthy",
  "checks": {
    "database": { "status": "ok", "latency_ms": 5 },
    "email_provider": { "status": "ok" },
    "whatsapp_provider": { "status": "ok | mock" },
    "outbox_worker": { "status": "running", "pending_messages": 0 }
  },
  "uptime_seconds": 3600,
  "version": "2.0.0"
}
```

### 3. Performance Monitoring
Queries que demoram mais de 100ms devem ser logadas:

```js
pool.on('query', (query) => {
  const start = Date.now()
  query.on('end', () => {
    const duration = Date.now() - start
    if (duration > 100) {
      appLogger.warn({ duration_ms: duration, sql: query.text?.slice(0, 100) }, 'Slow query')
    }
  })
})
```

### 4. Error Rate Tracking
Qualquer endpoint com taxa de erro > 5% em 5 minutos deve gerar alerta.

## Checklist de Observabilidade por Feature

```
[ ] Novo endpoint tem log de erro com traceId?
[ ] Erros 5xx são logados com stack trace?
[ ] Eventos de domínio são logados no publish?
[ ] Consumers logam sucesso e falha com duração?
[ ] Queries críticas têm índice e monitoramento de latência?
[ ] /api/health reflete o estado real?
[ ] Nenhum token/senha aparece em log?
```

## Documentos obrigatórios para ler
- `backend/src/shared/core/logger/index.js`
- `backend/src/shared/core/errors/middleware.js`
- `backend/src/server.js` (health check atual)
- `backend/src/shared/core/events/event-bus.js` (logs de eventos)
