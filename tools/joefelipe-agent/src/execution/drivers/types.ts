// Fase 9.8 — fundacao para drivers reais de execucao (Claude Code, OpenCode,
// Aider, Codex CLI, etc.). O ExecutionEngine NUNCA conhece essas interfaces
// diretamente: ele so conhece Executor/ExecutorRegistry (execution/types.ts).
// Driver e a camada de tecnologia, usada internamente por um Executor.

import type { ExecutionCommand, StepResult } from "../types.ts"

/** Capacidades que um driver pode declarar via health(). Puramente descritivo
 * — nao concede permissao nenhuma por si so (Policy/Approval continuam sendo
 * quem decide o que pode rodar). */
export type DriverCapability = "read" | "write" | "shell" | "git" | "test"

export interface DriverHealth {
  available: boolean
  version: string | null
  capabilities: DriverCapability[]
  message?: string
}

/**
 * Contrato de um driver de tecnologia (Claude Code, OpenCode, Aider, Codex
 * CLI, etc.). Um Executor (execution/executors/*) delega a um Driver via
 * DriverManager, mas nunca expõe o Driver ao ExecutionEngine.
 */
export interface ExecutorDriver {
  readonly id: string
  /** Prepara o driver (ex.: valida CLI instalada, versao, autenticacao). Idempotente. */
  initialize(): Promise<void>
  /** Nunca lanca: erros de verificacao devem virar { available: false, message }. */
  health(): Promise<DriverHealth>
  /** Indica se este driver e capaz de atender o comando (sem checar health). */
  supports(command: ExecutionCommand): boolean
  /** So deve ser chamado apos health().available === true. */
  execute(command: ExecutionCommand): Promise<StepResult>
  /** Cancela uma execucao em andamento, se o driver suportar. Idempotente/no-op se nao houver o que cancelar. */
  cancel(commandId: string): Promise<void>
  /** Libera recursos do driver (processos, sockets, handles). Idempotente. */
  dispose(): Promise<void>
}
