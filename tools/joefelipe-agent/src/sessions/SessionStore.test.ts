import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SessionStore } from "./SessionStore.ts";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "joefelipe-sessions-test-"));
}

function clean(r: string) {
  try { rmSync(r, { recursive: true, force: true }); } catch { /* best-effort */ }
}

const DEFAULTS = { provider: "mock", model: "mock-safe-v1", kernelMode: "READ_ONLY" };

test("SessionStore.create: gera sessao real com todos os campos exigidos", () => {
  const root = tempRoot();
  try {
    const store = new SessionStore(root);
    const session = store.create({ ...DEFAULTS, title: "Minha missao" });
    assert.ok(session.id.startsWith("sess-"));
    assert.equal(session.title, "Minha missao");
    assert.equal(session.status, "active");
    assert.equal(session.provider, "mock");
    assert.equal(session.model, "mock-safe-v1");
    assert.equal(session.kernelMode, "READ_ONLY");
    assert.equal(session.missionId, null);
    assert.equal(session.executionId, null);
    assert.equal(session.plannerGoalId, null);
    assert.deepEqual(session.messages, []);
    assert.ok(session.createdAt);
    assert.ok(session.updatedAt);
  } finally {
    clean(root);
  }
});

test("SessionStore.list: lista sessoes reais ordenadas por atividade recente", () => {
  const root = tempRoot();
  try {
    const store = new SessionStore(root);
    const a = store.create({ ...DEFAULTS, title: "Primeira" });
    const b = store.create({ ...DEFAULTS, title: "Segunda" });
    const list = store.list();
    assert.equal(list.length, 2);
    assert.equal(list[0].id, b.id);
    assert.equal(list[1].id, a.id);
  } finally {
    clean(root);
  }
});

test("SessionStore: nenhuma mensagem fica sem sessao (getOrCreateActive cria automaticamente)", () => {
  const root = tempRoot();
  try {
    const store = new SessionStore(root);
    assert.equal(store.getActive(), null);
    const session = store.getOrCreateActive(DEFAULTS);
    assert.ok(session);
    assert.equal(store.getActive()?.id, session.id);
  } finally {
    clean(root);
  }
});

test("SessionStore.activate: troca sessao ativa, so uma ativa por vez", () => {
  const root = tempRoot();
  try {
    const store = new SessionStore(root);
    const a = store.create(DEFAULTS);
    const b = store.create(DEFAULTS);
    assert.equal(store.getActive()?.id, b.id);
    assert.equal(store.get(a.id)?.status, "idle");

    const result = store.activate(a.id);
    assert.equal(result.success, true);
    assert.equal(store.getActive()?.id, a.id);
    assert.equal(store.get(b.id)?.status, "idle");
  } finally {
    clean(root);
  }
});

test("SessionStore.activate: id desconhecido retorna erro claro, sem crash", () => {
  const root = tempRoot();
  try {
    const store = new SessionStore(root);
    const result = store.activate("sess-nao-existe");
    assert.equal(result.success, false);
    assert.ok(result.error?.includes("não encontrada"));
  } finally {
    clean(root);
  }
});

test("SessionStore.appendMessage: mensagens ficam vinculadas a sessao (nunca soltas)", () => {
  const root = tempRoot();
  try {
    const store = new SessionStore(root);
    const session = store.create(DEFAULTS);
    store.appendMessage(session.id, { role: "user", content: "oi", timestamp: new Date().toISOString() });
    store.appendMessage(session.id, { role: "assistant", content: "ola", timestamp: new Date().toISOString() });

    const reloaded = store.get(session.id);
    assert.equal(reloaded?.messages.length, 2);
    assert.equal(reloaded?.messages[0].role, "user");
    assert.equal(reloaded?.messages[1].role, "assistant");
  } finally {
    clean(root);
  }
});

test("SessionStore.clearMessages: limpa mensagens de verdade (nao decorativo)", () => {
  const root = tempRoot();
  try {
    const store = new SessionStore(root);
    const session = store.create(DEFAULTS);
    store.appendMessage(session.id, { role: "user", content: "oi", timestamp: new Date().toISOString() });
    store.clearMessages(session.id);
    assert.deepEqual(store.get(session.id)?.messages, []);
  } finally {
    clean(root);
  }
});

test("SessionStore.linkContext: vincula missionId/executionId/plannerGoalId (planner/execution/approval vinculados)", () => {
  const root = tempRoot();
  try {
    const store = new SessionStore(root);
    const session = store.create(DEFAULTS);
    store.linkContext(session.id, { missionId: "goal-1/mission-x", executionId: "orc-123", plannerGoalId: "goal-1" });

    const reloaded = store.get(session.id);
    assert.equal(reloaded?.missionId, "goal-1/mission-x");
    assert.equal(reloaded?.executionId, "orc-123");
    assert.equal(reloaded?.plannerGoalId, "goal-1");
  } finally {
    clean(root);
  }
});

test("SessionStore: restaura sessao apos reiniciar o processo (persistencia real em disco)", () => {
  const root = tempRoot();
  try {
    const store1 = new SessionStore(root);
    const session = store1.create({ ...DEFAULTS, title: "Sessao persistente" });
    store1.appendMessage(session.id, { role: "user", content: "mensagem persistida", timestamp: new Date().toISOString() });
    store1.linkContext(session.id, { executionId: "orc-999" });

    const store2 = new SessionStore(root);
    const restored = store2.get(session.id);
    assert.ok(restored);
    assert.equal(restored!.title, "Sessao persistente");
    assert.equal(restored!.messages.length, 1);
    assert.equal(restored!.executionId, "orc-999");
    assert.equal(store2.getActive()?.id, session.id);
  } finally {
    clean(root);
  }
});

// Fase 9.17: sessions.jsonl gigante nao pode travar o construtor nem
// esconder a store atras de um parse sincrono sem limite (mesmo guard ja
// existente no EventStore, agora tambem no SessionStore).
test("SessionStore: sessions.jsonl gigante nao trava o construtor (guard de leitura) e uma nova sessao ainda funciona (aciona rotacao)", () => {
  const root = tempRoot();
  try {
    const dir = join(root, "tools", "joefelipe-agent", "runtime");
    mkdirSync(dir, { recursive: true });
    const bigFile = join(dir, "sessions.jsonl");
    const knownId = "sess-should-be-ignored";
    const line = JSON.stringify({
      id: knownId, title: "sessao gigante", status: "idle", provider: "mock", model: "mock-safe-v1",
      kernelMode: "READ_ONLY", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      missionId: null, executionId: null, plannerGoalId: null, messages: [],
    }) + "\n";
    const repeats = Math.ceil((51 * 1024 * 1024) / line.length) + 1;
    writeFileSync(bigFile, line.repeat(repeats), "utf8");
    assert.ok(statSync(bigFile).size > 50 * 1024 * 1024);

    const store = new SessionStore(root);
    assert.equal(store.get(knownId), undefined, "guard deveria pular o parse do arquivo gigante");
    assert.deepEqual(store.list(), []);

    const session = store.create(DEFAULTS);
    assert.equal(store.list().length, 1);
    assert.equal(store.list()[0].id, session.id);

    const newSize = statSync(bigFile).size;
    assert.ok(newSize < 10 * 1024, "sessions.jsonl deveria estar pequeno apos a rotacao (so a nova sessao)");
    const rotated = readdirSync(dir).filter((f) => f.startsWith("sessions.") && f.endsWith(".jsonl") && f !== "sessions.jsonl");
    assert.equal(rotated.length, 1, "arquivo gigante deveria ter sido rotacionado para fora do caminho ativo");
  } finally {
    clean(root);
  }
});
