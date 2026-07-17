# INC-005 — Acesso não autorizado à produção por teste do runner (sem mutação)

> **Classificação:** `INCIDENTE_DE_ACESSO_NAO_AUTORIZADO_SEM_MUTACAO`
> **Status:** CONTIDO · **Severidade:** Baixa (sem mutação; leitura + no-op) · **Registrado:** 2026-07-17
> **Origem:** desenvolvimento da OPS-MIGRATIONS-03C (PR #51) · **Relacionado:** [[INC-004-exposicao-credencial-runtime-scratch]] · [[../mapas/decisions/ADR-006-migrations]]

## Resumo

Durante a primeira execução local da suíte de testes do runner de migrations, os testes de banco **conectaram ao banco de produção** a partir da máquina de desenvolvimento, sem autorização. **Nenhum dado ou schema foi alterado.**

## Causa-raiz — ordem de carregamento do `dotenv`

Dois fatores combinados:

1. O runner chamava `require('dotenv').config()` **no topo do módulo**. Ao ser importado pelo teste, o `dotenv` carregava `backend/.env` — que aponta para o pooler de produção — em `process.env.DATABASE_URL`.
2. O teste selecionava o alvo com fallback `TEST_DATABASE_URL || DATABASE_URL`. Sem `TEST_DATABASE_URL` local, caiu no `DATABASE_URL` recém-populado com produção.

A proteção pré-existente (`tests/jest.setup.js`, que lança erro se `DATABASE_URL` contém host de produção) **não pegou**: ela lê `DATABASE_URL` no *setup*, e o `dotenv` do runner só populava a variável **depois**, no `require` do módulo sob teste. A proteção rodou cedo demais na ordem de carregamento.

## Impacto — limitado, sem mutação

O runner, ao rodar contra produção com todas as migrations já aplicadas:

- `CREATE TABLE IF NOT EXISTS schema_migrations` → **no-op** (tabela já existe);
- `SELECT` das migrations aplicadas → leitura;
- todas as 32 migrations → `applied.has(version)` verdadeiro → **`[skip]`**, zero DDL, zero `INSERT`;
- verificação de integridade → `SELECT`;
- `pg_advisory_lock` / `unlock` → nível de sessão, **não toca dados**; liberado ao encerrar.

**Confirmação:** produção permaneceu saudável (endpoint público `HTTP 200`, deploy vivo inalterado). Nenhum DDL novo, nenhum dado alterado.

## O ponto que importa

Mesmo sem mutação, um teste local **descobriu e usou uma credencial de produção** automaticamente. O risco não foi o efeito — foi a **capacidade**: a mesma via, com um banco em estado divergente, poderia ter aplicado uma migration não intencional em produção. A defesa anterior era insuficiente por depender da ordem de carregamento.

## Contenção — duas camadas

1. **`dotenv.config()` movido para dentro do guard `require.main === module`.** Importar o runner (testes) não tem mais efeito colateral em `process.env`. `npm run migrate` (execução direta) continua carregando o `.env` normalmente.
2. **Testes de banco gated exclusivamente em `TEST_DATABASE_URL`**, sem fallback para `DATABASE_URL`, com guard adicional que recusa qualquer host que não seja `localhost` / `127.0.0.1` / `postgres`.

A proteção do `jest.setup.js` permanece como terceira camada (defense-in-depth), agora não mais contornável pela via do `dotenv`.

## Verificação da contenção

- `require('scripts/run-migrations')` com ambiente limpo → `process.env.DATABASE_URL` permanece **vazio** (sem poluição).
- Suíte sem `TEST_DATABASE_URL` → testes de banco **pulam**; zero conexão externa.
- `TEST_DATABASE_URL` apontando para host de produção → guard local recusa **e** `jest.setup.js` aborta.

## Débito / lição

- **Nenhum `require` de módulo deve ter efeito colateral de ambiente.** Carregamento de `.env` pertence ao ponto de entrada (execução direta), nunca ao corpo de um módulo importável.
- O `backend/.env` local apontar para produção é um fator de risco por si só (registrado como observação em [[../mapas/decisions/ADR-006-migrations]]): um `npm run migrate` local atinge produção. Fora do escopo desta correção; candidato a `.env` de desenvolvimento separado.

## Confirmação de ausência de alteração

| Verificação | Resultado |
|---|---|
| Schema de produção | **inalterado** — nenhum DDL novo (todas `[skip]`) |
| Dados de produção | **inalterados** — nenhum `INSERT`/`UPDATE`/`DELETE` |
| `schema_migrations` | **inalterada** — nenhum registro novo |
| Advisory lock | adquirido e **liberado** ao encerrar a sessão |
| Render / workflow / deploy | **não tocados** |
| Credencial / hostname neste registro | **não reproduzidos** |
