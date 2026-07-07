import type { ExecutionCommand, StepResult } from "../types.ts"
import type { ExecutorDriver, DriverHealth } from "./types.ts"

/**
 * Fundacao para uma futura integracao com o Aider — Fase 9.8.
 * Nenhum Executor usa este driver ainda (nao ha executor "aider" registrado
 * por padrao); existe para provar que a arquitetura suporta multiplos
 * drivers sem tocar no ExecutionEngine. Ver ClaudeDriver.ts para o racional.
 */
export class AiderDriver implements ExecutorDriver {
  readonly id = "aider"

  async initialize(): Promise<void> {}

  async health(): Promise<DriverHealth> {
    return {
      available: false,
      version: null,
      capabilities: ["read", "write", "git"],
      message: "AiderDriver ainda nao conectado (fundacao criada na Fase 9.8; integracao real e fase futura).",
    }
  }

  supports(command: ExecutionCommand): boolean {
    return command.executor === "aider"
  }

  async execute(_command: ExecutionCommand): Promise<StepResult> {
    return {
      success: false,
      error: "AiderDriver ainda nao conectado. Verifique health() antes de chamar execute().",
      metadata: { driver: this.id, connected: "false" },
    }
  }

  async cancel(_commandId: string): Promise<void> {}

  async dispose(): Promise<void> {}
}
