## O que foi alterado?

<!-- Descreva brevemente as mudancas -->

## Tipo de mudanca

- [ ] Bug fix
- [ ] Nova feature
- [ ] Refatoracao
- [ ] Infra / CI / DevOps
- [ ] Documentacao

## Checklist

- [ ] `npm test` passa localmente (273+ testes, 0 falhas)
- [ ] Sem `console.log` de debug
- [ ] Nenhum segredo (.env) commitado
- [ ] Se mudou rota — atualizou `barber.routes.js` ou equivalente
- [ ] Se mudou schema — criou migration em `backend/database/`

## Controle de abuso (obrigatório p/ rota nova ou alterada)

- [ ] **Pode gerar abuso?** avaliado
- [ ] **Gera custo?** (banco/compute/integração paga) avaliado
- [ ] **Precisa de rate limit?** aplicado (`createRateLimit`) ou isenção justificada
- [ ] **Precisa de limite por tenant/usuário?** aplicado ou isenção justificada
- [ ] Regra: `.opencodex/rules/route-protection-abuse-control.md`
