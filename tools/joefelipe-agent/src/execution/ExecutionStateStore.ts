import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs"
import { join } from "node:path"

// Snapshot persistente da execucao ATIVA (nao um log historico — para isso
// ja existe orchestration.jsonl). Este arquivo reflete "o que esta rodando
// agora", permitindo checar abort/estado sem depender de memoria do
// processo (util quando um segundo comando de CLI roda em paralelo).
export type PersistedExecutionStatus = "running" | "completed" | "failed" | "aborted"

export interface ExecutionStepSnapshot {
  id: string
  order: number
  title: string
  type: string
  status: string
  executor: string
  startedAt?: string
  completedAt?: string
  result?: string
  error?: string
}

export interface ExecutionState {
  orchestrationId: string
  missionId: string
  status: PersistedExecutionStatus
  abortRequested: boolean
  currentStepId: string | null
  steps: ExecutionStepSnapshot[]
  startedAt: string
  updatedAt: string
  completedAt?: string
  error?: string
}

export class ExecutionStateStore {
  private file: string

  constructor(root: string) {
    const dir = join(root, "tools", "joefelipe-agent", "runtime")
    mkdirSync(dir, { recursive: true })
    this.file = join(dir, "execution-state.json")
  }

  load(): ExecutionState | null {
    if (!existsSync(this.file)) return null
    try {
      return JSON.parse(readFileSync(this.file, "utf8")) as ExecutionState
    } catch {
      return null
    }
  }

  save(state: ExecutionState): void {
    try {
      writeFileSync(this.file, JSON.stringify(state, null, 2), "utf8")
    } catch {
      /* best-effort: nunca derruba a execucao por falha de disco */
    }
  }

  clear(): void {
    try {
      if (existsSync(this.file)) unlinkSync(this.file)
    } catch {
      /* best-effort */
    }
  }

  /** Marca abort no estado persistido atual. Retorna false se nao ha estado salvo. */
  markAbortRequested(): boolean {
    const state = this.load()
    if (!state) return false
    state.abortRequested = true
    state.updatedAt = new Date().toISOString()
    this.save(state)
    return true
  }

  isAbortRequested(): boolean {
    return this.load()?.abortRequested ?? false
  }
}
