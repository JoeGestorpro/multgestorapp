import type { Kernel } from "../kernel/Kernel.ts"
import type { Goal, Plan, PlannedMission, PlanSummary } from "./types.ts"
import type { PlanningStrategy } from "./PlanningStrategy.ts"
import { ApprovalManager } from "../approval/ApprovalManager.ts"
import { PlanStore } from "./PlanStore.ts"
import { QueueManager } from "./QueueManager.ts"

function generateId(): string {
  return "plan-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6)
}

function now(): string {
  return new Date().toISOString()
}

export class GoalPlanner {
  readonly strategy: PlanningStrategy
  readonly store: PlanStore
  readonly queue: QueueManager
  private kernel: Kernel
  approvalManager: ApprovalManager | null

  constructor(kernel: Kernel, strategy: PlanningStrategy, store?: PlanStore, queue?: QueueManager, approvalManager?: ApprovalManager) {
    this.kernel = kernel
    this.strategy = strategy
    this.store = store ?? new PlanStore()
    this.queue = queue ?? new QueueManager()
    this.approvalManager = approvalManager ?? null
  }

  async plan(goalInput: string | Omit<Goal, "id" | "createdAt" | "updatedAt">): Promise<Plan> {
    const nowISO = now()
    const goal: Goal = typeof goalInput === "string"
      ? {
          id: this.deriveGoalId(goalInput),
          title: goalInput,
          intent: goalInput,
          status: "planned",
          priority: 3,
          tags: [],
          createdAt: nowISO,
          updatedAt: nowISO,
        }
      : {
          ...goalInput,
          id: (goalInput as any).id ?? this.deriveGoalId((goalInput as any).title),
          createdAt: nowISO,
          updatedAt: nowISO,
        } as Goal

    const missions = await this.strategy.plan(goal)

    const plan: Plan = {
      id: generateId(),
      goal,
      missions,
      createdAt: nowISO,
      updatedAt: nowISO,
      status: "planned",
      warnings: [],
    }

    this.store.save(plan)
    this.kernel.events.emit("plan:created", { planId: plan.id, goalId: goal.id })

    return plan
  }

  advance(): { success: boolean; error?: string } {
    const plan = this.store.load()
    if (!plan) return { success: false, error: "Nenhum plano encontrado em runtime/queue.json" }

    const planned = plan.missions.find((m) => m.status === "planned")
    if (!planned) return { success: false, error: "Nenhuma missao planned disponivel para avancar" }

    if (planned.requiresHumanApproval && this.approvalManager && !this.approvalManager.isApproved(planned.id)) {
      this.approvalManager.request(planned, this.kernel.context.getMode())
      return { success: false, error: "Missao requer aprovacao humana. Use 'approval list' para ver pendencias" }
    }

    const canWrite = this.kernel.permissions.canExecute()
    const promoteResult = this.queue.promoteToNext(planned, canWrite)
    if (!promoteResult.success) return promoteResult

    this.kernel.context.setMission(planned.id, planned.title, planned.intent)
    this.kernel.events.emit("plan:advanced", { missionId: planned.id, planId: plan.id })

    return { success: true }
  }

  complete(missionId: string): { success: boolean; error?: string } {
    const plan = this.store.load()
    if (!plan) return { success: false, error: "Nenhum plano encontrado" }

    const mission = plan.missions.find((m) => m.id === missionId)
    if (!mission) return { success: false, error: "Missao " + missionId + " nao encontrada no plano" }

    mission.status = "completed"
    plan.updatedAt = now()

    const allDone = plan.missions.every((m) => m.status === "completed")
    if (allDone) {
      plan.status = "completed"
    }

    this.store.save(plan)
    this.kernel.events.emit("plan:completed", { missionId, planId: plan.id })

    return { success: true }
  }

  loadPlan(): Plan | null {
    return this.store.load()
  }

  getStatus(): PlanSummary {
    return {
      plan: this.store.load(),
      queue: this.queue.getStatus(),
    }
  }

  get name(): string {
    return "planner (" + this.strategy.name + ")"
  }

  private deriveGoalId(title: string): string {
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
    return "goal-" + (slug || "untitled")
  }
}