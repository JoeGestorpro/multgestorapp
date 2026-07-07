export type GoalStatus = "draft" | "planned" | "active" | "completed" | "blocked" | "cancelled"

export interface Goal {
  id: string
  title: string
  intent: string
  status: GoalStatus
  priority: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface PlannedMission {
  id: string
  goalId: string
  title: string
  intent: string
  executorId: string
  type?: string
  allowedFilesHint?: string[]
  sourceRiskId?: string
  classification?: string
  requiresHumanApproval?: boolean
  dependsOn: string[]
  status: GoalStatus
  order: number
}

export interface Plan {
  id: string
  goal: Goal
  missions: PlannedMission[]
  createdAt: string
  updatedAt: string
  status: GoalStatus
  warnings: string[]
}

export interface QueueStatus {
  current: { taskId: string | null; status: string | null; mode: string | null }
  next: { taskId: string | null; status: string | null; mode: string | null }
}

export interface PlanSummary {
  plan: Plan | null
  queue: QueueStatus
}
