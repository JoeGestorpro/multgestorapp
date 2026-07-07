import type { ExecutionCommand, StepResult } from "../types.ts"
import type { ExecutorDriver, DriverHealth } from "./types.ts"

/**
 * Fundacao para a integracao real com o Claude Code (CLI/SDK) — Fase 9.8.
 * Ainda NAO conectado: health() sempre reporta indisponivel ate uma fase
 * futura ligar a integracao real (spawn do CLI, deteccao de versao, etc.).
 * O DriverManager nunca chama execute() quando health().available e false,
 * mas o metodo abaixo tambem falha com segurança se for chamado direto.
 */
export class ClaudeDriver implements ExecutorDriver {
  readonly id = "claude-code"

  async initialize(): Promise<void> {
    /* fundacao apenas: nada para inicializar ainda */
  }

  async health(): Promise<DriverHealth> {
    return {
      available: false,
      version: null,
      capabilities: ["read", "write", "shell"],
      message: "ClaudeDriver ainda nao conectado (fundacao criada na Fase 9.8; integracao real e fase futura).",
    }
  }

  supports(command: ExecutionCommand): boolean {
    return command.executor === "claude-code"
  }

  async execute(_command: ExecutionCommand): Promise<StepResult> {
    return {
      success: false,
      error: "ClaudeDriver ainda nao conectado. Verifique health() antes de chamar execute().",
      metadata: { driver: this.id, connected: "false" },
    }
  }

  async cancel(_commandId: string): Promise<void> {
    /* nada em andamento para cancelar ainda */
  }

  async dispose(): Promise<void> {
    /* sem recursos alocados ainda */
  }
}
