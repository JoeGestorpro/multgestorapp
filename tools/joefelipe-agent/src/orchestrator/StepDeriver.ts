import type { PlannedMission } from "../planner/types.ts"
import type { OrchestrationStep, StepType } from "./types.ts"

const DEFAULT_STEPS: StepType[] = ["analyze", "implement", "validate", "report"]

const TYPE_STEP_MAP: Record<string, StepType[]> = {
  security:   ["analyze", "implement", "validate", "approval", "report"],
  feature:    ["analyze", "implement", "test", "commit"],
  refactor:   ["analyze", "implement", "test", "validate"],
  docs:       ["analyze", "generate", "validate"],
  bugfix:     ["analyze", "implement", "test", "commit"],
  audit:      ["analyze", "read", "report"],
  config:     ["read", "implement", "validate"],
}

const STEP_EXECUTOR: Record<StepType, string> = {
  analyze:    "claude-code",
  read:       "claude-code",
  plan:       "claude-code",
  generate:   "claude-code",
  implement:  "claude-code",
  test:       "claude-code",
  validate:   "claude-code",
  commit:     "claude-code",
  report:     "claude-code",
  approval:   "human",
  custom:     "claude-code",
}

const STEP_TITLES: Record<StepType, string> = {
  analyze:    "Analisar estrutura e requisitos",
  read:       "Ler documentacao e codigo existente",
  plan:       "Planejar abordagem de implementacao",
  generate:   "Gerar artefatos e documentacao",
  implement:  "Implementar as modificacoes necessarias",
  test:       "Executar testes e validar funcionamento",
  validate:   "Validar seguranca e conformidade",
  commit:     "Preparar e revisar commit",
  report:     "Gerar relatorio de resultados",
  approval:   "Aguardar aprovacao humana",
  custom:     "Executar acao personalizada",
}

function generateId(): string {
  return "step-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6)
}

function makePrompt(mission: PlannedMission, stepType: StepType): string {
  const base = "Missao: " + mission.title + ". " + mission.intent
  const hints = mission.allowedFilesHint?.length
    ? " Escopo: " + mission.allowedFilesHint.join(", ")
    : ""
  return base + hints + " [passo: " + STEP_TITLES[stepType] + "]"
}

export class StepDeriver {
  derive(mission: PlannedMission): OrchestrationStep[] {
    const types = TYPE_STEP_MAP[mission.type ?? ""] ?? DEFAULT_STEPS
    let filtered: StepType[]

    if (mission.classification === "READ_ONLY" || mission.classification === "PLAN_ONLY") {
      filtered = types.filter((t) =>
        t === "analyze" || t === "read" || t === "report" || t === "validate"
      )
      if (filtered.length === 0) filtered = ["read", "report"]
    } else {
      filtered = [...types]
    }

    if (mission.requiresHumanApproval) {
      const lastReadIdx = filtered.reduce((max, t, i) =>
        (t === "read" || t === "analyze" || t === "plan") ? i : max, -1
      )
      const insertAt = lastReadIdx >= 0 ? lastReadIdx + 1 : filtered.length - 1

      if (!filtered.includes("approval")) {
        filtered.splice(insertAt, 0, "approval")
      }
    }

    const steps: OrchestrationStep[] = []
    for (let i = 0; i < filtered.length; i++) {
      const t = filtered[i]
      const stepId = generateId()
      steps.push({
        id: stepId,
        missionId: mission.id,
        order: i + 1,
        title: STEP_TITLES[t],
        type: t,
        status: "pending",
        executor: STEP_EXECUTOR[t],
        dependsOn: i > 0 ? [steps[i - 1].id] : [],
        prompt: makePrompt(mission, t),
      })
    }

    return steps
  }
}