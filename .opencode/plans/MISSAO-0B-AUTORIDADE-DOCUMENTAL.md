# MISSÃO 0B — AUTORIDADE DOCUMENTAL

**Dependência:** Missão 0A concluída
**Risco:** Médio
**Decisões humanas necessárias:** D07, D08
**Alterações permitidas:** Conteúdo de autoridade, hierarquia e governança em ATLAS.md, Governanca-Documental.md e constitution-knowledge-os.md
**Exclusões/movimentações/renomeações:** Permitido mover constitution-knowledge-os.md para `rules/`

---

## Escopo

Alinhar os documentos constitucionais do OpenCodex (ATLAS.md,
Governanca-Documental.md) e promover o documento `constitution-knowledge-os.md`
de `_inbox/revisar/` para `rules/`, resolvendo os conflitos de autoridade
identificados no Gate 4 (C2, D13).

**Proibido:** corrigir links de navegação (já feitos na 0A), alterar
documentos de arquitetura, excluir arquivos não relacionados.

---

## Decisões necessárias antes de iniciar

| ID | Decisão | Impacto | Risco |
|----|---------|---------|-------|
| D07 | Alinhar Governanca-Documental.md e ATLAS.md sobre hierarquia de autoridade | Definição de qual documento prevalece em caso de conflito | Médio |
| D08 | Promover `_inbox/revisar/constitution-knowledge-os.md` para `rules/` | Constitution ganha localização canônica adequada | Alto (movimentação) |

---

## Arquivos afetados

```
.opencodex/ATLAS.md
.opencodex/Governanca-Documental.md
.opencodex/_inbox/revisar/constitution-knowledge-os.md  →  .opencodex/rules/constitution-knowledge-os.md
```

---

## Ações

| ID | Ação | Risco |
|----|------|-------|
| A2.1 | ATLAS.md: atualizar hierarquia de autoridade para refletir navegação real | 🟡 |
| A2.2 | ATLAS.md: remover ou corrigir referências a `brain/constitution.md` | 🟡 |
| A2.3 | ATLAS.md: verificar e alinhar as 5 capacidades com estrutura atual | 🟡 |
| A2.4 | Mover `_inbox/revisar/constitution-knowledge-os.md` → `rules/constitution-knowledge-os.md` | 🔴 |
| A2.5 | ATLAS.md: atualizar link para `rules/constitution-knowledge-os.md` | 🟢 |
| A2.6 | Alinhar Governanca-Documental.md com ATLAS.md, eliminando contradições | 🟡 |

---

## PRE-GATE

- [ ] Decisões D07 e D08 respondidas por humano
- [ ] `git status` / `git diff` — branch limpa
- [ ] Confirmar que Missão 0A foi concluída e validada
- [ ] Backup de ATLAS.md, Governanca-Documental.md e constitution-knowledge-os.md
- [ ] Lista dos arquivos que poderão ser alterados (acima)

---

## POST-GATE

- [ ] `git diff` — restrito aos 3 arquivos do escopo (+1 movido)
- [ ] Grep: confirmar que `brain/constitution` não é mais referenciado
- [ ] Grep: confirmar que `rules/constitution-knowledge-os.md` existe e está acessível
- [ ] Validar que ATLAS.md e Governanca-Documental.md não se contradizem
- [ ] Relatório gerado em `.opencode/plans/MISSAO-0B-RELATORIO.md`
- [ ] Aguardar autorização explícita para Missão 0C

---

```
MISSAO_0B_STATUS: PLANO_CONCLUIDO
PRONTA_PARA_EXECUCAO: NAO
BLOQUEADA_POR: D07, D08
```
