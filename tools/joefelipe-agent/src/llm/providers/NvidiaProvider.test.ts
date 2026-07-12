import { test, mock } from "node:test"
import assert from "node:assert/strict"
import { NvidiaProvider } from "./NvidiaProvider.ts"

function makeProvider(apiKey = "nvapi-test-key", model = "test-model-v1", timeoutMs?: number) {
  return new NvidiaProvider(apiKey, model, timeoutMs)
}

function makeFastProvider(apiKey = "nvapi-test-key", model = "test-model-v1", timeoutMs = 50) {
  return new NvidiaProvider(apiKey, model, timeoutMs, 0)
}

function mockFetch(response: object, status = 200) {
  const fn = mock.fn(() => Promise.resolve(new Response(JSON.stringify(response), { status })))
  mock.method(globalThis, "fetch", fn)
  return fn
}

test("NvidiaProvider completa com resposta valida", async () => {
  const fetchMock = mockFetch({ choices: [{ message: { content: "Resposta OK" } }] })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  assert.equal(res.text, "Resposta OK")
  assert.equal(res.provider, "nvidia")
  assert.equal(fetchMock.mock.callCount(), 1)
})

test("NvidiaProvider envia formato correto da request (nao-streaming, sem extra_body)", async () => {
  let body: any = null
  const fetchMock = mock.fn((url: string, opts: any) => {
    body = JSON.parse(opts.body as string)
    return Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] })))
  })
  mock.method(globalThis, "fetch", fetchMock)

  const p = makeProvider("nvapi-abc", "deepseek-ai/deepseek-v4-flash")
  await p.complete({ mode: "READ_ONLY", task: "teste" })

  assert.match(body.messages[0].content, /JoeFelipe/)
  assert.equal(body.messages[1].content, "teste")
  assert.equal(body.model, "deepseek-ai/deepseek-v4-flash")
  assert.equal(body.max_tokens, 1024)
  assert.equal(body.stream, false, "esta fase e nao-streaming, explicito no corpo da requisicao")
  assert.equal(body.extra_body, undefined, "sem chat_template_kwargs/thinking nesta versao minima")
})

test("NvidiaProvider usa request.maxTokens quando informado (Fase 10)", async () => {
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

test("NvidiaProvider expoe usage.total_tokens em metadata.tokensUsed (Fase 10)", async () => {
  mockFetch({ choices: [{ message: { content: "ok" } }], usage: { total_tokens: 77 } })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "teste" })
  assert.equal(res.metadata?.tokensUsed, 77)
})

test("NvidiaProvider: metadata.tokensUsed fica undefined quando API nao reporta usage (Fase 10)", async () => {
  mockFetch({ choices: [{ message: { content: "ok" } }] })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "teste" })
  assert.equal(res.metadata?.tokensUsed, undefined)
})

test("NvidiaProvider envia Authorization Bearer", async () => {
  let authHeader = ""
  const fetchMock = mock.fn((url: string, opts: any) => {
    authHeader = opts.headers?.Authorization ?? ""
    return Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] })))
  })
  mock.method(globalThis, "fetch", fetchMock)

  const p = makeProvider("nvapi-secret-123", "deepseek-ai/deepseek-v4-flash")
  await p.complete({ mode: "READ_ONLY", task: "teste" })
  assert.equal(authHeader, "Bearer nvapi-secret-123")
})

test("NvidiaProvider bloqueia termo sensivel antes de chamar API", async () => {
  const fetchMock = mock.method(globalThis, "fetch", () => Promise.resolve(new Response("ok")))
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "fazer deploy em producao" })
  assert.ok(res.safety.blockedReasons.length > 0)
  assert.ok(res.text.includes("bloqueada"))
  assert.equal(fetchMock.mock.callCount(), 0)
})

// ── Fase 9.19: reasoning/reasoning_content NUNCA vaza (decisao explicita) ──

test("NvidiaProvider: reasoning_content NUNCA aparece em res.text — so message.content", async () => {
  mockFetch({
    choices: [{
      message: {
        content: "Resposta final publica",
        reasoning_content: "cadeia de raciocinio interna que NUNCA deve ser exibida ao usuario",
      },
    }],
  })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  assert.equal(res.text, "Resposta final publica")
  assert.ok(!res.text.includes("cadeia de raciocinio"));
  assert.ok(!JSON.stringify(res).includes("cadeia de raciocinio"), "reasoning_content nao deveria vazar em NENHUM campo da resposta");
})

test("NvidiaProvider: campo 'reasoning' (variante alternativa) tambem e descartado", async () => {
  mockFetch({
    choices: [{
      message: {
        content: "Resposta final publica",
        reasoning: "outro raciocinio interno que tambem nunca deve vazar",
      },
    }],
  })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  assert.equal(res.text, "Resposta final publica")
  assert.ok(!JSON.stringify(res).includes("outro raciocinio"));
})

test("NvidiaProvider erro HTTP gera erro (sem retry)", async () => {
  mock.method(globalThis, "fetch", () => Promise.resolve(new Response("Unauthorized", { status: 401 })))
  const p = makeFastProvider()
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "teste" })
  }, /NVIDIA API error: 401/)
})

test("NvidiaProvider timeout gera erro especifico (sem retry)", async () => {
  mock.method(globalThis, "fetch", (url: string, opts: any) => {
    return new Promise((_resolve, reject) => {
      opts?.signal?.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted", "AbortError"))
      })
    })
  })
  const p = makeFastProvider("nvapi-key", "model", 50)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "teste" })
  }, /NVIDIA timeout apos/)
})

test("NvidiaProvider retry apos falha transiente", async () => {
  let attempt = 0
  const fetchMock = mock.fn(() => {
    attempt++
    if (attempt < 2) return Promise.reject(new Error("transient error"))
    return Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: "sucesso apos retry" } }] })))
  })
  mock.method(globalThis, "fetch", fetchMock)

  const p = new NvidiaProvider("nvapi-key", "model", 5000, 1)
  const res = await p.complete({ mode: "READ_ONLY", task: "teste" })
  assert.equal(res.text, "sucesso apos retry")
  assert.equal(fetchMock.mock.callCount(), 2)
})

test("NvidiaProvider erro nao contem api key", async () => {
  mock.method(globalThis, "fetch", () => Promise.reject(new Error("something broke")))
  const p = makeFastProvider("nvapi-my-super-secret-key-12345")
  try {
    await p.complete({ mode: "READ_ONLY", task: "teste" })
    assert.fail("deveria ter lancado erro")
  } catch (err) {
    const msg = (err as Error).message
    assert.ok(!msg.includes("my-super-secret-key"))
    assert.ok(!msg.includes("12345"))
  }
})

test("NvidiaProvider canExecute sempre false", async () => {
  mockFetch({ choices: [{ message: { content: "resposta" } }] })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "analisar" })
  assert.equal(res.safety.canExecute, false)
})

test("NvidiaProvider 429 (rate limit): mensagem categorizada e COM retry (transiente, backoff curto)", async () => {
  const fetchMock = mock.fn(() => Promise.resolve(new Response("Too Many Requests", { status: 429 })))
  mock.method(globalThis, "fetch", fetchMock)
  const p = makeProvider("nvapi-test", "model", 5000)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /429.*limite de requisicoes/)
  assert.equal(fetchMock.mock.callCount(), 3)
})

test("NvidiaProvider 500 (erro interno do provedor): mensagem categorizada, com retry ate esgotar", async () => {
  const fetchMock = mock.fn(() => Promise.resolve(new Response("Internal Error", { status: 500 })))
  mock.method(globalThis, "fetch", fetchMock)
  const p = new NvidiaProvider("nvapi-test", "model", 5000, 1)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /500.*erro interno do provedor/)
  assert.equal(fetchMock.mock.callCount(), 2)
})

test("NvidiaProvider modelo invalido (400): mensagem categorizada e SEM retry", async () => {
  const fetchMock = mock.fn(() => Promise.resolve(new Response("Bad Request: model not found", { status: 400 })))
  mock.method(globalThis, "fetch", fetchMock)
  const p = makeProvider("nvapi-test", "modelo-que-nao-existe", 5000)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /400.*requisicao invalida/)
  assert.equal(fetchMock.mock.callCount(), 1)
})

test("NvidiaProvider modelo inexistente (404): mensagem categorizada e SEM retry", async () => {
  const fetchMock = mock.fn(() => Promise.resolve(new Response("Model not found", { status: 404 })))
  mock.method(globalThis, "fetch", fetchMock)
  const p = makeProvider("nvapi-test", "modelo-que-nao-existe", 5000)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /404.*nao encontrado/)
  assert.equal(fetchMock.mock.callCount(), 1)
})

test("NvidiaProvider chave invalida (401): mensagem categorizada e SEM retry", async () => {
  const fetchMock = mock.fn(() => Promise.resolve(new Response("Unauthorized", { status: 401 })))
  mock.method(globalThis, "fetch", fetchMock)
  const p = makeProvider("nvapi-invalida", "model", 5000)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /401.*chave invalida/)
  assert.equal(fetchMock.mock.callCount(), 1)
})

test("NvidiaProvider provider offline (conexao recusada): erro propagado, sem crash do processo", async () => {
  mock.method(globalThis, "fetch", () => Promise.reject(new Error("connect ECONNREFUSED 127.0.0.1:443")))
  const p = makeFastProvider()
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /ECONNREFUSED/)
})

test("NvidiaProvider resposta vazia (content vazio): mensagem segura, sem crash", async () => {
  mockFetch({ choices: [{ message: { content: "" } }] })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  assert.equal(res.text, "[NVIDIA] Sem resposta da API")
  assert.equal(res.safety.canExecute, false)
})

test("NvidiaProvider resposta sem choices: mensagem segura, sem crash", async () => {
  mockFetch({})
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  assert.equal(res.text, "[NVIDIA] Sem resposta da API")
})

test("NvidiaProvider resposta muito grande: e truncada com marcador, nao quebra o chat", async () => {
  const huge = "A".repeat(50_000)
  mockFetch({ choices: [{ message: { content: huge } }] })
  const p = makeProvider()
  const res = await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  assert.ok(res.text.length < huge.length)
  assert.ok(res.text.includes("resposta truncada"))
})

test("NvidiaProvider timeout NAO e re-tentado mesmo com maxRetries > 0 (evita ~90s de espera na UI)", async () => {
  const fetchMock = mock.fn((_url: string, opts: any) => {
    return new Promise((_resolve, reject) => {
      opts?.signal?.addEventListener("abort", () => reject(new DOMException("The operation was aborted", "AbortError")))
    })
  })
  mock.method(globalThis, "fetch", fetchMock)
  const p = new NvidiaProvider("nvapi-key", "model", 30, 2)
  await assert.rejects(async () => {
    await p.complete({ mode: "READ_ONLY", task: "analisar estado" })
  }, /NVIDIA timeout apos/)
  assert.equal(fetchMock.mock.callCount(), 1, "timeout deve falhar rapido, sem retry")
})
