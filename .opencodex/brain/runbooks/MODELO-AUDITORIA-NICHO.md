# Modelo de Auditoria de Nicho — reutilizável

> **Status:** OFICIAL • VIVO — checklist enxuto para auditar QUALQUER nicho (Clima retomado,
> ou um nicho novo) sem reescrever a investigação completa do zero.
> **Origem:** [[../../audits/2026-07-03-core-vs-nicho-audit]] §15
> Não é a auditoria de Core (essa é única e já foi feita); é o roteiro para avaliar um nicho
> específico depois que o Core estiver estável.

## Perguntas obrigatórias por nicho

1. **Auth:** o nicho usa um guard de auth próprio/correto, ou herdou (por engano) o de outro
   módulo? (achado real: `clima.routes.js` usava `requireBarberAdminAuth`)
2. **Motor de agendamento/entidade core:** o nicho reutiliza o contrato genérico (Bookable/Provider,
   quando existir) ou reimplementou o próprio armazenamento?
3. **Rotas:** estão registradas via registry dinâmico ou hardcoded em `server.js`/`App.jsx`?
4. **Ativação:** uma empresa desse nicho tem o módulo ativado automaticamente no registro
   orgânico, ou depende de ação manual do master?
5. **Frontend:** existe pelo menos uma tela funcional (não stub) usando o design-system real
   (não uma cópia de componentes)?
6. **Uso real:** existe pelo menos 1 empresa de verdade usando este módulo em produção? Se não,
   classificar como "esqueleto" e não "nicho pronto" — não inflar o status.
7. **Testes:** existe teste de integração cross-tenant para este nicho especificamente?
8. **Landing/comercial:** existe landing própria ou o nicho depende só da landing genérica
   (que hoje não existe como template)?
9. **Duplicação:** alguma lógica deste nicho já existe em outro nicho de forma quase idêntica?
   Se sim, é candidato a extração para o Core — registrar e não deixar como dívida silenciosa.
10. **Documentação:** `capabilities-map.md` reflete o status real deste nicho (não o aspiracional)?

## Classificação de saída

Usar sempre a mesma escala de evidência das auditorias do MultGestor: **VALIDADO** (produção
real) · **[FATO]** · **[PARCIAL]** · **[HIPÓTESE]** · **[INSUFICIENTE]**. Nunca inflar "scaffold"
para "completo" sem uma empresa real usando.

## Saída esperada

Uma tabela curta (não um documento de 200 linhas) com as 10 respostas acima + 1 recomendação:
continuar / congelar / descontinuar o nicho, e se continuar, o que falta em ordem de bloqueio.
