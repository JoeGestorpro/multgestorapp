import { test } from "node:test"
import assert from "node:assert/strict"
import { CircuitBreakerProvider } from "./CircuitBreakerProvider.ts"
import type { LlmProvider, LlmRequest, LlmResponse } from "../types.ts"

class HttpError extends Error {
  status: number
  constructor(status: number, message = "http error") {
    super(message)
    this.status = status
  }
}

function makeResponse(request: LlmRequest): LlmResponse {
  return {
    provider: "openrouter",
    model: "fake-model",
    mode: request.mode,
    text: "ok",
    safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
    metadata: {},
  }
}

/** Provider fake cujo comportamento (falhar/ter sucesso) e controlado de fora
 * via `behavior`, e que conta quantas vezes complete() foi de fato chamado
 * (usado para provar que o circuito OPEN nao chega a "chamar" o provider). */
function scriptedProvider(): { provider: LlmProvider; callCount: () => number; setBehavior: (fn: (r: LlmRequest) => Promise<LlmResponse>) => void } {
  let calls = 0
  let behavior: (r: LlmRequest) => Promise<LlmResponse> = async (r) => makeResponse(r)
  const provider: LlmProvider = {
    name: "openrouter",
    model: "fake-model",
    async complete(request: LlmRequest): Promise<LlmResponse> {
      calls += 1
      return behavior(request)
    },
  }
  return { provider, callCount: () => calls, setBehavior: (fn) => { behavior = fn } }
}

test("CircuitBreakerProvider: pass-through em CLOSED quando o provider funciona", async () => {
  const { provider } = scriptedProvider()
  const cb = new CircuitBreakerProvider(provider, { failureThreshold: 3 })
  const res = await cb.complete({ mode: "READ_ONLY", task: "a" })
  assert.equal(res.text, "ok")
  assert.equal(cb.getState(), "CLOSED")
})

test("CircuitBreakerProvider: abre apos N falhas consecutivas (5xx)", async () => {
  const { setBehavior, provider } = scriptedProvider()
  setBehavior(async () => { throw new HttpError(503, "5xx-fail") })
  const cb = new CircuitBreakerProvider(provider, { failureThreshold: 3, resetTimeoutMs: 60_000 })

  for (let i = 0; i < 3; i++) {
    await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "fail-" + i }), /5xx-fail/)
  }
  assert.equal(cb.getState(), "OPEN")
})

test("CircuitBreakerProvider: 6a chamada apos 5 falhas e rejeitada sem chamar o provider (sem fetch)", async () => {
  const { provider, callCount, setBehavior } = scriptedProvider()
  setBehavior(async () => { throw new HttpError(503, "5xx-fail") })
  const cb = new CircuitBreakerProvider(provider, { failureThreshold: 5, resetTimeoutMs: 60_000 })

  for (let i = 0; i < 5; i++) {
    await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "fail-" + i }))
  }
  assert.equal(cb.getState(), "OPEN")
  assert.equal(callCount(), 5)

  const sixth = await cb.complete({ mode: "READ_ONLY", task: "sixth" })
  assert.equal(callCount(), 5, "a 6a chamada nao deveria ter chegado ao provider real")
  assert.equal(sixth.safety.canExecute, false)
  assert.equal(sixth.metadata?.blocked, true)
  assert.match(sixth.safety.blockedReasons[0], /Provedor temporariamente indisponivel/)
})

test("CircuitBreakerProvider: 4xx (exceto 429) nao conta como falha nem abre o circuito", async () => {
  const { provider, callCount, setBehavior } = scriptedProvider()
  setBehavior(async () => { throw new HttpError(401, "unauthorized") })
  const cb = new CircuitBreakerProvider(provider, { failureThreshold: 2, resetTimeoutMs: 60_000 })

  for (let i = 0; i < 10; i++) {
    await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "x" }))
  }
  assert.equal(cb.getState(), "CLOSED", "401 e erro da requisicao, nao do provider estar fora do ar")
  assert.equal(callCount(), 10, "nenhuma chamada deveria ter sido bloqueada pelo circuito")
})

test("CircuitBreakerProvider: 429 conta como falha de circuito", async () => {
  const { provider, setBehavior } = scriptedProvider()
  setBehavior(async () => { throw new HttpError(429, "rate limited upstream") })
  const cb = new CircuitBreakerProvider(provider, { failureThreshold: 2, resetTimeoutMs: 60_000 })

  await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "a" }))
  await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "b" }))
  assert.equal(cb.getState(), "OPEN")
})

test("CircuitBreakerProvider: erro sem status (timeout/rede) conta como falha", async () => {
  const { provider, setBehavior } = scriptedProvider()
  setBehavior(async () => { throw new Error("network down") })
  const cb = new CircuitBreakerProvider(provider, { failureThreshold: 2, resetTimeoutMs: 60_000 })

  await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "a" }))
  await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "b" }))
  assert.equal(cb.getState(), "OPEN")
})

test("CircuitBreakerProvider: OPEN -> HALF_OPEN apos resetTimeoutMs -> CLOSED com sucesso", async () => {
  const { provider, callCount, setBehavior } = scriptedProvider()
  setBehavior(async () => { throw new HttpError(500, "boom") })
  const cb = new CircuitBreakerProvider(provider, { failureThreshold: 2, resetTimeoutMs: 30 })

  await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "a" }))
  await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "b" }))
  assert.equal(cb.getState(), "OPEN")

  await new Promise((r) => setTimeout(r, 50))

  setBehavior(async (r) => makeResponse(r)) // provider "recuperou"
  const testCall = await cb.complete({ mode: "READ_ONLY", task: "teste-half-open" })
  assert.equal(testCall.text, "ok")
  assert.equal(cb.getState(), "CLOSED")
  assert.equal(callCount(), 3, "a chamada de teste em HALF_OPEN deveria ter chegado ao provider real")
})

test("CircuitBreakerProvider: HALF_OPEN com nova falha volta para OPEN", async () => {
  const { provider, setBehavior } = scriptedProvider()
  setBehavior(async () => { throw new HttpError(500, "boom") })
  const cb = new CircuitBreakerProvider(provider, { failureThreshold: 1, resetTimeoutMs: 30 })

  await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "a" }))
  assert.equal(cb.getState(), "OPEN")

  await new Promise((r) => setTimeout(r, 50))
  await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "half-open-test" }))
  assert.equal(cb.getState(), "OPEN", "falha durante o teste em HALF_OPEN deveria reabrir o circuito")
})

test("CircuitBreakerProvider: sucesso zera o contador de falhas consecutivas", async () => {
  const { provider, setBehavior } = scriptedProvider()
  setBehavior(async () => { throw new HttpError(500, "boom") })
  const cb = new CircuitBreakerProvider(provider, { failureThreshold: 3, resetTimeoutMs: 60_000 })

  await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "a" }))
  await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "b" }))
  setBehavior(async (r) => makeResponse(r))
  await cb.complete({ mode: "READ_ONLY", task: "c" }) // sucesso, zera contador
  setBehavior(async () => { throw new HttpError(500, "boom") })
  await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "d" }))
  await assert.rejects(() => cb.complete({ mode: "READ_ONLY", task: "e" }))
  assert.equal(cb.getState(), "CLOSED", "so 2 falhas consecutivas apos o reset, threshold e 3")
})

test("CircuitBreakerProvider: name/model delegam para o provider interno", () => {
  const { provider } = scriptedProvider()
  const cb = new CircuitBreakerProvider(provider)
  assert.equal(cb.name, "openrouter")
  assert.equal(cb.model, "fake-model")
})
