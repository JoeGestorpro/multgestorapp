// Contrato base do LlmService. Portado de
// tools/joefelipe-agent/src/llm/LlmProvider.ts (Fase 1 — IA Operacional).
// LLM propõe, não executa. Nenhuma ação perigosa é executada diretamente.
//
// Um LlmProvider é qualquer objeto com a forma:
//   { name: string, model: string, complete(request): Promise<LlmResponse> }
//
// request: { mode, task, context?, maxTokens?, sessionId? }
// response: { provider, model, mode, text, safety, metadata? }
// safety: { canExecute, requiresHumanApproval, blockedReasons[] }

const LLM_MODES = Object.freeze({
  READ_ONLY: 'READ_ONLY',
  PLAN_ONLY: 'PLAN_ONLY',
  SAFE_WRITE: 'SAFE_WRITE',
  HUMAN_APPROVAL_REQUIRED: 'HUMAN_APPROVAL_REQUIRED',
  EXECUTE_APPROVED: 'EXECUTE_APPROVED',
  LOCKED: 'LOCKED'
})

const LLM_PROVIDER_NAMES = Object.freeze({
  MOCK: 'mock',
  OPENROUTER: 'openrouter',
  NVIDIA: 'nvidia'
})

module.exports = { LLM_MODES, LLM_PROVIDER_NAMES }
