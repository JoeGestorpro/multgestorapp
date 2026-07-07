import { readFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, renameSync, statSync } from "node:fs"
import { join } from "node:path"
import type { ApprovalRequest, ApprovalAuditEntry } from "./types.ts"
import type { PlannedMission } from "../planner/types.ts"
import type { Kernel } from "../kernel/Kernel.ts"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ROTATED_FILES = 20
const MAX_LOAD_SIZE = 50 * 1024 * 1024

function generateId(): string {
  return "apr-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6)
}

export class ApprovalManager {
  private root: string
  private dir: string
  private file: string
  private auditFile: string
  private kernel: Kernel | null
  private requests = new Map<string, ApprovalRequest>()

  constructor(root: string, kernel?: Kernel) {
    this.root = root
    this.dir = join(root, "tools", "joefelipe-agent", "runtime")
    this.file = join(this.dir, "approval.jsonl")
    this.auditFile = join(this.dir, "approval-audit.jsonl")
    this.kernel = kernel ?? null
    mkdirSync(this.dir, { recursive: true })
    this.loadIndex()
  }

  private loadIndex(): void {
    if (!existsSync(this.file)) return
    try {
      const stat = statSync(this.file)
      if (stat.size > MAX_LOAD_SIZE) {
        console.warn("[ApprovalManager] arquivo muito grande (" + stat.size + " bytes), ignorando load")
        return
      }
      const raw = readFileSync(this.file, "utf8")
      for (const line of raw.split("\n").filter(Boolean)) {
        try {
          const req = JSON.parse(line) as ApprovalRequest
          this.requests.set(req.id, req)
        } catch {
          /* skip malformed lines */
        }
      }
    } catch {
      /* best-effort */
    }
  }

  private pruneRotated(base: string): void {
    try {
      const files = readdirSync(this.dir)
        .filter((f) => f.startsWith(base + ".") && f.endsWith(".jsonl") && f !== base + ".jsonl")
        .sort()
      if (files.length <= MAX_ROTATED_FILES) return
      for (const f of files.slice(0, files.length - MAX_ROTATED_FILES)) {
        unlinkSync(join(this.dir, f))
      }
    } catch {
      /* best-effort */
    }
  }

  private rotateIfNeeded(file: string, base: string): void {
    try {
      if (!existsSync(file)) return
      const st = statSync(file)
      if (st.size <= MAX_FILE_SIZE) return
      const ts = new Date().toISOString().replace(/[:.]/g, "-")
      const rotated = file.replace(".jsonl", "." + ts + ".jsonl")
      renameSync(file, rotated)
      this.pruneRotated(base)
    } catch {
      /* best-effort */
    }
  }

  private logAudit(entry: ApprovalAuditEntry): void {
    try {
      this.rotateIfNeeded(this.auditFile, "approval-audit")
      appendFileSync(this.auditFile, JSON.stringify(entry) + "\n", "utf8")
    } catch {
      /* best-effort */
    }
  }

  request(mission: PlannedMission, mode: string, requestedBy = "system"): ApprovalRequest {
    const req: ApprovalRequest = {
      id: generateId(),
      missionId: mission.id,
      missionTitle: mission.title,
      missionIntent: mission.intent,
      classification: mission.classification ?? "unknown",
      mode,
      requestedBy,
      requestedAt: new Date().toISOString(),
      status: "pending",
    }
    this.requests.set(req.id, req)
    this.saveRequest(req)
    this.logAudit({
      id: generateId(),
      missionId: mission.id,
      action: "requested",
      previousMode: mode,
      newMode: mode,
      timestamp: req.requestedAt,
    })
    return req
  }

  list(): ApprovalRequest[] {
    return Array.from(this.requests.values())
      .filter((r) => r.status === "pending")
      .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))
  }

  get(id: string): ApprovalRequest | undefined {
    return this.requests.get(id)
  }

  approve(id: string, decidedBy = "human", reason?: string): { success: boolean; error?: string } {
    const req = this.requests.get(id)
    if (!req) return { success: false, error: "Aprovacao nao encontrada: " + id }
    if (req.status !== "pending") return { success: false, error: "Aprovacao ja " + req.status }

    if (!this.kernel) return { success: false, error: "Kernel nao disponivel" }

    const previousMode = this.kernel.context.getMode()
    this.kernel.permissions.setMode("EXECUTE_APPROVED")
    this.kernel.context.setMode("EXECUTE_APPROVED")

    req.status = "approved"
    req.decidedBy = decidedBy
    req.decidedAt = new Date().toISOString()
    req.reason = reason
    this.saveRequest(req)

    this.logAudit({
      id: generateId(),
      missionId: req.missionId,
      action: "approved",
      previousMode: previousMode,
      newMode: "EXECUTE_APPROVED",
      decidedBy,
      reason,
      timestamp: req.decidedAt,
    })

    return { success: true }
  }

  reject(id: string, decidedBy = "human", reason?: string): { success: boolean; error?: string } {
    const req = this.requests.get(id)
    if (!req) return { success: false, error: "Aprovacao nao encontrada: " + id }
    if (req.status !== "pending") return { success: false, error: "Aprovacao ja " + req.status }

    const previousMode = this.kernel?.context.getMode() ?? "READ_ONLY"

    req.status = "rejected"
    req.decidedBy = decidedBy
    req.decidedAt = new Date().toISOString()
    req.reason = reason
    this.saveRequest(req)

    this.logAudit({
      id: generateId(),
      missionId: req.missionId,
      action: "rejected",
      previousMode: previousMode,
      newMode: previousMode,
      decidedBy,
      reason,
      timestamp: req.decidedAt,
    })

    return { success: true }
  }

  isApproved(missionId: string): boolean {
    return Array.from(this.requests.values()).some(
      (r) => r.missionId === missionId && r.status === "approved"
    )
  }

  getPendingCount(): number {
    return Array.from(this.requests.values()).filter((r) => r.status === "pending").length
  }

  getRequests(): ApprovalRequest[] {
    return Array.from(this.requests.values())
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
  }

  private saveRequest(req: ApprovalRequest): void {
    this.requests.set(req.id, req)
    try {
      this.rotateIfNeeded(this.file, "approval")
      appendFileSync(this.file, JSON.stringify(req) + "\n", "utf8")
    } catch {
      /* best-effort */
    }
  }
}