import type { PlanningStrategy } from "./PlanningStrategy.ts"
import type { Goal, PlannedMission } from "./types.ts"
import type { LlmEngine } from "../llm/LlmEngine.ts"
import { detectSensitive } from "../llm/sensitive.ts"
import { RuleBasedPlanningStrategy } from "./RuleBasedPlanningStrategy.ts"

interface ParsedMission {
  title: string
  intent: string
  type?: string
  dependsOn?: string[]
  order: number
}

interface ParsedPlan {
  missions: ParsedMission[]
  warnings?: string[]
}

function slugify(title: string, goal: Goal): string {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  const prefix = goal.tags.length ? goal.tags[0] + "/" : ""
  return prefix + (slug || "mission")
}

const SYSTEM_PROMPT = "Voce e o planejador de missoes do Agente JoeFelipe.\nAnalise o objetivo do usuario e decomponha em multiplas missoes ordenadas.\nCada missao deve ser especifica e executavel sequencialmente.\nResponda APENAS com JSON valido, sem markdown, sem explicacoes.\n\nFormato:\n{\n  \"missions\": [\n    {\n      \"title\": \"string\",\n      \"intent\": \"descricao detalhada do que fazer\",\n      \"type\": \"analysis|security|feat|fix|refactor|docs|ops-infra\",\n      \"dependsOn\": [\"title-da-outra-missao\"],\n      \"order\": 1\n    }\n  ],\n  \"warnings\": [\"riscos ou pre-condicoes\"]\n}"

export class LLMPlanningStrategy implements PlanningStrategy {
  readonly name = "llm-based"
  private llm: LlmEngine
  private fallback: RuleBasedPlanningStrategy

  constructor(llm: LlmEngine) {
    this.llm = llm
    this.fallback = new RuleBasedPlanningStrategy()
  }

  async plan(goal: Goal): Promise<PlannedMission[]> {
    try {
      const task = "Analise e decomponha o seguinte objetivo em missoes:\n\nTitulo: " + goal.title + "\nIntencao: " + goal.intent + "\nPrioridade: " + goal.priority + "\nTags: " + goal.tags.join(", ")
      const response = await this.llm.complete({
        mode: "PLAN_ONLY",
        task: task,
        maxTokens: 2048,
        context: { systemPrompt: SYSTEM_PROMPT },
      })

      const parsed = this.tryParse(response.text)
      if (!parsed || !Array.isArray(parsed.missions) || parsed.missions.length === 0) {
        console.warn("[LLMPlanningStrategy] JSON invalido ou lista vazia. Usando fallback.")
        return this.fallback.plan(goal)
      }

      return this.buildMissions(parsed, goal)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn("[LLMPlanningStrategy] Erro ao chamar LLM: " + msg + ". Usando fallback.")
      return this.fallback.plan(goal)
    }
  }

  /**
   * Fase 11-B.1: LLMs reais raramente devolvem JSON perfeito — texto antes/
   * depois do bloco, trailing commas, comentarios `//`. Cada estagio abaixo
   * tenta parsear uma versao progressivamente mais "consertada" do texto;
   * para no primeiro que produzir um ParsedPlan valido (com `missions[]`).
   */
  private tryParse(text: string): ParsedPlan | null {
    let cleaned = text.trim()

    // 1. Remove code fence markdown (```json ... ``` ou ``` ... ```).
    if (cleaned.startsWith("```")) {
      const first = cleaned.indexOf("\n")
      const last = cleaned.lastIndexOf("```")
      if (first !== -1 && last !== -1 && last > first) {
        cleaned = cleaned.slice(first + 1, last).trim()
      }
    }

    const attempt = (s: string): ParsedPlan | null => {
      try {
        const parsed = JSON.parse(s)
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.missions)) {
          return parsed as ParsedPlan
        }
      } catch {
        // tenta o proximo estagio
      }
      return null
    }

    // 2. Parse direto (caso feliz: resposta ja e JSON puro).
    let result = attempt(cleaned)
    if (result) return result

    // 3. Extrai o primeiro "{" ate o ultimo "}" — cobre respostas com texto
    // solto antes/depois do bloco JSON ("Aqui esta o plano:\n{...}\nPrecisa de mais algo?").
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    const extracted = jsonMatch ? jsonMatch[0] : cleaned
    result = attempt(extracted)
    if (result) return result

    // 4. Remove trailing commas antes de "}" ou "]" (erro comum de LLM).
    const noTrailingCommas = extracted.replace(/,\s*([}\]])/g, "$1")
    result = attempt(noTrailingCommas)
    if (result) return result

    // 5. Remove linhas de comentario "//" (invalido em JSON, mas alguns
    // modelos incluem mesmo quando instruidos a nao explicar).
    const noComments = noTrailingCommas
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n")
    result = attempt(noComments)
    if (result) return result

    // 6. Nenhum estagio funcionou — loga uma amostra para diagnostico e
    // deixa o chamador cair no fallback (RuleBasedPlanningStrategy).
    console.warn("[LLMPlanningStrategy] Falha ao fazer parse do JSON. Primeiros 200 chars: " + cleaned.slice(0, 200))
    return null
  }

  private buildMissions(parsed: ParsedPlan, goal: Goal): PlannedMission[] {
    const planWarnings: string[] = parsed.warnings ?? []
    const missions: PlannedMission[] = []

    for (const m of parsed.missions) {
      if (typeof m.title !== "string" || typeof m.intent !== "string" || typeof m.order !== "number") {
        continue
      }

      const combined = m.title + " " + m.intent
      const sensitive = detectSensitive(combined)

      if (sensitive.length > 0) {
        planWarnings.push("Missao \"" + m.title + "\": contem termo sensivel (" + sensitive.join(", ") + ") — requer aprovacao humana")
      }

      missions.push({
        id: slugify(m.title, goal),
        goalId: goal.id,
        title: m.title,
        intent: m.intent,
        executorId: "llm-proposal",
        type: m.type ?? undefined,
        allowedFilesHint: [],
        sourceRiskId: undefined,
        dependsOn: m.dependsOn ?? [],
        status: "planned",
        order: m.order,
      })
    }

    if (missions.length === 0) {
      console.warn("[LLMPlanningStrategy] Nenhuma missao valida apos sanitizacao. Usando fallback.")
      return this.fallback.plan(goal)
    }

    return missions
  }
}