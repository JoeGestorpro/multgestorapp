import { test } from "node:test";
import assert from "node:assert/strict";
import { LlmEngine } from "./LlmEngine.ts";
import { createKernel } from "../kernel/Kernel.ts";
import type { LlmProvider, LlmRequest, LlmResponse } from "./types.ts";
import type { LlmConfig } from "./llm-config.ts";

/** Provider "mock" que sempre falha — registrado sob o nome "mock" para
 * substituir o MockProvider real (default do LlmEngine sem config explicita),
 * sem precisar tocar em campos internos do engine. */
function brokenMockProvider(err: Error): LlmProvider {
  return {
    name: "mock",
    model: "test-model",
    async complete(_request: LlmRequest): Promise<LlmResponse> {
      throw err;
    },
  };
}

test("LlmEngine.complete: provider quebrado nunca lanca excecao (fallback seguro sempre)", async () => {
  const engine = new LlmEngine();
  engine.registry.register(brokenMockProvider(new Error("network down")));

  const response = await engine.complete({ mode: "READ_ONLY", task: "teste" });
  assert.equal(response.safety.canExecute, false);
  assert.equal(response.mode, "READ_ONLY");
  assert.ok(response.text.length > 0);
});

test("LlmEngine.complete: mensagem de erro do provider e sanitizada (chave nunca aparece)", async () => {
  const engine = new LlmEngine();
  const leaking = new Error("falha ao chamar API com Authorization: Bearer sk-super-secret-should-not-leak-123456");
  engine.registry.register(brokenMockProvider(leaking));

  const response = await engine.complete({ mode: "READ_ONLY", task: "teste" });
  assert.ok(!response.text.includes("sk-super-secret-should-not-leak-123456"));
  assert.ok(!JSON.stringify(response).includes("sk-super-secret-should-not-leak-123456"));
});

// Fase 9.19 (NVIDIA): chaves nvapi-... tem prefixo diferente de sk-... — sem
// a alternativa dedicada no API_KEY_PATTERN, uma chave vazada FORA do padrao
// "Bearer <token>" nao seria mascarada. Este teste usa a chave solta, sem a
// palavra "Bearer", para provar que a nova alternativa (nao so o fallback
// Bearer) e o que efetivamente mascara.
test("LlmEngine.complete: chave NVIDIA (nvapi-...) e sanitizada mesmo fora do padrao 'Bearer <token>'", async () => {
  const engine = new LlmEngine();
  const leaking = new Error("chave invalida: nvapi-super-secret-should-not-leak-654321 rejeitada pelo provedor");
  engine.registry.register(brokenMockProvider(leaking));

  const response = await engine.complete({ mode: "READ_ONLY", task: "teste" });
  assert.ok(!response.text.includes("nvapi-super-secret-should-not-leak-654321"));
  assert.ok(!JSON.stringify(response).includes("nvapi-super-secret-should-not-leak-654321"));
});

test("LlmEngine.complete: modo (READ_ONLY/PLAN_ONLY/etc.) e sempre preservado na resposta de fallback", async () => {
  const engine = new LlmEngine();
  engine.registry.register(brokenMockProvider(new Error("timeout")));

  const response = await engine.complete({ mode: "PLAN_ONLY", task: "teste" });
  assert.equal(response.mode, "PLAN_ONLY");
});

test("LlmEngine.complete: MockProvider funciona normalmente sem qualquer configuracao", async () => {
  const engine = new LlmEngine();
  const response = await engine.complete({ mode: "READ_ONLY", task: "analisar estado" });
  assert.equal(response.provider, "mock");
  assert.equal(response.safety.canExecute, false);
});

// ── Fase 9.19: complete() nunca chama um provider real sem o kernel permitir ──

function fakeRealProvider(): { provider: LlmProvider; called: () => boolean } {
  let called = false;
  const provider: LlmProvider = {
    name: "openrouter",
    model: "fake-real-model",
    async complete(_request: LlmRequest): Promise<LlmResponse> {
      called = true;
      return {
        provider: "openrouter",
        model: "fake-real-model",
        mode: _request.mode,
        text: "resposta real (nao deveria ter sido chamada se o kernel bloqueou)",
        safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
        metadata: { external: true },
      };
    },
  };
  return { provider, called: () => called };
}

const ENABLED_CONFIG: LlmConfig = {
  provider: "openrouter",
  model: "fake-real-model",
  externalCallsEnabled: true,
  openRouterApiKey: "sk-fake-key-for-test",
};

test("LlmEngine.complete: nao chama provider real quando o kernel esta READ_ONLY (fecha B-003)", async () => {
  const kernel = createKernel("READ_ONLY");
  const engine = new LlmEngine(kernel, ENABLED_CONFIG);
  const { provider, called } = fakeRealProvider();
  engine.registry.register(provider);

  const response = await engine.complete({ mode: "READ_ONLY", task: "analisar estado" });
  assert.equal(called(), false, "o provider real nunca deveria ser chamado sob kernel READ_ONLY");
  assert.equal(response.provider, "mock");
  assert.ok(response.text.includes("[Bloqueado]"));
  assert.equal(response.safety.requiresHumanApproval, true);
});

test("LlmEngine.complete: nao chama provider real quando o kernel esta LOCKED", async () => {
  const kernel = createKernel("LOCKED");
  const engine = new LlmEngine(kernel, ENABLED_CONFIG);
  const { provider, called } = fakeRealProvider();
  engine.registry.register(provider);

  const response = await engine.complete({ mode: "LOCKED", task: "analisar estado" });
  assert.equal(called(), false, "o provider real nunca deveria ser chamado sob kernel LOCKED");
  assert.equal(response.provider, "mock");
});

test("LlmEngine.complete: permite o provider real quando o kernel esta em modo permitido (PLAN_ONLY+)", async () => {
  const kernel = createKernel("PLAN_ONLY");
  const engine = new LlmEngine(kernel, ENABLED_CONFIG);
  const { provider, called } = fakeRealProvider();
  engine.registry.register(provider);

  const response = await engine.complete({ mode: "PLAN_ONLY", task: "analisar estado" });
  assert.equal(called(), true, "o provider real deveria ter sido chamado sob kernel PLAN_ONLY");
  assert.equal(response.provider, "openrouter");
  assert.equal(response.text.includes("[Bloqueado]"), false);
});

test("LlmEngine.complete: sem kernel (undefined), o gate de kernel nao bloqueia (comportamento anterior preservado)", async () => {
  const engine = new LlmEngine(undefined, ENABLED_CONFIG);
  const { provider, called } = fakeRealProvider();
  engine.registry.register(provider);

  const response = await engine.complete({ mode: "READ_ONLY", task: "analisar estado" });
  assert.equal(called(), true);
  assert.equal(response.provider, "openrouter");
});

test("LlmEngine.complete: externalCallsEnabled=false bloqueia o provider real mesmo com kernel permitindo", async () => {
  const kernel = createKernel("EXECUTE_APPROVED");
  const disabledConfig: LlmConfig = { ...ENABLED_CONFIG, externalCallsEnabled: false };
  const engine = new LlmEngine(kernel, disabledConfig);
  const { provider, called } = fakeRealProvider();
  engine.registry.register(provider);

  const response = await engine.complete({ mode: "EXECUTE_APPROVED", task: "analisar estado" });
  assert.equal(called(), false, "externalCallsEnabled=false deveria bloquear mesmo com kernel EXECUTE_APPROVED");
  assert.equal(response.provider, "mock");
  assert.ok(response.text.includes("[Bloqueado]"));
});

// ── Fase 10: wrappers de LLM Cost Safety (Budget/RateLimit/CircuitBreaker) ──

test("LlmEngine.getSafetyStatus: sem safety config, budgetActive e false (backward compat)", () => {
  const kernel = createKernel("PLAN_ONLY");
  const engine = new LlmEngine(kernel, ENABLED_CONFIG);
  assert.deepEqual(engine.getSafetyStatus(), { budgetActive: false });
});

test("LlmEngine: sem safety config, o provider real e chamado sem nenhum wrapper interposto", async () => {
  const kernel = createKernel("PLAN_ONLY");
  const engine = new LlmEngine(kernel, ENABLED_CONFIG);
  const { provider, called } = fakeRealProvider();
  // Substitui o provider ja registrado (openrouter) pelo fake, simulando o
  // que o construtor teria feito se a API key fosse valida.
  engine.registry.register(provider);

  const response = await engine.complete({ mode: "PLAN_ONLY", task: "analisar estado" });
  assert.equal(called(), true);
  assert.equal(response.provider, "openrouter");
});

test("LlmEngine: com budget configurado, a segunda chamada e bloqueada ao exceder o limite de tokens", async () => {
  const kernel = createKernel("PLAN_ONLY");
  let calls = 0;
  const engine = new LlmEngine(kernel, ENABLED_CONFIG, { budget: { maxTokensPerSession: 50 } });
  const provider: LlmProvider = {
    name: "openrouter",
    model: "fake-real-model",
    async complete(request: LlmRequest): Promise<LlmResponse> {
      calls += 1;
      return {
        provider: "openrouter",
        model: "fake-real-model",
        mode: request.mode,
        text: "resposta real",
        safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
        metadata: { tokensUsed: 60 },
      };
    },
  };
  engine.registry.register(engine.wrapWithSafety(provider));

  const first = await engine.complete({ mode: "PLAN_ONLY", task: "a" });
  assert.equal(first.text, "resposta real");

  const second = await engine.complete({ mode: "PLAN_ONLY", task: "b" });
  assert.equal(calls, 1, "a segunda chamada deveria ter sido bloqueada pelo BudgetProvider antes do provider real");
  assert.equal(second.safety.canExecute, false);
  assert.match(second.safety.blockedReasons[0], /Limite de tokens/);
});

test("LlmEngine.getSafetyStatus: com budget ativo, reflete uso real apos uma chamada", async () => {
  const kernel = createKernel("PLAN_ONLY");
  const engine = new LlmEngine(kernel, ENABLED_CONFIG, {
    sessionId: "agent-run-1",
    budget: { maxTokensPerSession: 1000, ratePerToken: 0.01 },
    rateLimit: { maxCalls: 10, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 5 },
  });
  const provider: LlmProvider = {
    name: "openrouter",
    model: "fake-real-model",
    async complete(request: LlmRequest): Promise<LlmResponse> {
      return {
        provider: "openrouter",
        model: "fake-real-model",
        mode: request.mode,
        text: "ok",
        safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
        metadata: { tokensUsed: 30 },
      };
    },
  };
  engine.registry.register(engine.wrapWithSafety(provider));

  await engine.complete({ mode: "PLAN_ONLY", task: "a" });
  const status = engine.getSafetyStatus();
  assert.equal(status.budgetActive, true);
  assert.equal(status.tokensUsed, 30);
  assert.equal(status.tokensLimit, 1000);
  assert.equal(status.budgetUsed, 0.3);
  assert.equal(status.rateLimitRemaining, 9);
  assert.equal(status.circuitState, "CLOSED");
});

test("LlmEngine.getSafetyStatus: rateLimitRemaining e por sessao, nao um bucket 'default' global", async () => {
  const kernel = createKernel("PLAN_ONLY");
  const engine = new LlmEngine(kernel, ENABLED_CONFIG, {
    budget: { maxTokensPerSession: 100_000 },
    rateLimit: { maxCalls: 5, windowMs: 60_000 },
  });
  const provider: LlmProvider = {
    name: "openrouter",
    model: "fake-real-model",
    async complete(request: LlmRequest): Promise<LlmResponse> {
      return {
        provider: "openrouter",
        model: "fake-real-model",
        mode: request.mode,
        text: "ok",
        safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
        metadata: {},
      };
    },
  };
  engine.registry.register(engine.wrapWithSafety(provider));

  await engine.complete({ mode: "PLAN_ONLY", task: "a", sessionId: "sess-real" });

  // Consultar sem sessionId (bucket "default") nao deveria refletir uma
  // chamada feita sob "sess-real" — cada sessao tem sua propria janela.
  assert.equal(engine.getSafetyStatus().rateLimitRemaining, 5);
  assert.equal(engine.getSafetyStatus("sess-real").rateLimitRemaining, 4);
});

test("LlmEngine: emite evento llm:cost no kernel apos complete() bem-sucedido de provider real", async () => {
  const kernel = createKernel("PLAN_ONLY");
  const engine = new LlmEngine(kernel, ENABLED_CONFIG);
  const provider: LlmProvider = {
    name: "openrouter",
    model: "fake-real-model",
    async complete(request: LlmRequest): Promise<LlmResponse> {
      return {
        provider: "openrouter",
        model: "fake-real-model",
        mode: request.mode,
        text: "ok",
        safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
        metadata: { tokensUsed: 15 },
      };
    },
  };
  engine.registry.register(provider);

  const events: unknown[] = [];
  kernel.events.on("llm:cost", (payload) => events.push(payload));

  await engine.complete({ mode: "PLAN_ONLY", task: "tarefa de teste", sessionId: "sess-xyz" });

  assert.equal(events.length, 1);
  const payload = events[0] as Record<string, unknown>;
  assert.equal(payload.provider, "openrouter");
  assert.equal(payload.model, "fake-real-model");
  assert.equal(payload.sessionId, "sess-xyz");
  assert.equal(payload.tokens, 15);
  assert.equal(payload.mode, "PLAN_ONLY");
  assert.equal(payload.taskSummary, "tarefa de teste");
});

test("LlmEngine: NAO emite evento llm:cost para respostas do MockProvider", async () => {
  const kernel = createKernel("READ_ONLY");
  const engine = new LlmEngine(kernel);

  const events: unknown[] = [];
  kernel.events.on("llm:cost", (payload) => events.push(payload));

  await engine.complete({ mode: "READ_ONLY", task: "teste" });
  assert.equal(events.length, 0);
});

test("LlmEngine: NAO emite evento llm:cost quando a chamada foi bloqueada pelo BudgetProvider", async () => {
  const kernel = createKernel("PLAN_ONLY");
  const engine = new LlmEngine(kernel, ENABLED_CONFIG, { budget: { maxTokensPerSession: 10 } });
  const provider: LlmProvider = {
    name: "openrouter",
    model: "fake-real-model",
    async complete(request: LlmRequest): Promise<LlmResponse> {
      return {
        provider: "openrouter",
        model: "fake-real-model",
        mode: request.mode,
        text: "ok",
        safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
        metadata: { tokensUsed: 20 },
      };
    },
  };
  engine.registry.register(engine.wrapWithSafety(provider));

  const events: unknown[] = [];
  kernel.events.on("llm:cost", (payload) => events.push(payload));

  await engine.complete({ mode: "PLAN_ONLY", task: "a" }); // consome 20 tokens, ja excede o limite de 10
  await engine.complete({ mode: "PLAN_ONLY", task: "b" }); // deveria ser bloqueada, sem novo evento

  assert.equal(events.length, 1, "so a primeira chamada (real) deveria ter gerado evento de custo");
});
