export type KernelMode =
  | 'READ_ONLY'
  | 'PLAN_ONLY'
  | 'SAFE_WRITE'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'EXECUTE_APPROVED'
  | 'LOCKED'

export type LifecycleStatus = 'starting' | 'ready' | 'paused' | 'resuming' | 'shuttingDown' | 'error'
export type KernelHealth = 'starting' | 'ready' | 'degraded' | 'error'
export type ResourceType = 'filesystem' | 'git' | 'database' | 'network' | 'shell' | 'llm' | 'config' | 'secrets'
export type ActionType = 'read' | 'write' | 'execute' | 'delete' | 'admin'
export type DispatchKind = 'mission' | 'prompt' | 'chat' | 'toolCall' | 'healthCheck' | 'planning'

export interface MemorySlot {
  conversationId: string
  role: 'user' | 'system' | 'assistant'
  content: string
  importance: number
  source: 'user' | 'mission' | 'planner' | 'llm' | 'system'
  timestamp: string
}

export interface KernelContext {
  missionId: string | null
  missionTitle: string | null
  intent: string | null
  startedAt: string | null
  mode: KernelMode
  memory: MemorySlot[]
}

export interface Permission {
  granted: boolean
  action: ActionType
  resource: ResourceType
  reason: string | null
  requiresHumanApproval: boolean
}

export interface RegistryEntry {
  id: string
  type: 'driver' | 'connection' | 'policy' | 'tool' | 'skill' | 'event' | 'provider'
  name: string
  version: string
  status: 'registered' | 'active' | 'error'
  tags: string[]
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ComponentStatus {
  name: string
  status: 'ready' | 'degraded' | 'error' | 'unavailable'
  message?: string
}

export interface DispatchRequest {
  kind: DispatchKind
  payload: unknown
  context?: Partial<KernelContext>
}

export interface DispatchResult {
  success: boolean
  kind: DispatchKind
  data: unknown
  permission: Permission
  error?: string
}

export interface KernelStatus {
  health: KernelHealth
  mode: KernelMode
  lifecycle: LifecycleStatus
  mission: {
    current: string | null
    title: string | null
    intent: string | null
  }
  memory: {
    totalSlots: number
    recentSlots: number
  }
  registry: {
    total: number
    byType: Record<string, number>
  }
  permissions: {
    canExecute: boolean
    requiresHumanApproval: boolean
  }
  components: ComponentStatus[]
  version: string
  uptime: number
  startedAt: string
  memoryUsage: { rss: number; heapUsed: number; heapTotal: number } | null
}

export function defaultKernelContext(): KernelContext {
  return {
    missionId: null,
    missionTitle: null,
    intent: null,
    startedAt: null,
    mode: 'READ_ONLY',
    memory: [],
  }
}

export function defaultPermission(): Permission {
  return {
    granted: false,
    action: 'read',
    resource: 'filesystem',
    reason: null,
    requiresHumanApproval: false,
  }
}
