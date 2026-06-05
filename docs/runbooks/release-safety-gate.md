# Release Safety Gate — Runbook

## O que é

O **Release Safety Gate** é um script Node.js (`backend/scripts/pre-release.js`) que
executa uma bateria de verificações antes de um release ser commitado/pusheado.
Ele impede que código sujo, quebrado ou inseguro chegue à branch principal.

## Quando executar

- **Sempre** antes de commitar/pushar código funcional para `main`.
- Pode ser executado localmente com `npm run pre-release` (no diretório raiz).

## Verificações executadas (e ordem)

| # | Verificação | O que checa | O que fazer se falhar |
|---|-------------|-------------|----------------------|
| 1 | Working tree limpo | Se há arquivos não commitados | `git add + git commit` ou `git stash` |
| 2 | Branch permitida | Se a branch é `main` ou `release/*` | Faça merge ou mude de branch |
| 3 | Workflows YAML válidos | Se `.github/workflows/*.yml` são YAML válidos | Corrija a sintaxe YAML do workflow |
| 4 | Secret Scan | Se há senhas, chaves ou tokens expostos | Remova o segredo ou adicione ao `.gitignore` |
| 5 | Database Guard | Se `DATABASE_URL` não aponta para produção/Supabase | Mude para banco local/staging |
| 6 | Testes unitários (backend) | `jest tests/unit/ --runInBand` | Corrija os testes que falharam |
| 7 | Lint (frontend) | `eslint .` com zero erros | Corrija os erros de lint |
| 8 | Build (frontend) | `vite build` compila sem erro | Corrija os erros de compilação |

## Formato da saída

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RELEASE SAFETY GATE  v1
  2025-06-05 14:30:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Git --

  ✓ Working tree deve estar limpo
  ✓ Branch deve ser main ou release/*

-- 2. Workflows YAML --
  ...
```

### Aprovado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ APROVADO
  8 verificacoes passaram
  ✓ Commit e push liberados.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Bloqueado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✗ BLOQUEADO
  2 falha(s) de 8 verificacao(oes)

  ✗ Working tree deve estar limpo
    Motivo: Arquivos modificados ou nao versionados encontrados:
           M src/index.js
           ?? src/nova-feature.js

           Proximo passo: git add + git commit antes de rodar o pre-release.

  ✗ DATABASE_URL nao pode apontar para producao / Supabase
    Motivo: DATABASE_URL=postgresql://...
           Esta string aponta para ambiente de producao ou Supabase.
           O pre-release deve rodar contra banco local ou de teste.
           Proximo passo: alterar DATABASE_URL para um banco local ou de staging.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Não | String de conexão com o banco. Se apontar para produção, o Database Guard bloqueia. |
| `SKIP_DB_GUARD` | Não | Se `true`, pula a verificação do Database Guard. |

## Exit codes

| Código | Significado |
|--------|-------------|
| 0 | Aprovado — pode commitear/pushear |
| 1 | Bloqueado — corrija as falhas e tente novamente |

## Manutenção

Para adicionar uma nova verificação:

1. Crie a função de verificação com `runCheck('Nome da verificação', () => { ... })`
2. Adicione a seção numerada no `main()`, na ordem desejada
3. Atualize a tabela acima neste runbook
4. Teste com `npm run pre-release`
