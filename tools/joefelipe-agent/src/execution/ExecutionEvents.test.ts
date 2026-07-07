import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TaskOrchestrator } from "../orchestrator/TaskOrchestrator.ts";
import { ExecutionEngine, SimpleRegistry } from "./ExecutionEngine.ts";
import { PolicyEngine } from "./policy/PolicyEngine.ts";
import { EventStore } from "../events/EventStore.ts";
import type { PlannedMission } from "../planner/types.ts";
import type { ExecutionCommand } from "./types.ts";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "joefelipe-events-"));
}

function clean(r: string) {
  try { rmSync(r, { recursive: true, force: true }); } catch { }
}

const auditMission: PlannedMission = {
  id: "events-test-1",
  goalId: "goal-1",
  order: 1,
  title: "Missao de auditoria",
  intent: "testar integracao com o EventStore",
  executorId: "claude-code",
  type: "audit",
  status: "active",
  dependsOn: [],
  classification: "READ_ONLY",
};

test("execucao bem-sucedida grava execution_started e execution_completed", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    orc.create(auditMission);
    const eventStore = new EventStore(root);
    const engine = new ExecutionEngine(orc, undefined, undefined, undefined, eventStore);

    const results = await engine.runAll();
    assert.ok(results.every((r) => r.success));

    const events = eventStore.list(50);
    const types = events.map((e) => e.type);
    assert.ok(types.includes("execution_started"));
    assert.ok(types.includes("execution_completed"));
    assert.ok(types.includes("step_completed"));
    assert.ok(types.includes("executor_resolved"));
  } finally {
    clean(root);
  }
});

test("step falho grava step_failed e execution_failed", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    orc.create(auditMission);
    const eventStore = new EventStore(root);

    const failingExecutor = {
      id: "claude-code",
      canHandle: (_cmd: ExecutionCommand) => true,
      execute: async (_cmd: ExecutionCommand) => ({ success: false, error: "erro simulado" }),
    };
    const reg = new SimpleRegistry([failingExecutor]);
    const engine = new ExecutionEngine(orc, reg, undefined, undefined, eventStore);

    await engine.runAll();

    const events = eventStore.list(50);
    const types = events.map((e) => e.type);
    assert.ok(types.includes("step_failed"));
    assert.ok(types.includes("execution_failed"));
  } finally {
    clean(root);
  }
});

test("policy_denied e gravado quando a policy nega o step", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    orc.create(auditMission);
    const eventStore = new EventStore(root);

    const blockingPolicy = new PolicyEngine([
      { name: "BlockAll", evaluate: () => ({ allowed: false, reason: "bloqueado para teste" }) },
    ]);
    const engine = new ExecutionEngine(orc, undefined, blockingPolicy, undefined, eventStore);

    await engine.runOnce();

    const events = eventStore.list(50);
    const denied = events.find((e) => e.type === "policy_denied");
    assert.ok(denied);
    assert.equal(denied.severity, "warning");
    assert.equal(denied.payload.reason, "bloqueado para teste");
  } finally {
    clean(root);
  }
});

test("abort grava execution_aborted", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const featureMission: PlannedMission = {
      ...auditMission,
      id: "events-test-abort-1",
      type: "feature",
      classification: "SAFE_WRITE",
    };
    orc.create(featureMission);
    const eventStore = new EventStore(root);

    // Simula um abort disparado por um processo externo enquanto o primeiro
    // step ainda esta rodando (o executor chama engine.abort() como side-effect).
    let engineRef: ExecutionEngine;
    const abortingExecutor = {
      id: "claude-code",
      canHandle: (_cmd: ExecutionCommand) => true,
      execute: async (cmd: ExecutionCommand) => {
        engineRef.abort();
        return { success: true, result: cmd.prompt };
      },
    };
    const reg = new SimpleRegistry([abortingExecutor]);
    const engine = new ExecutionEngine(orc, reg, undefined, undefined, eventStore);
    engineRef = engine;

    const results = await engine.runAll();
    assert.equal(results.length, 1, "somente o primeiro step deve rodar antes do abort");

    const events = eventStore.list(50);
    const types = events.map((e) => e.type);
    assert.ok(types.includes("execution_aborted"));
  } finally {
    clean(root);
  }
});

test("payload dos eventos nao contem secrets nem environment sensivel", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    orc.create(auditMission);
    const eventStore = new EventStore(root);
    const engine = new ExecutionEngine(orc, undefined, undefined, undefined, eventStore);

    await engine.runAll();

    const events = eventStore.list(50);
    assert.ok(events.length > 0);
    for (const e of events) {
      const raw = JSON.stringify(e.payload).toLowerCase();
      assert.ok(!raw.includes("api_key"));
      assert.ok(!raw.includes("environment"));
      assert.ok(!("environment" in e.payload));
      assert.ok(!("prompt" in e.payload));
    }
  } finally {
    clean(root);
  }
});
