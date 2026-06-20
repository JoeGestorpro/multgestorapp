// Modelo de dados de uma missão operacional (V3 — Mission Builder).
// Só tipos: apagáveis pelo type-stripping do Node. Nenhum runtime aqui.

import type { LlmMode, LlmSafety } from "../llm/LlmProvider.ts";

/** Classificação de risco da missão (precedência crescente). */
export type MissionClassification =
  | "READ_ONLY"
  | "PLAN_ONLY"
  | "SAFE_WRITE"
  | "HUMAN_GATED"
  | "DANGEROUS";

/** Executor-alvo do prompt operacional gerado. */
export type Executor = "claude-code" | "opencode";

/** Entrada bruta de uma missão (o que se quer fazer). */
export interface MissionInput {
  title: string;
  intent: string;
  executor: Executor;
  /** id explícito; se ausente, derivado de type + title. */
  id?: string;
  /** tipo da missão: "security", "ops-infra", "docs", "feat"... */
  type?: string;
  /** dica de escopo de escrita; sensíveis/proibidos são removidos. */
  allowedFilesHint?: string[];
  /** origem do risco/decisão/achado (auditabilidade). */
  sourceRiskId?: string;
}

export interface MissionScope {
  allowed: string[];
  forbidden: string[];
}

export interface MissionProvenance {
  generatedAt: string;
  agentVersion: string;
  sources: string[];
  llmProvider: string;
  llmModel: string;
  externalCallsEnabled: boolean;
  sourceRiskId?: string;
}

/** Missão completa, segura e auditável gerada pelo Mission Builder. */
export interface Mission {
  id: string;
  title: string;
  classification: MissionClassification;
  executor: Executor;
  llmMode: LlmMode;
  requiresHumanApproval: boolean;
  scope: MissionScope;
  operationalPrompt: string;
  validationChecklist: string[];
  rollbackPlan: string[];
  commitPrompt: string;
  safety: LlmSafety;
  provenance: MissionProvenance;
  warnings: string[];
}
