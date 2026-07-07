import type { RegistryEntry } from './types.ts'

export class Registry {
  private entries = new Map<string, RegistryEntry>()

  register(entry: RegistryEntry): void {
    this.entries.set(entry.id, entry)
  }

  unregister(id: string): void {
    this.entries.delete(id)
  }

  get(id: string): RegistryEntry | undefined {
    return this.entries.get(id)
  }

  listByType(type: RegistryEntry['type']): RegistryEntry[] {
    return Array.from(this.entries.values()).filter((e) => e.type === type)
  }

  list(): RegistryEntry[] {
    return Array.from(this.entries.values())
  }

  setStatus(id: string, status: RegistryEntry['status']): void {
    const entry = this.entries.get(id)
    if (entry) {
      entry.status = status
      entry.updatedAt = new Date().toISOString()
    }
  }

  toArray(): RegistryEntry[] {
    return this.list()
  }

  get total(): number {
    return this.entries.size
  }

  get byType(): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const entry of this.entries.values()) {
      counts[entry.type] = (counts[entry.type] ?? 0) + 1
    }
    return counts
  }

  exists(id: string): boolean {
    return this.entries.has(id)
  }
}
