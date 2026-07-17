# OPS-MIGRATIONS-03D — Plano de integração operacional do runner

> **Status:** PLANO DOCUMENTAL · **Nenhuma ação operacional executada.**
> **Marcadores:** `OPS_MIGRATIONS_03D_PLANO_DOCUMENTAL_AUTORIZADO` · `OPS_MIGRATIONS_03D_OPERACIONAL_NAO_AUTORIZADA` · `CREDENCIAL_INSERIDA_SOMENTE_PELO_OPERADOR`
> **Base:** [[../../projetos/multgestor/mapas/decisions/ADR-006-migrations]] (+ Emenda 01) · [[../../auditorias/multgestor/2026-07-16-ops-migrations-03b]] · [[../../projetos/multgestor/incidentes/INC-005-acesso-nao-autorizado-producao-teste-runner]]

## Objetivo

Colocar o runner endurecido (OPS-MIGRATIONS-03C, já em `main`) para aplicar migrations em produção de forma **bloqueante** e **auditável**, no ciclo de deploy do Render. Este documento é apenas o **plano**; cada gate exige autorização humana no momento de sua execução.

## Regra invariante (vinculante)

```text
Se MIGRATION_DATABASE_URL estiver ausente, inválida ou não verificável,
o wiring bloqueante NÃO pode ser ativado.
O fallback para DATABASE_URL NÃO será aceito na execução de produção.
```

Justificativa: no build do Render, `DATABASE_URL` é o pooler em **modo transaction (6543)**, onde `pg_advisory_lock` (por sessão) é não-confiável — Emenda 01, §5. O runner *tecnicamente* faz fallback para `DATABASE_URL` com aviso, mas em produção esse fallback é **proibido**: sem endpoint de sessão dedicado, a trava de concorrência é decorativa. Portanto o wiring só é ativado com `MIGRATION_DATABASE_URL` presente e verificada (GATE 2/3).

## Fronteira de credencial (vinculante)

O valor de `MIGRATION_DATABASE_URL` é uma **connection string de produção com usuário e senha**. Sua inserção é **ação exclusiva do operador humano**, no painel do Render. O agente:

- **não** insere, edita, lê nem testa o valor;
- **não** usa `update_environment_variables` do MCP com esse valor;
- verifica apenas **existência** e **efeito** (GATE 2/3), nunca o conteúdo.

## Ordem obrigatória

```text
variável (operador)  →  verificação  →  wiring bloqueante  →  deploy controlado
```

Inverter qualquer par é motivo de abortar. Em especial: **jamais** ativar o wiring antes de a variável existir e ser verificada — sob risco de trava decorativa (6543) ou de todo deploy quebrar.

## Distinção crítica — dois `npm run migrate` diferentes

| Onde | Alvo | Papel | Nesta etapa |
|---|---|---|---|
| **`deploy.yml` → job `run-migrations`** (linha ~20) | `secrets.DATABASE_URL` (conexão direta, IPv6) → falha `ENETUNREACH`, mascarado por `continue-on-error` | rede de segurança **inexistente** (decorativa) | **REMOVER** (GATE 9) |
| **`ci.yml` → step `Run migrations`** (linha ~82) | Postgres **efêmero** `localhost:5432`, `NODE_ENV=test` | valida que as migrations são **aplicáveis** em todo PR | **PRESERVAR intacto** |

Confundir os dois removeria a validação de migrations no CI. O único job a remover é o de **produção** no `deploy.yml`.

---

## Gates

### GATE 0 — Baseline e estado de produção
- **Quem:** agente (leitura).
- **Ação:** registrar HEAD de `main`, deploy vivo no Render, saúde (`/api/health/deep`), e — se autorizado — a última migration em `schema_migrations` via leitura.
- **Evidência:** commit vivo = `main`; `database: ok`; lista das últimas versões aplicadas.
- **Saída:** baseline congelado para comparação pós-deploy.

### GATE 1 — Variável criada pelo operador
- **Quem:** **operador humano** (painel Render). `CREDENCIAL_INSERIDA_SOMENTE_PELO_OPERADOR`.
- **Ação:** criar `MIGRATION_DATABASE_URL` = connection string **session (porta 5432)** do Supabase, mesmo host do pooler, usuário de privilégio adequado.
- **Evidência:** o operador confirma a criação; o valor **não** é compartilhado com o agente.
- **Saída:** variável existe no serviço `srv-…backend`.

### GATE 2 — Existência verificada sem revelar valor
- **Quem:** agente.
- **Ação:** confirmar que a variável **existe** (nome presente na configuração do serviço), **sem ler o valor**. Se o MCP não expõe leitura de env sem valor, a confirmação é do operador (checkbox), não do agente.
- **Evidência:** presença do nome `MIGRATION_DATABASE_URL`; valor **nunca** exibido/transcrito.
- **Abortar se:** ausente ou não verificável → **regra invariante**: não prosseguir.

### GATE 3 — Validação do endpoint dedicado/session
- **Quem:** agente + operador.
- **Ação:** provar que o endpoint é **modo session (5432)** e alcançável do build, **sem** o agente tocar a credencial. Método candidato: uma sonda **temporária** (nos moldes da OPS-MIGRATIONS-03B, já revertida), que lê `MIGRATION_DATABASE_URL` do ambiente do build e reporta **apenas** `dedicado=true`, `sessão estável=true/false`, código de erro — **jamais** URL/host/IP. Sonda é gated e revertida após a coleta.
- **Evidência:** `dedicado=true` + prova de sessão estável (advisory lock com 2 clientes), como na 03B §9.
- **Abortar se:** endpoint não é session, ou sessão instável → **regra invariante**.

### GATE 4 — Preparação do wiring bloqueante
- **Quem:** agente (branch + PR, **sem** aplicar no Render).
- **Ação:** preparar a alteração do `buildCommand` do Render para incluir `npm run migrate` **após** `npm install`, de forma bloqueante (falha do migrate → build falha → deploy falha → versão anterior permanece).
  - Free tier: o ponto é o **`buildCommand`** (não há `preDeployCommand`). Ver ADR-006, *Ponto de acoplamento*.
  - A alteração do `buildCommand` é **config do Render** — sua aplicação é GATE 6, gated à parte; aqui só se **documenta/prepara** o texto exato.
- **Evidência:** valor proposto do `buildCommand` revisado; confirmação de que o runner exige `MIGRATION_DATABASE_URL` (regra invariante embutida no processo, não no código — o código faz fallback com aviso; a proibição é operacional).
- **Saída:** wiring pronto para aplicar, **não aplicado**.

### GATE 5 — Plano de rollback pronto
- **Quem:** agente (documentação).
- **Conteúdo mínimo:**
  - **Restaurar `buildCommand`** ao valor anterior (`npm install`) — reverte o gate; deploys voltam a não migrar.
  - **Critérios de abortar** (qualquer um dispara rollback imediato):
    - migrate falha no build por conectividade (`ENETUNREACH`/timeout);
    - `MIGRATION_DATABASE_URL` revelou-se ausente/ inválida em runtime de build;
    - trava não adquirida de forma confiável;
    - qualquer migration retorna erro (o runner já aborta com exit≠0);
    - deploy bloqueado por mais de um limite de tempo definido pelo operador.
  - **Valor exato do `buildCommand` anterior** registrado antes de qualquer mudança (capturado no GATE 0).
- **Saída:** rollback executável em 1 passo (reverter buildCommand), sem depender de memória.

### GATE 6 — Deploy controlado
- **Quem:** operador autoriza; agente acompanha.
- **Pré-condições:** GATES 1–5 verdes. `MIGRATION_DATABASE_URL` presente e verificada.
- **Ação:** aplicar o `buildCommand` novo (config Render) e disparar **um** deploy controlado, observando o build.
- **Evidência esperada** (logs saneados, sem host/IP — OPS-MIGRATIONS-03C):
  ```text
  [migrate] endpoint dedicado=true
  [migrate] conexão estabelecida
  [migrate] migrations pendentes: N
  [migrate] todas as migrations aplicadas com sucesso.
  ```
- **Abortar se:** build falha por migrate (aciona GATE 5).
- **Nota factual:** as 32 migrations já estão aplicadas em produção → espera-se **N = 0 pendentes**, todas `[skip]`. Primeiro deploy não deve aplicar nada novo — risco de mutação ≈ nulo; o risco real é o **acoplamento** do gate.

### GATE 7 — Confirmação de zero migrations pendentes
- **Quem:** agente (leitura autorizada) ou operador.
- **Ação:** confirmar, via leitura de `schema_migrations`, que a última versão do repositório (`20260708_031`) consta como aplicada e que nada ficou pendente.
- **Evidência:** `schema_migrations` contém todas as 32; `pendentes: 0` no log do build.
- **Saída:** produção alinhada ao repositório.

### GATE 8 — Segunda execução idempotente
- **Quem:** operador autoriza; agente acompanha.
- **Ação:** um segundo deploy controlado (ou redeploy) — o build roda `migrate` novamente.
- **Evidência:** `migrations pendentes: 0`, todas `[skip]`, `aplicadas com sucesso`, **nenhum `[ok]` novo**, nenhum `INSERT` em `schema_migrations`.
- **Saída:** idempotência comprovada em produção.

### GATE 9 — Remoção do job de produção do `deploy.yml`
- **Quem:** agente (branch + PR); operador autoriza merge.
- **Ação:** remover o job **`run-migrations`** do `deploy.yml` (o que bate em `secrets.DATABASE_URL` e falha `ENETUNREACH`).
  - **Atenção obrigatória:** o job `deploy-backend` declara `needs: run-migrations`. Ao remover `run-migrations`, **trocar para `needs: ci`** — senão o workflow fica inválido.
  - **Preservar** o `continue-on-error`? Não — o job inteiro sai. O `continue-on-error` deixa de existir junto.
  - **NÃO tocar** no step `Run migrations` do `ci.yml` (efêmero) — permanece como validação.
- **Evidência:** `deploy.yml` sem o job de produção; `deploy-backend` com `needs: ci`; `ci.yml` intacto; CI verde.
- **Saída:** GitHub não tenta mais aplicar migration em produção; o gate real vive no Render (GATE 6).

### GATE 10 — Validação final e documentação
- **Quem:** agente (documentação).
- **Ação:** registrar evidências dos GATES 0–9; atualizar ADR-006 (`DATAOPS-002` → mecanismo **ativo** no Render); marcar a matriz de capacidades; encerrar OPS-MIGRATIONS-03D.
- **Evidência:** deploy controlado verde, idempotência comprovada, GitHub neutralizado, produção alinhada e saudável.
- **Saída:** `OPS_MIGRATIONS_03D_CONCLUIDA` (marcador futuro, na conclusão real).

---

## Sequência resumida (visão única)

```text
GATE 0  baseline (agente, leitura)
GATE 1  operador cria MIGRATION_DATABASE_URL (session 5432)   ← humano, credencial
GATE 2  agente verifica EXISTÊNCIA (sem valor)
GATE 3  validação session + sessão estável (sonda temporária, gated)
        └─ se ausente/inválida/instável → PARAR (regra invariante)
GATE 4  preparar wiring do buildCommand (branch/PR, não aplicar)
GATE 5  rollback pronto (restaurar buildCommand) + critérios de abortar
GATE 6  operador autoriza → aplicar buildCommand → 1 deploy controlado
GATE 7  confirmar pendentes = 0, schema_migrations completa
GATE 8  2º deploy → idempotência (nenhum [ok] novo)
GATE 9  remover run-migrations do deploy.yml (deploy-backend → needs: ci)
GATE 10 validação final + docs
```

## O que este plano NÃO autoriza

Alterar Render, criar/editar variável, alterar `buildCommand`, modificar `deploy.yml`/`ci.yml`, executar migration, disparar deploy, acessar/testar credencial, iniciar a integração operacional. Cada um exige autorização própria no gate correspondente. Este PR é **documental** e **não deve ser mergeado** sem revisão (`OPS_MIGRATIONS_03D_PR_DOCUMENTAL_MERGE_NAO_AUTORIZADO`).
