import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TaskOrchestrator } from "../orchestrator/TaskOrchestrator.ts";
import { ExecutionEngine, SimpleRegistry } from "./ExecutionEngine.ts";
import { ExecutionStateStore } from "./ExecutionStateStore.ts";
import type { PlannedMission } from "../planner/types.ts";
import type { ExecutionCommand } from "./types.ts";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "joefelipe-persistence-"));
}

function clean(r: string) {
  try { rmSync(r, { recursive: true, force: true }); } catch { }
}

const featureMission: PlannedMission = {
  id: "persist-test-1",
  goalId: "goal-1",
  order: 1,
  title: "Missao com escrita segura",
  intent: "testar persistencia de execucao",
  executorId: "claude-code",
  type: "feature",
  status: "active",
  dependsOn: [],
  classification: "SAFE_WRITE",
};

test("engine salva estado ao iniciar execucao (running, steps presentes)", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(featureMission);
    const store = new ExecutionStateStore(root);
    const engine = new ExecutionEngine(orc, undefined, undefined, undefined, undefined, store);

    await engine.runOnce();

    const state = store.load();
    assert.ok(state);
    assert.equal(state.orchestrationId, o.id);
    assert.equal(state.missionId, o.missionId);
    assert.equal(state.status, "running");
    assert.equal(state.steps.length, o.steps.length);
    assert.equal(state.steps[0].status, "completed");
  } finally {
    clean(root);
  }
});

test("engine atualiza progresso step a step no estado persistido", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    orc.create(featureMission);
    const store = new ExecutionStateStore(root);
    const engine = new ExecutionEngine(orc, undefined, undefined, undefined, undefined, store);

    await engine.runOnce();
    let state = store.load();
    assert.ok(state);
    const completedAfter1 = state.steps.filter((s) => s.status === "completed").length;
    assert.equal(completedAfter1, 1);

    await engine.runOnce();
    state = store.load();
    assert.ok(state);
    const completedAfter2 = state.steps.filter((s) => s.status === "completed").length;
    assert.equal(completedAfter2, 2);
  } finally {
    clean(root);
  }
});

test("store.markAbortRequested marca abort persistente (equivalente a run abort)", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    orc.create(featureMission);
    const store = new ExecutionStateStore(root);
    const engine = new ExecutionEngine(orc, undefined, undefined, undefined, undefined, store);

    await engine.runOnce();
    const marked = store.markAbortRequested();
    assert.equal(marked, true);
    assert.equal(store.isAbortRequested(), true);
  } finally {
    clean(root);
  }
});

test("engine para ao detectar abort persistente antes do proximo step", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(featureMission);
    const store = new ExecutionStateStore(root);

    let executorCalls = 0;
    const countingExecutor = {
      id: "claude-code",
      canHandle: (_cmd: ExecutionCommand) => true,
      execute: async (cmd: ExecutionCommand) => {
        executorCalls++;
        return { success: true, result: cmd.prompt };
      },
    };
    const reg = new SimpleRegistry([countingExecutor]);
    const engine = new ExecutionEngine(orc, reg, undefined, undefined, undefined, store);

    // Primeiro step roda normalmente e persiste o estado.
    const first = await engine.runOnce();
    assert.ok(first?.result.success);
    assert.equal(executorCalls, 1);

    // Simula um segundo processo pedindo abort via store.
    const marked = store.markAbortRequested();
    assert.equal(marked, true);

    // O engine deve detectar o abort persistido e nao chamar o executor de novo.
    const second = await engine.runOnce();
    assert.equal(second, null);
    assert.equal(executorCalls, 1, "executor nao deve ser chamado apos abort persistente");

    const updated = orc.get(o.id);
    assert.ok(updated);
    assert.notEqual(updated.steps[1].status, "completed");
  } finally {
    clean(root);
  }
});

test("run status consegue ler o estado persistido (store.load)", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    orc.create(featureMission);
    const store = new ExecutionStateStore(root);
    const engine = new ExecutionEngine(orc, undefined, undefined, undefined, undefined, store);

    await engine.runOnce();

    const state = store.load();
    assert.ok(state);
    assert.equal(typeof state.status, "string");
    assert.ok(Array.isArray(state.steps));
  } finally {
    clean(root);
  }
});

test("clear remove o estado ao finalizar toda a orquestracao com sucesso", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    orc.create(featureMission);
    const store = new ExecutionStateStore(root);
    const engine = new ExecutionEngine(orc, undefined, undefined, undefined, undefined, store);

    const results = await engine.runAll();
    assert.ok(results.every((r) => r.success));

    const state = store.load();
    assert.equal(state, null, "estado deve ser limpo apos sucesso total");
  } finally {
    clean(root);
  }
});

test("falha em um step salva o erro no estado persistido", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    orc.create(featureMission);
    const store = new ExecutionStateStore(root);

    const failingExecutor = {
      id: "claude-code",
      canHandle: (_cmd: ExecutionCommand) => true,
      execute: async (_cmd: ExecutionCommand) => ({ success: false, error: "falha simulada no step" }),
    };
    const reg = new SimpleRegistry([failingExecutor]);
    const engine = new ExecutionEngine(orc, reg, undefined, undefined, undefined, store);

    const results = await engine.runAll();
    assert.equal(results.length, 1);
    assert.equal(results[0].success, false);

    const state = store.load();
    assert.ok(state);
    assert.equal(state.status, "failed");
    assert.equal(state.error, "falha simulada no step");
    assert.equal(state.steps[0].error, "falha simulada no step");
  } finally {
    clean(root);
  }
});

test("engine.abort() persiste abortRequested mesmo sem chamada anterior de runAll", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    orc.create(featureMission);
    const store = new ExecutionStateStore(root);
    const engine = new ExecutionEngine(orc, undefined, undefined, undefined, undefined, store);

    engine.abort();

    assert.equal(store.isAbortRequested(), true);
  } finally {
    clean(root);
  }
});
