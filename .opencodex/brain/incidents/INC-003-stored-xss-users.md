# INC-003 — Stored XSS em users.name

> **Status:** CORRIGIDO
> **Data:** 2026-06-14
> **Severidade:** ALTA
> **Responsável:** — (detectado em auditoria)
> **Relacionamentos:** [[incidents/README]] · [[lessons-learned]] · [[technical/seguranca]]

---

## Resumo

3 registros em `users.name` continham HTML injection (`<>`). Stored XSS potencial em dados de usuário.

## Impacto

- Risco de execução de script malicioso
- Dados não sanitizados no banco

## Causa

- Ausência de sanitização na entrada de `users.name`
- Parte do ciclo XSS (Bloco A v2)

## Correção

- 3 UPDATEs cirúrgicos (só name)
- Count(`~'[<>]'`) = 0 → ciclo XSS CLOSED

## Prevenção

- Validação/sanitização na entrada
- Monitoramento periódico

## Referências

- [[03-TIMELINE#2026-06-15]]
- [[technical/seguranca]]
