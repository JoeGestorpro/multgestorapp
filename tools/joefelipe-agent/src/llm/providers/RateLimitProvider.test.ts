import { test } from "node:test"
import assert from "node:assert/strict"
import { RateLimitProvider } from "./RateLimitProvider.ts"
import type { LlmProvider, LlmRequest, LlmResponse } from "../types.ts"

function fakeProvider(): { provider: LlmProvider; callCount: () => number } {
  let calls = 0
  const provider: LlmProvider = {
    name: "openrouter",
    model: "fake-model",
    async complete(request: LlmRequest): Promise<LlmResponse> {
      calls += 1
      return {
        provider: "openrouter",
        model: "fake-model",
        mode: request.mode,
        text: "ok",
        safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
        metadata: {},
      }
    },
  }
  return { provider, callCount: () => calls }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

test("RateLimitProvider: permite chamadas dentro do limite da janela", async () => {
  const { provider, callCount } = fakeProvider()
  const p = new RateLimitProvider(provider, { maxCalls: 3, windowMs: 60_000 })
  await p.complete({ mode: "READ_ONLY", task: "a" })
  await p.complete({ mode: "READ_ONLY", task: "b" })
  await p.complete({ mode: "READ_ONLY", task: "c" })
  assert.equal(callCount(), 3)
})

test("RateLimitProvider: bloqueia a chamada que excede maxCalls na janela", async () => {
  const { provider, callCount } = fakeProvider()
  const p = new RateLimitProvider(provider, { maxCalls: 2, windowMs: 60_000 })
  await p.complete({ mode: "READ_ONLY", task: "a" })
  await p.complete({ mode: "READ_ONLY", task: "b" })
  const third = await p.complete({ mode: "READ_ONLY", task: "c" })

  assert.equal(callCount(), 2, "a chamada bloqueada nao deveria ter chegado ao provider real")
  assert.equal(third.safety.canExecute, false)
  assert.equal(third.metadata?.blocked, true)
  assert.match(third.safety.blockedReasons[0], /Rate limit excedido/)
})

test("RateLimitProvider: libera novamente apos a janela passar", async () => {
  const { provider, callCount } = fakeProvider()
  const p = new RateLimitProvider(provider, { maxCalls: 1, windowMs: 50 })
  await p.complete({ mode: "READ_ONLY", task: "a" })
  const blocked = await p.complete({ mode: "READ_ONLY", task: "b" })
  assert.equal(blocked.metadata?.blocked, true)

  await sleep(70)
  const afterWindow = await p.complete({ mode: "READ_ONLY", task: "c" })
  assert.equal(afterWindow.metadata?.blocked, undefined)
  assert.equal(callCount(), 2)
})

test("RateLimitProvider: sessoes diferentes tem janelas independentes", async () => {
  const { provider, callCount } = fakeProvider()
  const p = new RateLimitProvider(provider, { maxCalls: 1, windowMs: 60_000 })
  const a1 = await p.complete({ mode: "READ_ONLY", task: "a", sessionId: "sess-a" })
  const b1 = await p.complete({ mode: "READ_ONLY", task: "b", sessionId: "sess-b" })
  assert.equal(a1.metadata?.blocked, undefined)
  assert.equal(b1.metadata?.blocked, undefined)
  assert.equal(callCount(), 2)

  const a2 = await p.complete({ mode: "READ_ONLY", task: "a2", sessionId: "sess-a" })
  assert.equal(a2.metadata?.blocked, true, "sessao sess-a ja usou sua unica chamada")
})

test("RateLimitProvider: chamadas sem sessionId caem no bucket default compartilhado", async () => {
  const { provider } = fakeProvider()
  const p = new RateLimitProvider(provider, { maxCalls: 1, windowMs: 60_000 })
  const first = await p.complete({ mode: "READ_ONLY", task: "a" })
  const second = await p.complete({ mode: "READ_ONLY", task: "b" })
  assert.equal(first.metadata?.blocked, undefined)
  assert.equal(second.metadata?.blocked, true)
})

test("RateLimitProvider: getStatus reporta chamadas restantes", async () => {
  const { provider } = fakeProvider()
  const p = new RateLimitProvider(provider, { maxCalls: 5, windowMs: 60_000 })
  await p.complete({ mode: "READ_ONLY", task: "a", sessionId: "s1" })
  await p.complete({ mode: "READ_ONLY", task: "b", sessionId: "s1" })
  const status = p.getStatus("s1")
  assert.equal(status.remaining, 3)
  assert.equal(status.maxCalls, 5)
  assert.equal(status.windowMs, 60_000)
})

test("RateLimitProvider: reset(sessionId) limpa so aquela sessao", async () => {
  const { provider } = fakeProvider()
  const p = new RateLimitProvider(provider, { maxCalls: 1, windowMs: 60_000 })
  await p.complete({ mode: "READ_ONLY", task: "a", sessionId: "s1" })
  await p.complete({ mode: "READ_ONLY", task: "b", sessionId: "s2" })
  p.reset("s1")
  assert.equal(p.getStatus("s1").remaining, 1)
  assert.equal(p.getStatus("s2").remaining, 0)
})

test("RateLimitProvider: reset() sem argumento limpa todas as sessoes", async () => {
  const { provider } = fakeProvider()
  const p = new RateLimitProvider(provider, { maxCalls: 1, windowMs: 60_000 })
  await p.complete({ mode: "READ_ONLY", task: "a", sessionId: "s1" })
  await p.complete({ mode: "READ_ONLY", task: "b", sessionId: "s2" })
  p.reset()
  assert.equal(p.getStatus("s1").remaining, 1)
  assert.equal(p.getStatus("s2").remaining, 1)
})

test("RateLimitProvider: name/model delegam para o provider interno", () => {
  const { provider } = fakeProvider()
  const p = new RateLimitProvider(provider, { maxCalls: 1, windowMs: 1000 })
  assert.equal(p.name, "openrouter")
  assert.equal(p.model, "fake-model")
})
