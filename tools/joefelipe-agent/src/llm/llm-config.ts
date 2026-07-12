import type { LlmProviderName } from "./LlmProvider.ts";
import type { BudgetConfig } from "./providers/BudgetProvider.ts";
import type { RateLimitConfig } from "./providers/RateLimitProvider.ts";
import type { CircuitBreakerConfig } from "./providers/CircuitBreakerProvider.ts";

/** Forma equivalente a LlmSafetyConfig (definida em LlmEngine.ts) — duplicada
 * aqui como estrutura, nao como import, para nao criar dependencia circular
 * entre llm-config.ts e LlmEngine.ts (que ja importa loadLlmConfig daqui). */
export interface LoadedSafetyConfig {
  sessionId?: string;
  budget?: BudgetConfig;
  rateLimit?: RateLimitConfig;
  circuitBreaker?: CircuitBreakerConfig;
}

export interface LlmConfig {
  provider: LlmProviderName;
  model: string;
  externalCallsEnabled: boolean;
  openRouterApiKey?: string;
  openRouterModel?: string;
  nvidiaApiKey?: string;
  nvidiaModel?: string;
}

const VALID_PROVIDERS: ReadonlySet<string> = new Set([
  "mock",
  "openrouter",
  "nvidia",
  "openai",
  "anthropic",
  "local",
]);

const PROVIDER_MODEL_MAP: Record<string, string> = {
  mock: "mock-safe-v1",
  openrouter: "openrouter/auto",
  nvidia: "deepseek-ai/deepseek-v4-flash",
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4",
  local: "local-model-v1",
};

/**
 * Le a env preferida (nome oficial da Fase 9.5) com fallback para o nome
 * legado prefixado JOEFELIPE_ (mantido por compatibilidade com deployments
 * anteriores que ja configuraram essas vars).
 */
function readEnv(preferred: string, legacy: string): string {
  return (process.env[preferred] ?? process.env[legacy] ?? "").trim();
}

export function loadLlmConfig(): LlmConfig {
  // Regra de seguranca (Fase 9.5.1): o provider real NUNCA e escolhido soh pela
  // presenca de uma chave no ambiente. JOEFELIPE_LLM_PROVIDER e a UNICA fonte
  // de decisao explicita — sem ela (env ausente/vazia), o default e sempre
  // "mock", mesmo com OPENROUTER_API_KEY setada. Isso evita que uma variavel
  // de nome generico, ja presente no host por outro motivo, mude o
  // comportamento do agente (e de testes) sem decisao humana.
  const rawProvider = (process.env.JOEFELIPE_LLM_PROVIDER ?? "mock").trim().toLowerCase();
  const rawModel = (process.env.JOEFELIPE_LLM_MODEL ?? "").trim();
  const openRouterApiKey = readEnv("OPENROUTER_API_KEY", "JOEFELIPE_OPENROUTER_API_KEY");
  const openRouterRawModel = readEnv("OPENROUTER_MODEL", "JOEFELIPE_OPENROUTER_MODEL");
  const nvidiaApiKey = readEnv("NVIDIA_API_KEY", "JOEFELIPE_NVIDIA_API_KEY");
  const nvidiaRawModel = readEnv("NVIDIA_MODEL", "JOEFELIPE_NVIDIA_MODEL");

  let provider: LlmProviderName;
  let model: string;
  let externalCallsEnabled = false;

  if (rawProvider === "openrouter") {
    if (openRouterApiKey) {
      provider = "openrouter";
      model = openRouterRawModel || rawModel || PROVIDER_MODEL_MAP.openrouter;
      externalCallsEnabled = true;
    } else {
      provider = "mock";
      model = rawModel || "mock-safe-v1";
      console.warn("[llm-config] JOEFELIPE_LLM_PROVIDER=openrouter mas OPENROUTER_API_KEY ausente. Usando MockProvider.");
    }
  } else if (rawProvider === "nvidia") {
    if (nvidiaApiKey) {
      provider = "nvidia";
      model = nvidiaRawModel || rawModel || PROVIDER_MODEL_MAP.nvidia;
      externalCallsEnabled = true;
    } else {
      provider = "mock";
      model = rawModel || "mock-safe-v1";
      console.warn("[llm-config] JOEFELIPE_LLM_PROVIDER=nvidia mas NVIDIA_API_KEY ausente. Usando MockProvider.");
    }
  } else if (VALID_PROVIDERS.has(rawProvider)) {
    provider = rawProvider as LlmProviderName;
    model = rawModel || PROVIDER_MODEL_MAP[rawProvider] || "unknown-v1";
  } else {
    provider = "mock";
    model = rawModel || "mock-safe-v1";
    console.warn("[llm-config] JOEFELIPE_LLM_PROVIDER invalido (\"" + rawProvider + "\"). Usando MockProvider.");
  }

  return {
    provider,
    model,
    externalCallsEnabled,
    openRouterApiKey: openRouterApiKey || undefined,
    openRouterModel: openRouterRawModel || undefined,
    nvidiaApiKey: nvidiaApiKey || undefined,
    nvidiaModel: nvidiaRawModel || undefined,
  };
}

function readNumberEnv(name: string): number | undefined {
  const raw = (process.env[name] ?? "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Fase 10 (LLM Cost Safety): le os limites de orcamento/rate limit/circuit
 * breaker do ambiente. Cada wrapper (budget/rateLimit/circuitBreaker) so e
 * ativado se as envs relevantes estiverem presentes — sem nenhuma env, o
 * retorno e `{}` e o LlmEngine funciona exatamente como antes da Fase 10
 * (nenhum wrapper aplicado, backward compat).
 */
export function loadSafetyConfig(): LoadedSafetyConfig {
  const sessionId = (process.env.JOEFELIPE_LLM_SESSION_ID ?? "").trim() || undefined;

  const maxTokensPerSession = readNumberEnv("JOEFELIPE_LLM_MAX_TOKENS_PER_SESSION");
  const maxCostPerSession = readNumberEnv("JOEFELIPE_LLM_MAX_COST_PER_SESSION");
  const ratePerToken = readNumberEnv("JOEFELIPE_LLM_RATE_PER_TOKEN");
  const budget: BudgetConfig | undefined =
    maxTokensPerSession !== undefined || maxCostPerSession !== undefined
      ? { maxTokensPerSession, maxCostPerSession, ratePerToken }
      : undefined;

  const maxCalls = readNumberEnv("JOEFELIPE_LLM_RATE_LIMIT_MAX_CALLS");
  const windowMs = readNumberEnv("JOEFELIPE_LLM_RATE_LIMIT_WINDOW_MS");
  const rateLimit: RateLimitConfig | undefined =
    maxCalls !== undefined && windowMs !== undefined ? { maxCalls, windowMs } : undefined;

  const failureThreshold = readNumberEnv("JOEFELIPE_LLM_CIRCUIT_FAILURE_THRESHOLD");
  const resetTimeoutMs = readNumberEnv("JOEFELIPE_LLM_CIRCUIT_RESET_TIMEOUT_MS");
  const circuitBreaker: CircuitBreakerConfig | undefined =
    failureThreshold !== undefined || resetTimeoutMs !== undefined
      ? { failureThreshold, resetTimeoutMs }
      : undefined;

  return { sessionId, budget, rateLimit, circuitBreaker };
}