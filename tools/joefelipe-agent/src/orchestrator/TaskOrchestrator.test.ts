import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TaskOrchestrator } from "./TaskOrchestrator.ts";
import type { PlannedMission } from "../planner/types.ts";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "joefelipe-orchestrator-test-"));
}

function clean(r: string) {
  try { rmSync(r, { recursive: true, force: true }); } catch { /* best-effort */ }
}

const mission: PlannedMission = {
  id: "orchestrator-test-mission-1",
  goalId: "goal-1",
  order: 1,
  title: "Missao de teste (TaskOrchestrator)",
  intent: "provar que o guard de leitura de arquivo gigante funciona",
  executorId: "claude-code",
  type: "audit",
  status: "active",
  dependsOn: [],
  classification: "READ_ONLY",
};

// Fase 9.17: orchestration.jsonl gigante nao pode travar o construtor nem
// esconder a store atras de um parse sincrono sem limite (mesmo guard ja
// existente no EventStore, agora tambem no TaskOrchestrator).
test("TaskOrchestrator: orchestration.jsonl gigante nao trava o construtor (guard de leitura) e uma nova orquestracao ainda funciona (aciona rotacao)", () => {
  const root = tempRoot();
  try {
    const dir = join(root, "tools", "joefelipe-agent", "runtime");
    mkdirSync(dir, { recursive: true });
    const bigFile = join(dir, "orchestration.jsonl");
    const knownId = "orc-should-be-ignored";
    const line = JSON.stringify({ id: knownId, missionId: "x", status: "running", steps: [] }) + "\n";
    const repeats = Math.ceil((51 * 1024 * 1024) / line.length) + 1;
    writeFileSync(bigFile, line.repeat(repeats), "utf8");
    assert.ok(statSync(bigFile).size > 50 * 1024 * 1024);

    const orchestrator = new TaskOrchestrator(root);
    assert.equal(orchestrator.get(knownId), undefined, "guard deveria pular o parse do arquivo gigante");
    assert.equal(orchestrator.active(), null, "nao deveria herdar 'running' do arquivo gigante ignorado");

    const orc = orchestrator.create(mission);
    assert.equal(orchestrator.active()?.id, orc.id);

    const newSize = statSync(bigFile).size;
    assert.ok(newSize < 10 * 1024, "orchestration.jsonl deveria estar pequeno apos a rotacao (so a nova orquestracao)");
    const rotated = readdirSync(dir).filter((f) => f.startsWith("orchestration.") && f.endsWith(".jsonl") && f !== "orchestration.jsonl");
    assert.equal(rotated.length, 1, "arquivo gigante deveria ter sido rotacionado para fora do caminho ativo");
  } finally {
    clean(root);
  }
});
