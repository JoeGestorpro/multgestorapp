import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MissionStore } from "./MissionStore.ts";
import { buildMission } from "./MissionBuilder.ts";
import type { MissionInput } from "./mission-types.ts";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "joefelipe-missionstore-test-"));
}

function clean(r: string) {
  try { rmSync(r, { recursive: true, force: true }); } catch { /* best-effort */ }
}

const input: MissionInput = {
  title: "Auditar painel executivo",
  intent: "apenas analisar e revisar o estado, sem alterar",
  executor: "claude-code",
};

test("MissionStore.save + get: persiste e recupera a Mission real gerada pelo MissionBuilder", async () => {
  const root = tempRoot();
  try {
    const mission = await buildMission(input, root);
    const store = new MissionStore(root);
    store.save(mission);

    const reloaded = store.get(mission.id);
    assert.ok(reloaded);
    assert.equal(reloaded!.title, mission.title);
    assert.equal(reloaded!.classification, mission.classification);
  } finally {
    clean(root);
  }
});

test("MissionStore.list: lista missoes mais recentes primeiro", async () => {
  const root = tempRoot();
  try {
    const store = new MissionStore(root);
    const m1 = await buildMission({ ...input, title: "Primeira" }, root);
    const m2 = await buildMission({ ...input, title: "Segunda" }, root);
    store.save(m1);
    store.save(m2);

    const list = store.list();
    assert.equal(list.length, 2);
    assert.equal(list[0].id, m2.id);
  } finally {
    clean(root);
  }
});

test("MissionStore: get com id desconhecido retorna undefined, sem crash", () => {
  const root = tempRoot();
  try {
    const store = new MissionStore(root);
    assert.equal(store.get("nao-existe"), undefined);
  } finally {
    clean(root);
  }
});

test("MissionStore: persiste em disco e sobrevive a um novo processo (reload)", async () => {
  const root = tempRoot();
  try {
    const mission = await buildMission(input, root);
    const store1 = new MissionStore(root);
    store1.save(mission);

    const store2 = new MissionStore(root);
    const reloaded = store2.get(mission.id);
    assert.ok(reloaded);
    assert.equal(reloaded!.id, mission.id);
  } finally {
    clean(root);
  }
});

// Fase 9.17: missions.jsonl gigante nao pode travar o construtor nem
// esconder a store atras de um parse sincrono sem limite.
test("MissionStore: missions.jsonl gigante nao trava o construtor (guard de leitura) e uma nova missao ainda funciona (aciona rotacao)", async () => {
  const root = tempRoot();
  try {
    const dir = join(root, "tools", "joefelipe-agent", "runtime");
    mkdirSync(dir, { recursive: true });
    const bigFile = join(dir, "missions.jsonl");
    const knownId = "mission-should-be-ignored";
    const line = JSON.stringify({ id: knownId, title: "missao gigante" }) + "\n";
    const repeats = Math.ceil((51 * 1024 * 1024) / line.length) + 1;
    writeFileSync(bigFile, line.repeat(repeats), "utf8");
    assert.ok(statSync(bigFile).size > 50 * 1024 * 1024);

    const store = new MissionStore(root);
    assert.equal(store.get(knownId), undefined, "guard deveria pular o parse do arquivo gigante");
    assert.deepEqual(store.list(), []);

    const mission = await buildMission(input, root);
    store.save(mission);
    assert.equal(store.list().length, 1);
    assert.equal(store.list()[0].id, mission.id);

    const newSize = statSync(bigFile).size;
    assert.ok(newSize < 10 * 1024, "missions.jsonl deveria estar pequeno apos a rotacao (so a nova missao)");
    const rotated = readdirSync(dir).filter((f) => f.startsWith("missions.") && f.endsWith(".jsonl") && f !== "missions.jsonl");
    assert.equal(rotated.length, 1, "arquivo gigante deveria ter sido rotacionado para fora do caminho ativo");
  } finally {
    clean(root);
  }
});
