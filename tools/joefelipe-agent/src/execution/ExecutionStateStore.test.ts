import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ExecutionStateStore, type ExecutionState } from "./ExecutionStateStore.ts";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "joefelipe-state-store-"));
}

function clean(r: string) {
  try { rmSync(r, { recursive: true, force: true }); } catch { }
}

function makeState(over: Partial<ExecutionState> = {}): ExecutionState {
  const now = new Date().toISOString();
  return {
    orchestrationId: "orc-1",
    missionId: "m-1",
    status: "running",
    abortRequested: false,
    currentStepId: null,
    steps: [],
    startedAt: now,
    updatedAt: now,
    ...over,
  };
}

test("load retorna null quando nao ha estado salvo", () => {
  const root = tempRoot();
  try {
    const store = new ExecutionStateStore(root);
    assert.equal(store.load(), null);
  } finally {
    clean(root);
  }
});

test("save + load roundtrip preserva o estado", () => {
  const root = tempRoot();
  try {
    const store = new ExecutionStateStore(root);
    const state = makeState({ status: "running" });
    store.save(state);
    const loaded = store.load();
    assert.ok(loaded);
    assert.equal(loaded.orchestrationId, "orc-1");
    assert.equal(loaded.status, "running");
  } finally {
    clean(root);
  }
});

test("markAbortRequested marca abort no estado existente", () => {
  const root = tempRoot();
  try {
    const store = new ExecutionStateStore(root);
    store.save(makeState({ abortRequested: false }));
    const marked = store.markAbortRequested();
    assert.equal(marked, true);
    assert.equal(store.isAbortRequested(), true);
  } finally {
    clean(root);
  }
});

test("markAbortRequested retorna false sem estado salvo", () => {
  const root = tempRoot();
  try {
    const store = new ExecutionStateStore(root);
    const marked = store.markAbortRequested();
    assert.equal(marked, false);
  } finally {
    clean(root);
  }
});

test("isAbortRequested false por padrao", () => {
  const root = tempRoot();
  try {
    const store = new ExecutionStateStore(root);
    store.save(makeState());
    assert.equal(store.isAbortRequested(), false);
  } finally {
    clean(root);
  }
});

test("clear remove o arquivo de estado", () => {
  const root = tempRoot();
  try {
    const store = new ExecutionStateStore(root);
    store.save(makeState());
    assert.ok(store.load());
    store.clear();
    assert.equal(store.load(), null);
  } finally {
    clean(root);
  }
});

test("clear e idempotente quando nao ha arquivo", () => {
  const root = tempRoot();
  try {
    const store = new ExecutionStateStore(root);
    assert.doesNotThrow(() => store.clear());
  } finally {
    clean(root);
  }
});
