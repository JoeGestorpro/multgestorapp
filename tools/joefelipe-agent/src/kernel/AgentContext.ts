import type { KernelContext, KernelMode, MemorySlot } from './types.ts'
import { defaultKernelContext } from './types.ts'

export class AgentContextManager {
  private context: KernelContext
  private conversationCounter = 0

  constructor(initialMode: KernelMode = 'READ_ONLY') {
    this.context = defaultKernelContext()
    this.context.mode = initialMode
  }

  get(): KernelContext {
    return { ...this.context, memory: [...this.context.memory] }
  }

  setMission(missionId: string, title: string, intent: string): void {
    this.context.missionId = missionId
    this.context.missionTitle = title
    this.context.intent = intent
    this.context.startedAt = new Date().toISOString()
    this.pushMemory('system', `Missão iniciada: ${title}`, 0.8, 'mission')
  }

  clearMission(): void {
    this.context.missionId = null
    this.context.missionTitle = null
    this.context.intent = null
    this.context.startedAt = null
  }

  pushMemory(role: MemorySlot['role'], content: string, importance = 0.5, source: MemorySlot['source'] = 'system'): void {
    this.conversationCounter++
    const slot: MemorySlot = {
      conversationId: `conv-${this.conversationCounter}`,
      role,
      content,
      importance: Math.max(0, Math.min(1, importance)),
      source,
      timestamp: new Date().toISOString(),
    }
    this.context.memory.push(slot)
  }

  getRecentMemory(n: number): MemorySlot[] {
    return this.context.memory.slice(-n)
  }

  getImportantMemory(threshold = 0.7): MemorySlot[] {
    return this.context.memory.filter((m) => m.importance >= threshold)
  }

  getMemoryBySource(source: MemorySlot['source']): MemorySlot[] {
    return this.context.memory.filter((m) => m.source === source)
  }

  clearMemory(): void {
    this.context.memory = []
  }

  getMode(): KernelMode {
    return this.context.mode
  }

  setMode(mode: KernelMode): void {
    this.context.mode = mode
  }
}
