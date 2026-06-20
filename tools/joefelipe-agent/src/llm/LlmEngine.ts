// Engine central do LLM Core do Agente JoeFelipe.
// Decide qual provider usar, carrega config, garante fallback seguro para mock.
// V2: suporta apenas MockProvider. Providers reais serão adicionados em versões futuras.

import type { LlmRequest, LlmResponse, LlmProviderName } from "./LlmProvider.ts";
import { loadLlmConfig, type LlmConfig } from "./llm-config.ts";
import { MockProvider } from "./providers/MockProvider.ts";

export class LlmEngine {
  private config: LlmConfig;
  private provider: MockProvider; // V2: apenas MockProvider; futuro: LlmProvider

  constructor(config?: LlmConfig) {
    this.config = config ?? loadLlmConfig();
    this.provider = new MockProvider();
  }

  getProviderInfo(): { provider: LlmProviderName; model: string; externalCallsEnabled: boolean } {
    return {
      provider: this.config.provider,
      model: this.config.model,
      externalCallsEnabled: this.config.externalCallsEnabled,
    };
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    try {
      const response = await this.provider.complete(request);
      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        provider: "mock",
        model: "mock-safe-v1",
        mode: request.mode,
        text: `MockProvider (fallback por erro): ${msg}`,
        safety: {
          canExecute: false,
          requiresHumanApproval: true,
          blockedReasons: [`Erro interno no provider: ${msg}`],
        },
        metadata: { fallback: true, error: msg },
      };
    }
  }
}
