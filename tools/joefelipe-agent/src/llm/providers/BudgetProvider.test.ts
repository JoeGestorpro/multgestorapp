import { test } from "node:test"
import assert from "node:assert/strict"
import { BudgetProvider } from "./BudgetProvider.ts"
import type { LlmProvider, LlmRequest, LlmResponse } from "../types.ts"

function fakeProvider(text = "resposta", tokensUsed?: number): LlmProvider {
  return {
    name: "openrouter",
    model: "fake-model",
    async complete(request: LlmRequest): Promise<LlmResponse> {
      return {
        provider: "openrouter",
        model: "fake-model",
        mode: request.mode,
        text,
        safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
        metadata: tokensUsed !== undefined ? { tokensUsed } : {},
      }
    },
  }
}

test("BudgetProvider: pass-through quando dentro do orcamento", async () => {
  const p = new BudgetProvider(fakeProvider("ok", 10), "s1", { maxTokensPerSession: 1000 })
  const res = await p.complete({ mode: "READ_ONLY", task: "teste" })
  assert.equal(res.text, "ok")
  assert.equal(res.safety.canExecute, false)
  assert.deepEqual(res.metadata, { tokensUsed: 10 })
})

test("BudgetProvider: acumula tokens/custo entre chamadas", async () => {
  const p = new BudgetProvider(fakeProvider("ok", 100), "s1", { ratePerToken: 0.01 })
  await p.complete({ mode: "READ_ONLY", task: "a" })
  await p.complete({ mode: "READ_ONLY", task: "b" })
  const usage = p.getUsage()
  assert.equal(usage.tokensUsed, 200)
  assert.equal(usage.estimatedCost, 2)
  assert.equal(usage.sessionId, "s1")
})

test("BudgetProvider: bloqueia quando maxTokensPerSession e excedido", async () => {
  const p = new BudgetProvider(fakeProvider("ok", 60), "s1", { maxTokensPerSession: 50 })
  const first = await p.complete({ mode: "READ_ONLY", task: "a" })
  assert.equal(first.metadata?.blocked, undefined)

  const second = await p.complete({ mode: "READ_ONLY", task: "b" })
  assert.equal(second.safety.canExecute, false)
  assert.equal(second.metadata?.blocked, true)
  assert.match(second.safety.blockedReasons[0], /Limite de tokens/)
})

test("BudgetProvider: bloqueia quando maxCostPerSession e excedido", async () => {
  const p = new BudgetProvider(fakeProvider("ok", 100), "s1", { maxCostPerSession: 0.5, ratePerToken: 0.01 })
  await p.complete({ mode: "READ_ONLY", task: "a" }) // custo acumulado = 1.0 >= 0.5
  const second = await p.complete({ mode: "READ_ONLY", task: "b" })
  assert.equal(second.safety.canExecute, false)
  assert.match(second.safety.blockedReasons[0], /Limite de custo/)
})

test("BudgetProvider: chamada bloqueada nao chega a chamar o provider real", async () => {
  let calls = 0
  const provider: LlmProvider = {
    name: "openrouter",
    model: "m",
    async complete(request: LlmRequest): Promise<LlmResponse> {
      calls += 1
      return { provider: "openrouter", model: "m", mode: request.mode, text: "x", safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] }, metadata: { tokensUsed: 1000 } }
    },
  }
  const p = new BudgetProvider(provider, "s1", { maxTokensPerSession: 500 })
  await p.complete({ mode: "READ_ONLY", task: "a" })
  assert.equal(calls, 1)
  await p.complete({ mode: "READ_ONLY", task: "b" })
  assert.equal(calls, 1, "segunda chamada deveria ter sido bloqueada antes de chegar ao provider real")
})

test("BudgetProvider: reset(sessionId correto) zera contadores", async () => {
  const p = new BudgetProvider(fakeProvider("ok", 50), "s1")
  await p.complete({ mode: "READ_ONLY", task: "a" })
  assert.equal(p.getUsage().tokensUsed, 50)
  p.reset("s1")
  assert.equal(p.getUsage().tokensUsed, 0)
  assert.equal(p.getUsage().estimatedCost, 0)
})

test("BudgetProvider: reset(sessionId errado) nao zera contadores", async () => {
  const p = new BudgetProvider(fakeProvider("ok", 50), "s1")
  await p.complete({ mode: "READ_ONLY", task: "a" })
  p.reset("outra-sessao")
  assert.equal(p.getUsage().tokensUsed, 50)
})

test("BudgetProvider: reset() sem argumento zera a sessao gerenciada", async () => {
  const p = new BudgetProvider(fakeProvider("ok", 50), "s1")
  await p.complete({ mode: "READ_ONLY", task: "a" })
  p.reset()
  assert.equal(p.getUsage().tokensUsed, 0)
})

test("BudgetProvider: getStatus expoe limites e uso no formato do dashboard", async () => {
  const p = new BudgetProvider(fakeProvider("ok", 50), "s1", { maxTokensPerSession: 200, maxCostPerSession: 1, ratePerToken: 0.001 })
  await p.complete({ mode: "READ_ONLY", task: "a" })
  const status = p.getStatus()
  assert.equal(status.tokensUsed, 50)
  assert.equal(status.tokensLimit, 200)
  assert.equal(status.budgetUsed, 0.05)
  assert.equal(status.budgetLimit, 1)
  assert.equal(status.sessionId, "s1")
})

test("BudgetProvider: sem tokensUsed reportado, estima por tamanho de texto", async () => {
  const p = new BudgetProvider(fakeProvider("uma resposta de dezesseis chars"), "s1")
  await p.complete({ mode: "READ_ONLY", task: "1234567890123456" }) // 16 chars
  const usage = p.getUsage()
  assert.ok(usage.tokensUsed > 0, "deveria estimar tokens a partir do texto quando o provider nao reporta usage")
})

test("BudgetProvider: name/model delegam para o provider interno", () => {
  const p = new BudgetProvider(fakeProvider(), "s1")
  assert.equal(p.name, "openrouter")
  assert.equal(p.model, "fake-model")
})
