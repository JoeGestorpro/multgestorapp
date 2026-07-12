// Prompt Generator Mode (V4) do Agente JoeFelipe.
// Transforma uma missão classificada (V3) em um prompt textual SEGURO para
// Claude Code / OpenCode. Não executa, não chama LLM real, não lê secrets.

import { join } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import {
  deriveSafetyRules,
  buildValidation,
  renderPromptText,
} from "./PromptTemplate.ts";
import type { GeneratedPrompt, PromptGeneratorInput } from "./prompt-types.ts";

/** Gera o prompt seguro a partir de uma missão (já classificada pela V3). */
export function generatePrompt(input: PromptGeneratorInput): GeneratedPrompt {
  const { mission } = input;
  const safety = deriveSafetyRules(mission);
  const validation = buildValidation(mission);
  const text = renderPromptText(input);

  return {
    missionId: mission.id,
    classification: mission.classification,
    safety,
    validation,
    text,
  };
}

/** Grava o prompt em runtime/prompt.md (git-ignored, best-effort). */
export function writePromptArtifact(root: string, content: string): void {
  try {
    const dir = join(root, "tools", "joefelipe-agent", "runtime");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "prompt.md"), content, "utf8");
  } catch {
    /* runtime é best-effort; nunca derruba o agente */
  }
}
