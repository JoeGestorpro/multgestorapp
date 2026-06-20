// Configuração segura do LLM Core do Agente JoeFelipe.
// Lê configuração por variável de ambiente, sem secrets, sem chamada externa.
// Segurança primeiro: qualquer configuração inválida cai para mock.

import type { LlmProviderName } from "./LlmProvider.ts";

export interface LlmConfig {
  provider: LlmProviderName;
  model: string;
  externalCallsEnabled: boolean;
}

const VALID_PROVIDERS: ReadonlySet<string> = new Set([
  "mock",
  "openrouter",
  "openai",
  "anthropic",
  "local",
]);

const PROVIDER_MODEL_MAP: Record<string, string> = {
  mock: "mock-safe-v1",
  openrouter: "openrouter-auto-v1",
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4",
  local: "local-model-v1",
};

export function loadLlmConfig(): LlmConfig {
  const rawProvider = (process.env.JOEFELIPE_LLM_PROVIDER ?? "mock").trim().toLowerCase();
  const rawModel = (process.env.JOEFELIPE_LLM_MODEL ?? "").trim();

  let provider: LlmProviderName;
  let model: string;

  if (VALID_PROVIDERS.has(rawProvider)) {
    provider = rawProvider as LlmProviderName;
    model = rawModel || PROVIDER_MODEL_MAP[rawProvider] || "unknown-v1";
  } else {
    provider = "mock";
    model = rawModel || "mock-safe-v1";
  }

  // V2: apenas mock é funcional. Qualquer provider não-mock cai para mock.
  if (provider !== "mock") {
    provider = "mock";
    model = "mock-safe-v1";
  }

  const externalCallsEnabled = false;

  return { provider, model, externalCallsEnabled };
}
