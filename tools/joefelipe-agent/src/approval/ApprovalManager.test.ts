import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ApprovalManager } from "./ApprovalManager.ts";
import type { PlannedMission } from "../planner/types.ts";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "joefelipe-approval-test-"));
}

function clean(r: string) {
  try { rmSync(r, { recursive: true, force: true }); } catch { /* best-effort */ }
}

function runtimeDir(root: string): string {
  const dir = join(root, "tools", "joefelipe-agent", "runtime");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function repeatToSize(line: string, minBytes: number): string {
  const repeats = Math.ceil(minBytes / line.length) + 1;
  return line.repeat(repeats);
}

function writeOversizedApprovalFile(path: string, minBytes: number, knownId: string): void {
  const line = JSON.stringify({
    id: knownId, missionId: "m", missionTitle: "t", missionIntent: "i",
    classification: "SAFE_WRITE", mode: "HUMAN_APPROVAL_REQUIRED",
    requestedBy: "system", requestedAt: new Date().toISOString(), status: "pending",
  }) + "\n";
  writeFileSync(path, repeatToSize(line, minBytes), "utf8");
}

const mission: PlannedMission = {
  id: "approval-test-mission-1",
  goalId: "goal-1",
  order: 1,
  title: "Missao de teste (ApprovalManager)",
  intent: "provar guard de leitura e rotacao do audit",
  executorId: "claude-code",
  type: "security",
  status: "active",
  dependsOn: [],
  classification: "SAFE_WRITE",
};

// Fase 9.17: approval.jsonl gigante nao pode travar o construtor nem
// esconder a store atras de um parse sincrono sem limite (mesmo guard ja
// existente no EventStore, agora tambem no ApprovalManager).
test("ApprovalManager: approval.jsonl gigante nao trava o construtor (guard de leitura) e uma nova aprovacao aciona rotacao", () => {
  const root = tempRoot();
  try {
    const dir = runtimeDir(root);
    const bigFile = join(dir, "approval.jsonl");
    writeOversizedApprovalFile(bigFile, 51 * 1024 * 1024, "apr-should-be-ignored");
    assert.ok(statSync(bigFile).size > 50 * 1024 * 1024);

    const manager = new ApprovalManager(root);
    assert.equal(manager.get("apr-should-be-ignored"), undefined, "guard deveria pular o parse do arquivo gigante");
    assert.deepEqual(manager.list(), []);

    const req = manager.request(mission, "HUMAN_APPROVAL_REQUIRED");
    assert.equal(manager.list().length, 1);
    assert.equal(manager.list()[0].id, req.id);

    const newSize = statSync(bigFile).size;
    assert.ok(newSize < 10 * 1024, "approval.jsonl deveria estar pequeno apos a rotacao");
    const rotated = readdirSync(dir).filter((f) => f.startsWith("approval.") && f.endsWith(".jsonl") && f !== "approval.jsonl");
    assert.equal(rotated.length, 1);
  } finally {
    clean(root);
  }
});

// Fase 9.17: approval-audit.jsonl nunca rotacionava (logAudit() nao chamava
// rotateIfNeeded) — crescia sem limite a cada approve/reject/request.
test("ApprovalManager: approval-audit.jsonl rotaciona sozinho e nao cresce indefinidamente", () => {
  const root = tempRoot();
  try {
    const dir = runtimeDir(root);
    const bigAudit = join(dir, "approval-audit.jsonl");
    const auditLine = JSON.stringify({
      id: "aud-existing", missionId: "m", action: "requested",
      previousMode: "READ_ONLY", newMode: "READ_ONLY", timestamp: new Date().toISOString(),
    }) + "\n";
    writeFileSync(bigAudit, repeatToSize(auditLine, 11 * 1024 * 1024), "utf8");
    assert.ok(statSync(bigAudit).size > 10 * 1024 * 1024);

    const manager = new ApprovalManager(root);
    manager.request(mission, "HUMAN_APPROVAL_REQUIRED");

    const newSize = statSync(bigAudit).size;
    assert.ok(newSize < 10 * 1024, "approval-audit.jsonl deveria ter sido rotacionado, nao deve crescer indefinidamente");
    const rotated = readdirSync(dir).filter((f) => f.startsWith("approval-audit.") && f.endsWith(".jsonl") && f !== "approval-audit.jsonl");
    assert.equal(rotated.length, 1);
  } finally {
    clean(root);
  }
});

// Fase 9.17: pruneRotated("approval") usava startsWith(base) sem separador,
// entao "approval-audit.*.jsonl" tambem casava com base="approval" e os dois
// pools de arquivos rotacionados competiam pelo mesmo teto de 20 (poda
// cruzada). Este teste prova que os dois pools sao independentes.
test("ApprovalManager: poda de approval.jsonl e approval-audit.jsonl e independente (sem poda cruzada pelo prefixo)", () => {
  const root = tempRoot();
  try {
    const dir = runtimeDir(root);

    // 25 arquivos rotacionados "falsos" pre-existentes em cada pool (acima do teto de 20).
    for (let i = 0; i < 25; i++) {
      const idx = String(i).padStart(2, "0");
      writeFileSync(join(dir, "approval.fake-" + idx + ".jsonl"), "{}\n", "utf8");
      writeFileSync(join(dir, "approval-audit.fake-" + idx + ".jsonl"), "{}\n", "utf8");
    }

    // Ambos os arquivos "ativos" acima do teto de 10MB, para forcar rotacao dos dois na mesma chamada.
    writeOversizedApprovalFile(join(dir, "approval.jsonl"), 11 * 1024 * 1024, "apr-x");
    writeFileSync(join(dir, "approval-audit.jsonl"), repeatToSize(JSON.stringify({ id: "aud-x" }) + "\n", 11 * 1024 * 1024), "utf8");

    const manager = new ApprovalManager(root);
    manager.request(mission, "HUMAN_APPROVAL_REQUIRED");

    const approvalRotated = readdirSync(dir).filter((f) => f.startsWith("approval.") && f.endsWith(".jsonl") && f !== "approval.jsonl");
    const auditRotated = readdirSync(dir).filter((f) => f.startsWith("approval-audit.") && f.endsWith(".jsonl") && f !== "approval-audit.jsonl");

    assert.equal(approvalRotated.length, 20, "pool 'approval' deveria manter exatamente o teto de 20, independente do pool de audit");
    assert.equal(auditRotated.length, 20, "pool 'approval-audit' deveria manter exatamente o teto de 20, independente do pool de approval");
  } finally {
    clean(root);
  }
});
