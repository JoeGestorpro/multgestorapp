import type { ExecutionCommand, StepResult } from "../types.ts"
import type { ExecutorDriver, DriverHealth } from "./types.ts"

/**
 * Fundacao para uma futura integracao com o Codex CLI — Fase 9.8.
 * Nenhum Executor usa este driver ainda. Ver ClaudeDriver.ts para o racional.
 */
export class CodexDriver implements ExecutorDriver {
  readonly id = "codex-cli"

  async initialize(): Promise<void> {}

  async health(): Promise<DriverHealth> {
    return {
      available: false,
      version: null,
      capabilities: ["read", "write", "shell"],
      message: "CodexDriver ainda nao conectado (fundacao criada na Fase 9.8; integracao real e fase futura).",
    }
  }

  supports(command: ExecutionCommand): boolean {
    return command.executor === "codex-cli"
  }

  async execute(_command: ExecutionCommand): Promise<StepResult> {
    return {
      success: false,
      error: "CodexDriver ainda nao conectado. Verifique health() antes de chamar execute().",
      metadata: { driver: this.id, connected: "false" },
    }
  }

  async cancel(_commandId: string): Promise<void> {}

  async dispose(): Promise<void> {}
}
