import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ClaudeExecutor } from "./ClaudeExecutor.ts";
import { OpenCodeExecutor } from "./OpenCodeExecutor.ts";
import { DriverRegistry } from "../drivers/DriverRegistry.ts";
import { createDefaultDriverRegistry } from "../drivers/index.ts";
import type { ExecutorDriver, DriverHealth } from "../drivers/types.ts";
import { TaskOrchestrator } from "../../orchestrator/TaskOrchestrator.ts";
import { ExecutionEngine, SimpleRegistry } from "../ExecutionEngine.ts";
import { createKernel } from "../../kernel/Kernel.ts";
import type { Kernel } from "../../kernel/Kernel.ts";
import type { PlannedMission } from "../../planner/types.ts";
import type { ExecutionCommand } from "../types.ts";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "joefelipe-driver-integration-"));
}

function clean(r: string) {
  try { rmSync(r, { recursive: true, force: true }); } catch { /* best-effort */ }
}

function makeCmd(executor: string): ExecutionCommand {
  return {
    id: "cmd-test",
    missionId: "m1",
    stepId: "s1",
    executor,
    mode: "SAFE_WRITE",
    workingDirectory: "/tmp",
    prompt: "hello",
    timeout: 1000,
    retry: 0,
    environment: {},
    metadata: {},
  };
}

function healthyFakeDriver(id: string, resultText: string): ExecutorDriver {
  return {
    id,
    async initialize() {},
    async health(): Promise<DriverHealth> {
      return { available: true, version: "1.0.0-fake", capabilities: ["read", "write"] };
    },
    supports: () => true,
    async execute(command: ExecutionCommand) {
      return { success: true, result: resultText, metadata: { driver: id, commandId: command.id } };
    },
    async cancel() {},
    async dispose() {},
  };
}

function unhealthyFakeDriver(id: string): ExecutorDriver {
  return {
    id,
    async initialize() {},
    async health(): Promise<DriverHealth> {
      return { available: false, version: null, capabilities: [] };
    },
    supports: () => true,
    async execute() {
      throw new Error("nao deveria ser chamado (driver indisponivel)");
    },
    async cancel() {},
    async dispose() {},
  };
}

// ── Selecao correta do driver via Executor ──────────────────────────────────

test("ClaudeExecutor: sem driver real registrado, comportamento identico ao stub anterior", async () => {
  const ex = new ClaudeExecutor();
  const result = await ex.execute(makeCmd("claude-code"));
  assert.equal(result.success, true);
  assert.equal(result.result, "hello");
  assert.equal(result.metadata?.stub, "true");
});

test("ClaudeExecutor: com driver real saudavel registrado, executa via ele (selecao correta)", async () => {
  const registry = new DriverRegistry();
  registry.register(healthyFakeDriver("claude-code", "resposta do driver real"));
  const ex = new ClaudeExecutor(registry);

  const result = await ex.execute(makeCmd("claude-code"));
  assert.equal(result.success, true);
  assert.equal(result.result, "resposta do driver real");
  assert.equal(result.metadata?.driver, "claude-code");
});

test("ClaudeExecutor: com driver real indisponivel, cai para o stub automaticamente (fallback)", async () => {
  const registry = new DriverRegistry();
  registry.register(unhealthyFakeDriver("claude-code"));
  const ex = new ClaudeExecutor(registry);

  const result = await ex.execute(makeCmd("claude-code"));
  assert.equal(result.success, true);
  assert.equal(result.metadata?.stub, "true");
});

test("OpenCodeExecutor: com driver real saudavel registrado, executa via ele (selecao correta)", async () => {
  const registry = new DriverRegistry();
  registry.register(healthyFakeDriver("opencode", "resposta opencode real"));
  const ex = new OpenCodeExecutor(registry);

  const result = await ex.execute(makeCmd("opencode"));
  assert.equal(result.success, true);
  assert.equal(result.result, "resposta opencode real");
});

test("OpenCodeExecutor: com driver real indisponivel, cai para o stub automaticamente (fallback)", async () => {
  const registry = new DriverRegistry();
  registry.register(unhealthyFakeDriver("opencode"));
  const ex = new OpenCodeExecutor(registry);

  const result = await ex.execute(makeCmd("opencode"));
  assert.equal(result.success, true);
  assert.equal(result.metadata?.stub, "true");
});

// ── ExecutionEngine continua desacoplado do driver (so conhece Executor) ────

const featureMission: PlannedMission = {
  id: "driver-integration-mission-1",
  goalId: "goal-1",
  order: 1,
  title: "Missao de integracao driver",
  intent: "testar que o engine nao precisa saber qual driver esta por tras do executor",
  executorId: "claude-code",
  type: "feature",
  status: "active",
  dependsOn: [],
  classification: "SAFE_WRITE",
};

test("ExecutionEngine: com um driver real injetado no Executor, o engine roda normalmente sem qualquer mudanca no seu proprio codigo", async () => {
  const root = tempRoot();
  let kernel;
  try {
    kernel = createKernel("EXECUTE_APPROVED");
    await kernel.initialize();

    const registry = new DriverRegistry();
    registry.register(healthyFakeDriver("claude-code", "step executado pelo driver real fake"));
    const claudeExecutor = new ClaudeExecutor(registry);

    const orc = new TaskOrchestrator(root);
    orc.create(featureMission);
    const engine = new ExecutionEngine(orc, new SimpleRegistry([claudeExecutor]), undefined, kernel);

    const results = await engine.runAll();
    assert.ok(results.length > 0);
    assert.ok(results.every((r) => r.success));
    assert.ok(results.some((r) => r.result === "step executado pelo driver real fake"));
  } finally {
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("ExecutionEngine: Policy/READ_ONLY continua bloqueando SAFE_WRITE mesmo com driver real saudavel injetado", async () => {
  const root = tempRoot();
  let kernel;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    const registry = new DriverRegistry();
    registry.register(healthyFakeDriver("claude-code", "nao deveria aparecer: policy bloqueia antes"));
    const claudeExecutor = new ClaudeExecutor(registry);

    const orc = new TaskOrchestrator(root);
    orc.create(featureMission);
    const engine = new ExecutionEngine(orc, new SimpleRegistry([claudeExecutor]), undefined, kernel);

    const results = await engine.runAll();
    const anySafeWriteDenied = results.some((r) => !r.success && r.error?.includes("READ_ONLY"));
    assert.ok(anySafeWriteDenied, "algum step SAFE_WRITE deveria ser negado pela policy sob kernel READ_ONLY, mesmo com driver real saudavel");
  } finally {
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.19: LLM real controlado — o driver de texto real (OpenRouterText-
// Driver, registrado no lugar do ClaudeDriver placeholder por createDefault-
// DriverRegistry) so executa de verdade quando a ExternalCallPolicy permite
// (aprovacao humana explicita), nunca por acao automatica. ───────────────────

const auditMissionForLlm: PlannedMission = {
  id: "driver-integration-llm-mission-1",
  goalId: "goal-1",
  order: 1,
  title: "Auditoria com LLM real controlada",
  intent: "analisar o estado atual do projeto",
  executorId: "claude-code",
  type: "audit",
  status: "active",
  dependsOn: [],
  classification: "READ_ONLY",
};

async function withOpenRouterEnv<T>(fn: () => Promise<T>): Promise<T> {
  const originalProvider = process.env.JOEFELIPE_LLM_PROVIDER;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.JOEFELIPE_LLM_PROVIDER = "openrouter";
  process.env.OPENROUTER_API_KEY = "sk-fake-key-for-e2e-test";
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === "string" ? input : input?.url ?? "";
    if (url.includes("openrouter.ai")) {
      return new Response(JSON.stringify({ choices: [{ message: { content: "Analise real simulada via OpenRouter" } }] }));
    }
    return originalFetch(input, init);
  }) as typeof fetch;

  try {
    return await fn();
  } finally {
    globalThis.fetch = originalFetch;
    if (originalProvider === undefined) delete process.env.JOEFELIPE_LLM_PROVIDER;
    else process.env.JOEFELIPE_LLM_PROVIDER = originalProvider;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalKey;
  }
}

test("Fase 9.19 e2e: step 'analyze' NAO usa o driver real de LLM quando o kernel nao esta em modo aprovado (ExternalCallPolicy bloqueia)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  try {
    await withOpenRouterEnv(async () => {
      kernel = createKernel("READ_ONLY");
      await kernel.initialize();

      const driverRegistry = createDefaultDriverRegistry();
      const claudeExecutor = new ClaudeExecutor(driverRegistry);

      const orc = new TaskOrchestrator(root);
      orc.create(auditMissionForLlm);
      const engine = new ExecutionEngine(orc, new SimpleRegistry([claudeExecutor]), undefined, kernel);

      const res = await engine.runOnce();
      assert.ok(res);
      assert.equal(res!.result.success, false);
      assert.ok(res!.result.error?.includes("aprovacao humana"));
    });
  } finally {
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("Fase 9.19 e2e: step 'analyze' usa o driver real de LLM quando aprovado (EXECUTE_APPROVED) e a chave esta configurada", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  try {
    await withOpenRouterEnv(async () => {
      kernel = createKernel("EXECUTE_APPROVED");
      await kernel.initialize();

      const driverRegistry = createDefaultDriverRegistry();
      const claudeExecutor = new ClaudeExecutor(driverRegistry);

      const orc = new TaskOrchestrator(root);
      orc.create(auditMissionForLlm);
      const engine = new ExecutionEngine(orc, new SimpleRegistry([claudeExecutor]), undefined, kernel);

      const res = await engine.runOnce();
      assert.ok(res);
      assert.equal(res!.result.success, true);
      assert.equal(res!.result.result, "Analise real simulada via OpenRouter");
      assert.equal(res!.result.metadata?.driver, "claude-code");
      assert.equal(res!.result.metadata?.stub, undefined, "nao deveria ter caido no StubDriver — o driver real deveria ter sido usado");
    });
  } finally {
    if (kernel) await kernel.destroy();
    clean(root);
  }
});
