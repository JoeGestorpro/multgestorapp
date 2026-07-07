export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired"

export interface ApprovalRequest {
  id: string
  missionId: string
  missionTitle: string
  missionIntent: string
  classification: string
  mode: string
  requestedBy: string
  requestedAt: string
  status: ApprovalStatus
  decidedBy?: string
  decidedAt?: string
  reason?: string
}

export interface ApprovalAuditEntry {
  id: string
  missionId: string
  action: "requested" | "approved" | "rejected" | "expired"
  previousMode: string
  newMode: string
  decidedBy?: string
  reason?: string
  timestamp: string
}