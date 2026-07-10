// Portado de tools/joefelipe-agent/src/llm/DriverManager.ts (Fase 1 — IA Operacional).

class DriverManager {
  constructor(registry, activeProvider = 'mock') {
    this.registry = registry
    this.activeProvider = activeProvider
  }

  selectProvider() {
    const provider = this.registry.get(this.activeProvider)
    if (provider) return provider
    const mock = this.registry.get('mock')
    if (mock) return mock
    throw new Error('Nenhum provider disponivel')
  }
}

module.exports = { DriverManager }
