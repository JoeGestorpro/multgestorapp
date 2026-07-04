# PACK 00 — Leia Primeiro

> ⚠️ **ARQUIVO GERADO — NÃO EDITAR À MÃO.** Fonte: `.opencodex/brain/` (Segundo Cérebro).
> Regenerado por `scripts/generate-context-pack.js` a cada fechamento de missão relevante
> (princípio D-015: o pack é DERIVADO, nunca fonte — ninguém escreve direto aqui).

- **Gerado em:** 2026-07-04
- **state_version de origem:** 25
- **Commit local de referência:** `e661259`
- **Push para produção:** ainda **NÃO autorizado** no momento da geração deste pack (ver PACK-02)

---

## Como usar este pacote

Estes 6 arquivos (`PACK-00` a `PACK-05`) são o contexto mínimo para qualquer conversa nova
sobre o MultGestor começar informada, sem precisar colar documentos. Eles **resumem e
referenciam** os documentos canônicos do repositório — não os substituem. Se você precisar de
detalhe técnico completo (código, evidência linha-a-linha, histórico integral), vá à fonte
citada em cada seção.

## Antes de confiar em qualquer afirmação daqui

Este pack é uma **foto**, não a fonte viva. Se a conversa for sobre uma ação real (push, SQL
em produção, decisão de escopo), confirme contra o repositório antes de agir:

1. `git log origin/main..main --oneline` — o estado de "o que já foi ou não enviado" muda
   assim que houver autorização de push.
2. `.opencodex/queue/current-task.md` e `next-task.md` — missão ativa pode ter mudado.
3. `.opencodex/brain/01-CURRENT-STATE.md` e `EXECUTION-PLAYBOOK-PRODUCAO.md` — fontes vivas
   completas, sempre mais atualizadas que este pack.

## Ordem de leitura recomendada

`PACK-01` (quem somos e como trabalhamos) → `PACK-02` (onde estamos agora) → `PACK-03`
(o que vem a seguir) → `PACK-04` (regras de arquitetura, se a conversa for técnica) → `PACK-05`
(decisões, se a conversa for sobre "por que fizemos X assim" ou "o que falta decidir").
