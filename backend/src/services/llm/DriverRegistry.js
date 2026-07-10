// Portado de tools/joefelipe-agent/src/llm/DriverRegistry.ts (Fase 1 — IA Operacional).
// Sem integração com kernel (o backend do MultGestor não tem esse conceito) —
// só o registro de providers em memória.

class DriverRegistry {
  constructor() {
    this.providers = new Map()
  }

  register(provider) {
    this.providers.set(provider.name, provider)
  }

  get(id) {
    return this.providers.get(id)
  }

  list() {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.name,
      name: p.name,
      model: p.model,
      enabled: true
    }))
  }

  getStatus() {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.name,
      name: p.name,
      model: p.model,
      status: 'active'
    }))
  }

  get total() {
    return this.providers.size
  }
}

module.exports = { DriverRegistry }
