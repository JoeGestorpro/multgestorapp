// Fase 9.11 — Work Sessions: cada conversa passa a ser uma Missao em
// potencial, nunca uma mensagem solta. A Session guarda apenas PONTEIROS
// (missionId/executionId/plannerGoalId) para o que ja existe em
// GoalPlanner/TaskOrchestrator — nunca uma copia do conteudo (sem estado
// duplicado).

export type SessionStatus = "active" | "idle" | "archived"

export interface SessionMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface WorkSession {
  id: string
  title: string
  status: SessionStatus
  provider: string
  model: string
  kernelMode: string
  createdAt: string
  updatedAt: string
  missionId: string | null
  executionId: string | null
  plannerGoalId: string | null
  messages: SessionMessage[]
}
