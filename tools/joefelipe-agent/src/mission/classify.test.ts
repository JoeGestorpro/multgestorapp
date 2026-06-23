// Testes da classificação de risco determinística (núcleo de segurança do Mission Builder).
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyMission, maxClassification, toLlmMode } from "./classify.ts";
import type { MissionInput } from "./mission-types.ts";

const base = (over: Partial<MissionInput>): MissionInput => ({
  title: "Tarefa",
  intent: "fazer algo",
  executor: "claude-code",
  ...over,
});

test("maxClassification respeita a precedência", () => {
  assert.equal(maxClassification("READ_ONLY", "DANGEROUS"), "DANGEROUS");
  assert.equal(maxClassification("SAFE_WRITE", "PLAN_ONLY"), "SAFE_WRITE");
  assert.equal(maxClassification("READ_ONLY", "READ_ONLY"), "READ_ONLY");
});

test("toLlmMode mapeia classificação → modo do LLM Core", () => {
  assert.equal(toLlmMode("READ_ONLY"), "READ_ONLY");
  assert.equal(toLlmMode("PLAN_ONLY"), "PLAN_ONLY");
  assert.equal(toLlmMode("SAFE_WRITE"), "SAFE_WRITE");
  assert.equal(toLlmMode("HUMAN_GATED"), "HUMAN_APPROVAL_REQUIRED");
  assert.equal(toLlmMode("DANGEROUS"), "LOCKED");
});

test("auditoria de leitura sem arquivos → READ_ONLY, sem aprovação humana", () => {
  const r = classifyMission(base({ title: "Auditar painel", intent: "apenas analisar e revisar o estado" }));
  assert.equal(r.classification, "READ_ONLY");
  assert.equal(r.llmMode, "READ_ONLY");
  assert.equal(r.requiresHumanApproval, false);
});

test("escopo de arquivos sem termo sensível → SAFE_WRITE", () => {
  const r = classifyMission(base({ title: "Atualizar doc", intent: "escrever documentação", allowedFilesHint: ["docs/x.md"] }));
  assert.equal(r.classification, "SAFE_WRITE");
  assert.equal(r.requiresHumanApproval, false);
});

test("termo perigoso → DANGEROUS / LOCKED / requer aprovação humana", () => {
  const r = classifyMission(base({ title: "Criar policies RLS", intent: "rodar migration no banco" }));
  assert.equal(r.classification, "DANGEROUS");
  assert.equal(r.llmMode, "LOCKED");
  assert.equal(r.requiresHumanApproval, true);
});

test("termo gated (commit) sem perigoso → HUMAN_GATED", () => {
  const r = classifyMission(base({ title: "Preparar commit", intent: "fazer commit local da doc" }));
  assert.equal(r.classification, "HUMAN_GATED");
  assert.equal(r.llmMode, "HUMAN_APPROVAL_REQUIRED");
  assert.equal(r.requiresHumanApproval, true);
});

test("safety.requiresHumanApproval do LLM eleva para HUMAN_GATED", () => {
  const r = classifyMission(
    base({ title: "Auditar painel", intent: "apenas analisar" }),
    { canExecute: false, requiresHumanApproval: true, blockedReasons: [] },
  );
  assert.ok(["HUMAN_GATED", "DANGEROUS"].includes(r.classification));
  assert.equal(r.requiresHumanApproval, true);
});

test("comportamento conhecido C-6 (over-lock): auditoria que cita 'RLS' é super-classificada como DANGEROUS (lado seguro)", () => {
  // Documenta o over-lock: missão de leitura que MENCIONA termo perigoso é travada.
  // Seguro por design; refinar para contexto é uma mudança consciente (V4).
  const r = classifyMission(base({ title: "Auditar RLS", intent: "apenas ler, sem alterar" }));
  assert.equal(r.classification, "DANGEROUS");
});
