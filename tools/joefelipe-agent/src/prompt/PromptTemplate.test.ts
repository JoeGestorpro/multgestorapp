// Testes do PromptTemplate (V4): funções puras de derivação de segurança e render.
// Invariantes: determinístico, sem efeito colateral, nunca afrouxa segurança.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deriveSafetyRules,
  buildValidation,
  buildSecurityRules,
  buildFinalReport,
  renderPromptText,
  renderGeneratedPromptMarkdown,
} from "./PromptTemplate.ts";
import { generatePrompt } from "./PromptGenerator.ts";
import { makeMission, makeDangerousMission, makeEmptyMission } from "./prompt-test-fixtures.ts";

test("deriveSafetyRules reflete a missão e nunca afrouxa invariantes", () => {
  const s = deriveSafetyRules(makeMission({ requiresHumanApproval: true }));
  assert.equal(s.requiresHumanApproval, true);
  assert.equal(s.canExecute, false); // sempre false
  assert.equal(s.externalCalls, false); // sempre false
  assert.equal(s.noSecrets, true);
  assert.equal(s.noDangerousExecution, true);
  assert.equal(s.noPushMergeWithoutApproval, true);
  assert.equal(s.stopOnUnforeseen, true);
});

test("buildValidation = checklist da missão + invariantes da V4, sem mutar a entrada", () => {
  const mission = makeMission({ validationChecklist: ["Rodar type-check"] });
  const original = [...mission.validationChecklist];
  const v = buildValidation(mission);
  assert.ok(v.items.includes("Rodar type-check"));
  assert.ok(v.items.some((i) => i.includes("canExecute=false")));
  assert.ok(v.items.some((i) => i.toLowerCase().includes("secret")));
  // a entrada não pode ter sido mutada (copiada com spread)
  assert.deepEqual(mission.validationChecklist, original);
  assert.equal(mission.validationChecklist.length, 1);
});

test("buildSecurityRules: sempre presente; reforça em requiresHumanApproval e DANGEROUS", () => {
  const safe = buildSecurityRules(makeMission(), deriveSafetyRules(makeMission()));
  assert.ok(safe.some((r) => r.includes("canExecute: false")));
  assert.ok(safe.some((r) => r.includes("externalCalls: false")));
  assert.ok(safe.some((r) => r.toLowerCase().includes("secret")));
  assert.ok(!safe.some((r) => r.includes("requiresHumanApproval: true")));

  const dm = makeDangerousMission();
  const dangerous = buildSecurityRules(dm, deriveSafetyRules(dm));
  assert.ok(dangerous.some((r) => r.includes("requiresHumanApproval: true")));
  assert.ok(dangerous.some((r) => r.includes("DANGEROUS")));
});

test("buildFinalReport lista os itens de relatório obrigatório", () => {
  const r = buildFinalReport();
  assert.ok(Array.isArray(r));
  assert.ok(r.length >= 5);
  assert.ok(r.some((x) => x.includes("canExecute=false")));
  assert.ok(r.some((x) => x.toLowerCase().includes("git status")));
});

test("renderPromptText com dados completos contém todas as seções", () => {
  const text = renderPromptText({ mission: makeMission() });
  for (const section of [
    "Contexto:",
    "Objetivo:",
    "Escopo permitido:",
    "Escopo proibido:",
    "Classificação de risco:",
    "Aprovação humana:",
    "Validações obrigatórias:",
    "Regras de segurança:",
    "Relatório final obrigatório:",
    "Pare após o relatório final.",
  ]) {
    assert.ok(text.includes(section), `faltou seção: ${section}`);
  }
  assert.ok(text.includes("docs/exemplo.md")); // escopo permitido
  assert.ok(text.includes("READ_ONLY")); // classificação
});

test("renderPromptText com campos opcionais: usa objective/context explícitos quando dados", () => {
  const text = renderPromptText({
    mission: makeMission(),
    objective: "OBJETIVO-CUSTOM",
    context: "CONTEXTO-CUSTOM",
  });
  assert.ok(text.includes("OBJETIVO-CUSTOM"));
  assert.ok(text.includes("CONTEXTO-CUSTOM"));
});

test("renderPromptText sem campos opcionais: deriva objetivo=título e contexto da missão", () => {
  const mission = makeMission();
  const text = renderPromptText({ mission });
  assert.ok(text.includes(mission.title)); // objetivo derivado
  assert.ok(text.includes(mission.id)); // contexto derivado
  assert.ok(text.includes(mission.executor));
  assert.ok(text.includes(mission.provenance.llmProvider));
});

test("entrada vazia: arrays vazios caem nos textos de fallback, sem quebrar", () => {
  const text = renderPromptText({ mission: makeEmptyMission() });
  assert.ok(text.includes("(nenhum arquivo de escrita")); // allowed vazio
  assert.ok(text.includes("(nenhum)")); // forbidden vazio
  assert.ok(text.length > 0);
});

test("classificação de missão: DANGEROUS reflete llmMode e regra específica", () => {
  const text = renderPromptText({ mission: makeDangerousMission() });
  assert.ok(text.includes("DANGEROUS"));
  assert.ok(text.includes("LOCKED")); // llmMode
  assert.ok(text.includes("OBRIGATÓRIA")); // aprovação humana obrigatória
});

test("caracteres especiais são preservados verbatim (sem quebrar o render)", () => {
  const objective = "Corrigir `${x}` & <tag> — 100% \"aspas\" 🚀 \\backslash";
  const text = renderPromptText({ mission: makeMission(), objective });
  assert.ok(text.includes(objective));
});

test("conteúdo multilinha é preservado", () => {
  const context = "Linha 1\nLinha 2\n\nLinha 4 com  espaços";
  const text = renderPromptText({ mission: makeMission(), context });
  assert.ok(text.includes(context));
});

test("comportamento determinístico: mesma entrada → texto idêntico", () => {
  const input = { mission: makeMission(), objective: "det", context: "ctx" };
  assert.equal(renderPromptText(input), renderPromptText(input));
});

test("renderGeneratedPromptMarkdown embala o prompt em bloco ```text", () => {
  const gp = generatePrompt({ mission: makeMission() });
  const md = renderGeneratedPromptMarkdown(gp);
  assert.ok(md.includes("## Prompt seguro gerado"));
  assert.ok(md.includes("```text"));
  assert.ok(md.includes(gp.text));
});
