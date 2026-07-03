# MultGestor Platform Specification

> **Status:** OFICIAL • VIVO — este é o documento constitucional da plataforma. Define o que
> é Core, o que é Nicho, e as regras que governam a fronteira entre os dois.
> **Criado:** 2026-07-03 (missão Core P0) · **Última sincronização:** 2026-07-03
> **Fontes:** [[capabilities-map]] (catálogo técnico vivo) ·
> [[../audits/2026-07-03-core-vs-nicho-audit]] (evidência e diagnóstico) ·
> [[runbooks/MODELO-AUDITORIA-NICHO]] (como auditar um nicho)
> **Regra de honestidade:** o que está implementado é descrito no presente. O que é intenção
> futura é marcado **[VISÃO — não implementado]**. Nunca confundir os dois.

---

## 1. Propósito

Este documento existe para que qualquer pessoa (humana ou IA) que for tocar em código do
MultGestor saiba, sem precisar perguntar: **isto que estou editando é Core ou é Nicho?** Se a
resposta não for óbvia lendo este documento, é sinal de que o código está no lugar errado —
registrar como achado, não improvisar uma exceção.

---

## 2. Constituição do Core — princípios invioláveis

1. **O Core nunca importa nem consulta nada com prefixo de nicho.** Nenhum arquivo em
   `services/`, `controllers/`, `middlewares/` fora das pastas de módulo (`barber/`, `clima/`)
   pode referenciar tabelas `barber_*`/`clima_*`/`mg_*` ou helpers nomeados por nicho
   (`barber-helpers.js`, etc.). Violação = achado P0, corrigir antes de qualquer feature nova.
2. **Todo guard/middleware usado por mais de um módulo tem nome genérico**, mesmo que hoje só
   exista uma implementação. Nunca importar `requireBarberAdminAuth` fora do módulo barber —
   usar `requireTenantAdminAuth` (mesma implementação, nome honesto sobre o escopo real).
3. **Toda constante de domínio (scope, feature flag, branding default) é nomeada, não literal.**
   Um `'barber_admin'` solto dentro de uma comparação é uma bandeira vermelha — deve vir de
   uma constante documentada (`AUTH_SCOPE_TENANT_ADMIN`, etc.).
4. **Nenhuma mudança no Core pode alterar o comportamento de um módulo já vendido** sem que
   isso seja uma decisão explícita, testada e documentada — nunca um efeito colateral.
5. **O Core não inventa capacidade que não existe.** Se hoje só existe um auth_scope genérico
   para todos os nichos, isso é documentado como está (§4), não disfarçado com uma API que
   finge suportar por-módulo quando na prática não suporta.

---

## 3. Contrato Core × Nicho

### O Core garante (hoje, verificado por código)

| Capability | Garantia |
|---|---|
| Autenticação | JWT + refresh com rotação + revogação server-side; login/logout/me |
| Multi-tenant | Isolamento por `company_id` via RLS + GUC (reads em prod; writes prontos localmente) |
| Empresas / Usuários / Papéis | CRUD e autorização por role (`admin`, `owner`, `collaborator`, `master_admin`) |
| Módulos | Catálogo (`modules`) + ativação por empresa (`company_modules`) + guard reutilizável (`createModuleGuard`) |
| Billing | Webhooks idempotentes (Kiwify/AbacatePay), ativação automática de módulo no pagamento |
| Painel Master | Gestão de empresas e módulos (CRUD real via `Modules.jsx`) |
| Observabilidade / Backup / Deploy | Health checks, backup automatizado, CI/CD — nicho-agnósticos |

### Todo nicho novo DEVE entregar apenas

Regras de negócio · entidades de domínio · telas específicas · fluxos · menus · campos ·
relatórios · landing · seeds próprios · documentação do módulo.

### Todo nicho novo NÃO DEVE precisar reescrever

Autenticação · isolamento multi-tenant · CRUD de empresa/usuário · billing/webhooks ·
observabilidade/backup/deploy.

**Estado real vs. o contrato (2026-07-03):** o lado "Core garante" já é majoritariamente
verdadeiro após a correção P0 desta missão. O lado "nicho não deveria reescrever" ainda tem uma
exceção conhecida: **não existe motor de agendamento genérico com estado** — cada nicho com
agenda ainda escreve o próprio (ver §4, linha Booking Engine). Isso é dívida documentada, não
escondida.

---

## 4. Catálogo do Core (resumo — fonte viva é [[capabilities-map]])

| Capability | Status |
|---|---|
| Multi-Tenant Engine | ✅ Produção |
| Auth (JWT + refresh + revogação) | ✅ Produção |
| Módulos (`modules`/`company_modules`) | 🟡 Dado funciona; rotas ainda hardcoded em `server.js`/`App.jsx` (sem registry dinâmico) |
| Billing / Planos | 🟡 Técnico pronto; vocabulário de feature ainda do barber |
| Booking Engine (funções puras) | ✅ `scheduling-utils.js` reusado por Barber + Clima |
| Booking Engine (com estado) | 🔴 Não é compartilhado de fato — ver auditoria Core×Nicho A7 |
| Design System | 🟡 Genérico existe; `BarberUI.jsx` ainda duplica componentes |
| Guards genéricos por módulo | ✅ `createModuleGuard(slug, name)` — usar sempre este padrão para novos módulos |
| Guard genérico de auth de tenant | ✅ `requireTenantAdminAuth` (criado nesta missão, mesma implementação de `requireBarberAdminAuth`) |
| Registry dinâmico de rotas | 🔴 Não existe — maior alavanca de extensibilidade pendente |

Detalhe completo, com arquivo:linha de cada item: [[capabilities-map]] e
[[../audits/2026-07-03-core-vs-nicho-audit]] §2-§4.

---

## 5. Catálogo de Nichos

| Nicho | Status real | Empresa real usando? |
|---|---|---|
| BarberGestor | ✅ Completo, vendido, em produção | Sim (JoeFelipe + outras) |
| ClimaGestor | 🔴 Backend ~50% (schema+rotas existem; auth corrigida nesta missão); frontend ~1% (`Clima.jsx` stub de 7 linhas) | Não |
| PetGestor / AutoGestor / AgroGestor / CaféGestor / FiscalGestor | **[VISÃO — não implementado]** | Não existem — citados apenas em documentos de planejamento, nenhuma linha de código |

Nunca inflar o status de um nicho por otimismo — usar o modelo em
[[runbooks/MODELO-AUDITORIA-NICHO]] para reavaliar antes de qualquer comunicação externa.

---

## 6. Manifesto de Nicho — o que descreve um módulo

**Hoje (real, dado no banco):** `modules.name`, `modules.slug`, `modules.description`,
`modules.is_active`. É o que existe fisicamente na tabela `modules`.

**O manifesto completo que um nicho DEVERIA declarar (estado alvo, ainda não formalizado como
arquivo único — hoje disperso em migration + rotas + telas escritas à mão):**

```yaml
# MANIFESTO DE NICHO (formato alvo — não existe ainda como arquivo real)
slug: clima
name: ClimaGestor
icon: <ícone>
theme: <cores default>
auth_scope: tenant_admin        # hoje sempre 'barber_admin' — ver §2 regra 5
schema:
  migration_template: <referência ao template — não existe ainda>
  tables: [clima_professionals, clima_services, clima_appointments]
routes:
  base_path: /api/clima
  guard_module: clima            # createModuleGuard('clima', 'ClimaGestor')
  guard_auth: requireTenantAdminAuth
frontend:
  entry: <shell genérico + telas de domínio>
  landing_template: <não existe ainda>
plans:
  module_key: clima
seeds:
  script: seed-module.js --slug=clima   # hoje só existe seed-barber.js, hardcoded
```

Este YAML é uma **especificação alvo**, não um arquivo consumido por código hoje. Formalizá-lo
como schema real (JSON Schema ou similar) é trabalho P1/P2 (ver §9).

---

## 7. SDK / Template de Nicho — [VISÃO — não implementado]

Ordem de construção recomendada (não fazer tudo de uma vez — cada item só vale a pena depois
de validado por um segundo nicho real):

1. Registry dinâmico de rotas (backend + frontend) lendo o manifesto de §6.
2. Migration-template parametrizável (gera `CREATE TABLE` a partir do manifesto).
3. Contrato genérico `Bookable`/`Provider` — só depois de um segundo nicho real precisar de
   agenda, para não generalizar no vácuo (erro que aconteceu com o Booking Engine atual).
4. Shell de frontend genérico (lista/form/dashboard) consumindo o design-system real.
5. `seed-module.js --slug=<x>` generalizado a partir de `seed-barber.js`.
6. Template de landing parametrizado.

**Não implementar nada disto agora** — é o roadmap P1/P2 do Core, condicionado a uma decisão de
produto sobre qual será o segundo nicho real (ver [[../audits/2026-07-03-core-vs-nicho-audit]] §18).

---

## 8. Release Gate do Core

Nenhuma mudança estrutural do Core (registry de rotas, contrato Bookable/Provider, guard de
auth genérico, extração de lógica de `company.service.js` ou arquivo equivalente) entra em
produção sem:

```
☑ Suíte completa do backend verde (npm test)
☑ Lint + build do frontend verdes
☑ Smoke local cobrindo: login master, login do(s) módulo(s) afetado(s),
  rota principal de cada módulo afetado, rota de módulo protegida (guard)
☑ Nenhuma rota removida, nenhum comportamento de módulo já vendido alterado
☑ Documentação (este arquivo + capabilities-map.md) atualizada no mesmo PR/commit
☐ Push/deploy — sempre gated por autorização humana explícita
```

---

## 9. Definition of Ready — para começar um nicho novo

O Core deve ter, **antes** de começar um nicho novo pago:
- Registry de rotas dinâmico (não editar `server.js`/`App.jsx` à mão).
- Guard de auth genérico corrigido e em uso (`requireTenantAdminAuth` — já existe desde esta
  missão; falta o registry para o resto do ganho aparecer).
- `company.service.js` (ou service Core equivalente) sem conhecimento de tabelas de nicho —
  **atendido nesta missão**.
- Pelo menos um contrato genérico de entidade agendável, se o nicho tiver agenda.

Sem isso, "criar nicho novo" continua custando quase tanto quanto reescrever — como o
ClimaGestor provou.

---

## 10. Definition of Done — para o Core ser considerado finalizado

- Nenhum arquivo fora de uma pasta de módulo conhece tabela/helper de nicho (auditável por
  grep — ver [[../audits/2026-07-03-core-vs-nicho-audit]] §3 para o método).
- Um módulo novo pode ser registrado sem editar `server.js`/`App.jsx` manualmente.
- Existe pelo menos um "Bookable"/"Provider" genérico usado por 2 nichos reais (não 2
  reimplementações).
- `company_modules` é populada automaticamente (por `niche_type` no registro orgânico, ou por
  webhook — já resolvido no billing).
- Um segundo nicho real (não um esqueleto) está em produção com pelo menos uma empresa usando,
  validado pelo [[runbooks/MODELO-AUDITORIA-NICHO]].
- **MultGestor Core Completion Index** (ver auditoria) ultrapassa 75/100.

---

## 11. Regras de manutenção deste documento

- Atualizar §4/§5 sempre que uma auditoria de Core ou de nicho for refeita — nunca deixar
  divergir do código real.
- Seções marcadas **[VISÃO]** só saem dessa marcação quando houver código funcionando E
  evidência de uso real — nunca por causa de uma decisão de escrever a spec primeiro.
- Mudanças na Constituição (§2) exigem registrar o motivo em
  `.opencodex/brain/decisions/` (ADR), não só editar a lista.
- Este documento não duplica o detalhe técnico da auditoria — aponta para ela. Se um número
  aqui divergir do que está na auditoria mais recente, a auditoria vence; corrigir este arquivo.
