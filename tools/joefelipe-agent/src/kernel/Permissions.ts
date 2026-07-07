import type { KernelMode, Permission, ActionType, ResourceType } from './types.ts'
import { defaultPermission } from './types.ts'

const MODE_PERMISSIONS: Record<KernelMode, { execute: boolean; humanApproval: boolean }> = {
  READ_ONLY: { execute: false, humanApproval: false },
  PLAN_ONLY: { execute: false, humanApproval: false },
  SAFE_WRITE: { execute: true, humanApproval: false },
  HUMAN_APPROVAL_REQUIRED: { execute: true, humanApproval: true },
  EXECUTE_APPROVED: { execute: true, humanApproval: false },
  LOCKED: { execute: false, humanApproval: false },
}

const MODE_ACTION_MATRIX: Record<KernelMode, { action: ActionType; resource: ResourceType }[]> = {
  READ_ONLY: [
    { action: 'read', resource: 'filesystem' },
    { action: 'read', resource: 'git' },
    { action: 'read', resource: 'database' },
    { action: 'read', resource: 'llm' },
  ],
  PLAN_ONLY: [
    { action: 'read', resource: 'filesystem' },
    { action: 'read', resource: 'git' },
    { action: 'read', resource: 'database' },
    { action: 'read', resource: 'llm' },
    { action: 'execute', resource: 'llm' },
  ],
  SAFE_WRITE: [
    { action: 'read', resource: 'filesystem' },
    { action: 'read', resource: 'git' },
    { action: 'read', resource: 'database' },
    { action: 'read', resource: 'llm' },
    { action: 'execute', resource: 'llm' },
    { action: 'write', resource: 'git' },
    { action: 'write', resource: 'config' },
  ],
  HUMAN_APPROVAL_REQUIRED: [
    { action: 'read', resource: 'filesystem' },
    { action: 'read', resource: 'git' },
    { action: 'read', resource: 'database' },
    { action: 'read', resource: 'llm' },
    { action: 'execute', resource: 'llm' },
    { action: 'write', resource: 'git' },
    { action: 'execute', resource: 'git' },
    { action: 'admin', resource: 'git' },
  ],
  EXECUTE_APPROVED: [
    { action: 'read', resource: 'filesystem' },
    { action: 'read', resource: 'git' },
    { action: 'read', resource: 'database' },
    { action: 'read', resource: 'llm' },
    { action: 'execute', resource: 'llm' },
    { action: 'write', resource: 'git' },
    { action: 'execute', resource: 'git' },
    { action: 'write', resource: 'filesystem' },
  ],
  LOCKED: [],
}

export class PermissionManager {
  private _mode: KernelMode

  constructor(initialMode: KernelMode = 'READ_ONLY') {
    this._mode = initialMode
  }

  get mode(): KernelMode {
    return this._mode
  }

  setMode(mode: KernelMode): void {
    this._mode = mode
  }

  canExecute(): boolean {
    return MODE_PERMISSIONS[this._mode].execute
  }

  requiresHumanApproval(): boolean {
    return MODE_PERMISSIONS[this._mode].humanApproval
  }

  check(action: ActionType, resource: ResourceType): Permission {
    const allowed = MODE_ACTION_MATRIX[this._mode]
    const match = allowed.find((a) => a.action === action && a.resource === resource)

    if (match) {
      return {
        granted: true,
        action,
        resource,
        reason: null,
        requiresHumanApproval: this.requiresHumanApproval(),
      }
    }

    return {
      granted: false,
      action,
      resource,
      reason: `Modo ${this._mode} não permite ${action} em ${resource}`,
      requiresHumanApproval: false,
    }
  }

  blockedReasons(): string[] {
    const reasons: string[] = []
    if (!this.canExecute()) {
      reasons.push(`Modo ${this._mode}: execução desabilitada`)
    }
    if (this.requiresHumanApproval()) {
      reasons.push(`Modo ${this._mode}: requer aprovação humana`)
    }
    return reasons
  }
}
