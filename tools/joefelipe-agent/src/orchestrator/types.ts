export type StepStatus = "pending" | "ready" | "waiting_executor" | "running" | "waiting_human" | "completed" | "failed" | "skipped"

export type StepType =
  | "analyze"
  | "read"
  | "plan"
  | "generate"
  | "implement"
  | "test"
  | "validate"
  | "commit"
  | "report"
  | "approval"
  | "custom"

export interface OrchestrationStep {
  id: string
  missionId: string
  order: number
  title: string
  type: StepType
  status: StepStatus
  executor: string
  dependsOn: string[]
  prompt: string
  result?: string
  error?: string
  startedAt?: string
  completedAt?: string
}

export interface Orchestration {
  id: string
  missionId: string
  planId: string
  goalId: string
  steps: OrchestrationStep[]
  status: "pending" | "running" | "completed" | "failed"
  createdAt: string
  updatedAt: string
}

export type StepDerivationTable = Record<string, StepType[]>