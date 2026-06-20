// Orquestrador do Mission Builder (V3).
// Estado do projeto + LLM Core (mock) → Mission tipada, segura e auditável.
// READ-ONLY: nunca executa, nunca edita a fila, só grava em runtime/ (best-effort).

import { join } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { findRepoRoot } from "../readers.ts";
import { buildState } from "../state.ts";
import { LlmEngine } from "../llm/LlmEngine.ts";
import type { LlmRequest } from "../llm/LlmProvider.ts";
import { classifyMission } from "./classify.ts";
import { buildScope } from "./scope.ts";
import {
  renderOperationalPrompt,
  buildChecklist,
  buildRollback,
  buildCommitPrompt,
} from "./render.ts";
import type { Mission, MissionInput } from "./mission-types.ts";

const engine = new LlmEngine();

function deriveId(input: MissionInput): string {
  if (input.id) return input.id;
  const slug = input.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove diacríticos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const prefix = input.type ? `${input.type}/` : "";
  return `${prefix}${slug || "mission"}`;
}

export async function buildMission(
  input: MissionInput,
  root: string = findRepoRoot(),
): Promise<Mission> {
  const state = buildState(root);

  // Pré-classificação (sem safety) define o modo enviado ao LLM Core.
  const pre = classifyMission(input);

  const task = [input.title, input.intent, ...(input.allowedFilesHint ?? [])]
    .filter(Boolean)
    .join(". ");
  const request: LlmRequest = {
    mode: pre.llmMode,
    task,
    context: {
      missionId: deriveId(input),
      executor: input.executor,
      currentMission: state.mission.current,
      branch: state.git.branch,
    },
  };
  const llm = await engine.complete(request);

  // Classificação final considera o safety retornado pela LLM Core.
  const cls = classifyMission(input, llm.safety);

  const id = deriveId(input);
  const { scope, warnings: scopeWarnings } = buildScope(input.allowedFilesHint);
  const p1 = state.risks.items.filter((r) => r.severity === "P1");

  const operationalPrompt = renderOperationalPrompt({
    id,
    input,
    classification: cls.classification,
    llmMode: cls.llmMode,
    requiresHumanApproval: cls.requiresHumanApproval,
    scope,
    currentMission: state.mission.current,
    branch: state.git.branch,
    p1Titles: p1.map((r) => `${r.id ?? ""} ${r.title}`.trim()),
    llmText: llm.text,
  });

  const warnings: string[] = [...scopeWarnings, ...cls.reasons];
  if (cls.classification === "DANGEROUS") {
    warnings.push("Missão DANGEROUS: execução só com autorização humana explícita. canExecute=false.");
  }
  for (const r of llm.safety.blockedReasons) warnings.push(`LLM safety: ${r}`);

  return {
    id,
    title: input.title,
    classification: cls.classification,
    executor: input.executor,
    llmMode: cls.llmMode,
    requiresHumanApproval: cls.requiresHumanApproval,
    scope,
    operationalPrompt,
    validationChecklist: buildChecklist(cls.classification, input.type),
    rollbackPlan: buildRollback(cls.classification, scope),
    commitPrompt: buildCommitPrompt(id, input.title, input.type),
    safety: llm.safety,
    provenance: {
      generatedAt: new Date().toISOString(),
      agentVersion: state.agent.version,
      sources: state.sources.found.map((s) => s.path),
      llmProvider: llm.provider,
      llmModel: llm.model,
      externalCallsEnabled: state.llm.externalCallsEnabled,
      sourceRiskId: input.sourceRiskId,
    },
    warnings,
  };
}

/** Grava o markdown da missão em runtime/mission.md (git-ignored, best-effort). */
export function writeMissionArtifact(root: string, content: string): void {
  try {
    const dir = join(root, "tools", "joefelipe-agent", "runtime");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "mission.md"), content, "utf8");
  } catch {
    /* runtime é best-effort; nunca derruba o agente */
  }
}
