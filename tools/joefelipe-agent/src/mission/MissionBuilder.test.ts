// Testes de integração do Mission Builder (orquestração estado → LLM Core → Mission).
// Invariantes de segurança: nunca executa, nunca chama API externa, sempre exige aprovação no perigoso.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMission } from "./MissionBuilder.ts";
import type { MissionInput } from "./mission-types.ts";

const dangerous: MissionInput = {
  id: "security/rls-companies-users",
  title: "Adicionar policies RLS para companies e users",
  intent: "Criar a migration e as políticas RLS no banco.",
  executor: "claude-code",
  type: "security",
  allowedFilesHint: ["supabase/migrations/"],
  sourceRiskId: "A-001",
};

const readOnly: MissionInput = {
  title: "Auditar o painel executivo",
  intent: "apenas analisar e revisar o estado, sem alterar",
  executor: "claude-code",
};

test("missão perigosa: DANGEROUS/LOCKED/aprovação + invariantes de segurança", async () => {
  const m = await buildMission(dangerous);
  assert.equal(m.classification, "DANGEROUS");
  assert.equal(m.llmMode, "LOCKED");
  assert.equal(m.requiresHumanApproval, true);
  assert.equal(m.safety.canExecute, false);
  assert.equal(m.provenance.externalCallsEnabled, false);
  assert.ok(m.scope.forbidden.some((f) => f.includes("secrets")));
  assert.ok(m.warnings.length > 0);
});

test("missão de auditoria de leitura → READ_ONLY", async () => {
  const m = await buildMission(readOnly);
  assert.equal(m.classification, "READ_ONLY");
});

test("invariante global: canExecute nunca é true (LLM propõe, não executa)", async () => {
  const m = await buildMission(dangerous);
  assert.equal(m.safety.canExecute, false);
});
