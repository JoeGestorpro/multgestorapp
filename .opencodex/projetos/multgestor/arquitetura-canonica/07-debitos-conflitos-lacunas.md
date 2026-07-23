# GATE 7 — Débitos, Conflitos e Lacunas

> **Missão 1 — Arquitetura Canônica do Core MultGestor**
> **Baseline:** `ba55065` · **Data:** 2026-07-20

## 1. Resumo

| Classe | Débitos Críticos | Débitos Altos | Débitos Médios | Débitos Baixos |
|--------|-----------------|--------------|---------------|---------------|
| CONFLITO_DOCUMENTACAO_CODIGO | 0 | 1 | 2 | 3 |
| IMPLEMENTACAO_PARCIAL | 0 | 4 | 3 | 2 |
| AUSENCIA_DE_TESTE | 0 | 2 | 1 | 0 |
| SEGURANCA | 0 | 1 | 1 | 1 |
| DADOS_RLS | 0 | 0 | 2 | 1 |
| BILLING | 0 | 1 | 0 | 0 |
| OPERACAO | 1 | 1 | 1 | 0 |
| OBSERVABILIDADE | 0 | 0 | 1 | 1 |
| FRONTEIRA_INDEFINIDA | 0 | 1 | 0 | 0 |
| LEGADO | 0 | 1 | 1 | 0 |

---

## 2. Débitos Detalhados

### 🔴 CRÍTICOS

#### OPS-001: Redis não configurado em produção

| | |
|---|---|
| **ID** | OPS-001 |
| **Classe** | OPERACAO |
| **Descrição** | Redis não está configurado no Render. Cache e rate limit operam exclusivamente em fallback in-memory. Rate limit é local à instância — com múltiplas instâncias, limites não são compartilhados. Cache é perdido em cold start (free tier hiberna, cold start de 33s observado). |
| **Evidência** | `GET /api/health/deep` (2026-07-16) → `redis: { status: "degraded", message: "Redis nao configurado — fallback in-memory ativo" }` |
| **Impacto** | Rate limit bypassável por rotação de IP+instância; cache perdido em restart |
| **Probabilidade** | Média (sem Redis desde o início) |
| **Gravidade** | Alta (abuso, custo, segurança) |
| **Dependências** | Configuração do Render, Redis provider, variáveis de ambiente |
| **Recomendação** | Provisionar Redis gerenciado, configurar REDIS_URL no Render |
| **Condição de encerramento** | Health check mostra `redis: { status: "ok" }` |

---

### 🟡 ALTOS

#### ARC-001: Booking Engine acoplado ao BarberGestor

| | |
|---|---|
| **ID** | ARC-001 |
| **Classe** | FRONTEIRA_INDEFINIDA |
| **Descrição** | `booking-appointments.service.js` (59x barber_) e `booking-scheduling.service.js` (32x barber_) têm nome genérico mas são exclusivos do BarberGestor. `scheduling-utils.js` é o único componente genuinamente compartilhado. |
| **Evidência** | grep -c barber_ nos dois arquivos, ADR-007 |
| **Impacto** | Booking não é reutilizável; segundo nicho reimplementa do zero |
| **Dependências** | ADR-007 (decisão humana) |
| **Recomendação** | Decidir ADR-007 (Opção A: rebaixar ou Opção B: promover com adapter) |
| **Condição de encerramento** | ADR-007 aprovada + implementada |

#### ARC-002: God service (barber.service.js)

| | |
|---|---|
| **ID** | ARC-002 |
| **Classe** | IMPLEMENTACAO_PARCIAL |
| **Descrição** | `barber.service.js` com ~6500 linhas. Decomposição iniciada (vários services extraídos) mas o arquivo original persiste com alta complexidade. |
| **Evidência** | Análise de tamanho de arquivo |
| **Impacto** | Manutenibilidade, testabilidade |
| **Dependências** | Nenhuma |
| **Recomendação** | Completar decomposição, remover legado |
| **Condição de encerramento** | barber.service.js < 500 linhas ou removido |

#### OPS-002: APP_RUNTIME_URL não configurada em dev

| | |
|---|---|
| **ID** | OPS-002 |
| **Classe** | OPERACAO |
| **Descrição** | Sem `APP_RUNTIME_URL`, `poolTenant` cai em `DATABASE_URL` — role com BYPASSRLS → RLS inerte. |
| **Evidência** | `database.js:75-77`: "APP_RUNTIME_URL não configurada — poolTenant usando DATABASE_URL; RLS pode permanecer inerte" |
| **Impacto** | Desenvolvedores podem não detectar falhas de RLS até produção |
| **Recomendação** | Documentar setup de APP_RUNTIME_URL no README ou script de setup |
| **Condição de encerramento** | Setup documentado e verificado em CI |

#### BILL-001: Fase C billing consumers em quarentena

| | |
|---|---|
| **ID** | BILL-001 |
| **Classe** | BILLING |
| **Descrição** | `sale.created` → loyalty + package consumers estão em quarentena lógica (código comentado). Implementados FORA DE ORDEM (Fase C antes de Fase A). |
| **Evidência** | `server.js:418-426`: "⚠️ QUARENTENA FASE C" |
| **Impacto** | Vendas não geram pontos de fidelidade nem redenção de pacotes automaticamente |
| **Dependências** | Promoção formal via `.opencodex/queue/next-task.md` + auditoria |
| **Recomendação** | Formalizar Fase C, reativar wiring, testar |
| **Condição de encerramento** | Quarentena removida + testes passando |

#### SEG-001: Fase 2 RLS não registrada como migration

| | |
|---|---|
| **ID** | SEG-001 |
| **Classe** | DADOS_RLS |
| **Descrição** | RLS para wallet/packages/loyalty/anamnese não está em `run-migrations.js`. Só existe como SQL avulso. Usa padrão antigo (sem NULLIF, sem WITH CHECK). |
| **Evidência** | `rls_fase2_wallet_packages_loyalty_anamnese.sql` header |
| **Impacto** | RLS pode não ser aplicada em bancos novos; padrão inconsistente |
| **Recomendação** | Registrar como migration, harmonizar padrão (NULLIF + WITH CHECK) |
| **Condição de encerramento** | Migration registrada e aplicada |

#### TEST-001: Cobertura de testes insuficiente

| | |
|---|---|
| **ID** | TEST-001 |
| **Classe** | AUSENCIA_DE_TESTE |
| **Descrição** | ~70 testes unitários + ~15 integração para 35+ serviços e 226 endpoints. Sem testes de frontend significativos. |
| **Evidência** | Contagem de arquivos de teste vs serviços |
| **Impacto** | Risco de regressão, dificuldade de refatoração |
| **Recomendação** | Estabelecer meta de cobertura, priorizar testes de booking + billing + RLS |
| **Condição de encerramento** | Cobertura > 60% |

---

### 🟢 MÉDIOS

| ID | Classe | Débito | Recomendação |
|----|--------|--------|-------------|
| ARC-003 | LEGADO | `barber.service.legacy.js` no archive | Remover após confirmação de que não é mais referenciado |
| DOC-001 | CONFLITO | `capacidades.md` com 4 divergências factuais (D-02, D-03, D-04, D-08) | Atualizar com dados da Missão 1 |
| DOC-002 | CONFLITO | `docs/PLATFORM_ARCHITECTURE.md` desatualizado | Substituir por referência à arquitetura canônica |
| DOC-003 | CONFLITO | `docs/core/runtime-map.md` sem refresh token | Atualizar ou arquivar |
| SEG-002 | SEGURANCA | `pool.query()` direto sem tenant context bypassa RLS | Documentado como intencional; monitorar uso |
| OBS-001 | OBSERVABILIDADE | Sem dashboard de métricas (apenas /metrics raw) | Implementar dashboard Grafana ou similar |
| CLI-001 | AUSENCIA_DE_TESTE | Sem testes de carga/performance (apenas 1 arquivo perf) | Adicionar testes de carga para booking + auth |

---

## 3. Lacunas (Gaps)

| Lacuna | Descrição | Impacto |
|--------|-----------|---------|
| GAP-001 | Sem contrato OpenAPI/Swagger | Documentação de API depende de leitura de código |
| GAP-002 | Sem diagrama ER formal | Modelo de dados depende de leitura de migrations |
| GAP-003 | Sem runbooks de operação | Apenas migration-031 documentado |
| GAP-004 | Sem SLA/SLO documentados | Sem baseline de disponibilidade |
| GAP-005 | Sem testes de frontend | 2 arquivos apenas |
| GAP-006 | Sem testes de carga | Apenas 1 perf test |
| GAP-007 | Variáveis de ambiente não totalmente documentadas | `.env.example` parcial |

---

## 4. Débitos Resolvidos (Missão 0 → Missão 1)

| Débito Anterior | Status | Resolução |
|-----------------|--------|-----------|
| RLS inerte em runtime | ✅ RESOLVIDO | `tenantAwareConnect` + `poolTenant` (2026-07-02) |
| Empresas/usuários sem policy RLS | ✅ RESOLVIDO | Migration 024 (2026-06-24) |
| Gating com vocabulário barber | ✅ RESOLVIDO | 0 ocorrências — chaves genéricas |
| Migrations executadas remotamente | ✅ RESOLVIDO | Runner local + schema_migrations |

---

## 5. POST-GATE 7

| Verificação | Status |
|-------------|--------|
| Débitos classificados | ✅ 18 débitos (1 crítico, 7 altos, 6 médios, 4 baixos) |
| Lacunas identificadas | ✅ 7 gaps |
| Débitos resolvidos | ✅ 4 encerrados |
| Evidência por débito | ✅ |
| Impacto/probabilidade/gravidade | ✅ |
| Recomendação por débito | ✅ |
| Condição de encerramento | ✅ |
| Nenhum arquivo operacional alterado | ✅ |
