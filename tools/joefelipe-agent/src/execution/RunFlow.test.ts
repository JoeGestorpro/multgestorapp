import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TaskOrchestrator } from "../orchestrator/TaskOrchestrator.ts";
import { ExecutionEngine, SimpleRegistry } from "./ExecutionEngine.ts";
import { createKernel } from "../kernel/Kernel.ts";
import type { PlannedMission } from "../planner/types.ts";

function tempRoot(): string {
  const d = mkdtempSync(join(tmpdir(), "joefelipe-runflow-"));
  return d;
}

function clean(r: string) {
  try { rmSync(r, { recursive: true, force: true }); } catch { }
}

const sampleMission: PlannedMission = {
  id: "runflow-test-1",
  goalId: "goal-1",
  order: 1,
  title: "RunFlow de teste",
  intent: "testar o fluxo completo planner -> orchestrator -> engine",
  executorId: "noop",
  type: "audit",
  status: "planned",
  dependsOn: [],
  classification: "READ_ONLY",
};

test("RunFlow executa missao do plano", async () => {
  const root = tempRoot();
  try {
    const kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    const o = orc.create(sampleMission);

    assert.equal(o.steps.length, 3);
    assert.equal(o.status, "pending");

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

test("RunFlow abort interrompe execucao", async () => {
  const root = tempRoot();
  try {
    const kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    orc.create(sampleMission);

    const engine = new ExecutionEngine(orc, undefined, undefined, kernel);

    assert.equal(engine.status.running, false);
    assert.equal(engine.status.abortRequested, false);

    engine.abort();
    assert.equal(engine.status.running, false);
    assert.equal(engine.status.abortRequested, true);

    await kernel.destroy();
  } finally {
    clean(root);
  }
});