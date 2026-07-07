# Fluxos — Navegação por Situação

Em vez de pensar em pastas, pense no que você veio fazer. Escolha seu fluxo abaixo.

---

## FLUXO 1 — Primeira vez no projeto

[[HOME.md]]
  ↓
[[MAPA-DAS-PASTAS.md]] — entende o papel de cada pasta
  ↓
[[GLOSSARIO.md]] — traduz termos desconhecidos
  ↓
[[brain/00-HOME.md]] — visão geral do projeto
  ↓
[[brain/INDEX.md]] — navegação completa por camadas

---

## FLUXO 2 — Corrigir um bug

[[HOME.md]]
  ↓
[[queue/current-task.md]] — vê a missão atual
  ↓
[[brain/01-CURRENT-STATE.md]] — entende o estado do projeto
  ↓
[[rules/auditor-flow.md]] — fluxo de auditoria para correções
  ↓
Arquivos afetados (código) — faz a correção
  ↓
Testes — verifica a correção
  ↓
[[audits/]] — registra auditoria

---

## FLUXO 3 — Criar uma funcionalidade

[[HOME.md]]
  ↓
[[brain/product/README.md]] — Product Brain
  ↓
[[brain/product/prds/README.md]] — PRD Library
  ↓
[[brain/architecture-decisions.md]] — ADRs (decisões arquiteturais)
  ↓
[[brain/technical/README.md]] — Technical Brain (stack e padrões)
  ↓
[[brain/technical/banco.md]] — banco de dados
  ↓
[[brain/technical/backend.md]] — backend
  ↓
[[brain/technical/frontend.md]] — frontend
  ↓
Testes — unitários + integração
  ↓
[[brain/technical/deploy.md]] — deploy
  ↓
[[audits/]] — registra auditoria

---

## FLUXO 4 — Nova IA ou agente

[[HOME.md]]
  ↓
[[CONVENCOES.md]] — regras de contribuição
  ↓
[[rules/]] — regras vinculantes que o agente deve seguir
  ↓
[[templates/]] — modelos de documento para o agente usar
  ↓
[[prompts/]] — comandos prontos para IA
  ↓
[[agents/]] — definições de agentes existentes (referência)
  ↓
[[brain/agents/README.md]] — AI Brain (índice completo)
  ↓
Execução — o agente executa sua missão
  ↓
[[audits/]] — auditoria pós-execução

---

## FLUXO 5 — Deploy / produção

[[HOME.md]]
  ↓
[[ops/playbooks.md]] — playbooks operacionais
  ↓
[[brain/technical/deploy.md]] — estratégia de deploy
  ↓
[[brain/technical/ci-cd.md]] — pipeline de CI/CD
  ↓
[[brain/technical/banco.md]] — migrations (se aplicável)
  ↓
Execução do deploy
  ↓
[[brain/01-CURRENT-STATE.md]] — verifica estado pós-deploy
  ↓
[[audits/]] — auditoria

---

## FLUXO 6 — Auditoria / verificação

[[HOME.md]]
  ↓
[[queue/current-task.md]] — missão que está sendo auditada
  ↓
[[rules/auditor-flow.md]] — fluxo de auditoria
  ↓
[[templates/preflight-check.md]] — checklist de verificação
  ↓
Execução da auditoria
  ↓
[[audits/]] — registra relatório

---

## FLUXO 7 — Segurança

[[HOME.md]]
  ↓
[[brain/technical/seguranca.md]] — política de segurança
  ↓
[[brain/technical/rls.md]] — Row Level Security
  ↓
[[brain/technical/rate-limit.md]] — rate limiting
  ↓
[[rules/route-protection-abuse-control.md]] — proteção de rotas
  ↓
[[brain/security-secrets-rotation.md]] — rotação de secrets
  ↓
[[brain/constitution.md]] — regras de segurança invioláveis (§3)
  ↓
[[audits/]] — registra verificação de segurança

---

> Não encontrou seu fluxo? Comece pelo [[HOME.md]] e navegue pelo [[brain/INDEX.md]].
> Consulte [[brain/KNOWLEDGE-GRAPH.md]] para o mapa completo de relacionamentos entre documentos.
