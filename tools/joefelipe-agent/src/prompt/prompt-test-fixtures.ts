// Fixtures compartilhadas dos testes do Prompt Generator (V4).
// Não é um arquivo de teste (sem sufixo .test.ts) e não é runtime de produto:
// apenas monta objetos Mission determinísticos para exercitar o gerador.

import type { Mission } from "../mission/mission-types.ts";

/** Constrói uma Mission válida e determinística; sobrescrevível campo a campo. */
export function makeMission(over: Partial<Mission> = {}): Mission {
  return {
    id: "docs/exemplo",
    title: "Atualizar documentação de exemplo",
    classification: "READ_ONLY",
    executor: "claude-code",
    llmMode: "READ_ONLY",
    requiresHumanApproval: false,
    scope: {
      allowed: ["docs/exemplo.md"],
      forbidden: ["**/.env", "supabase/migrations/**"],
    },
    operationalPrompt: "Analisar e atualizar a doc de exemplo.",
    validationChecklist: ["Rodar type-check", "Rodar a suíte de testes"],
    rollbackPlan: ["git checkout -- docs/exemplo.md"],
    commitPrompt: "docs: atualizar exemplo",
    safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
    provenance: {
      generatedAt: "2026-07-12T00:00:00.000Z",
      agentVersion: "1.0.0",
      sources: ["A-001"],
      llmProvider: "mock",
      llmModel: "mock-1",
      externalCallsEnabled: false,
      sourceRiskId: "A-001",
    },
    warnings: [],
    ...over,
  };
}

/** Missão perigosa (DANGEROUS/LOCKED) com aprovação humana obrigatória. */
export function makeDangerousMission(over: Partial<Mission> = {}): Mission {
  return makeMission({
    id: "security/rls-companies",
    title: "Adicionar policies RLS",
    classification: "DANGEROUS",
    llmMode: "LOCKED",
    requiresHumanApproval: true,
    scope: {
      allowed: ["supabase/migrations/"],
      forbidden: ["**/.env", "**/secrets/**"],
    },
    warnings: ["Missão perigosa: só planejar, aguardar aprovação humana."],
    ...over,
  });
}

/** Missão degenerada: arrays vazios e strings vazias (entrada vazia/limite). */
export function makeEmptyMission(over: Partial<Mission> = {}): Mission {
  return makeMission({
    id: "",
    title: "",
    scope: { allowed: [], forbidden: [] },
    validationChecklist: [],
    warnings: [],
    ...over,
  });
}
