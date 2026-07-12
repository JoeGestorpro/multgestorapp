// Tipos do Prompt Generator Mode (V4) do Agente JoeFelipe.
// Só tipos: apagáveis pelo type-stripping do Node. Nenhum runtime aqui.
// A V4 transforma uma missão (já classificada pela V3) em um prompt textual seguro.

import type { Mission, MissionClassification } from "../mission/mission-types.ts";

/** Entrada do gerador: a missão classificada + objetivo/contexto opcionais. */
export interface PromptGeneratorInput {
  mission: Mission;
  /** Objetivo explícito; se ausente, usa `mission.title`. */
  objective?: string;
  /** Contexto adicional; se ausente, derivado da provenance/missão. */
  context?: string;
}

/** Regras de segurança refletidas no prompt (derivadas da missão; nunca afrouxadas). */
export interface PromptSafetyRules {
  requiresHumanApproval: boolean;
  /** Sempre false: a LLM propõe, não executa. */
  canExecute: boolean;
  /** Sempre false na V4: nenhuma chamada externa. */
  externalCalls: boolean;
  noSecrets: boolean;
  noDangerousExecution: boolean;
  noPushMergeWithoutApproval: boolean;
  stopOnUnforeseen: boolean;
}

/** Validações obrigatórias que o executor deve rodar. */
export interface PromptValidation {
  items: string[];
}

/** Resultado do gerador: prompt textual pronto + metadados de segurança. */
export interface GeneratedPrompt {
  missionId: string;
  classification: MissionClassification;
  safety: PromptSafetyRules;
  validation: PromptValidation;
  /** Prompt seguro, pronto para colar em Claude Code / OpenCode. */
  text: string;
}
