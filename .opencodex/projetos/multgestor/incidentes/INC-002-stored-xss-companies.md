# INC-002 — Stored XSS em companies.name

> **Status:** CORRIGIDO
> **Data:** 2026-06-14
> **Severidade:** ALTA
> **Responsável:** — (detectado em auditoria)
> **Relacionamentos:** [[incidents/README]] · [[lessons-learned]] · [[technical/seguranca]]

---

## Resumo

3 registros em `companies.name` continham HTML injection (`<>`). Stored XSS potencial em dados de tenant.

## Impacto

- Risco de execução de script malicioso no painel do dono
- Dados não sanitizados no banco

## Causa

- Ausência de sanitização na entrada de `companies.name`
- Portão de entrada XSS não fechado

## Correção

- 3 UPDATEs cirúrgicos (só name, sem alterar updated_at)
- Count(`~'[<>]'`) = 0 após correção
- Portão de entrada (`/register` com `<script>`) → 400 (Bloco B+C)

## Prevenção

- Validação/sanitização na entrada de todos os campos textuais
- Monitoramento periódico de `<>` em campos de texto

## Commits

- `b75d34a` (PR #6) — XSS register hardening

## Deploy

- PR #6 deployado com sucesso

## Referências

- [[linha-do-tempo#2026-06-15]]
- [[technical/seguranca]]
