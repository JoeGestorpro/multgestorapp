# MISSÃO 0E — VALIDAÇÃO FINAL

**Dependência:** Missões 0A, 0B, 0C, 0D concluídas
**Risco:** Baixo
**Decisões humanas necessárias:** Nenhuma
**Alterações em arquivos:** Nenhuma — verificação apenas
**Commit/push:** Permitido apenas com autorização explícita ao final

---

## Escopo

Validar que todas as missões anteriores foram executadas corretamente,
verificar integridade do OpenCodex após as alterações, e emitir o relatório
final de encerramento da Governança do OpenCodex (Missão 0).

---

## Ações de verificação

| ID | Ação | Ferramenta | Critério de aceite |
|----|------|------------|--------------------|
| A5.1 | Verificar que links brain/* foram corrigidos | `grep -r "brain/" .opencodex/` | Nenhum resultado em FLUXOS, MAPA, CONVENCOES, ATLAS, GLOSSARIO |
| A5.2 | Verificar que audits/ foi substituído por auditorias/ | `grep -r "audits/" .opencodex/` | Apenas resultados esperados (se houver) |
| A5.3 | Verificar que HOME.md não é mais referenciado como porta de entrada | `grep -r "HOME.md" .opencodex/` | Apenas o próprio HOME.md e redirecionamento |
| A5.4 | Verificar que 02-COMO-USAR.md passou a ser referenciado | `grep -r "02-COMO-USAR" .opencodex/` | Pelo menos 1 referência externa |
| A5.5 | Verificar que ATLAS, FLUXOS, GLOSSARIO, MAPA são referenciados de 00-HOME.md | Read em 00-HOME.md | Links presentes |
| A5.6 | `git status` — verificar arquivos alterados | `git status` | Apenas arquivos esperados |
| A5.7 | `git diff` — verificar alterações | `git diff` | Nenhuma alteração inesperada |
| A5.8 | Confirmar que cada assunto tem 1 fonte canônica | Conferir Gate 5 vs estado atual | 38 assuntos mapeados |
| A5.9 | Confirmar que auxiliares apontam para fonte canônica | Amostragem | Pelo menos 80% conforme |

---

## Verificações adicionais por missão

### Pós-0A (navegação)
- [ ] `grep "brain/KNOWLEDGE-OS"` — resolvido
- [ ] `grep "audits/"` em ATLAS, FLUXOS, CONVENCOES, MAPA — resolvido
- [ ] `grep "HOME.md"` em ATLAS, FLUXOS — aponta para `00-HOME.md`

### Pós-0B (autoridade)
- [ ] `grep "brain/constitution"` — não existe mais
- [ ] `Test-Path .opencodex/rules/constitution-knowledge-os.md` — existe
- [ ] ATLAS.md e Governanca-Documental.md — sem contradições

### Pós-0C (duplicidades)
- [ ] Nenhum arquivo da lista de placeholders ainda existe (exceto se D02/D03=preencher)
- [ ] HOME.md contém apenas redirecionamento
- [ ] `roadmap/roadmap/` não existe mais (se D09=Sim)

### Pós-0D (arquitetura)
- [ ] AUDIT_REPORT.md sem objeções descartadas
- [ ] capabilities-map.md com Repository/EventBus implementados
- [ ] runtime-map.md com refresh token
- [ ] PLATFORM_ARCHITECTURE.md sem R9

---

## Saída

```
.opencode/plans/MISSAO-0E-RELATORIO-VALIDACAO.md
```

Contendo:

- Resultado de cada verificação (A5.1–A5.9)
- Resultado das verificações por missão
- Lista de não conformidades (se houver)
- Estado final do OpenCodex pós-consolidação
- Sinal verde: SIM / NÃO para Missão 1

---

## PRE-GATE

- [ ] Confirmar que Missões 0A, 0B, 0C e 0D foram concluídas e validadas
      individualmente
- [ ] `git status` / `git diff` — branch com todas as alterações das 4 missões
- [ ] Nenhuma alteração em progresso

---

## POST-GATE

- [ ] Relatório de validação gerado
- [ ] Se sinal verde: Missão 0 oficialmente encerrada
- [ ] Se sinal vermelho: lista de não conformidades encaminhada para revisão
- [ ] Aguardar autorização para Missão 1 — Arquitetura Canônica do Core MultGestor

---

```
MISSAO_0E_STATUS: PLANO_CONCLUIDO
PRONTA_PARA_EXECUCAO: NAO
BLOQUEADA_POR: MISSOES_0A_0B_0C_0D
```
