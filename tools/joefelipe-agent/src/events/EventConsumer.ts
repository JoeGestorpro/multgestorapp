import { EventStore } from "./EventStore.ts"
import { EventClassifier } from "./EventClassifier.ts"
import type { OperationalEvent, EventAnalysis } from "./types.ts"
import type { LlmEngine } from "../llm/LlmEngine.ts"

export class EventConsumer {
  private store: EventStore
  private classifier: EventClassifier
  private llm: LlmEngine | null

  constructor(store: EventStore, llm: LlmEngine | null = null) {
    this.store = store
    this.classifier = new EventClassifier()
    this.llm = llm
  }

  ingest(event: OperationalEvent): OperationalEvent {
    const classification = this.classifier.classify(event)
    event.type = classification.type
    event.severity = classification.severity
    event.summary = classification.summary
    event.status = "received"
    this.store.save(event)
    return event
  }

  async processPending(): Promise<OperationalEvent[]> {
    const pending = this.store.pending()
    const processed: OperationalEvent[] = []

    for (const event of pending) {
      try {
        const analyzed = await this.analyze(event)
        processed.push(analyzed)
      } catch {
        event.status = "failed"
        this.store.save(event)
        processed.push(event)
      }
    }

    return processed
  }

  private async analyze(event: OperationalEvent): Promise<OperationalEvent> {
    event.status = "classifying"
    this.store.save(event)

    if (this.llm) {
      try {
        const analysis = await this.analyzeWithLlm(event)
        event.analysis = analysis
        event.status = "analyzed"
        event.updatedAt = new Date().toISOString()
        this.store.save(event)
        return event
      } catch {
        // fallback to rule-based
      }
    }

    event.analysis = this.analyzeFallback(event)
    event.status = "analyzed"
    event.updatedAt = new Date().toISOString()
    this.store.save(event)
    return event
  }

  private async analyzeWithLlm(event: OperationalEvent): Promise<EventAnalysis> {
    if (!this.llm) throw new Error("LLM not available")

    const systemPrompt = `You are an AI operations analyst. Analyze the following event and provide a structured analysis.
Return ONLY valid JSON with fields: summary, impact, severity, warnings (array), recommendedMissions (array of {title, intent, order}), safety ({canExecute: false, requiresHumanApproval: boolean}).`

    const userPrompt = `Event: ${event.type} (${event.severity})
Summary: ${event.summary}
Source: ${event.source}
Payload: ${JSON.stringify(event.payload)}
Fingerprint: ${event.fingerprint ?? "none"}`

    const response = await this.llm.complete({ mode: "PLAN_ONLY", task: systemPrompt + "\n\n" + userPrompt })
    const parsed = JSON.parse(response.text.trim())
    return {
      summary: parsed.summary ?? event.summary,
      impact: parsed.impact ?? "",
      severity: parsed.severity ?? event.severity,
      recommendedMissions: parsed.recommendedMissions ?? [],
      warnings: parsed.warnings ?? [],
      analyzedAt: new Date().toISOString(),
      safety: { canExecute: false, requiresHumanApproval: true },
    }
  }

  private analyzeFallback(event: OperationalEvent): EventAnalysis {
    const warnings: string[] = []
    if (event.severity === "critical") {
      warnings.push("Evento critico requer atencao humana")
    }

    const impact = event.severity === "critical"
      ? "Potencial impacto no fluxo de trabalho"
      : "Impacto limitado, monitoramento recomendado"

    return {
      summary: event.summary,
      impact,
      severity: event.severity,
      recommendedMissions: [],
      warnings,
      analyzedAt: new Date().toISOString(),
      safety: { canExecute: false, requiresHumanApproval: event.severity === "critical" },
    }
  }
}