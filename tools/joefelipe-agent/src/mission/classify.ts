// Classificação de risco determinística de uma missão.
// Precedência: READ_ONLY < PLAN_ONLY < SAFE_WRITE < HUMAN_GATED < DANGEROUS.
// Combina sinais: termos sensíveis (fonte única) + safety da LLM Core.

import { detectSensitiveHits, type SensitiveHit } from "../llm/sensitive.ts";
import type { LlmMode, LlmSafety } from "../llm/LlmProvider.ts";
import type { MissionClassification, MissionInput } from "./mission-types.ts";

const ORDER: Record<MissionClassification, number> = {
  READ_ONLY: 0,
  PLAN_ONLY: 1,
  SAFE_WRITE: 2,
  HUMAN_GATED: 3,
  DANGEROUS: 4,
};

/** Mapa classificação (V3) → LlmMode (contrato V2, sem quebra). */
const MODE_MAP: Record<MissionClassification, LlmMode> = {
  READ_ONLY: "READ_ONLY",
  PLAN_ONLY: "PLAN_ONLY",
  SAFE_WRITE: "SAFE_WRITE",
  HUMAN_GATED: "HUMAN_APPROVAL_REQUIRED",
  DANGEROUS: "LOCKED",
};

const READ_ONLY_VERBS =
  /\b(ler|leitura|auditar|auditoria|analisar|an[aá]lise|revisar|revis[aã]o|inspecionar|inspe[cç][aã]o|read[\s-]?only)\b/i;

export interface ClassifyResult {
  classification: MissionClassification;
  llmMode: LlmMode;
  requiresHumanApproval: boolean;
  hits: SensitiveHit[];
  reasons: string[];
}

export function maxClassification(
  a: MissionClassification,
  b: MissionClassification,
): MissionClassification {
  return ORDER[a] >= ORDER[b] ? a : b;
}

export function toLlmMode(c: MissionClassification): LlmMode {
  return MODE_MAP[c];
}

export function classifyMission(input: MissionInput, safety?: LlmSafety): ClassifyResult {
  const reasons: string[] = [];
  const haystack = [input.title, input.intent, ...(input.allowedFilesHint ?? [])].join(" ");
  const hits = detectSensitiveHits(haystack);

  // Base: escopo de escrita → SAFE_WRITE; leitura/auditoria → READ_ONLY; senão PLAN_ONLY.
  const hasFiles = !!input.allowedFilesHint && input.allowedFilesHint.length > 0;
  let level: MissionClassification;
  if (hasFiles) {
    level = "SAFE_WRITE";
    reasons.push("Escopo com arquivos de escrita → base SAFE_WRITE");
  } else if (READ_ONLY_VERBS.test(haystack)) {
    level = "READ_ONLY";
    reasons.push("Intenção de leitura/auditoria sem arquivos → base READ_ONLY");
  } else {
    level = "PLAN_ONLY";
    reasons.push("Sem arquivos de escrita → base PLAN_ONLY");
  }

  // Eleva por termos sensíveis.
  for (const h of hits) {
    if (h.severity === "dangerous") {
      level = maxClassification(level, "DANGEROUS");
      reasons.push(`Termo perigoso "${h.label}" → eleva para DANGEROUS`);
    } else {
      level = maxClassification(level, "HUMAN_GATED");
      reasons.push(`Termo sensível "${h.label}" → eleva para HUMAN_GATED`);
    }
  }

  // Eleva pelo safety retornado pela LLM Core.
  if (safety?.requiresHumanApproval) {
    level = maxClassification(level, "HUMAN_GATED");
    reasons.push("LLM safety.requiresHumanApproval=true → eleva para HUMAN_GATED");
  }

  const requiresHumanApproval = ORDER[level] >= ORDER.HUMAN_GATED;
  return { classification: level, llmMode: MODE_MAP[level], requiresHumanApproval, hits, reasons };
}
