import { test, mock } from "node:test"
import assert from "node:assert/strict"
import { OpenRouterProvider } from "./OpenRouterProvider.ts"

function makeProvider(apiKey = "sk-test-key", model = "test-model-v1", timeoutMs?: number) {
  return new OpenRouterProvider(apiKey, model, timeoutMs)
}

function makeFastProvider(apiKey = "sk-test-key", model = "test-model-v1", timeoutMs = 50) {
  return new OpenRouterProvider(apiKey, model, timeoutMs, 0)
}

function mockFetch(response: object, status = 200) {
  const fn = mock.fn(() => Promise.resolve(new Response(JSON.stringify(response), { status })))
  mock.method(globalThis, "fetch", fn)
  return fn
}

test("OpenRouterProvider completa com resposta valida", async () => {
  const fetchMock = mockFetch({ choices: [{ message: { content: "Resposta OK" } }] })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  assert.equal(res.text, "Resposta OK")
  assert.equal(res.provider, "openrouter")
  assert.equal(fetchMock.mock.callCount(), 1)
})

test("OpenRouterProvider envia formato correto da request", async () => {
  let body: any = null
  const fetchMock = mock.fn((url: string, opts: any) => {
    body = JSON.parse(opts.body as string)
    return Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] })))
  })
  mock.method(globalThis, "fetch", fetchMock)

  const p = makeProvider("sk-abc", "gpt-4o")
  await p.complete({ mode: "READ_ONLY", task: "teste" })

  assert.match(body.messages[0].content, /JoeFelipe/)
  assert.equal(body.messages[1].content, "teste")
  assert.equal(body.model, "gpt-4o")
  assert.equal(body.max_tokens, 1024)
})

test("OpenRouterProvider usa request.maxTokens quando informado (Fase 10)", async () => {
  let body: any = null
  const fetchMock = mock.fn((url: string, opts: any) => {
    body = JSON.parse(opts.body as string)
    return Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] })))
  })
  mock.method(globalThis, "fetch", fetchMock)

  const p = makeProvider()
  await p.complete({ mode: "READ_ONLY", task: "teste", maxTokens: 256 })
  assert.equal(body.max_tokens, 256)
})

test("OpenRouterProvider expoe usage.total_tokens em metadata.tokensUsed (Fase 10)", async () => {
  mockFetch({ choices: [{ message: { content: "ok" } }], usage: { total_tokens: 42 } })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "teste" })
  assert.equal(res.metadata?.tokensUsed, 42)
})

test("OpenRouterProvider: metadata.tokensUsed fica undefined quando API nao reporta usage (Fase 10)", async () => {
  mockFetch({ choices: [{ message: { content: "ok" } }] })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "teste" })
  assert.equal(res.metadata?.tokensUsed, undefined)
})

test("OpenRouterProvider envia Authorization Bearer", async () => {
  let authHeader = ""
  const fetchMock = mock.fn((url: string, opts: any) => {
    authHeader = opts.headers?.Authorization ?? ""
    return Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] })))
  })
  mock.method(globalThis, "fetch", fetchMock)

  const p = makeProvider("sk-secret-123", "gpt-4o")
  await p.complete({ mode: "READ_ONLY", task: "teste" })
  assert.equal(authHeader, "Bearer sk-secret-123")
})

test("OpenRouterProvider bloqueia termo sensivel antes de chamar API", async () => {
  const fetchMock = mock.method(globalThis, "fetch", () => Promise.resolve(new Response("ok")))
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "fazer deploy em producao" })
  assert.ok(res.safety.blockedReasons.length > 0)
  assert.ok(res.text.includes("bloqueada"))
  assert.equal(fetchMock.mock.callCount(), 0)
})

test("OpenRouterProvider erro HTTP gera erro (sem retry)", async () => {
  mock.method(globalThis, "fetch", () => Promise.resolve(new Response("Unauthorized", { status: 401 })))
  const p = makeFastProvider()
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "teste" })
  }, /OpenRouter API error: 401/)
})

test("OpenRouterProvider timeout gera erro especifico (sem retry)", async () => {
  mock.method(globalThis, "fetch", (url: string, opts: any) => {
    return new Promise((_resolve, reject) => {
      opts?.signal?.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted", "AbortError"))
      })
    })
  })
  const p = makeFastProvider("key", "model", 50)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "teste" })
  }, /OpenRouter timeout apos/)
})

test("OpenRouterProvider retry apos falha transiente", async () => {
  let attempt = 0
  const fetchMock = mock.fn(() => {
    attempt++
    if (attempt < 2) return Promise.reject(new Error("transient error"))
    return Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: "sucesso apos retry" } }] })))
  })
  mock.method(globalThis, "fetch", fetchMock)

  const p = new OpenRouterProvider("key", "model", 5000, 1)
  const res = await p.complete({ mode: "READ_ONLY", task: "teste" })
  assert.equal(res.text, "sucesso apos retry")
  assert.equal(fetchMock.mock.callCount(), 2)
})

test("OpenRouterProvider erro nao contem api key", async () => {
  mock.method(globalThis, "fetch", () => Promise.reject(new Error("something broke")))
  const p = makeFastProvider("my-super-secret-key-12345")
  try {
    await p.complete({ mode: "READ_ONLY", task: "teste" })
    assert.fail("deveria ter lancado erro")
  } catch (err) {
    const msg = (err as Error).message
    assert.ok(!msg.includes("my-super-secret-key"))
    assert.ok(!msg.includes("12345"))
  }
})

test("OpenRouterProvider canExecute sempre false", async () => {
  mockFetch({ choices: [{ message: { content: "resposta" } }] })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "analisar" })
  assert.equal(res.safety.canExecute, false)
})

// ── Fase 9.6: robustez de producao (canary) ────────────────────────────────

test("OpenRouterProvider 429 (rate limit): mensagem categorizada e COM retry (transiente, backoff curto)", async () => {
  const fetchMock = mock.fn(() => Promise.resolve(new Response("Too Many Requests", { status: 429 })))
  mock.method(globalThis, "fetch", fetchMock)
  const p = makeProvider("sk-test", "model", 5000)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /429.*limite de requisicoes/)
  // 429 e tratado como transiente (diferente de 4xx permanente) — vale a
  // pena tentar de novo apos um pequeno backoff, ao contrario de timeout.
  assert.equal(fetchMock.mock.callCount(), 3)
})

test("OpenRouterProvider 500 (erro interno do provedor): mensagem categorizada, com retry ate esgotar", async () => {
  const fetchMock = mock.fn(() => Promise.resolve(new Response("Internal Error", { status: 500 })))
  mock.method(globalThis, "fetch", fetchMock)
  const p = new OpenRouterProvider("sk-test", "model", 5000, 1)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /500.*erro interno do provedor/)
  assert.equal(fetchMock.mock.callCount(), 2)
})

test("OpenRouterProvider modelo invalido (400 — status real observado no canary): mensagem categorizada e SEM retry", async () => {
  const fetchMock = mock.fn(() => Promise.resolve(new Response("Bad Request: model not found", { status: 400 })))
  mock.method(globalThis, "fetch", fetchMock)
  const p = makeProvider("sk-test", "modelo-que-nao-existe", 5000)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /400.*requisicao invalida/)
  assert.equal(fetchMock.mock.callCount(), 1)
})

test("OpenRouterProvider modelo inexistente (404): mensagem categorizada e SEM retry", async () => {
  const fetchMock = mock.fn(() => Promise.resolve(new Response("Model not found", { status: 404 })))
  mock.method(globalThis, "fetch", fetchMock)
  const p = makeProvider("sk-test", "modelo-que-nao-existe", 5000)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /404.*nao encontrado/)
  assert.equal(fetchMock.mock.callCount(), 1)
})

test("OpenRouterProvider chave invalida (401): mensagem categorizada e SEM retry", async () => {
  const fetchMock = mock.fn(() => Promise.resolve(new Response("Unauthorized", { status: 401 })))
  mock.method(globalThis, "fetch", fetchMock)
  const p = makeProvider("sk-invalida", "model", 5000)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /401.*chave invalida/)
  assert.equal(fetchMock.mock.callCount(), 1)
})

test("OpenRouterProvider provider offline (conexao recusada): erro propagado, sem crash do processo", async () => {
  mock.method(globalThis, "fetch", () => Promise.reject(new Error("connect ECONNREFUSED 127.0.0.1:443")))
  const p = makeFastProvider()
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /ECONNREFUSED/)
})

test("OpenRouterProvider resposta vazia (content vazio): mensagem segura, sem crash", async () => {
  mockFetch({ choices: [{ message: { content: "" } }] })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  assert.equal(res.text, "[OpenRouter] Sem resposta da API")
  assert.equal(res.safety.canExecute, false)
})

test("OpenRouterProvider resposta sem choices: mensagem segura, sem crash", async () => {
  mockFetch({})
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  assert.equal(res.text, "[OpenRouter] Sem resposta da API")
})

test("OpenRouterProvider resposta muito grande: e truncada com marcador, nao quebra o chat", async () => {
  const huge = "A".repeat(50_000)
  mockFetch({ choices: [{ message: { content: huge } }] })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  assert.ok(res.text.length < huge.length)
  assert.ok(res.text.includes("resposta truncada"))
})

test("OpenRouterProvider timeout: mensagem amigavel, texto nao trava (fallback via LlmEngine)", async () => {
  mock.method(globalThis, "fetch", (_url: string, opts: any) => {
    return new Promise((_resolve, reject) => {
      opts?.signal?.addEventListener("abort", () => reject(new DOMException("The operation was aborted", "AbortError")))
    })
  })
  const p = makeFastProvider("key", "model", 30)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /OpenRouter timeout apos/)
})

test("OpenRouterProvider timeout NAO e re-tentado mesmo com maxRetries > 0 (evita ~90s de espera na UI)", async () => {
  const fetchMock = mock.fn((_url: string, opts: any) => {
    return new Promise((_resolve, reject) => {
      opts?.signal?.addEventListener("abort", () => reject(new DOMException("The operation was aborted", "AbortError")))
    })
  })
  mock.method(globalThis, "fetch", fetchMock)
  const p = new OpenRouterProvider("key", "model", 30, 2)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /OpenRouter timeout apos/)
  assert.equal(fetchMock.mock.callCount(), 1, "timeout deve falhar rapido, sem retry (senao a espera vira ~3x o timeout)")
})