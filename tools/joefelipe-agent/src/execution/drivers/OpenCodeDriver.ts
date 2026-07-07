import type { ExecutionCommand, StepResult } from "../types.ts"
import type { ExecutorDriver, DriverHealth } from "./types.ts"

/**
 * Fundacao para a integracao real com o OpenCode — Fase 9.8.
 * Ver ClaudeDriver.ts para o racional completo (mesmo padrao aplicado a
 * cada driver: indisponivel ate a integracao real ser ligada).
 */
export class OpenCodeDriver implements ExecutorDriver {
  readonly id = "opencode"

  async initialize(): Promise<void> {}

  async health(): Promise<DriverHealth> {
    return {
      available: false,
      version: null,
      capabilities: ["read", "write", "shell"],
      message: "OpenCodeDriver ainda nao conectado (fundacao criada na Fase 9.8; integracao real e fase futura).",
    }
  }

  supports(command: ExecutionCommand): boolean {
    return command.executor === "opencode"
  }

  async execute(_command: ExecutionCommand): Promise<StepResult> {
    return {
      success: false,
      error: "OpenCodeDriver ainda nao conectado. Verifique health() antes de chamar execute().",
      metadata: { driver: this.id, connected: "false" },
    }
  }

  async cancel(_commandId: string): Promise<void> {}

  async dispose(): Promise<void> {}
}
