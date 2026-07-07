import type { LlmProvider, LlmProviderName } from "./types.ts"
import { DriverRegistry } from "./DriverRegistry.ts"

export class DriverManager {
  private registry: DriverRegistry
  private config: { activeProvider: LlmProviderName }

  constructor(registry: DriverRegistry, activeProvider: LlmProviderName = "mock") {
    this.registry = registry
    this.config = { activeProvider }
  }

  selectProvider(_taskType?: string): LlmProvider {
    const target = this.config.activeProvider
    const provider = this.registry.get(target)
    if (provider) return provider
    const mock = this.registry.get("mock")
    if (mock) return mock
    throw new Error("Nenhum provider disponivel")
  }
}