export type EventSeverity = "info" | "warning" | "critical"
export type EventSource = "file:watch" | "api:ingest" | "system:kernel" | "system:planner" | "git" | "execution:engine" | "llm:usage"
export type EventStatus = "received" | "classifying" | "analyzed" | "acknowledged" | "failed"

export interface OperationalEvent {
  id: string
  type: string
  source: EventSource
  severity: EventSeverity
  summary: string
  payload: Record<string, unknown>
  status: EventStatus
  fingerprint?: string
  analysis?: EventAnalysis
  planId?: string
  createdAt: string
  updatedAt: string
}

export interface EventAnalysis {
  summary: string
  impact: string
  severity: EventSeverity
  recommendedMissions?: Array<{
    title: string
    intent: string
    type?: string
    dependsOn?: string[]
    order: number
  }>
  warnings: string[]
  analyzedAt: string
  safety: { canExecute: false; requiresHumanApproval: boolean }
}

export interface EventStoreStats {
  total: number
  bySeverity: Record<string, number>
  byStatus: Record<string, number>
  bySource: Record<string, number>
}

export interface EventClassification {
  type: string
  severity: EventSeverity
  summary: string
}