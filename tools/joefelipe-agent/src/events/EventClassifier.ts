import type { OperationalEvent, EventSeverity, EventClassification } from "./types.ts"

const RISK_PATTERNS = [/riscos-ativos/, /risco/, /p[12]/i]
const MISSION_PATTERNS = [/current-task/, /next-task/, /backlog/]
const DECISION_PATTERNS = [/decisoes-executivas/, /decis[ãa]o/]

export class EventClassifier {
  classify(event: OperationalEvent): EventClassification {
    if (event.source === "api:ingest" && event.type !== "file:changed") {
      return { type: event.type, severity: event.severity, summary: event.summary }
    }

    if (event.source === "file:watch") {
      return this.classifyFileEvent(event)
    }

    return { type: event.type, severity: "info", summary: event.summary }
  }

  private classifyFileEvent(event: OperationalEvent): EventClassification {
    const path = (event.payload.path as string) ?? ""

    if (RISK_PATTERNS.some((p) => p.test(path))) {
      return { type: "risk:changed", severity: "critical", summary: "Arquivo de riscos alterado: " + path }
    }

    if (MISSION_PATTERNS.some((p) => p.test(path))) {
      return { type: "mission:updated", severity: "warning", summary: "Arquivo de missao alterado: " + path }
    }

    if (DECISION_PATTERNS.some((p) => p.test(path))) {
      return { type: "decision:changed", severity: "warning", summary: "Arquivo de decisoes alterado: " + path }
    }

    return { type: "file:changed", severity: "info", summary: "Arquivo alterado: " + path }
  }
}