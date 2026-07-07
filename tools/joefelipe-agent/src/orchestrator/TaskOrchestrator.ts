import { readFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, renameSync, statSync } from "node:fs"
import { join } from "node:path"
import type { Orchestration, OrchestrationStep, StepStatus } from "./types.ts"
import { StepDeriver } from "./StepDeriver.ts"
import type { PlannedMission } from "../planner/types.ts"
import type { ExecutionCommand, ExecutionMode } from "../execution/types.ts"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ROTATED_FILES = 20
const MAX_LOAD_SIZE = 50 * 1024 * 1024

function generateId(): string {
  return "orc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6)
}

export class TaskOrchestrator {
  private root: string
  private dir: string
  private file: string
  private deriver: StepDeriver
  private orchestrations = new Map<string, Orchestration>()
  private activeId: string | null = null

  constructor(root: string) {
    this.root = root
    this.dir = join(root, "tools", "joefelipe-agent", "runtime")
    this.file = join(this.dir, "orchestration.jsonl")
    this.deriver = new StepDeriver()
    mkdirSync(this.dir, { recursive: true })
    this.loadIndex()
  }

  private loadIndex(): void {
    if (!existsSync(this.file)) return
    try {
      const stat = statSync(this.file)
      if (stat.size > MAX_LOAD_SIZE) {
        console.warn("[TaskOrchestrator] arquivo muito grande (" + stat.size + " bytes), ignorando load")
        return
      }
      const raw = readFileSync(this.file, "utf8")
      for (const line of raw.split("\n").filter(Boolean)) {
        try {
          const orc = JSON.parse(line) as Orchestration
          this.orchestrations.set(orc.id, orc)
          if (orc.status === "pending" || orc.status === "running") {
            this.activeId = orc.id
          }
        } catch {
          /* skip malformed */
        }
      }
    } catch {
      /* best-effort */
    }
  }

  private pruneRotated(): void {
    try {
      const files = readdirSync(this.dir)
        .filter((f) => f.startsWith("orchestration.") && f.endsWith(".jsonl") && f !== "orchestration.jsonl")
        .sort()
      if (files.length <= MAX_ROTATED_FILES) return
      for (const f of files.slice(0, files.length - MAX_ROTATED_FILES)) {
        unlinkSync(join(this.dir, f))
      }
    } catch {
      /* best-effort */
    }
  }

  private rotateIfNeeded(): void {
    try {
      if (!existsSync(this.file)) return
      const st = statSync(this.file)
      if (st.size <= MAX_FILE_SIZE) return
      const ts = new Date().toISOString().replace(/[:.]/g, "-")
      const rotated = this.file.replace(".jsonl", "." + ts + ".jsonl")
      renameSync(this.file, rotated)
      this.pruneRotated()
    } catch {
      /* best-effort */
    }
  }

  private persist(orc: Orchestration): void {
    this.orchestrations.set(orc.id, orc)
    try {
      this.rotateIfNeeded()
      appendFileSync(this.file, JSON.stringify(orc) + "\n", "utf8")
    } catch {
      /* best-effort */
    }
  }

  create(mission: PlannedMission): Orchestration {
    const steps = this.deriver.derive(mission)
    const now = new Date().toISOString()
    const orc: Orchestration = {
      id: generateId(),
      missionId: mission.id,
      planId: mission.goalId,
      goalId: mission.goalId,
      steps,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    }
    this.activeId = orc.id
    this.persist(orc)
    return orc
  }

  nextStep(): { step: OrchestrationStep | null; orchestration: Orchestration | null } {
    const orc = this.active()
    if (!orc) return { step: null, orchestration: null }

    for (const step of orc.steps) {
      if (step.status !== "pending") continue
      const depsMet = step.dependsOn.every((depId) => {
        const dep = orc.steps.find((s) => s.id === depId)
        return dep && dep.status === "completed"
      })
      if (depsMet) {
        step.status = "ready"
        if (orc.status === "pending") orc.status = "running"
        orc.updatedAt = new Date().toISOString()
        this.persist(orc)
        return { step, orchestration: orc }
      }
    }
    return { step: null, orchestration: orc }
  }

  completeStep(stepId: string): { success: boolean; error?: string } {
    const orc = this.active()
    if (!orc) return { success: false, error: "Nenhuma orquestracao ativa" }

    const step = orc.steps.find((s) => s.id === stepId)
    if (!step) return { success: false, error: "Step nao encontrado: " + stepId }

    step.status = "completed"
    step.completedAt = new Date().toISOString()
    orc.updatedAt = new Date().toISOString()

    const allDone = orc.steps.every((s) => s.status === "completed" || s.status === "skipped")
    if (allDone) orc.status = "completed"

    this.persist(orc)
    return { success: true }
  }

  buildCommand(step: OrchestrationStep): ExecutionCommand {
    const now = new Date().toISOString()
    const mode: ExecutionMode = step.type === "read" || step.type === "analyze" || step.type === "plan" || step.type === "report"
      ? "READ_ONLY"
      : step.type === "approval"
        ? "READ_ONLY"
        : "SAFE_WRITE"
    return {
      id: "cmd-" + step.id,
      missionId: step.missionId,
      stepId: step.id,
      executor: step.executor,
      mode,
      workingDirectory: this.root,
      prompt: step.prompt,
      timeout: 120_000,
      retry: 0,
      environment: {},
      metadata: { order: step.order, type: step.type, title: step.title },
    }
  }

  markWaiting(stepId: string): boolean {
    const orc = this.active()
    if (!orc) return false
    const step = orc.steps.find((s) => s.id === stepId)
    if (!step) return false
    step.status = "waiting_executor"
    orc.updatedAt = new Date().toISOString()
    this.persist(orc)
    return true
  }

  markRunning(stepId: string): boolean {
    const orc = this.active()
    if (!orc) return false
    const step = orc.steps.find((s) => s.id === stepId)
    if (!step) return false
    step.status = "running"
    step.startedAt = step.startedAt ?? new Date().toISOString()
    orc.updatedAt = new Date().toISOString()
    this.persist(orc)
    return true
  }

  // Pausa o step aguardando decisao humana (nao falha a orquestracao: o
  // status geral permanece "running" ate approveStepHuman/rejectStepHuman).
  markWaitingHuman(stepId: string): { success: boolean; error?: string } {
    const orc = this.active()
    if (!orc) return { success: false, error: "Nenhuma orquestracao ativa" }
    const step = orc.steps.find((s) => s.id === stepId)
    if (!step) return { success: false, error: "Step nao encontrado: " + stepId }
    step.status = "waiting_human"
    orc.updatedAt = new Date().toISOString()
    this.persist(orc)
    return { success: true }
  }

  findStep(stepId: string): OrchestrationStep | undefined {
    for (const orc of this.orchestrations.values()) {
      const step = orc.steps.find((s) => s.id === stepId)
      if (step) return step
    }
    return undefined
  }

  approveStepHuman(stepId: string, note?: string): { success: boolean; error?: string } {
    const orc = this.active()
    if (!orc) return { success: false, error: "Nenhuma orquestracao ativa" }
    const step = orc.steps.find((s) => s.id === stepId)
    if (!step) return { success: false, error: "Step nao encontrado: " + stepId }
    if (step.status !== "waiting_human") {
      return { success: false, error: "Step " + stepId + " nao esta aguardando aprovacao humana (status atual: " + step.status + ")" }
    }
    step.result = note ?? "Aprovado manualmente pelo humano"
    return this.completeStep(stepId)
  }

  rejectStepHuman(stepId: string, reason?: string): { success: boolean; error?: string } {
    const orc = this.active()
    if (!orc) return { success: false, error: "Nenhuma orquestracao ativa" }
    const step = orc.steps.find((s) => s.id === stepId)
    if (!step) return { success: false, error: "Step nao encontrado: " + stepId }
    if (step.status !== "waiting_human") {
      return { success: false, error: "Step " + stepId + " nao esta aguardando aprovacao humana (status atual: " + step.status + ")" }
    }
    return this.failStep(stepId, reason ?? "Rejeitado pelo humano")
  }

  failStep(stepId: string, error?: string): { success: boolean; error?: string } {
    const orc = this.active()
    if (!orc) return { success: false, error: "Nenhuma orquestracao ativa" }

    const step = orc.steps.find((s) => s.id === stepId)
    if (!step) return { success: false, error: "Step nao encontrado: " + stepId }

    step.status = "failed"
    step.error = error
    step.completedAt = new Date().toISOString()
    orc.status = "failed"
    orc.updatedAt = new Date().toISOString()

    this.persist(orc)
    return { success: true }
  }

  active(): Orchestration | null {
    if (!this.activeId) return null
    const orc = this.orchestrations.get(this.activeId)
    if (!orc || orc.status === "completed" || orc.status === "failed") {
      this.activeId = null
      return null
    }
    return orc
  }

  get(id: string): Orchestration | undefined {
    return this.orchestrations.get(id)
  }

  list(limit = 10): Orchestration[] {
    return Array.from(this.orchestrations.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  }
}