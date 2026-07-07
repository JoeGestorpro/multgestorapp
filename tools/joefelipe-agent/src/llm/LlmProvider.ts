// Interfaces do LLM Core plugável do Agente JoeFelipe.
// Define contratos para provedores de LLM: mock, OpenRouter, OpenAI, Anthropic, local.
// Segurança: LLM propõe, não executa. Nenhuma ação perigosa é executada diretamente.

export type LlmMode =
  | "READ_ONLY"
  | "PLAN_ONLY"
  | "SAFE_WRITE"
  | "HUMAN_APPROVAL_REQUIRED"
  | "EXECUTE_APPROVED"
  | "LOCKED";

export type LlmProviderName =
  | "mock"
  | "openrouter"
  | "nvidia"
  | "openai"
  | "anthropic"
  | "local";

export interface LlmRequest {
  mode: LlmMode;
  task: string;
  context?: Record<string, unknown>;
  maxTokens?: number;
  /** Identifica a sessao/conversa de origem — usado pelo RateLimitProvider
   * para isolar a janela deslizante por sessao (Fase 10). Opcional; sem ele,
   * todas as chamadas caem no mesmo bucket "default". */
  sessionId?: string;
}

export interface LlmSafety {
  canExecute: boolean;
  requiresHumanApproval: boolean;
  blockedReasons: string[];
}

export interface LlmResponse {
  provider: LlmProviderName;
  model: string;
  mode: LlmMode;
  text: string;
  safety: LlmSafety;
  metadata?: Record<string, unknown>;
}

export interface LlmProvider {
  name: LlmProviderName;
  model: string;
  complete(request: LlmRequest): Promise<LlmResponse>;
}
