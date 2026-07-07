import type { LlmProvider, LlmProviderName, ProviderConfig, ProviderStatus } from "./types.ts"
import type { Kernel } from "../kernel/Kernel.ts"

export class DriverRegistry {
  private providers = new Map<LlmProviderName, LlmProvider>()
  private kernel: Kernel | null

  constructor(kernel: Kernel | null = null) {
    this.kernel = kernel
  }

  register(provider: LlmProvider): void {
    this.providers.set(provider.name, provider)
    if (this.kernel) {
      const now = new Date().toISOString()
      this.kernel.registry.register({
        id: `provider-${provider.name}`,
        type: 'provider',
        name: provider.name,
        version: '1.0.0',
        status: 'active',
        tags: ['llm', provider.name],
        metadata: { model: provider.model },
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  get(id: LlmProviderName): LlmProvider | undefined {
    return this.providers.get(id)
  }

  list(): ProviderConfig[] {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.name,
      name: p.name,
      model: p.model,
      enabled: true,
    }))
  }

  getStatus(): ProviderStatus[] {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.name,
      name: p.name,
      model: p.model,
      status: 'active',
    }))
  }

  get total(): number {
    return this.providers.size
  }
}