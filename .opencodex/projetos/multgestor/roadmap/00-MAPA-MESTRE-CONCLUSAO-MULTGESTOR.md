# 🧭 MAPA MESTRE DE CONCLUSÃO DO MULTGESTOR

> **Tipo:** Documento canônico de arquitetura, dependências e sequência de execução.
> **Criado:** 2026-07-10 · **Autoridade superior:** `.opencodex/brain/constitution.md` (declarada vinculante pelo `CLAUDE.md`) · constituição do produto: [[constituicao]] (em conflito, a constituição vence).
> **Relacionados:** [[roadmap/ROADMAP-MESTRE-MULTGESTOR-2026]] · estado vivo em [[status-atual]] · [[mapas/DEPENDENCIAS-MULTGESTOR]] · [[capacidades]]
> **Regra de honestidade:** este documento NÃO afirma que algo está pronto. Ele obriga a auditar a raiz real antes de gerar qualquer plano. O painel de estado (Seção 15) permanece `NÃO AUDITADO` até uma auditoria READ_ONLY consolidada preenchê-lo com evidências.

---

## 1. Identidade do documento

**Nome:** Mapa Mestre de Conclusão do MultGestor
**Tipo:** Documento canônico de arquitetura, dependências e sequência de execução
**Projeto analisado:** MultGestor
**Projeto de governança:** ChatJoe / OpenCodex
**Finalidade:** determinar o que falta, o que depende de quê, o que deve ser concluído primeiro e qual missão pode ser executada em seguida.

Este documento é a referência principal para:

* auditorias do estado atual;
* criação de planos;
* escolha da próxima missão;
* validação de conclusões;
* desenvolvimento do core;
* desenvolvimento da IA operacional;
* integração de WhatsApp;
* integração de pagamentos;
* construção do front-end;
* estruturação do back-end;
* governança do banco de dados;
* criação futura de nichos;
* preparação para produção e escala.

Nenhuma missão deve ser escolhida apenas porque parece interessante ou urgente.
A próxima missão deve ser definida considerando:

1. dependências técnicas;
2. risco para produção;
3. impacto sobre outras funcionalidades;
4. estado real do código;
5. critérios de conclusão;
6. capacidade de reutilização pelo core e pelos nichos.

---

## 2. Regra fundamental

O MultGestor deve ser concluído **de baixo para cima**.

A sequência geral é:

```text
Governança e diagnóstico
        ↓
Segurança e banco de dados
        ↓
Back-end e contratos
        ↓
Front-end estrutural
        ↓
Pagamentos e controle de acesso
        ↓
WhatsApp e canais
        ↓
IA operacional
        ↓
Nichos
        ↓
Observabilidade e escala
        ↓
Liberação comercial
```

Isso significa que uma camada não deve ser considerada operacional se as dependências anteriores ainda estiverem quebradas, incompletas ou sem validação.

Exemplo:

```text
A IA operacional depende de:
- autenticação;
- autorização;
- dados confiáveis;
- ferramentas executáveis;
- WhatsApp;
- filas;
- eventos;
- logs;
- controle de custos;
- aprovação humana;
- segurança multi-tenant.
```

Portanto, não basta a IA conseguir responder no chat. Para ser considerada uma IA operacional real, toda essa cadeia deve estar funcional.

---

## 3. Regra de auditoria obrigatória

Antes de gerar qualquer plano de implementação, o executor deve auditar a raiz real do MultGestor.

O executor **não pode**:

* presumir que uma funcionalidade existe;
* marcar algo como concluído apenas porque existe um arquivo;
* confiar somente em documentos antigos;
* considerar uma interface funcional sem testar o fluxo;
* considerar uma integração pronta usando mocks;
* inventar o estado atual;
* substituir evidências por suposições.

O executor **deve procurar evidências** em:

* código-fonte;
* banco de dados;
* migrations;
* políticas RLS;
* rotas;
* APIs;
* testes;
* configurações;
* variáveis de ambiente;
* workflows de CI;
* serviços de deploy;
* logs;
* documentos canônicos;
* interfaces;
* integrações externas;
* filas;
* workers;
* webhooks;
* contratos entre front-end e back-end.

---

## 4. Estados permitidos

Cada capacidade deve receber somente um destes estados:

| Estado | Significado |
| ------ | ----------- |
| **NÃO EXISTE** | Não foi encontrada implementação real. |
| **DOCUMENTADO** | Existe documentação, PRD, arquitetura ou plano, mas não existe implementação comprovada. |
| **PARCIAL** | Existe implementação, mas faltam partes importantes. |
| **MOCK** | Existe uma simulação, resposta fixa, fake, stub ou comportamento sem integração real. |
| **IMPLEMENTADO NÃO VALIDADO** | A implementação existe, mas ainda não foi validada por testes e evidências suficientes. |
| **VALIDADO EM DESENVOLVIMENTO** | Funciona localmente ou em ambiente de desenvolvimento com testes suficientes. |
| **VALIDADO EM HOMOLOGAÇÃO** | Funciona em ambiente semelhante à produção, com integrações reais ou sandbox. |
| **PRODUÇÃO CONTROLADA** | Está em produção, mas ainda com uso controlado, poucos clientes ou monitoramento reforçado. |
| **PRODUÇÃO ESTÁVEL** | Está operacional, monitorado, documentado e com critérios de recuperação definidos. |
| **BLOQUEADO** | Não pode avançar porque depende de outra capacidade ainda incompleta. |

---

## 5. Critério verdadeiro de conclusão

Uma missão não está concluída apenas porque o código foi criado.

Uma missão só pode ser marcada como concluída quando houver:

* código implementado;
* testes relevantes passando;
* segurança revisada;
* contratos validados;
* erros tratados;
* logs adequados;
* documentação atualizada;
* evidência do funcionamento;
* ausência de regressões conhecidas;
* rollback ou recuperação definidos quando aplicável;
* validação das dependências;
* aprovação humana quando necessária.

Modelo obrigatório:

```text
Implementado: sim/não
Testado: sim/não
Integrado: sim/não
Seguro: sim/não
Documentado: sim/não
Observável: sim/não
Validado no ambiente correto: sim/não
```

Se algum item crítico estiver como "não", a missão continua parcial.

---

## 6. Sequência oficial de conclusão

### FASE 0 — Inventário e diagnóstico real

**Objetivo:** descobrir o estado verdadeiro do MultGestor antes de continuar implementando.

**Auditar:** estrutura do repositório; branches; commits locais; alterações não commitadas; código morto; mocks; testes; dívida técnica; documentação; ambientes; deploys; integrações; banco de dados; variáveis de ambiente; serviços externos; dependências desatualizadas; funcionalidades duplicadas; funcionalidades planejadas, mas não implementadas.

**Entregáveis:** inventário das capacidades; matriz de estado; matriz de dependências; lista de bloqueadores; riscos de produção; mapa de sistemas; backlog consolidado; indicação da próxima missão.

**Saída obrigatória:** nenhuma fase seguinte deve ser planejada com segurança antes desta auditoria.

---

### FASE 1 — Governança, segurança operacional e fluxo de código

**Objetivo:** garantir que o projeto possa ser alterado sem causar danos silenciosos.

**Deve conter:** estratégia de branches; commits escopados; revisão de pull requests; proteção da branch principal; CI obrigatório; lint; testes; análise de secrets; validação de migrations; controle de deploy; ambientes separados; política de rollback; versionamento; changelog; responsáveis e aprovações; classificação de risco das missões.

**Dependências:** nenhuma.
**Bloqueia:** todas as mudanças sensíveis de banco, pagamento, WhatsApp, IA e produção.
**Conclusão:** a fase está concluída quando uma mudança não consegue chegar à produção sem passar pelos gates definidos.

---

### FASE 2 — Banco de dados, multi-tenancy e segurança dos dados

**Objetivo:** garantir que os dados do MultGestor sejam seguros, isolados, recuperáveis e escaláveis.

**Deve conter:** modelo multi-tenant; identificação de organização, empresa ou tenant; usuários e vínculos; papéis e permissões; migrations versionadas; políticas RLS; testes de isolamento entre tenants; integridade referencial; índices; constraints; auditoria de alterações; política de retenção; backups; restauração testada; ambientes separados; dados sensíveis protegidos; política de exclusão; idempotência onde necessária.

**Testes obrigatórios:** usuário do tenant A não acessa tenant B; administrador comum não acessa funções master; migration sobe corretamente; migration possui estratégia de rollback ou recuperação; backup pode ser restaurado; operações críticas geram auditoria; queries principais utilizam índices adequados.

**Dependências:** Fase 1.
**Bloqueia:** back-end confiável; IA com acesso a dados; WhatsApp multiempresa; pagamento por assinatura; nichos reutilizáveis.

---

### FASE 3 — Identidade, autenticação, autorização e governança do dono

**Objetivo:** definir corretamente quem entra, onde entra e o que cada pessoa pode fazer.

**Deve conter:** login; recuperação de senha; gerenciamento de sessão; expiração e renovação; verificação de e-mail quando aplicável; autenticação multifator para acessos sensíveis; usuários; organizações; papéis; permissões; proprietário da conta; colaboradores; operadores; clientes; administrador global; painel master; auditoria de acessos; bloqueio e revogação; fluxo de convite; onboarding.

**Decisão arquitetural** — o MultGestor deve separar claramente:

```text
Identidade do usuário
Organização ou tenant
Produto ou nicho contratado
Plano e permissões
Recursos habilitados
```

Um usuário não deve receber acesso apenas porque conseguiu autenticar.

* A **autenticação** responde: *Quem é você?*
* A **autorização** responde: *O que você pode fazer?*
* A **assinatura** responde: *Quais recursos sua organização contratou?*

**Dependências:** Fases 1 e 2.

---

### FASE 4 — Back-end principal e contratos do core

**Objetivo:** consolidar o cérebro transacional do MultGestor.

**Deve conter:** arquitetura modular; separação entre domínio, aplicação e infraestrutura; contratos de API; validação de entrada; tratamento de erros; autenticação e autorização por rota; serviços do domínio; repositórios; transações; idempotência; paginação; filtros; busca; auditoria; configuração centralizada; rate limiting; jobs; filas; event bus; outbox; dead-letter queue quando aplicável; documentação dos endpoints; testes unitários; testes de integração; testes de contrato.

**Módulos mínimos a auditar:** usuários; organizações; clientes; contatos; agendas; serviços; produtos; vendas; financeiro; assinaturas; notificações; arquivos; configurações; auditoria; integrações; IA; painel master.

**Dependências:** Fases 1, 2 e 3.
**Regra:** o front-end não deve inventar regras de negócio que pertencem ao back-end.

---

### FASE 5 — Front-end estrutural, UI e UX

**Objetivo:** criar uma interface consistente, funcional e ligada aos contratos reais.

**Deve conter:** arquitetura do front-end; roteamento; gerenciamento de sessão; controle de permissões; estados de carregamento; estados vazios; tratamento de erros; formulários; validação; feedback de ações; acessibilidade; responsividade; design system; componentes reutilizáveis; navegação; breadcrumbs; notificações; logs de erro do cliente; integração real com a API; testes dos fluxos críticos.

**Fluxos mínimos:** login; onboarding; seleção de organização; painel principal; cadastro; edição; exclusão controlada; busca; filtros; configurações; permissões; plano; cobrança; WhatsApp; IA operacional; logout; recuperação de erro.

**Regra:** uma tela bonita sem integração real não está concluída. Uma tela funcional, mas confusa, também não está concluída. A conclusão exige:

```text
UI correta
UX compreensível
API real
Permissões corretas
Erros tratados
Fluxo testado
```

**Dependências:** contratos mínimos da Fase 4.

---

### FASE 6 — Gateway de pagamento, assinatura e liberação de acesso

**Objetivo:** transformar o MultGestor em um produto vendável e controlável.

**Deve conter:** produtos; planos; preços; período de teste, se houver; checkout; cobrança; assinatura; renovação; cancelamento; inadimplência; reativação; upgrade; downgrade; cupons, se necessários; notas ou recibos quando aplicável; conciliação; webhooks; assinatura dos webhooks; idempotência; tentativas; logs; auditoria; portal do cliente; controle de acesso por plano; controle de recursos; limites de uso.

**Fluxo correto:**

```text
Cliente escolhe o plano
        ↓
Gateway processa a cobrança
        ↓
Webhook confirmado e validado
        ↓
Assinatura é registrada no MultGestor
        ↓
Recursos do plano são liberados
        ↓
Eventos e auditoria são registrados
```

O front-end não deve liberar acesso apenas porque o usuário voltou da página de pagamento. A autoridade é a confirmação segura do back-end, normalmente por webhook validado.

**Dependências:** banco; autenticação; organizações; back-end; event bus; auditoria; painel do cliente.

---

### FASE 7 — Infraestrutura de WhatsApp e comunicação

**Objetivo:** criar um canal confiável de comunicação para o sistema e para a IA operacional.

**Deve conter:** definição do provedor; credenciais seguras; números; vinculação por tenant; templates; consentimento; opt-in; opt-out; janela de atendimento; webhooks; validação dos webhooks; recebimento de mensagens; envio de mensagens; mídia; estados de entrega; falhas; retries; filas; idempotência; rate limits; histórico; auditoria; custos; fallback; painel de conexão; status do canal; tratamento de desconexão; política de privacidade.

**Separação obrigatória:**

```text
Canal do WhatsApp
        ↓
Normalização da mensagem
        ↓
Event bus ou fila
        ↓
Roteamento
        ↓
Atendimento humano, automação ou IA
        ↓
Resposta
        ↓
Auditoria e métricas
```

A IA não deve conversar diretamente com o provedor sem uma camada intermediária controlada.

**Dependências:** tenants; autenticação; permissões; filas; eventos; logs; auditoria; back-end estável.

**Observação:** a dedução de que o WhatsApp precisa vir antes da IA operacional está correta para os fluxos que usarão WhatsApp. Porém, a IA pode começar a ser construída em ambiente interno antes, desde que suas ferramentas estejam desacopladas dos canais. A ordem correta é:

```text
Construir o núcleo seguro da IA
Construir a infraestrutura do WhatsApp
Conectar a IA ao WhatsApp
Validar a operação integrada
```

Não se deve construir toda a inteligência da IA dentro da integração do WhatsApp.

---

### FASE 8 — Núcleo da IA operacional do core

**Objetivo:** criar uma IA reutilizável pelo MultGestor e por todos os nichos.

**Deve conter:** provedor de LLM; abstração de modelos; política de fallback; controle de custos; limites por tenant; contexto; memória permitida; ferramentas; catálogo de ações; permissões das ferramentas; aprovação humana; modo somente leitura; modo de sugestão; modo de execução; logs; auditoria; rastreabilidade; proteção contra prompt injection; proteção de dados; isolamento por tenant; timeout; retries; tratamento de indisponibilidade; avaliação de respostas; métricas de qualidade; prevenção de ações duplicadas; versionamento de prompts; histórico de decisões; bloqueio de ações críticas.

**Modos recomendados:**

* **READ_ONLY** — a IA consulta e explica, mas não altera dados.
* **SUGGEST** — a IA propõe uma ação e aguarda aprovação.
* **APPROVAL_REQUIRED** — a IA prepara a ação, mas uma pessoa precisa aprovar.
* **AUTO_LIMITED** — a IA executa somente ações previamente autorizadas e de baixo risco.

**Ferramentas possíveis:** consultar cliente; consultar agenda; criar sugestão de agendamento; enviar mensagem; preparar cobrança; gerar resumo; classificar lead; responder dúvida; criar tarefa; registrar atendimento; escalar para humano; consultar estoque; emitir alerta; acompanhar pagamento.

**Regra crítica:** a IA nunca deve receber acesso irrestrito ao banco. Ela deve operar por ferramentas e serviços controlados:

```text
IA
 ↓
Tool autorizada
 ↓
Serviço do domínio
 ↓
Política de permissão
 ↓
Banco ou integração
```

**Dependências:** fases de banco; autenticação; autorização; back-end; eventos; filas; auditoria; observabilidade; controle de custos.

---

### FASE 9 — Integração IA + WhatsApp + operação humana

**Objetivo:** transformar a IA em um operador real dos canais.

**Deve conter:** roteamento das mensagens; identificação do tenant; identificação do contato; histórico; intenção; contexto; regras do negócio; resposta; uso de ferramentas; aprovação; transferência para humano; timeout; fallback; fila de atendimento; prioridade; controle de duplicidade; monitoramento; bloqueio; encerramento; avaliação do atendimento; custos; privacidade.

**Fluxo esperado:**

```text
Mensagem recebida
        ↓
Webhook validado
        ↓
Mensagem normalizada
        ↓
Tenant e contato identificados
        ↓
Política de atendimento carregada
        ↓
IA analisa a intenção
        ↓
IA responde ou solicita ferramenta
        ↓
Permissão é validada
        ↓
Ação é executada ou enviada para aprovação
        ↓
Resposta é enviada
        ↓
Tudo é auditado
```

**Dependências:** Fases 7 e 8.

---

### FASE 10 — Painel Master e governança do proprietário

**Objetivo:** permitir que o proprietário do MultGestor controle o negócio e a plataforma.

**Deve conter:** visão de clientes; visão de tenants; assinaturas; faturamento; inadimplência; planos; uso por recurso; uso de IA; custos de IA; uso de WhatsApp; falhas; integrações; saúde do sistema; deploys; filas; jobs; webhooks; logs; incidentes; segurança; auditorias; feature flags; bloqueio de tenant; suporte; impersonação segura, se realmente necessária; trilha de auditoria; gestão dos nichos; gestão de planos; gestão de capacidades; visão dos ambientes; alertas operacionais.

**Dependências:** pode ser construído parcialmente ao longo das fases, mas somente será considerado completo quando os módulos reais fornecerem dados confiáveis.

---

### FASE 11 — Consolidação do core reutilizável

**Objetivo:** separar claramente o que pertence ao MultGestor Core e o que pertence aos nichos.

**Core reutilizável:** autenticação; usuários; tenants; permissões; pagamentos; assinaturas; notificações; WhatsApp; arquivos; agenda base; clientes; auditoria; observabilidade; integrações; IA operacional; filas; eventos; feature flags; painel master; configuração; suporte.

**Nicho:** terminologia específica; fluxos específicos; regras específicas; relatórios específicos; formulários específicos; automações específicas; ferramentas específicas da IA; integrações específicas; experiência visual específica.

**Regra:** nenhum nicho deve copiar partes do core. O nicho deve:

```text
Herdar
Configurar
Estender
Especializar
```

Ele não deve duplicar autenticação, cobrança, WhatsApp, auditoria ou IA.

---

### FASE 12 — Criação e validação dos nichos

**Objetivo:** criar produtos específicos sobre o core validado.

**Para cada nicho:**

1. diagnóstico;
2. PRD;
3. MVP;
4. arquitetura;
5. jornadas;
6. rotas;
7. telas;
8. botões;
9. regras;
10. modelo de dados adicional;
11. integrações;
12. capacidades herdadas;
13. capacidades específicas;
14. ferramentas da IA;
15. testes;
16. plano de lançamento;
17. indicadores.

**Primeiro nicho recomendado:** o **BarberGestor** pode funcionar como nicho-piloto, porque permite validar: agenda; clientes; serviços; profissionais; comissão; caixa; pagamentos; WhatsApp; lembretes; confirmações; IA atendente; relatórios; assinatura. O BarberGestor não deve receber uma arquitetura paralela. Ele deve provar que o core realmente é reutilizável.

---

### FASE 13 — Observabilidade, confiabilidade e recuperação

**Objetivo:** saber quando algo falha, por que falhou e como recuperar.

**Deve conter:** logs estruturados; métricas; traces; monitoramento; alertas; health checks; status de dependências; filas monitoradas; dead-letter queues; erros de webhook; erros do front-end; erros do back-end; erros da IA; custos; latência; taxa de sucesso; disponibilidade; SLOs; SLIs; runbooks; gestão de incidentes; backup; restore; disaster recovery; post-mortem.

**Dependências:** deve nascer desde as primeiras fases, mas recebe consolidação antes da escala.

---

### FASE 14 — Segurança ofensiva e validação final

**Objetivo:** tentar quebrar o sistema antes que clientes ou atacantes façam isso.

**Deve conter:** revisão de autenticação; revisão de sessão; revisão de autorização; testes multi-tenant; pentest de APIs; validação de RLS; revisão de secrets; revisão de dependências; revisão de uploads; revisão de webhooks; revisão de pagamentos; revisão do WhatsApp; revisão da IA; prompt injection; data exfiltration; abuso de ferramentas; rate limiting; brute force; CSRF quando aplicável; XSS; SQL injection; SSRF; validação de CORS; headers; política de conteúdo; vulnerabilidades da cadeia de dependências.

---

### FASE 15 — Performance, capacidade e escala

**Objetivo:** preparar o sistema para crescer sem colapsar.

**Deve conter:** testes de carga; testes de stress; capacidade por plano; conexões de banco; cache; filas; workers; processamento assíncrono; otimização de queries; índices; CDN; armazenamento; mídia; limites do provedor; rate limits; custo por tenant; custo por mensagem; custo por execução da IA; custo de banco; custo de front-end; custo de back-end; estratégia de upgrade dos serviços; autoscaling quando aplicável; isolamento de cargas pesadas.

**Regra:** escala não significa apenas aguentar mais usuários. Significa:

```text
Mais usuários
Sem perda de segurança
Sem aumento descontrolado de custos
Sem degradação invisível
Sem mistura de dados
Sem filas travadas
Sem pagamentos inconsistentes
```

---

### FASE 16 — Homologação e lançamento controlado

**Objetivo:** validar o produto inteiro antes da abertura comercial ampla.

**Deve conter:** ambiente de homologação; dados de teste; gateway em sandbox; WhatsApp de teste; IA com limites; testes ponta a ponta; testes de regressão; checklist de segurança; checklist de banco; checklist de UX; checklist de pagamento; checklist de integrações; checklist de observabilidade; checklist de rollback; aceite; piloto com poucos usuários; acompanhamento próximo; coleta de feedback; correções; liberação progressiva.

---

## 7. Grafo principal de dependências

```text
Governança
    ↓
Banco seguro e multi-tenant
    ↓
Autenticação e autorização
    ↓
Back-end do core
    ↓
Contratos de API
    ↓
Front-end funcional
    ↓
Pagamentos e entitlement
    ↓
Eventos, filas e jobs
    ↓
WhatsApp
    ↓
Núcleo da IA operacional
    ↓
IA conectada ao WhatsApp
    ↓
Core reutilizável consolidado
    ↓
Nichos
    ↓
Homologação
    ↓
Produção controlada
    ↓
Escala
```

Algumas capacidades podem avançar em paralelo, mas nunca devem ignorar as dependências. Exemplo de paralelismo seguro:

```text
Design system do front-end
Documentação do gateway
Arquitetura da IA
Escolha do provedor de WhatsApp
```

Essas atividades podem ser planejadas em paralelo. Porém, a ativação real depende das camadas anteriores.

---

## 8. Matriz de dependências críticas

| Capacidade         | Depende principalmente de                                     |
| ------------------ | ------------------------------------------------------------- |
| Front-end real     | Contratos do back-end, autenticação e permissões              |
| Pagamentos         | Organizações, usuários, planos, webhooks, auditoria           |
| WhatsApp           | Tenants, eventos, filas, webhooks, logs e permissões          |
| IA operacional     | Dados confiáveis, ferramentas, permissões, auditoria e custos |
| IA no WhatsApp     | WhatsApp operacional e núcleo de IA seguro                    |
| Nichos             | Core reutilizável e contratos estáveis                        |
| Escala             | Observabilidade, performance, filas, custos e segurança       |
| Produção comercial | Pagamento, suporte, segurança, backup e recuperação           |
| Painel Master      | Dados reais de todos os módulos                               |
| Automação autônoma | Aprovação, ferramentas seguras, logs e limites                |

---

## 9. Como escolher a próxima missão

1. **Auditar o estado** — verificar o código e classificar cada capacidade.
2. **Identificar bloqueadores** — descobrir quais capacidades incompletas impedem várias outras.
3. **Calcular a prioridade arquitetural** — priorizar primeiro aquilo que: desbloqueia mais capacidades; reduz maior risco; protege produção; evita retrabalho; consolida o core; possui dependências já atendidas.
4. **Escolher uma missão pequena e concluível** — a missão deve ter escopo claro.
   * Exemplo ruim: `Concluir WhatsApp.`
   * Exemplo correto: `Implementar e validar a recepção idempotente de webhooks do provedor de WhatsApp, com verificação de assinatura, persistência segura, logs sanitizados e testes de integração.`
5. **Definir critérios de entrada** — o que precisa existir antes da missão começar.
6. **Definir critérios de saída** — quais evidências demonstrarão que a missão foi concluída.
7. **Gerar plano** — somente depois da auditoria e da escolha da missão.
8. **Executar** — a execução deve seguir o plano aprovado.
9. **Auditar a execução** — um plano de auditoria deve validar o resultado.
10. **Atualizar este mapa** — a matriz de estado deve ser atualizada com as evidências produzidas.

---

## 10. Formato obrigatório da auditoria do estado atual

**10.1 Resumo executivo** — estado geral; riscos críticos; maiores bloqueadores; módulos avançados; módulos incompletos; próxima fase recomendada.

**10.2 Matriz de capacidades**

| ID | Capacidade | Estado | Evidência | Dependências | Bloqueadores | Próxima ação |
| -- | ---------- | ------ | --------- | ------------ | ------------ | ------------ |

**10.3 Achados por camada** — governança; banco; segurança; back-end; front-end; UI/UX; pagamento; WhatsApp; IA; painel master; core; nichos; observabilidade; deploy; escala.

**10.4 Lista de mocks** — todo mock encontrado deve ser documentado.

**10.5 Lista de riscos** — P0: risco imediato para produção, dados, segurança ou dinheiro; P1: bloqueador estrutural; P2: falha funcional relevante; P3: melhoria; P4: evolução futura.

**10.6 Dependências externas** — para cada serviço: nome; finalidade; ambiente; plano; limites; credenciais configuradas; status da integração; riscos; custo; fallback.

**10.7 Próxima missão recomendada** — nome da missão; justificativa; dependências; arquivos envolvidos; riscos; testes; critérios de conclusão; impacto; o que ela desbloqueia.

---

## 11. Prompt oficial para auditar e atualizar o mapa

> Execute uma auditoria READ_ONLY na raiz real do projeto MultGestor.
> Use o arquivo `00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md` como referência canônica de sequência, dependências e critérios de conclusão.
>
> **Objetivos:** (1) descobrir o estado real de cada fase; (2) não confiar somente na documentação; (3) inspecionar código, banco, migrations, testes, integrações, configurações, CI e deploy; (4) classificar cada capacidade usando somente os estados permitidos; (5) identificar mocks, stubs, funcionalidades parciais e documentação sem implementação; (6) mapear dependências e bloqueadores; (7) identificar riscos P0, P1, P2, P3 e P4; (8) determinar qual é a próxima missão correta segundo a arquitetura; (9) produzir evidências; (10) não alterar nenhum arquivo durante a auditoria.
>
> **Regras:** não executar deploy; não fazer push; não criar migration; não alterar banco; não modificar código; não instalar dependências; não expor secrets; não inventar resultados; não marcar uma capacidade como concluída apenas porque existe código; diferenciar implementação, validação e produção; apontar claramente qualquer limitação da auditoria.
>
> **Entregue:** resumo executivo; matriz de fases; matriz de capacidades; mapa de dependências; bloqueadores; riscos; mocks; lacunas; ordem recomendada das próximas missões; especificação detalhada da próxima missão; evidências por arquivo, teste, rota, migration ou configuração.

---

## 12. Prompt oficial para gerar o plano da próxima missão

> Leia: (1) `00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md`; (2) o relatório de auditoria mais recente; (3) os documentos canônicos relacionados à capacidade escolhida.
>
> Gere um plano de execução **somente para a próxima missão recomendada**. O plano deve conter: problema; contexto; estado atual; objetivo; escopo; fora de escopo; dependências; pré-condições; arquitetura; arquivos que serão analisados; arquivos que poderão ser alterados; contratos envolvidos; banco de dados; segurança; back-end; front-end; testes; logs; observabilidade; rollback; riscos; critérios de aceitação; critérios de conclusão; evidências esperadas; atualização documental necessária.
>
> Não execute a missão. Não aumente o escopo. Não misture múltiplas fases independentes. Caso a missão ainda esteja bloqueada, não gere uma implementação fictícia — explique o bloqueio e recomende a missão anterior necessária.

---

## 13. Prompt oficial para executar uma missão aprovada

> Leia o plano aprovado e execute somente o escopo autorizado.
>
> **Antes de alterar qualquer arquivo:** (1) verifique o estado do Git; (2) identifique alterações preexistentes; (3) não sobrescreva trabalho alheio; (4) confirme as dependências da missão; (5) registre os riscos; (6) execute de forma incremental.
>
> **Durante a execução:** não ampliar escopo; não realizar deploy sem autorização; não realizar push sem autorização; não alterar produção; não expor secrets; preservar compatibilidade; criar ou atualizar testes; tratar erros; criar logs adequados; manter isolamento multi-tenant; respeitar os contratos; documentar decisões relevantes.
>
> **Ao finalizar:** executar testes; executar lint; executar verificações de segurança aplicáveis; mostrar os arquivos alterados; mostrar evidências; listar pendências; informar o que foi desbloqueado; gerar um relatório para a auditoria pós-execução; não marcar como concluído o que não foi comprovado.

---

## 14. Prompt oficial para auditar uma missão executada

> Audite a missão executada comparando: plano aprovado; diff produzido; testes; critérios de aceitação; critérios de conclusão; dependências; segurança; comportamento real.
>
> **Verifique:** (1) se o escopo foi respeitado; (2) se houve alterações não autorizadas; (3) se os testes são suficientes; (4) se existem regressões; (5) se os logs são seguros; (6) se há vazamento de dados; (7) se o isolamento multi-tenant foi preservado; (8) se os erros foram tratados; (9) se os contratos foram respeitados; (10) se a documentação foi atualizada; (11) se existe rollback ou recuperação; (12) se a missão pode realmente ser marcada como concluída.
>
> **Resultado permitido:** APROVADA; APROVADA COM RESSALVAS; REPROVADA; BLOQUEADA POR FALTA DE EVIDÊNCIA.

---

## 15. Painel de estado a ser mantido neste documento

> ✅ **Painel preenchido pela auditoria READ_ONLY de 2026-07-10** · 🔄 **Revisado pela missão 12.1A em 2026-07-16** (`4c8ce847`).
>
> ⚠️ **A decomposição factual por capacidade migrou para [[../matriz-consolidacao-core]]** (missão 12.1A): 20 blocos, IDs estáveis, proveniência e severidade P0–P4. **Este painel é resumo por fase; a matriz prevalece** em conflito sobre estado de capacidade.
>
> - **Relatório/evidências:** [[2026-07-10-auditoria-readonly-mapa-mestre]] · matriz 12.1A (ANEXOS A–G).
> - **Escopo auditado:** análise estática do repositório local + **suíte unitária executada** na 12.1A (53 suítes / 765 testes / 100% passando, 2026-07-16).
> - **Limitações (12.1A):** produção **NÃO** verificada — MCP Supabase retornou `Unauthorized`; CI **não** executado (só lido); testes de integração **não** executados localmente; config do Render **não** inspecionável. Ver ANEXO B da matriz.
> - **Nível de confiança:** ALTO para estrutura/código; **NENHUMA verificação própria de produção** nesta revisão.
> - **Correções factuais aplicadas em 2026-07-16:** 2 linhas deste painel estavam incorretas (Fases 1 e 2) — ver notas na tabela.
> - **Regra de reauditoria:** reavaliar a cada missão APPROVE e sempre que o código de uma fase mudar; um estado sem reauditoria após mudança relevante deve ser tratado como desatualizado.

| Fase                  | Estado atual | Evidência principal | Bloqueador | Próxima ação |
| --------------------- | ------------ | ------------------- | ---------- | ------------ |
| 0. Diagnóstico        | VALIDADO EM DESENVOLVIMENTO | Relatório 2026-07-10 | — | Manter painel sincronizado |
| 1. Governança         | PRODUÇÃO CONTROLADA | `.github/workflows/{ci,deploy,security-audit}.yml` | 🔄 **~~14 commits unpushed~~ RESOLVIDO** (D-06): `main` 0/0 = `4c8ce847`; **0 PRs abertas**. Bloqueador real: **`DATAOPS-002` = `NÃO_COMPROVADO`** (OPS-MIGRATIONS-01, 2026-07-16) — asserção sem evidência (`3b417a9`), contradita por 3 fontes; painel/logs/banco `NÃO_VERIFICADO`. **`DATAOPS-001`: job existe mas NÃO é bloqueante** (`continue-on-error`; `needs:` decorativo). **Risco de drift repo × prod: NÃO MENSURADO** | **`ops/migrations-02-evidencia-painel`** — ⚠️ **exige humano** (~10min): painel/logs do Render + `SELECT … FROM schema_migrations` |
| 2. Banco e RLS        | PRODUÇÃO CONTROLADA | migrations 024-029; `config/database.js:129` `tenantAwareConnect`; `tests/integration/tenant-isolation-rls.test.js`; CI cria role `app_runtime` NOBYPASSRLS real | 🔄 **~~writes via `pool.connect` podem bypassar (P1-a)~~ RESOLVIDO** (D-02) em `02c5396`, em `main`. Lacuna real: **cobertura de RLS em prod não verificada** (P2, `TENANT-003`) | Inventário de RLS **consultado no banco** (requer acesso read-only) |
| 3. Identidade         | VALIDADO EM DESENVOLVIMENTO | `auth.routes.js`, `auth.service.js`, migration 030 | MFA ausente | Backlog MFA acessos sensíveis |
| 4. Back-end           | VALIDADO EM DESENVOLVIMENTO | `services/*`, outbox/UoW/event-bus, `rate-limit.middleware.js` | — | Documentar contratos (OpenAPI) |
| 5. Front-end          | PRODUÇÃO CONTROLADA | `frontend/src/services/api.js` (VITE_API_URL real) | — | Cobrir fluxos plano/cobrança |
| 6. Pagamentos         | IMPLEMENTADO NÃO VALIDADO | `billing-manager.js` (assinatura+idempotência+outbox); providers kiwify/abacatepay; gating **já genérico** (`utils/planFeatures.js`, D-04) | config prod (plans/produtos/env, D-016) — **P2** | 🔄 **~~PRÓXIMA MISSÃO~~ reavaliada → 4º no backlog** da matriz. Pré-condição `release/push-p0-batch` **já satisfeita** (D-06); pré-requisito "generalizar gating" **não existe** (D-04) |
| 7. WhatsApp           | PARCIAL / MOCK em prod | `whatsapp-resolver.js` (default mock); `whatsapp-provider.js` | sem token cifrado por tenant | Onboarding credenciais por tenant |
| 8. IA Core            | PARCIAL | `services/llm/LlmService.js` (providers reais + budget/rate/circuit + gate); migration 031; `barber-ai.routes.js` | sem catálogo de ferramentas c/ permissão | Definir tool-calling gated |
| 9. IA + WhatsApp      | BLOQUEADO | Depende das fases 7 (mock) e 8 (sem tools) | Fases 7 e 8 | Concluir 7 e 8 |
| 10. Painel Master     | VALIDADO EM DESENVOLVIMENTO | `master.routes.js`, `master-finance.service.js`, `pages/master` | custo IA/WhatsApp parcial | Consolidar métricas reais |
| 11. Core reutilizável | PARCIAL | `shared/capabilities/*`, `integrations/*`; audit 52/100; D-017 | registry dinâmico de rotas (P1) | Decidir D-005 (ClimaGestor) |
| 12. Nichos            | PARCIAL | BarberGestor completo; ClimaGestor scaffold | — | Provar reuso via 2º nicho |
| 13. Observabilidade   | PARCIAL | Sentry, `appLogger`, `/api/health/deep`, outbox retry+DLQ | sem alertas/SLO formais | Alertas operacionais |
| 14. Segurança final   | PARCIAL | XSS fechado, RLS, rate-limits, `npm audit` 13/14 | sem pentest formal | Pentest pós-estabilização |
| 15. Escala            | NÃO EXISTE (inicial) | `barber-services.perf.test.js` | sem métricas reais | Load/stress test futuros |
| 16. Homologação       | BLOQUEADO | sem workflow/env de staging | Fases anteriores + staging | Criar ambiente de homologação |

---

## 16. Primeira ação recomendada

> ✅ **A ação original desta seção foi CUMPRIDA.** A auditoria READ_ONLY e a matriz real de capacidades existem: [[../matriz-consolidacao-core]] (missão 12.1A, 2026-07-16, commit `4c8ce847`) — 20 blocos, IDs estáveis, proveniência, severidade e dependências sem ciclos.

**Texto original (cumprido):** *"Executar uma auditoria arquitetural READ_ONLY da raiz atual do MultGestor e preencher a matriz real de capacidades e dependências (Seção 15)."*

### O que a auditoria respondeu

- **Concluído:** fundação multi-tenant (`TENANT-001/002`), pools (`CONFIG-001`), gating de plano (`FEATURE-001`), guard de módulo (`ACCESS-001`), outbox/contratos (`EVENT-001/002`), respostas/erros (`CONTRACT-001/003`), booking-utils (`DOMAIN-001`).
- **Parcial/reestruturação:** motor de booking (`DOMAIN-002`, **P1**), kit de nicho (`NICHEKIT-001`, **P1**), escopo de auth (`IDENT-002`, P2).
- **Mock/aspiracional:** Automation Engine, AI Operational Layer, N8N Bridge, Omnichannel — **não existem**; não usar em plano (ANEXO C).
- **Risco:** **`DATAOPS-002` = `NÃO_COMPROVADO`** (P1) — a rede de segurança que justifica o `continue-on-error` foi **afirmada sem evidência** pelo commit `3b417a9` e é **contradita por 3 fontes** do projeto. **Consequência registrada:** risco de **drift entre as migrations do repositório e o banco de produção** — hoje **NÃO MENSURADO** (já ocorreu 2×: `022`, `023`). Ver ANEXO D da matriz e [[../../auditorias/multgestor/2026-07-16-ops-migrations-01]].
- **Marcos:** *Core Consolidado v1* e *Multi-nicho* — **ambos NÃO ATINGIDOS** (ANEXO G).

### Próxima ação

> **`ops/migrations-02-evidencia-painel`** — ⚠️ **exige um humano, não um agente** (~10 min).
>
> 🔄 A missão anterior (`ops/verificar-aplicacao-migrations-producao`) **foi executada** em 2026-07-16 como **OPS-MIGRATIONS-01** e **não resolveu a incógnita — por falta de acesso, não de método**: painel/logs do Render inacessíveis (sem sessão Chrome; **login é vedado ao agente**), MCP Supabase `Unauthorized`, CLI ausente. `/api/health/deep` confirmou produção no ar, mas **não expõe `schema_migrations`**. Sem `render.yaml`, **o repositório é estruturalmente incapaz de responder**.
>
> **Os 3 passos:** (1) painel → `Build/Pre-Deploy/Start Command` (⚠️ free tier **não tem** Pre-Deploy → só Build); (2) log do último deploy → procurar `[migrate] banco alvo:` / `[ok]` / `[skip]`; (3) `SELECT version, name, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 10;` — **se `20260708_031` faltar, o drift está confirmado e ativo**.
>
> Especificação completa em [[../matriz-consolidacao-core]] §Próxima Missão · relatório em [[../../auditorias/multgestor/2026-07-16-ops-migrations-01]].

⚠️ **Não é mais a Fase 6.** Pagamentos foi reavaliada e caiu para 4º: sua pré-condição declarada já está satisfeita (D-06) e o pré-requisito de gating não existia (D-04) — mas perde para uma verificação P1 que custa uma inspeção.

---

## 17. Regra final

Este documento é o mapa. A auditoria mostra onde o projeto está. O plano define o próximo caminho. A execução percorre esse caminho. A auditoria pós-execução confirma se o destino foi alcançado. Nenhuma dessas etapas deve substituir a outra.

```text
MAPA
  ↓
AUDITORIA
  ↓
PRIORIDADE
  ↓
PLANO
  ↓
APROVAÇÃO
  ↓
EXECUÇÃO
  ↓
TESTES
  ↓
AUDITORIA FINAL
  ↓
ATUALIZAÇÃO DO MAPA
  ↓
PRÓXIMA MISSÃO
```

**Sobre WhatsApp × IA:** o WhatsApp é dependência da IA operacional *quando ela precisa atender por WhatsApp*. Mas existem duas construções diferentes — o **núcleo da IA operacional** (ferramentas, permissões, memória, custos, segurança e aprovação) e o **canal WhatsApp** (envio, recebimento, webhooks, filas, templates e histórico). Eles podem ser desenvolvidos parcialmente em paralelo, mas a operação completa só existe quando os dois são integrados sobre um back-end e banco confiáveis.
