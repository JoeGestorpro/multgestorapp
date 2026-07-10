# Checklist e Auditoria de Nichos

> Checklists para cada etapa do ciclo. Marque \[x]\ no Obsidian conforme avança.

---

## Checklist A — Pré-planejamento (antes de preencher template)

- [ ] Nome do nicho definido
- [ ] Dor principal definida (o que o dono perde dinheiro/tempo)
- [ ] Usuários/personas identificados (dono, gerente, funcionário, cliente)
- [ ] MVP mínimo esboçado (menor versão que entrega valor)
- [ ] Ideia resolve problema real (não é só "seria legal ter")

---

## Checklist B — Antes de enviar para implementação

- [ ] Template 01 preenchido (seções 1 a 17)
- [ ] Mapa de reaproveitamento do core preenchido
- [ ] Decisões travadas registradas
- [ ] Contrato de implementação definido
- [ ] Glossário e nomes oficiais definidos
- [ ] Fluxo principal descrito em steps
- [ ] Entidades e campos definidos
- [ ] Rotas/API listadas com permissões
- [ ] IA gerou plano de execução (seção 18 do template)
- [ ] Plano revisado e APROVADO por Joe
- [ ] Nível de confiança = Pronto para Code

---

## Checklist C — Por fase (IA preenche antes de cada fase)

- [ ] Quais arquivos serão alterados nesta fase?
- [ ] Quais arquivos serão criados?
- [ ] O que do core será reaproveitado?
- [ ] Risco de quebrar algo existente?
- [ ] Quais testes devem ser rodados depois?
- [ ] Escopo está limitado ao MVP?
- [ ] Contrato de implementação respeitado?

---

## Checklist D — Pós-implementação (pronto para produção)

- [ ] Login funcionando
- [ ] Isolamento tenant (company_id) OK
- [ ] Rotas protegidas exigem autenticação
- [ ] Rotas públicas têm validação
- [ ] Usuário não acessa dados de outra empresa
- [ ] Estados vazio/erro/loading tratados no frontend
- [ ] Build passa (0 errors)
- [ ] Testes passam
- [ ] Fluxo principal validado do início ao fim
- [ ] Não quebrou core existente
- [ ] Relatório final gerado

---

## Checklist E — Auditoria final

- [ ] MVP foi implementado conforme a arquitetura definida?
- [ ] Nada fora do escopo foi criado?
- [ ] Sem duplicação do core (login, tenant, usuários)?
- [ ] Autenticação foi reaproveitada corretamente?
- [ ] Tenant/multi-tenant foi respeitado?
- [ ] Permissões estão no backend e frontend?
- [ ] Rotas estão coerentes com o planejado?
- [ ] Entidades fazem sentido com o glossário?
- [ ] Testes cobrem o fluxo principal?
- [ ] Contrato de implementação foi respeitado?
- [ ] Risco de segurança identificado?
- [ ] Risco de manutenção identificado?

### Resultado da auditoria

**P0 (críticos):**

**P1 (importantes):**

**P2 (melhorias):**

**Veredito:** ✅ Aprovado / ❌ Não aprovado

---

## Checklist F — Pronto para produção (geral)

- [ ] Build passa
- [ ] Testes passam
- [ ] Lint 0 errors
- [ ] Fluxo principal validado manualmente
- [ ] Sem dados de outros tenants vazando
- [ ] Nicho registrado no INDEX.md
- [ ] Decisões registradas no chatJoe/projetos/instrutor-gerador-de-nichos/decisoes.md
