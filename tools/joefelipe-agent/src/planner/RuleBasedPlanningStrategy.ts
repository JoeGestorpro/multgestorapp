import type { PlanningStrategy } from "./PlanningStrategy.ts"
import type { Goal, PlannedMission } from "./types.ts"

export class RuleBasedPlanningStrategy implements PlanningStrategy {
  readonly name = "rule-based"

  plan(goal: Goal): PlannedMission[] {
    const mission: PlannedMission = {
      id: this.deriveMissionId(goal),
      goalId: goal.id,
      title: goal.title,
      intent: goal.intent,
      executorId: "claude-code",
      type: this.inferType(goal),
      allowedFilesHint: [],
      sourceRiskId: undefined,
      dependsOn: [],
      status: "planned",
      order: 1,
    }
    return [mission]
  }

  private deriveMissionId(goal: Goal): string {
    const slug = goal.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
    const prefix = goal.tags.length ? `${goal.tags[0]}/` : ""
    return `${prefix}${slug || "mission"}`
  }

  private inferType(goal: Goal): string | undefined {
    const t = goal.title.toLowerCase()
    if (goal.tags.length) return goal.tags[0]
    if (/seguranç|rls|policy|acesso|audit/i.test(t)) return "security"
    if (/deploy|infra|ops|migration|banco|db/i.test(t)) return "ops-infra"
    if (/doc|readme|manual|wiki/i.test(t)) return "docs"
    if (/fix|bug|corrig|hotfix|erro|error/i.test(t)) return "fix"
    if (/refactor|clean|limpar|reorg/i.test(t)) return "refactor"
    if (/feat|funcionalidade|novo|criar|implement/i.test(t)) return "feat"
    return undefined
  }
}
