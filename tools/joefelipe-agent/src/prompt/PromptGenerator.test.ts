// Testes do PromptGenerator (V4): orquestração generatePrompt + artefato best-effort.
// Invariantes: determinístico, não muta a entrada, sem chamada externa/LLM/DB/shell.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { generatePrompt, writePromptArtifact } from "./PromptGenerator.ts";
import { buildMission } from "../mission/MissionBuilder.ts";
import type { GeneratedPrompt } from "./prompt-types.ts";
import type { MissionClassification } from "../mission/mission-types.ts";
import { makeMission, makeDangerousMission } from "./prompt-test-fixtures.ts";

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    for (const v of Object.values(obj)) deepFreeze(v);
    Object.freeze(obj);
  }
  return obj;
}

test("geração de prompt válida: retorna GeneratedPrompt completo", () => {
  const gp = generatePrompt({ mission: makeMission() });
  assert.equal(gp.missionId, "docs/exemplo");
  assert.equal(gp.classification, "READ_ONLY");
  assert.equal(gp.safety.canExecute, false);
  assert.equal(gp.safety.externalCalls, false);
  assert.ok(gp.validation.items.length > 0);
  assert.ok(typeof gp.text === "string" && gp.text.length > 0);
});

test("classificação e aprovação são propagadas ao resultado (DANGEROUS)", () => {
  const gp = generatePrompt({ mission: makeDangerousMission() });
  assert.equal(gp.classification, "DANGEROUS");
  assert.equal(gp.safety.requiresHumanApproval, true);
  assert.ok(gp.text.includes("DANGEROUS"));
});

test("comportamento determinístico: duas gerações são deep-equal", () => {
  const input = { mission: makeMission(), objective: "obj", context: "ctx" };
  assert.deepEqual(generatePrompt(input), generatePrompt(input));
});

test("não muta o objeto Mission recebido (entrada deep-frozen não lança)", () => {
  const mission = deepFreeze(makeMission());
  const snapshot = JSON.stringify(mission);
  assert.doesNotThrow(() => generatePrompt({ mission }));
  assert.equal(JSON.stringify(mission), snapshot);
});

test("entrada inválida/degenerada (title e id vazios) não quebra a geração", () => {
  const gp = generatePrompt({ mission: makeMission({ id: "", title: "" }) });
  assert.equal(gp.missionId, "");
  assert.ok(gp.text.length > 0);
});

test("writePromptArtifact grava runtime/prompt.md sob o root informado", () => {
  const root = mkdtempSync(join(tmpdir(), "pg-artifact-"));
  try {
    writePromptArtifact(root, "conteudo-de-prompt");
    const out = join(root, "tools", "joefelipe-agent", "runtime", "prompt.md");
    assert.ok(existsSync(out));
    assert.equal(readFileSync(out, "utf8"), "conteudo-de-prompt");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("writePromptArtifact é best-effort: erro de FS é engolido (não lança)", () => {
  // root aponta para um ARQUIVO; mkdir sob ele falha (ENOTDIR) e deve ser engolido.
  const dir = mkdtempSync(join(tmpdir(), "pg-badroot-"));
  const fileAsRoot = join(dir, "not-a-dir");
  writeFileSync(fileAsRoot, "x");
  try {
    assert.doesNotThrow(() => writePromptArtifact(fileAsRoot, "qualquer"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("compatibilidade com Mission/MissionClassification via buildMission real (mock, sem chamada externa)", async () => {
  const mission = await buildMission({
    title: "Auditar o painel executivo",
    intent: "apenas analisar e revisar o estado, sem alterar",
    executor: "claude-code",
  });
  assert.equal(mission.provenance.externalCallsEnabled, false); // nenhuma chamada externa
  assert.equal(mission.safety.canExecute, false);

  const gp: GeneratedPrompt = generatePrompt({ mission });
  const cls: MissionClassification = gp.classification;
  assert.equal(cls, mission.classification);
  assert.equal(gp.missionId, mission.id);
  assert.ok(gp.text.includes(mission.classification));
});
