import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TaskOrchestrator } from "../orchestrator/TaskOrchestrator.ts";
import { StepDeriver } from "../orchestrator/StepDeriver.ts";
import { NoopExecutor } from "./executors/NoopExecutor.ts";
import { ExecutionEngine, SimpleRegistry } from "./ExecutionEngine.ts";
import { createKernel } from "../kernel/Kernel.ts";
import type { PlannedMission } from "../planner/types.ts";
import type { ExecutionCommand } from "./types.ts";

function tempRoot(): string {
  const d = mkdtempSync(join(tmpdir(), "joefelipe-exec-test-"));
  return d;
}

function clean(r: string) {
  try { rmSync(r, { recursive: true, force: true }); } catch { }
}

const sampleMission: PlannedMission = {
  id: "test-mission-1",
  goalId: "goal-1",
  order: 1,
  title: "Missao de teste",
  intent: "apenas testar o execution engine",
  executorId: "claude-code",
  type: "audit",
  status: "active",
  dependsOn: [],
  classification: "READ_ONLY",
};

function makeMission(over: Partial<PlannedMission> = {}): PlannedMission {
  return { ...sampleMission, ...over };
}

test("ExecutionCommand contem todos os campos do step", () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(makeMission());
    const step = o.steps[0];
    const cmd: ExecutionCommand = orc.buildCommand(step);

    assert.equal(cmd.stepId, step.id);
    assert.equal(cmd.missionId, step.missionId);
    assert.equal(cmd.executor, step.executor);
    assert.equal(cmd.prompt, step.prompt);
    assert.equal(cmd.timeout, 120_000);
    assert.equal(cmd.retry, 0);
    assert.ok(cmd.id.startsWith("cmd-"));
    assert.equal(cmd.mode, "READ_ONLY");
    assert.equal(cmd.workingDirectory, root);
    assert.deepEqual(cmd.metadata, { order: step.order, type: step.type, title: step.title });
  } finally {
    clean(root);
  }
});

test("NoopExecutor.execute retorna StepResult valido", async () => {
  const ex = new NoopExecutor();
  const cmd: ExecutionCommand = {
    id: "cmd-test",
    missionId: "m1",
    stepId: "s1",
    executor: "noop",
    mode: "READ_ONLY",
    workingDirectory: "/tmp",
    prompt: "hello world",
    timeout: 1000,
    retry: 0,
    environment: {},
    metadata: {},
  };

  const result = await ex.execute(cmd);
  assert.equal(result.success, true);
  assert.equal(result.result, "hello world");
  assert.equal(result.metadata?.executor, "noop");
});

test("Registry.resolve retorna executor pelo nome", () => {
  const reg = new SimpleRegistry();
  const cmd: ExecutionCommand = {
    id: "cmd-1", missionId: "m1", stepId: "s1", executor: "noop",
    mode: "READ_ONLY", workingDirectory: "/tmp", prompt: "x",
    timeout: 1000, retry: 0, environment: {}, metadata: {},
  };
  const ex = reg.resolve(cmd);
  assert.equal(ex.id, "noop");
});

test("Registry.resolve fallback se nome nao existe", () => {
  const reg = new SimpleRegistry();
  const cmd: ExecutionCommand = {
    id: "cmd-1", missionId: "m1", stepId: "s1", executor: "unknown-executor",
    mode: "READ_ONLY", workingDirectory: "/tmp", prompt: "x",
    timeout: 1000, retry: 0, environment: {}, metadata: {},
  };
  const ex = reg.resolve(cmd);
  assert.equal(ex.id, "noop");
});

test("Orchestrator aceita waiting_executor", () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(makeMission());
    const step = o.steps[0];
    assert.equal(step.status, "pending");

    const ok = orc.markWaiting(step.id);
    assert.equal(ok, true);
    assert.equal(step.status, "waiting_executor");

    const orc2 = new TaskOrchestrator(root);
    const o2 = orc2.get(o.id);
    assert.ok(o2);
    assert.equal(o2.steps.find((s) => s.id === step.id)?.status, "waiting_executor");
  } finally {
    clean(root);
  }
});

test("ExecutionEngine.runOnce executa fluxo completo", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(makeMission({ type: "audit" }));
    const engine = new ExecutionEngine(orc);

    const result = await engine.runOnce();
    assert.ok(result);
    assert.ok(result.result.success);
    assert.equal(result.result.result, o.steps[0].prompt);

    const updated = orc.get(o.id);
    assert.ok(updated);
    assert.equal(updated.steps[0].status, "completed");
  } finally {
    clean(root);
  }
});

test("ExecutionEngine.runAll executa todos ate completar", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(makeMission({ type: "feature", classification: "SAFE_WRITE" }));
    const engine = new ExecutionEngine(orc);

    const results = await engine.runAll();
    assert.equal(results.length, 4);
    assert.ok(results.every((r) => r.success));

    const updated = orc.get(o.id);
    assert.ok(updated);
    assert.equal(updated.status, "completed");
    assert.ok(updated.steps.every((s) => s.status === "completed"));
  } finally {
    clean(root);
  }
});

test("ExecutionEngine.runAll para no primeiro fail", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(makeMission({ type: "feature", classification: "SAFE_WRITE" }));

    // Os steps de uma missao "feature" usam o executor "claude-code" (via
    // STEP_EXECUTOR do StepDeriver). Registramos um fake com esse mesmo id
    // para que o registry o resolva no lugar do ClaudeExecutor (stub) default.
    let callCount = 0;
    const failingExecutor = {
      id: "claude-code",
      canHandle: (_cmd: ExecutionCommand) => true,
      execute: async (cmd: ExecutionCommand) => {
        callCount++;
        if (callCount === 1) {
          return { success: false, error: "erro forcado no primeiro step" };
        }
        return { success: true, result: cmd.prompt };
      },
    };

    const reg = new SimpleRegistry([failingExecutor]);
    const engine = new ExecutionEngine(orc, reg);

    const results = await engine.runAll();
    assert.equal(results.length, 1);
    assert.equal(results[0].success, false);
    assert.equal(results[0].error, "erro forcado no primeiro step");

    const updated = orc.get(o.id);
    assert.ok(updated);
    assert.equal(updated.status, "failed");
  } finally {
    clean(root);
  }
});

test("execution engine le kernelMode do kernel quando fornecido", async () => {
  const root = tempRoot();
  try {
    const kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    const orc = new TaskOrchestrator(root);
    orc.create(makeMission({ type: "feature", classification: "SAFE_WRITE" }));
    const engine = new ExecutionEngine(orc, undefined, undefined, kernel);

    const results = await engine.runAll();
    assert.equal(results.length, 2);
    assert.equal(results[0].success, true);
    assert.equal(results[1].success, false);
    assert.ok(results[1].error?.includes("nao permite"));
    assert.ok(results[1].error?.includes("READ_ONLY"));

    await kernel.destroy();
  } finally {
    clean(root);
  }
});

test("execution engine com kernel READ_ONLY permite steps READ_ONLY", async () => {
  const root = tempRoot();
  try {
    const kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    const orc = new TaskOrchestrator(root);
    const o = orc.create(makeMission({ type: "audit", classification: "READ_ONLY" }));
    const engine = new ExecutionEngine(orc, undefined, undefined, kernel);

    const results = await engine.runAll();
    assert.equal(results.length, 3);
    assert.ok(results.every((r) => r.success));

    const updated = orc.get(o.id);
    assert.ok(updated);
    assert.equal(updated.status, "completed");
    assert.ok(updated.steps.every((s) => s.status === "completed"));

    await kernel.destroy();
  } finally {
    clean(root);
  }
});

test("execution engine sem kernel usa fallback SAFE_WRITE", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(makeMission({ type: "feature", classification: "SAFE_WRITE" }));
    const engine = new ExecutionEngine(orc);

    const results = await engine.runAll();
    assert.equal(results.length, 4);
    assert.ok(results.every((r) => r.success));
  } finally {
    clean(root);
  }
});