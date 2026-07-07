import { describe, it, mock } from "node:test"
import assert from "node:assert/strict"
import { LLMPlanningStrategy } from "./LLMPlanningStrategy.ts"
import { LlmEngine } from "../llm/LlmEngine.ts"
import { MockProvider } from "../llm/providers/MockProvider.ts"
import type { Goal } from "./types.ts"

function makeGoal(overrides?: Partial<Goal>): Goal {
  return {
    id: "goal-test",
    title: overrides?.title ?? "Implementar RLS em companies",
    intent: overrides?.intent ?? "Criar migration e policies RLS para tabela companies",
    status: "planned",
    priority: 1,
    tags: overrides?.tags ?? ["security"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function makeStrategy(mockResponse: string): LLMPlanningStrategy {
  const mockProvider = new MockProvider()
  mock.method(mockProvider, "complete", async () => ({
    provider: "mock" as const,
    model: "mock-safe-v1",
    mode: "PLAN_ONLY" as const,
    text: mockResponse,
    safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
    metadata: { simulated: true },
  }))

  const engine = new LlmEngine()
  engine.registry.register(mockProvider)

  return new LLMPlanningStrategy(engine)
}

describe("LLMPlanningStrategy", () => {
  it("retorna PlannedMission[] com resposta valida da LLM", async () => {
    const strategy = makeStrategy(JSON.stringify({
      missions: [
        { title: "Analisar codigo atual", intent: "Percorrer codigo para entender arquitetura", type: "analysis", order: 1 },
        { title: "Criar migration RLS", intent: "Gerar migration com RLS policies", type: "security", order: 2 },
      ],
      warnings: [],
    }))

    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 2)
    assert.equal(missions[0].title, "Analisar codigo atual")
    assert.equal(missions[1].title, "Criar migration RLS")
    assert.equal(missions[0].executorId, "llm-proposal")
    assert.equal(missions[0].status, "planned")
    assert.equal(missions[0].goalId, "goal-test")
    assert.equal(missions[1].order, 2)
    assert.equal(strategy.name, "llm-based")
  })

  it("termo sensivel gera warning na missao e nao bloqueia", async () => {
    const strategy = makeStrategy(JSON.stringify({
      missions: [
        { title: "Criar RLS policy", intent: "Adicionar RLS na tabela companies", type: "security", order: 1 },
      ],
      warnings: [],
    }))

    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
    assert.equal(missions[0].title, "Criar RLS policy")
  })

  it("fallback para RuleBasedPlanningStrategy se JSON invalido", async () => {
    const strategy = makeStrategy("nao sou um json valido")
    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
  })

  it("fallback se lista vazia", async () => {
    const strategy = makeStrategy(JSON.stringify({ missions: [], warnings: [] }))
    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
  })
})

// ── Fase 11-B.1: parser resiliente a saida imperfeita de LLM real ──

describe("LLMPlanningStrategy — tryParse resiliente (Fase 11-B.1)", () => {
  const validMissions = [
    { title: "Analisar requisitos", intent: "Levantar requisitos do sistema", type: "analysis", order: 1 },
  ]

  it("JSON puro (caso feliz) e parseado direto", async () => {
    const strategy = makeStrategy(JSON.stringify({ missions: validMissions }))
    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
    assert.equal(missions[0].title, "Analisar requisitos")
  })

  it("JSON dentro de ```json ... ``` e parseado", async () => {
    const strategy = makeStrategy("```json\n" + JSON.stringify({ missions: validMissions }) + "\n```")
    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
  })

  it("JSON dentro de ``` ... ``` sem language tag e parseado", async () => {
    const strategy = makeStrategy("```\n" + JSON.stringify({ missions: validMissions }) + "\n```")
    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
  })

  it("JSON com trailing comma e parseado", async () => {
    const withTrailingComma = '{"missions": [{"title": "Analisar requisitos", "intent": "Levantar requisitos do sistema", "type": "analysis", "order": 1,},],}'
    const strategy = makeStrategy(withTrailingComma)
    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
    assert.equal(missions[0].title, "Analisar requisitos")
  })

  it("JSON com texto antes e depois do bloco e parseado (extracao por regex)", async () => {
    const wrapped = "Aqui esta o plano:\n\n" + JSON.stringify({ missions: validMissions }) + "\n\nPrecisa de mais alguma coisa?"
    const strategy = makeStrategy(wrapped)
    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
    assert.equal(missions[0].title, "Analisar requisitos")
  })

  it("JSON com comentarios // e parseado (comentarios removidos)", async () => {
    const withComments = [
      "{",
      '  // plano gerado automaticamente',
      '  "missions": [',
      '    { "title": "Analisar requisitos", "intent": "Levantar requisitos do sistema", "type": "analysis", "order": 1 }',
      "  ]",
      "}",
    ].join("\n")
    const strategy = makeStrategy(withComments)
    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
  })

  it("combinacao: fence + texto extra + trailing comma + comentarios, tudo junto", async () => {
    const messy = [
      "Claro! Segue o plano solicitado:",
      "",
      "```json",
      "{",
      "  // gerado pela LLM",
      '  "missions": [',
      '    { "title": "Analisar requisitos", "intent": "Levantar requisitos do sistema", "type": "analysis", "order": 1 },',
      "  ],",
      "}",
      "```",
      "",
      "Qualquer duvida, so avisar.",
    ].join("\n")
    const strategy = makeStrategy(messy)
    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
    assert.equal(missions[0].title, "Analisar requisitos")
  })

  it("resposta vazia cai no fallback RuleBasedPlanningStrategy (nao quebra)", async () => {
    const strategy = makeStrategy("")
    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
  })

  it("objeto JSON valido mas sem campo 'missions' cai no fallback", async () => {
    const strategy = makeStrategy(JSON.stringify({ plano: "algo", warnings: [] }))
    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
  })

  it("'missions' como array vazio cai no fallback (mesmo apos parse bem-sucedido)", async () => {
    const strategy = makeStrategy(JSON.stringify({ missions: [] }))
    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
  })

  it("texto completamente nao-JSON, sem chaves, cai no fallback sem lancar excecao", async () => {
    const strategy = makeStrategy("Desculpe, nao consigo gerar um plano para isso no momento.")
    const missions = await strategy.plan(makeGoal())
    assert.equal(missions.length, 1)
  })
})