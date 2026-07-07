export type EventHandler = (payload: unknown) => void

export interface EventBus {
  emit(event: string, payload: unknown): void
  on(event: string, handler: EventHandler): void
  off(event: string, handler: EventHandler): void
}

export class DefaultEventBus implements EventBus {
  private handlers = new Map<string, Set<EventHandler>>()

  emit(event: string, payload: unknown): void {
    const set = this.handlers.get(event)
    if (!set) return
    for (const handler of set) {
      try {
        handler(payload)
      } catch {
        /* best-effort: never crashes the kernel */
      }
    }
  }

  on(event: string, handler: EventHandler): void {
    let set = this.handlers.get(event)
    if (!set) {
      set = new Set()
      this.handlers.set(event, set)
    }
    set.add(handler)
  }

  off(event: string, handler: EventHandler): void {
    const set = this.handlers.get(event)
    if (!set) return
    set.delete(handler)
    if (set.size === 0) this.handlers.delete(event)
  }
}
