export type ExecutionMode = "READ_ONLY" | "SAFE_WRITE" | "FULL_WRITE"

export interface ExecutionCommand {
  id: string
  missionId: string
  stepId: string
  executor: string
  mode: ExecutionMode
  workingDirectory: string
  prompt: string
  timeout: number
  retry: number
  environment: Record<string, string>
  metadata: Record<string, unknown>
}

export interface StepResult {
  success: boolean
  result?: string
  error?: string
  metadata?: Record<string, string>
}

export interface Executor {
  readonly id: string
  canHandle(command: ExecutionCommand): boolean
  execute(command: ExecutionCommand): Promise<StepResult>
}

export interface ExecutorRegistry {
  /** Resolve com fallback seguro (noop) quando o id nao existe. */
  resolve(command: ExecutionCommand): Executor
  /** Resolve exigindo match exato; lanca ExecutorNotFoundError se nao existir. */
  resolveStrict(command: ExecutionCommand): Executor
  list(): string[]
}