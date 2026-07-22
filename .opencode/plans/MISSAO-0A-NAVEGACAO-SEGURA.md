# MISSÃO 0A — NAVEGAÇÃO SEGURA

**Dependência:** Gate 6 do Plano de Consolidação (Onda 1)
**Risco:** Baixo
**Decisões humanas necessárias:** Nenhuma
**Alterações de significado/autoridade/hierarquia:** Proibidas
**Exclusões/movimentações/renomeações:** Proibidas
**Commit/push:** Proibidos sem autorização

---

## Escopo

Corrigir exclusivamente **caminhos e referências** em links quebrados nos
documentos constitucionais do OpenCodex. Nenhum conteúdo, significado,
autoridade, regra ou hierarquia será alterado.

---

## Arquivos afetados

```
FLUXOS.md
MAPA-DAS-PASTAS.md
CONVENCOES.md
ATLAS.md
GLOSSARIO.md
00-HOME.md
Base de Conhecimento.md
```

`HOME.md` será apenas referenciado durante a busca, não modificado.

---

## Ações

| ID | Ação | Arquivo | Substituições |
|----|------|---------|---------------|
| A1.1 | Corrigir 14 links `brain/*` em 7 fluxos | `FLUXOS.md` | 14 |
| A1.2 | Corrigir 6 links `audits/` → `auditorias/` | `FLUXOS.md` | 6 |
| A1.3 | Corrigir 4 referências desatualizadas | `MAPA-DAS-PASTAS.md` | 4 |
| A1.4 | Corrigir 3 referências desatualizadas | `CONVENCOES.md` | 3 |
| A1.5 | Corrigir 4 referências desatualizadas | `ATLAS.md` | 4 |
| A1.6 | Corrigir link `brain/KNOWLEDGE-OS` | `GLOSSARIO.md` | 1 |
| A1.7 | `HOME.md` → `00-HOME.md` | `ATLAS.md` | 1 |
| A1.8 | `HOME.md` → `00-HOME.md` (8 ocorrências) | `FLUXOS.md` | 8 |
| A1.9 | Adicionar links para ATLAS, MAPA, GLOSSARIO, FLUXOS, CONVENCOES | `00-HOME.md` | 5 |
| A1.10 | Adicionar link para `02-COMO-USAR.md` | `00-HOME.md` | 1 |
| A1.11 | Adicionar link para `02-COMO-USAR.md` | `Base de Conhecimento.md` | 1 |

**Total de ações formais:** 11
**Volume estimado de substituições:** 34+

---

## PRE-GATE

- [ ] `git status` — verificar estado atual do repositório
- [ ] `git diff` — confirmar que não há alterações em aberto
- [ ] `git branch` — confirmar branch atual (`docs/sec-booking-rls-001`)
- [ ] Backup automático: `git stash` ou branch temporária se houver sujeira
- [ ] Lista dos arquivos que serão alterados (acima) — nenhum extra
- [ ] `grep` de links quebrados conhecidos para baseline antes/depois

---

## POST-GATE

- [ ] `git diff` — restrito exclusivamente aos 7 arquivos do escopo
- [ ] `grep` de links quebrados — validar que 34+ foram corrigidos
- [ ] Nenhum arquivo fora da lista foi alterado
- [ ] Nenhum conteúdo além de caminhos e referências foi modificado
- [ ] Relatório gerado em `.opencode/plans/MISSAO-0A-RELATORIO.md`
- [ ] Aguardar autorização explícita para Missão 0B

---

```
MISSAO_0A_STATUS: PLANO_CONCLUIDO
PRONTA_PARA_EXECUCAO: SIM
AGUARDANDO: AUTORIZACAO_EXPRESSA
```
