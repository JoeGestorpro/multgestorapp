import type { ExecutionCommand, StepResult } from "../types.ts"
import type { ExecutorDriver, DriverHealth } from "./types.ts"

/**
 * Driver simulado e seguro: nunca chama uma tecnologia externa, nunca toca
 * arquivos, nunca executa shell. E o driver default de qualquer Executor
 * ate que um driver real seja registrado E passe no health check — e o
 * fallback automatico do DriverManager quando um driver real fica
 * indisponivel.
 */
export class StubDriver implements ExecutorDriver {
  readonly id: string

  constructor(id: string) {
    this.id = id
  }

  async initialize(): Promise<void> {
    /* nao ha nada para inicializar num driver simulado */
  }

  async health(): Promise<DriverHealth> {
    return {
      available: true,
      version: "stub-1.0.0",
      capabilities: [],
      message: "Driver simulado (Fase 9.8) — nenhuma chamada externa, nenhuma escrita real.",
    }
  }

  supports(_command: ExecutionCommand): boolean {
    return true
  }

  async execute(command: ExecutionCommand): Promise<StepResult> {
    return {
      success: true,
      result: command.prompt,
      metadata: { driver: this.id, stub: "true", simulated: "true" },
    }
  }

  async cancel(_commandId: string): Promise<void> {
    /* nao ha execucao real para cancelar */
  }

  async dispose(): Promise<void> {
    /* sem recursos para liberar */
  }
}
