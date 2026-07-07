# Prompts de Backend

> **Status:** VIVO
> **Relacionamentos:** [[prompts/README]] · [[technical/backend]] · [[technical/eventos]]

---

## Prompt: Criar Endpoint

```
Crie um endpoint REST para [FUNÇÃO] no MultGestor.

Stack: Node 18 + Express 5 (CommonJS)
Banco: PostgreSQL via pg.Pool (sem ORM)
Validação: Zod
Eventos: Usar EVENT CONTRACTS se aplicável

Requisitos:
1. [REQUISITO 1]
2. [REQUISITO 2]

Regras:
- Filtrar por company_id (multi-tenant)
- Rate limit na rota
- Validação de entrada com Zod
- Log estruturado com Pino
- Erros como AppError

Contexto técnico: [[technical/backend]]
```

## Prompt: Criar Service

```
Crie um service para [FUNÇÃO] no MultGestor.

O service deve:
1. Conter regras de negócio
2. Usar BaseRepository para acesso a dados
3. Emitir eventos via EventBus/Outbox quando aplicável
4. Ser testável (sem dependências concretas)

Stack: Node 18 + Express 5 (CommonJS)
```

## Referências

- [[technical/backend]] — Backend detalhado
- [[technical/eventos]] — Eventos e outbox
- [[architecture-decisions#ADR-03]] — Event Bus + Outbox
