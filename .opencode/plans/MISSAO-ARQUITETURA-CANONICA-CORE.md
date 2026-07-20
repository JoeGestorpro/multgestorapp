# MISSÃO — ARQUITETURA CANÔNICA DO CORE MULTGESTOR

**Versão:** 1.0 | **Data:** 2026-07-20
**Dependências:** Gate 4 concluído, 6 documentos de evidência salvos em `.opencode/plans/`
**Modo atual:** PLAN — nenhuma alteração técnica autorizada
**Base branch:** `docs/sec-booking-rls-001` | **HEAD:** `0d392e6`

---

## 0. Quantitativos de Base (normalizados)

Todos os números abaixo referem-se à fotografia arquitetural registrada pelo Gate 4
em `consolidacao-gate-4.md`, `consolidacao-matriz-evidencias.md` e
`consolidacao-proximas-validacoes.md`.

### Capacidades

| Métrica | Valor | Origem do dado |
|---------|-------|----------------|
| Total de capacidades mapeadas | **40** | IDs C-01 a C-40 na matriz |
| CONSOLIDADO (produção confirmada) | **4** | Contagem manual na matriz (C-04, C-05, C-06, C-10) |
| CONSOLIDADO_LOCALMENTE | **21** | Contagem manual na matriz — correção do valor 20 informado anteriormente |
| PARCIAL | **9** | Contagem manual na matriz (C-14, C-17, C-28, C-29, C-31, C-33, C-34, C-35, C-36) |
| EM_EXPERIMENTO | **1** | C-30 (AI/LLM — MockProvider) |
| DESCONHECIDO | **1** | C-32 (Redis — sem confirmação de produção) |
| AUSENTE | **4** | C-37 a C-40 (testes frontend, automation, omnichannel, novos nichos) |
| **Soma verificada** | **40** | 4+21+9+1+1+4 = 40 ✓ |

### Validações pendentes

| Categoria | Quantidade | Origem |
|-----------|-----------|--------|
| MCP (Supabase) | **8** | VAL-MCP-01 a 08 (consolidacao-proximas-validacoes.md) |
| Render (painel) | **4** | VAL-RENDER-01 a 04 |
| Código | **4** | VAL-CODE-01,02,03,06 |
| Documentação | **4** | VAL-DOC-01 a 04 |
| Nicho | **3** | VAL-NICHO-01 a 03 |
| **Total pendentes** | **23** | 8+4+4+4+3 = 23 ✓ |
| Validações de produção (MCP+Render) | **12** | 8+4 = 12 — coerente com `PROVAS_DE_PRODUCAO_PENDENTES: 12` no Gate 4 |
| Já executadas | **2** | VAL-CODE-04,05 (cobertura de código verificada durante Gate 4) |

---

## 1. Objetivo Final

Transformar o levantamento arquitetural dos 3 terminais + Gate 4 em decisões
claras, contratos e uma fronteira estável entre plataforma e nichos.

Estrutura mental alvo:

```
MULTGESTOR
│
├── CORE DA PLATAFORMA
│   ├── autenticação
│   ├── multiempresa
│   ├── permissões
│   ├── planos e cobrança
│   ├── eventos e outbox
│   ├── integrações
│   └── observabilidade
│
├── CAPACIDADES COMPARTILHADAS
│   ├── agendamento
│   ├── carteira
│   ├── pacotes
│   ├── fidelidade
│   └── comunicação
│
└── NICHOS
    ├── BarberGestor
    ├── ClimaGestor
    └── futuros nichos
```

---

## 2. Macroblocos da Missão

### MISSÃO A — ARQUITETURA CANÔNICA DOCUMENTAL

Não altera código, banco, produção ou documentação fora de `.opencode/plans/`.

**Fases incluídas:**

| Fase | Descrição | Gate |
|------|-----------|------|
| Fase 1 | Fotografia atual — registrar 6 docs de evidência no cofre | A1 |
| Fase 2 | Blocos arquiteturais (PLATFORM_CORE, SHARED_CAPABILITIES, NICHE_CONTRACTS, NICHE_MODULES) | A2 |
| Fase 3 | Matriz de pertencimento (cada recurso → plataforma/capacidade/nicho) | A3 |
| Fase 4 | Contratos do Core (tenant, módulo, capacidade, eventos, plano) | A4 |
| Fase 4A | **BASE CANÔNICA INICIAL** — produzir 4 documentos conceituais: CORE-CONSOLIDADO.md, FRONTEIRA-CORE-NICHOS.md, CONTRATOS-DO-CORE.md, MATRIZ-DE-PERTENCIMENTO.md | A4 |
| Fase 5 | Arquitetura do Booking Engine (BookingEngine + adapters de nicho) | A5 |
| Fase 6 | Roadmap de extração (Wallet → Packages → Loyalty → Anamnesis → CRM) | A6 |

---

### MISSÃO B — IMPLEMENTAÇÃO ARQUITETURAL

Exige autorização independente. Não iniciada.

**Fases incluídas:**

| Fase | Descrição |
|------|-----------|
| Fase 7 | Decomposição progressiva do barber.service.js (3.831 linhas → sub-services via barber-core facade) |
| Fase 8 | Prova vertical com ClimaGestor (fluxo completo sem copiar BarberGestor) |

---

### MISSÃO C — VALIDAÇÃO OPERACIONAL

Qualquer operação com risco, escrita, secret, banco ou configuração exige
aprovação específica.

**Fases incluídas:**

| Fase | Descrição |
|------|-----------|
| Fase 9 | Validações via GitHub, Render, Supabase, Vercel e runtime |

---

### MISSÃO D — CONSOLIDAÇÃO FINAL

**Fases incluídas:**

| Fase | Descrição |
|------|-----------|
| Fase 10 | Atualização do painel mestre, ADRs e documentos canônicos para refletir o estado realmente executado e comprovado |

---

## 3. Detalhamento das Fases

### Fase 1 — Fotografia atual (congelar)

Registrar os 6 documentos de consolidação no cofre oficial:

| Documento | Conteúdo | Localização atual |
|-----------|----------|-------------------|
| README.md | Resumo executivo dos 3 terminais | `.opencode/plans/consolidacao-readme.md` |
| terminal-1-evidencias.md | Matriz de evidências (40 capacidades) | `.opencode/plans/consolidacao-matriz-evidencias.md` |
| terminal-2-objecoes.md | 7 objeções confirmadas, 5 descartadas | `.opencode/plans/consolidacao-objecoes.md` |
| gate-4-reconciliacao.md | Reconciliação com métricas corrigidas | `.opencode/plans/consolidacao-gate-4.md` |
| fronteira-core-nichos.md | Fronteira entre Core, capacidades e nichos | `.opencode/plans/consolidacao-fronteira-core-nichos.md` |
| proximas-validacoes.md | 23 validações pendentes | `.opencode/plans/consolidacao-proximas-validacoes.md` |

**Observação:** Os documentos acima permanecerão em `.opencode/plans/` enquanto o
agente estiver em MODO PLAN. A transferência para `C:\MultGestor-Arquitetura\evidencias\consolidacao\`
acontecerá somente em missão separada, fora do modo Plan e mediante autorização
explícita do operador. A Fase 1 não modificará permissões.

**Saída:** `FOTOGRAFIA_ARQUITETURAL_REGISTRADA`

---

### Fase 2 — Blocos arquiteturais

Classificar cada componente encontrado em um dos 4 blocos:

| Bloco | Nome | O que contém |
|-------|------|-------------|
| **PLATFORM_CORE** | Fundação da plataforma | empresas, usuários, auth, tenant, permissões, módulos, planos, assinaturas, billing, logs, eventos, outbox, migrations, health checks |
| **SHARED_CAPABILITIES** | Recursos multi-nicho | agenda, carteira, pacotes, fidelidade, CRM, notificações, e-mail, WhatsApp, arquivos, IA |
| **NICHE_CONTRACTS** | Como o nicho se conecta ao Core | registro de módulo, declaração de permissões, rotas, tenant, eventos, plano, billing, agenda, UI |
| **NICHE_MODULES** | Implementação específica do negócio | BarberGestor, ClimaGestor, futuros nichos |

**Saída:** `MAPA_DE_BLOCOS_APROVADO`

---

### Fase 3 — Matriz de pertencimento

Para cada recurso, responder: pertence à plataforma, a uma capacidade compartilhada
ou ao nicho?

Exemplo ilustrativo:

| Recurso | Estado atual | Destino arquitetural |
|---------|-------------|---------------------|
| JWT | Core | `platform/auth` |
| RLS | Core | `platform/tenant` |
| Billing | Core | `platform/billing` |
| Scheduling utils | Compartilhado | `capabilities/booking` |
| Wallet | Preso ao BarberGestor | `capabilities/wallet` |
| Loyalty | Preso ao BarberGestor | `capabilities/loyalty` |
| Produtos de barbearia | Nicho | `niches/barber` |
| Comissão de barbeiro | Nicho | `niches/barber` |
| ClimaGestor | Nicho incompleto | `niches/clima` |

Esta fase não move arquivos. Apenas define o destino correto.

**Saída:** `MATRIZ_DE_PERTENCIMENTO_APROVADA`

---

### Fase 4 — Contratos do Core

O Core não deve conhecer detalhes internos de nichos. Deve oferecer contratos:

1. **Contrato de tenant** — todo nicho informa `company_id`, `module`, `user_scope`;
   o Core garante autenticação, isolamento e contexto da empresa.

2. **Contrato de módulo** — cada nicho declara:
   ```
   id: barber
   nome: BarberGestor
   permissoes: [...]
   features: [...]
   rotas: [...]
   eventos: [...]
   ```

3. **Contrato de capacidade** — exemplo Booking Engine:
   - Entrada: empresa, recurso atendente, serviço, duração, horário, bloqueios
   - Saída: horários disponíveis, conflitos, reserva criada
   - O motor não precisa saber se o recurso é barbeiro, mecânico ou técnico.

4. **Contrato de eventos** — nicho publica eventos como `booking.created`,
   `customer.created`, `payment.confirmed`. O Core ou integrações reagem.

5. **Contrato de plano** — nicho pergunta "empresa possui feature X?"; Core
   responde "permitido / negado / limite / motivo".

**Saída:** `CONTRATOS_DO_CORE_DEFINIDOS`

---

### Fase 4A — Base Canônica Inicial

Produzir 4 documentos conceituais que orientarão as mudanças técnicas futuras:

| Documento | Conteúdo |
|-----------|----------|
| `CORE-CONSOLIDADO.md` | Estado atual do Core: o que funciona, o que é seguro, o que é experimental |
| `FRONTEIRA-CORE-NICHOS.md` | Fronteira explícita: o que é plataforma, o que é capacidade, o que é nicho |
| `CONTRATOS-DO-CORE.md` | Contratos formais entre Core, capacidades e nichos |
| `MATRIZ-DE-PERTENCIMENTO.md` | Para cada recurso, seu destino arquitetural |

Estes documentos serão criados em `.opencode/plans/` e posteriormente promovidos
para `C:\MultGestor-Arquitetura\01-CORE\` mediante autorização.

**Saída:** `BASE_CANONICA_INICIAL_CRIADA`

---

### Fase 5 — Booking Engine com fronteira

O scheduling-utils.js (229 linhas) é genérico e puro. Mas a VIEW `appointments`
consulta `barber_appointments` (client-booking.sql:180-194).

Arquitetura alvo:

```
BOOKING ENGINE
│
├── regras de disponibilidade
├── cálculo de horários
├── prevenção de conflito
├── bloqueios
├── jornada de trabalho
└── contrato de persistência
          │
          ├── BarberBookingAdapter
          ├── ClimaBookingAdapter
          └── FuturoNichoBookingAdapter
```

O motor define as regras. O adapter do nicho informa onde buscar profissionais,
onde buscar serviços, onde gravar o agendamento e quais campos específicos existem.
Assim o Core não consulta diretamente `barber_appointments`.

**Saída:** `BOOKING_ENGINE_COM_FRONTEIRA_DEFINIDA`

---

### Fase 6 — Roadmap de extração

Capacidades reaproveitáveis ainda alojadas em `/api/barber/`:

1. **Wallet** (prioritário — menor acoplamento)
2. **Packages**
3. **Loyalty**
4. **Anamnesis**
5. **CRM** (maior acoplamento — tabelas com prefixo `barber_`)

Exemplo de transição para Wallet:

```
ANTES:
  /api/barber/wallet
  barber/wallet.service.js

DEPOIS:
  /api/platform/wallet
  shared/capabilities/wallet/
    ├── wallet.service.js
    ├── wallet.repository.js
    ├── wallet.contract.js
    └── wallet.events.js
```

Cada extração é independente e exige autorização separada.

**Saída:** `ROADMAP_DE_EXTRACAO_APROVADO`

---

### Fase 7 — Decompor barber.service.js (MISSÃO B)

O god service (3.831 linhas, 37 funções, SQL inline) não deve ser quebrado em
uma única missão grande. Plano seguro por fatias:

```
barber.service.js
│
├── cash.service
├── collaborators.service
├── services.service
├── products.service
├── suppliers.service
├── sales.service
├── appointments.service
├── reports.service
└── dashboard.service
```

Cada fatia:
1. Escolher um domínio pequeno
2. Criar ou validar o sub-service
3. Preservar o contrato público
4. Migrar apenas um controller
5. Executar testes
6. Comparar respostas antigas e novas
7. Registrar evidência
8. Só então avançar

O facade `barber-core.service.js` (264 linhas) serve como camada de transição.

**Saída:** `BARBER_SERVICE_DECOMPOSTO_PROGRESSIVAMENTE`

---

### Fase 8 — Prova com ClimaGestor (MISSÃO B)

Usar o ClimaGestor como teste de reutilização do Core. Perguntas-chave:
- Usa autenticação do Core?
- Usa tenant do Core?
- Ativa módulo pelo Core?
- Usa permissões do Core?
- Publica eventos pelo Core?
- Usa billing do Core?
- Usa booking sem depender de `barber_appointments`?

Fluxo vertical mínimo:
```
empresa ativa ClimaGestor → usuário autorizado entra → cadastra recurso →
cadastra serviço → realiza agendamento → evento publicado
```

Cada resposta negativa revela uma dependência escondida.

**Saída:** `CORE_MULTI_NICHO_COMPROVADO`

---

### Fase 9 — Validações de produção (MISSÃO C)

Executar as 23 validações pendentes conforme prioridade:

| Prioridade | IDs | Categoria |
|-----------|-----|-----------|
| Alta | VAL-MCP-01,02,06; VAL-CODE-01; VAL-DOC-01-04; VAL-RENDER-01,02 | Imediato |
| Média | VAL-MCP-07; VAL-MCP-03-05; VAL-CODE-02,03; VAL-NICHO-01 | Semana |
| Baixa | VAL-RENDER-03,04; VAL-MCP-08; VAL-NICHO-02,03 | Mensal |

Não bloqueiam a arquitetura documental, mas impedem afirmações de
"produção consolidada" sem comprovação.

**Saída:** `MATRIZ_OPERACIONAL_VALIDADA`

---

### Fase 10 — Consolidação Canônica Final (MISSÃO D)

Após implementações e validações, revisar os documentos para refletir
o estado realmente executado e comprovado.

Estrutura final do cofre:

```
C:\MultGestor-Arquitetura\
├── 00-PAINEL-MESTRE\
│   └── PAINEL-MESTRE.md
│
├── 01-CORE\
│   ├── CORE-CONSOLIDADO.md
│   ├── FRONTEIRA-CORE-NICHOS.md
│   ├── CONTRATOS-DO-CORE.md
│   └── MAPA-DE-CAPACIDADES.md
│
├── 02-NICHOS\
│   ├── BARBERGESTOR.md
│   └── CLIMAGESTOR.md
│
├── 03-ADRS\
│   ├── ADR-BOOKING-ENGINE.md
│   ├── ADR-CAPABILITY-EXTRACTION.md
│   └── ADR-NICHE-CONTRACT.md
│
└── evidencias\
    └── consolidacao\
```

Os relatórios brutos permanecem como evidência histórica. Os documentos canônicos
mostram apenas o estado aprovado.

**Saída:** `DOCUMENTOS_CANONICOS_ATUALIZADOS`

---

## 4. Regra sobre permissões de escrita

A Fase 1 não modificará permissões. Enquanto o agente estiver em MODO PLAN,
os documentos permanecerão em `.opencode/plans/`. A transferência para
`C:\MultGestor-Arquitetura` acontecerá somente em missão separada, fora do
modo Plan e mediante autorização explícita do operador.

---

## 5. Gates de Parada (Missão A)

Ao final de cada gate, pare e apresente:
- arquivos propostos;
- decisões tomadas;
- contradições encontradas;
- riscos identificados;
- itens que dependem de autorização.

| Gate | Fase | Condição de abertura | Apresentar |
|------|------|---------------------|------------|
| **A1** | Fase 1 | 6 documentos de evidência registrados no plano | Caminho + hash de cada doc |
| **A2** | Fase 2 | Blocos arquiteturais definidos e aprovados | Mapa de blocos + classificações |
| **A3** | Fase 3 | Matriz de pertencimento aprovada | Planilha de pertencimento + contradições |
| **A4** | Fase 4 | Contratos do Core definidos | Texto de cada contrato + riscos |
| **A5** | Fase 5 | Booking Engine arquitetado | Diagrama + contratos de adapter |
| **A6** | Fase 6 | Roadmap de extração aprovado | Ordem + dependências + riscos |

**Não avance automaticamente para a MISSÃO B.** A transição entre Missões exige
autorização explícita e independente.

---

## 6. O que não fazer agora

- Não mover rotas
- Não renomear tabelas
- Não quebrar o barber.service.js inteiro
- Não criar novo nicho completo
- Não configurar produção no mesmo trabalho
- Não atualizar todos os documentos antigos de uma vez
- Não modificar permissões
- Não criar branch, commit ou push
- Não executar migration, banco ou deploy
- Não alterar configuração de MCP ou produção

Primeiro desenhar a fronteira. Depois mover o código.

---

## 7. Linha do tempo (Missão A apenas)

| Fase | Duração estimada | Dependências |
|------|-----------------|--------------|
| Fase 1 | 1 sessão | Gate 4 concluído |
| Fase 2 | 1 sessão | Fase 1 concluída |
| Fase 3 | 1-2 sessões | Fase 2 concluída |
| Fase 4 | 2 sessões | Fase 3 concluída |
| Fase 4A | 1-2 sessões | Fase 4 concluída |
| Fase 5 | 1 sessão | Fase 4A concluída |
| Fase 6 | 1 sessão | Fase 5 concluída |

---

## 8. Documentos de evidência já existentes

| Arquivo (em `.opencode/plans/`) | Conteúdo | Bytes |
|--------------------------------|----------|-------|
| `consolidacao-readme.md` | Resumo executivo completo dos 3 terminais | ~11.928 |
| `consolidacao-matriz-evidencias.md` | 40 capacidades classificadas pós-Gate 4 | ~5.128 |
| `consolidacao-objecoes.md` | 7 objeções confirmadas, 5 descartadas | ~2.977 |
| `consolidacao-fronteira-core-nichos.md` | Fronteira Core x capacidades x nichos | ~1.940 |
| `consolidacao-gate-4.md` | Reconciliação com métricas corrigidas | ~2.503 |
| `consolidacao-proximas-validacoes.md` | 23 validações pendentes em 5 categorias | ~2.475 |

**Total:** 6 documentos, ~27 KB

---

## 9. Estado atual do repositório

| Item | Valor |
|------|-------|
| Branch | `docs/sec-booking-rls-001` |
| HEAD | `0d392e6` |
| Arquivos modificados (tracked) | 7 |
| Arquivos não trackeados | 9 |
| Modificações no código | Nenhuma (MODO PLAN respeitado) |
| `C:\MultGestor-Arquitetura` | Fora do Git, não é repositório |

---

## 10. Glossário de termos arquiteturais

| Termo | Definição |
|-------|-----------|
| PLATFORM_CORE | Fundação multi-tenant que não depende de nenhum nicho |
| SHARED_CAPABILITIES | Recursos que vários nichos consomem sem pertencer a nenhum |
| NICHE_CONTRACTS | Interfaces / contratos que um nicho implementa para se conectar ao Core |
| NICHE_MODULES | Implementação concreta de um nicho de negócio |
| CONSOLIDADO | Capacidade com código + teste + deploy + comprovação operacional |
| CONSOLIDADO_LOCALMENTE | Capacidade com código + teste, sem comprovação de produção |
| PARCIAL | Implementação existe mas incompleta |
| EM_EXPERIMENTO | Mock ou interface sem uso real |
| DESCONHECIDO | Evidência insuficiente para classificar |
| AUSENTE | Nenhum código encontrado |
