# SEC-DATABASE-TLS-001 — Conexão ao banco de produção sem validação de certificado TLS

> **Status:** ABERTO · **Severidade:** Média · **Registrado:** 2026-07-17
> **Origem:** [[../../../auditorias/multgestor/2026-07-16-ops-migrations-03b]] §1.4 — achado incidental da Fase 2 do DataOps
> **Segregado por:** decisão humana (`ADR_006_EMENDA_01_APROVADA`, item 7) — fora do escopo de [[../mapas/decisions/ADR-006-migrations]]
> **Correção:** ⛔ **não autorizada** · nenhuma ação executada

## O que é

O backend em produção conecta ao Postgres com TLS **ativo mas sem verificar o certificado do servidor**. A conexão é cifrada; a identidade do servidor **não é autenticada**.

## Evidência

Log emitido em **todo** cold start de produção (observado em 4 instâncias distintas: 16/07 18:12 e 19:47; 17/07 01:33 e 02:55):

```text
[database] TLS sem verificação de certificado — configure DATABASE_SSL_CA ou DATABASE_SSL_CA_PATH
```

Fonte do comportamento — `backend/src/config/database.js:48-64`:

```js
function buildSslConfig() {
  if (process.env.NODE_ENV === 'test') return false;
  let ca = null;
  if (process.env.DATABASE_SSL_CA) { ... }
  else if (process.env.DATABASE_SSL_CA_PATH) { ... }
  if (ca) return { ca, rejectUnauthorized: true };
  appLogger.warn('[database] TLS sem verificação de certificado — ...');
  return { rejectUnauthorized: false };   // ← caminho ativo em produção
}
```

O `sslConfig` resultante é aplicado aos **dois** pools: `pool` (`DATABASE_URL`) e `poolTenant` (`APP_RUNTIME_URL`) — `database.js:68-81`. Ambos conectam sem validar certificado.

**Causa:** nem `DATABASE_SSL_CA` nem `DATABASE_SSL_CA_PATH` estão configuradas no ambiente de produção do Render.

## Impacto

- **Sem proteção contra MITM** no caminho até o banco. Um atacante capaz de interceptar o tráfego (BGP hijack, DNS spoofing, comprometimento de rede intermediária) poderia apresentar certificado forjado, e o cliente aceitaria — expondo credenciais de banco e todo o tráfego de dados de tenants.
- O tráfego atravessa **fronteira de região**: serviço em `oregon`, banco em `sa-east-1`. O caminho é longo e majoritariamente pela internet pública, o que **aumenta** a superfície em relação a um cenário intra-região.
- O código **já prevê** o modo seguro (`rejectUnauthorized: true` quando há CA) e **já avisa** que está degradado. Não é lacuna de design — é configuração ausente.

## Atenuantes

- A conexão **é** cifrada — não há tráfego em texto claro.
- O design é fail-fast quando mal configurado: `DATABASE_SSL_CA_PATH` presente mas ilegível causa erro de boot, nunca degradação silenciosa (`database.js:55`).
- Não há evidência de exploração. Nenhum indício de MITM foi procurado ou encontrado — **ausência de evidência não é evidência de ausência**.

## Severidade — por que Média

Não é Alta porque exige um atacante posicionado na rota de rede, o que é uma barreira real. Não é Baixa porque o alvo é o banco de produção multi-tenant inteiro e as credenciais que o abrem.

## Correção proposta — ⛔ NÃO EXECUTADA

1. Obter o CA do Supabase (certificado público, não é segredo).
2. Configurar `DATABASE_SSL_CA` (PEM inline) ou `DATABASE_SSL_CA_PATH` no Render → o código passa a `rejectUnauthorized: true` sem alteração de código.
3. Confirmar pelo log: a linha de warning **deve desaparecer** do cold start seguinte.

**Requer autorização humana** — é alteração de variável de ambiente no Render, explicitamente não autorizada na missão vigente.

⚠️ **Risco da correção:** se o CA estiver errado ou incompleto, `rejectUnauthorized: true` faz **toda** conexão ao banco falhar — o backend não sobe. Deve ser aplicada com plano de rollback (remover a variável restaura o comportamento atual) e verificada em janela controlada.

## Relações
### Depende de
—
### Bloqueia
—
### Relacionado
[[../mapas/decisions/ADR-006-migrations]] — a `MIGRATION_DATABASE_URL` da Emenda 01 herdará o mesmo `sslConfig`; corrigir aqui corrige lá também.
[[INC-004-exposicao-credencial-runtime-scratch]] — mesmo domínio (credenciais de banco), incidente distinto.

## Próximas ações
Nenhuma autorizada. Registrar na matriz de capacidades e priorizar junto ao backlog de segurança.
