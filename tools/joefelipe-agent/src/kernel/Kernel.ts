import type { KernelMode, KernelStatus, DispatchRequest, DispatchResult, ComponentStatus } from './types.ts'
import { AgentContextManager } from './AgentContext.ts'
import { PermissionManager } from './Permissions.ts'
import { Registry } from './Registry.ts'
import { DefaultEventBus } from './EventBus.ts'
import { LifecycleManager, createLifecycle } from './Lifecycle.ts'
import type { EventBus } from './EventBus.ts'

export class Kernel {
  readonly context: AgentContextManager
  readonly permissions: PermissionManager
  readonly registry: Registry
  readonly events: EventBus
  readonly lifecycle: LifecycleManager
  readonly version: string
  readonly startedAt: string

  private _health: ComponentStatus[] = []

  constructor(initialMode: KernelMode = 'READ_ONLY') {
    this.context = new AgentContextManager(initialMode)
    this.permissions = new PermissionManager(initialMode)
    this.registry = new Registry()
    this.events = new DefaultEventBus()
    this.lifecycle = createLifecycle()
    this.version = '1.0.0 (Kernel)'
    this.startedAt = new Date().toISOString()
  }

  async initialize(): Promise<void> {
    await this.lifecycle.runBeforeStart()
    await this.lifecycle.runStart()
    this.registerBuiltinComponents()
    await this.lifecycle.runReady()
  }

  private registerBuiltinComponents(): void {
    const now = new Date().toISOString()
    this.registry.register({
      id: 'kernel',
      type: 'tool',
      name: 'Agent Kernel',
      version: this.version,
      status: 'active',
      tags: ['core', 'kernel'],
      metadata: { mode: this.context.getMode() },
      createdAt: now,
      updatedAt: now,
    })
    this.registry.register({
      id: 'mock-provider',
      type: 'provider',
      name: 'MockProvider',
      version: '1.0.0',
      status: 'active',
      tags: ['llm', 'fallback'],
      metadata: { canExecute: false },
      createdAt: now,
      updatedAt: now,
    })
  }

  getStatus(): KernelStatus {
    const perms = this.permissions
    const ctx = this.context.get()
    const mem = ctx.memory

    return {
      health: this.computeHealth(),
      mode: this.context.getMode(),
      lifecycle: this.lifecycle.status,
      mission: {
        current: ctx.missionId,
        title: ctx.missionTitle,
        intent: ctx.intent,
      },
      memory: {
        totalSlots: mem.length,
        recentSlots: Math.min(mem.length, 10),
      },
      registry: {
        total: this.registry.total,
        byType: { ...this.registry.byType },
      },
      permissions: {
        canExecute: perms.canExecute(),
        requiresHumanApproval: perms.requiresHumanApproval(),
      },
      components: [...this._health],
      version: this.version,
      uptime: Date.now() - new Date(this.startedAt).getTime(),
      startedAt: this.startedAt,
      memoryUsage: this.getMemoryUsage(),
    }
  }

  async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    const permission = this.permissions.check('execute', 'llm')

    if (!permission.granted) {
      return {
        success: false,
        kind: request.kind,
        data: null,
        permission,
        error: permission.reason ?? 'Ação não permitida no modo atual',
      }
    }

    this.events.emit('dispatch', { kind: request.kind, timestamp: new Date().toISOString() })

    return {
      success: true,
      kind: request.kind,
      data: { received: true, mode: this.context.getMode() },
      permission,
    }
  }

  async destroy(): Promise<void> {
    await this.lifecycle.shutdown()
  }

  private computeHealth(): KernelStatus['health'] {
    if (this.lifecycle.status === 'error') return 'error'
    if (this.lifecycle.status === 'ready') return 'ready'
    if (this.lifecycle.status === 'starting' || this.lifecycle.status === 'resuming') return 'starting'
    return 'degraded'
  }

  private getMemoryUsage() {
    try {
      const usage = process.memoryUsage()
      return {
        rss: usage.rss,
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
      }
    } catch {
      return null
    }
  }
}

export function createKernel(initialMode: KernelMode = 'READ_ONLY'): Kernel {
  return new Kernel(initialMode)
}
