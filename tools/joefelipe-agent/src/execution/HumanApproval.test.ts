import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TaskOrchestrator } from "../orchestrator/TaskOrchestrator.ts";
import { ExecutionEngine } from "./ExecutionEngine.ts";
import type { PlannedMission } from "../planner/types.ts";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "joefelipe-approval-"));
}

function clean(r: string) {
  try { rmSync(r, { recursive: true, force: true }); } catch { }
}

// Missao "security" com classification SAFE_WRITE gera: analyze, implement,
// validate, approval, report — o step "approval" roteia para o HumanExecutor.
const securityMission: PlannedMission = {
  id: "approval-test-1",
  goalId: "goal-1",
  order: 1,
  title: "Missao de seguranca",
  intent: "testar fluxo de aprovacao humana",
  executorId: "claude-code",
  type: "security",
  status: "active",
  dependsOn: [],
  classification: "SAFE_WRITE",
};

function findApprovalStepId(orcId: string, orc: TaskOrchestrator): string {
  const active = orc.get(orcId);
  const step = active?.steps.find((s) => s.type === "approval");
  if (!step) throw new Error("approval step nao encontrado na missao de teste");
  return step.id;
}

test("step que exige aprovacao humana vira waiting_human (engine nao falha a orquestracao)", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(securityMission);
    const engine = new ExecutionEngine(orc);

    const results = await engine.runAll();
    // analyze, implement, validate concluem; approval fica pendente e para o loop.
    assert.equal(results.length, 4);
    assert.ok(results.slice(0, 3).every((r) => r.success));
    assert.equal(results[3].success, false);
    assert.equal(results[3].metadata?.pending, "true");

    const updated = orc.get(o.id);
    assert.ok(updated);
    const approvalStep = updated.steps.find((s) => s.type === "approval");
    assert.ok(approvalStep);
    assert.equal(approvalStep.status, "waiting_human");
    // A orquestracao NAO deve ser marcada como failed so por estar aguardando humano.
    assert.equal(updated.status, "running");
  } finally {
    clean(root);
  }
});

test("approveStepHuman altera o estado do step para completed e permite retomar", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(securityMission);
    const engine = new ExecutionEngine(orc);
    await engine.runAll();

    const stepId = findApprovalStepId(o.id, orc);
    const approveResult = orc.approveStepHuman(stepId, "aprovado no teste");
    assert.equal(approveResult.success, true);

    const afterApproval = orc.get(o.id);
    assert.ok(afterApproval);
    assert.equal(afterApproval.steps.find((s) => s.id === stepId)?.status, "completed");
    assert.equal(afterApproval.steps.find((s) => s.id === stepId)?.result, "aprovado no teste");

    // Retomando a MESMA orquestracao: o proximo step ("report") deve concluir a missao.
    const resumeEngine = new ExecutionEngine(orc);
    const moreResults = await resumeEngine.runAll();
    assert.equal(moreResults.length, 1);
    assert.ok(moreResults[0].success);

    const finalOrc = orc.get(o.id);
    assert.ok(finalOrc);
    assert.equal(finalOrc.status, "completed");
  } finally {
    clean(root);
  }
});

test("rejectStepHuman altera o estado do step para failed e falha a orquestracao", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(securityMission);
    const engine = new ExecutionEngine(orc);
    await engine.runAll();

    const stepId = findApprovalStepId(o.id, orc);
    const rejectResult = orc.rejectStepHuman(stepId, "rejeitado no teste");
    assert.equal(rejectResult.success, true);

    const afterReject = orc.get(o.id);
    assert.ok(afterReject);
    assert.equal(afterReject.steps.find((s) => s.id === stepId)?.status, "failed");
    assert.equal(afterReject.steps.find((s) => s.id === stepId)?.error, "rejeitado no teste");
    assert.equal(afterReject.status, "failed");
  } finally {
    clean(root);
  }
});

test("approveStepHuman falha com erro claro se o step nao esta waiting_human", () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(securityMission);
    const firstStepId = orc.get(o.id)!.steps[0].id; // "analyze", ainda "pending"

    const result = orc.approveStepHuman(firstStepId);
    assert.equal(result.success, false);
    assert.ok(result.error?.includes("nao esta aguardando aprovacao humana"));
  } finally {
    clean(root);
  }
});

test("run status (orchestrator.get) mostra claramente o step aguardando aprovacao", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(securityMission);
    const engine = new ExecutionEngine(orc);
    await engine.runAll();

    const active = orc.get(o.id);
    assert.ok(active);
    const pendingSteps = active.steps.filter((s) => s.status === "waiting_human");
    assert.equal(pendingSteps.length, 1);
    assert.equal(pendingSteps[0].type, "approval");
  } finally {
    clean(root);
  }
});

test("engine nao continua automaticamente apos um step bloqueado aguardando aprovacao", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const o = orc.create(securityMission);
    const engine = new ExecutionEngine(orc);
    await engine.runAll();

    // "report" (5o step) nunca deve ter rodado sem aprovacao.
    const active = orc.get(o.id);
    assert.ok(active);
    const reportStep = active.steps.find((s) => s.type === "report");
    assert.ok(reportStep);
    assert.equal(reportStep.status, "pending");

    // Rodar de novo sem aprovar nao avanca nada: o step de approval nao esta
    // mais "pending" (esta "waiting_human"), entao nextStep() nao o re-seleciona,
    // e "report" continua bloqueado pela dependencia nao concluida.
    const engine2 = new ExecutionEngine(orc);
    const results = await engine2.runAll();
    assert.equal(results.length, 0);
    assert.equal(orc.get(o.id)?.steps.find((s) => s.type === "report")?.status, "pending");
  } finally {
    clean(root);
  }
});
