export interface PolicyVerdict {
  allowed: boolean
  reason?: string
  requiredMode?: string
}

export interface PolicyContext {
  kernelMode: string
  canExecute: boolean
  requiresHumanApproval: boolean
  stepType: string
}

export interface ExecutionPolicy {
  readonly name: string
  evaluate(cmd: ExecutionCommand, ctx: PolicyContext): PolicyVerdict
}

// Re-import for convenience
import type { ExecutionCommand } from "../types.ts"