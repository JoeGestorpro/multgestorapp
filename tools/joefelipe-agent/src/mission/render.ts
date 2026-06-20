// Geração dos artefatos textuais da missão:
// prompt operacional, checklist, rollback, commit prompt e markdown completo.

import { GOVERNANCE_RULES, COMMIT_FOOTER, BASE_CHECKLIST, VERB_BY_TYPE } from "./templates.ts";
import type {
  Mission,
  MissionClassification,
  MissionInput,
  MissionScope,
} from "./mission-types.ts";

export interface PromptParams {
  id: string;
  input: MissionInput;
  classification: MissionClassification;
  llmMode: string;
  requiresHumanApproval: boolean;
  scope: MissionScope;
  currentMission: string | null;
  branch: string | null;
  p1Titles: string[];
  llmText: string;
}

export function renderOperationalPrompt(p: PromptParams): string {
  const target = p.input.executor === "opencode" ? "OpenCode" : "Claude Code";
  const lines: string[] = [];

  lines.push(`# Missão para ${target} — ${p.id}`);
  lines.push("");
  lines.push(
    "Você está no repositório do MultGestor. Missão gerada pelo Mission Builder (Agente JoeFelipe V3).",
  );
  lines.push("");
  lines.push(`- Classificação: ${p.classification} (llmMode ${p.llmMode})`);
  lines.push(`- Executor: ${target}`);
  lines.push(
    `- Aprovação humana: ${
      p.requiresHumanApproval
        ? "OBRIGATÓRIA antes de qualquer execução"
        : "não requerida para o escopo abaixo"
    }`,
  );
  if (p.currentMission) lines.push(`- Missão atual do projeto: ${p.currentMission}`);
  if (p.branch) lines.push(`- Branch: ${p.branch}`);
  if (p.p1Titles.length) lines.push(`- Riscos P1 ativos: ${p.p1Titles.join("; ")}`);
  lines.push("");

  if (p.requiresHumanApproval) {
    lines.push("> ⚠ AGUARDAR AUTORIZAÇÃO HUMANA EXPLÍCITA. NÃO iniciar execução até aprovação.");
    lines.push("");
  }

  lines.push("## Objetivo");
  lines.push(p.input.intent);
  lines.push("");

  lines.push("## Escopo permitido");
  if (p.scope.allowed.length) {
    for (const a of p.scope.allowed) lines.push(`- ${a}`);
  } else {
    lines.push("- (nenhum arquivo de escrita — missão de leitura/planejamento)");
  }
  lines.push("");

  lines.push("## Escopo proibido");
  for (const f of p.scope.forbidden) lines.push(`- ${f}`);
  lines.push("");

  lines.push("## Regras de governança (não negociáveis)");
  for (const r of GOVERNANCE_RULES) lines.push(`- ${r}`);
  lines.push("");

  lines.push(
    p.input.executor === "opencode"
      ? "> Diretriz OpenCode: tarefa pequena e objetiva, dentro do VS Code, sem sair do escopo permitido."
      : "> Diretriz Claude Code: pode auditar/planejar com contexto rico; respeitar escopo e gates.",
  );
  lines.push("");

  lines.push("## Proposta da camada de inteligência (LLM Core — mock)");
  lines.push(p.llmText);

  return lines.join("\n");
}

export function buildChecklist(c: MissionClassification, _type?: string): string[] {
  const list = [...BASE_CHECKLIST];
  if (c === "READ_ONLY" || c === "PLAN_ONLY") {
    list.push("Confirmar que nenhum arquivo foi alterado (git status --short limpo)");
  }
  if (c === "SAFE_WRITE") {
    list.push("Alterações limitadas estritamente ao escopo permitido");
    list.push("Validar comportamento após a mudança (build/teste do módulo afetado)");
  }
  if (c === "HUMAN_GATED" || c === "DANGEROUS") {
    list.push("NÃO executar sem autorização humana explícita registrada");
    list.push("Confirmar plano de rollback antes de qualquer ação aprovada");
  }
  if (c === "DANGEROUS") {
    list.push("Revisão humana obrigatória de cada comando antes da execução");
  }
  return list;
}

export function buildRollback(c: MissionClassification, scope: MissionScope): string[] {
  if (c === "READ_ONLY" || c === "PLAN_ONLY") {
    return ["Nenhuma alteração é feita; rollback não aplicável (operação read-only/plan-only)."];
  }
  if (c === "SAFE_WRITE") {
    const files = scope.allowed.length ? scope.allowed.join(" ") : "<arquivos do escopo>";
    return [
      `Reverter arquivos do escopo: git restore ${files}`,
      "Se já houver commit local: git revert <hash> (nunca push sem autorização).",
      "Confirmar git status --short limpo após o rollback.",
    ];
  }
  // HUMAN_GATED / DANGEROUS
  return [
    "Rollback NÃO deve ser executado pelo agente — operação requer aprovação humana.",
    "Plano para o humano: identificar o blast radius e ter backup/restore validado antes de agir.",
    "Para infra/banco/produção: seguir runbook específico e validar restore antes de qualquer mudança.",
    "Nenhum push/deploy/merge no rollback sem nova autorização explícita.",
  ];
}

export function buildCommitPrompt(id: string, title: string, type?: string): string {
  const scope = id.includes("/") ? id.split("/")[0] : (type ?? "agent");
  const verb = VERB_BY_TYPE[(type ?? "").toLowerCase()] ?? "feat";
  const subject = title.charAt(0).toLowerCase() + title.slice(1);
  return [
    `${verb}(${scope}): ${subject}`,
    "",
    `Missão ${id} gerada pelo Mission Builder (Agente JoeFelipe V3).`,
    "",
    COMMIT_FOOTER,
  ].join("\n");
}

/** Markdown completo da missão (stdout + runtime/mission.md). Contém todos os campos. */
export function renderMissionMarkdown(m: Mission): string {
  const lines: string[] = [];
  lines.push(`# Missão gerada — ${m.id}`);
  lines.push("");
  lines.push("> Artefato gerado pelo Mission Builder (Agente JoeFelipe V3). READ-ONLY: nada foi executado.");
  lines.push("> Vive em runtime/ e é git-ignored (não entra em commit).");
  lines.push("");

  lines.push("## Resumo");
  lines.push(`- id: ${m.id}`);
  lines.push(`- title: ${m.title}`);
  lines.push(`- classification: ${m.classification}`);
  lines.push(`- executor: ${m.executor}`);
  lines.push(`- llmMode: ${m.llmMode}`);
  lines.push(`- requiresHumanApproval: ${m.requiresHumanApproval}`);
  lines.push(`- canExecute: ${m.safety.canExecute}`);
  lines.push("");

  lines.push("## Escopo permitido");
  lines.push(
    m.scope.allowed.length
      ? m.scope.allowed.map((a) => `- ${a}`).join("\n")
      : "- (nenhum — leitura/planejamento)",
  );
  lines.push("");

  lines.push("## Escopo proibido");
  lines.push(m.scope.forbidden.map((f) => `- ${f}`).join("\n"));
  lines.push("");

  lines.push("## Operational prompt");
  lines.push("```text");
  lines.push(m.operationalPrompt);
  lines.push("```");
  lines.push("");

  lines.push("## Validation checklist");
  lines.push(m.validationChecklist.map((c) => `- [ ] ${c}`).join("\n"));
  lines.push("");

  lines.push("## Rollback plan");
  lines.push(m.rollbackPlan.map((r) => `- ${r}`).join("\n"));
  lines.push("");

  lines.push("## Commit prompt");
  lines.push("```text");
  lines.push(m.commitPrompt);
  lines.push("```");
  lines.push("");

  lines.push("## Safety");
  lines.push(`- canExecute: ${m.safety.canExecute}`);
  lines.push(`- requiresHumanApproval: ${m.safety.requiresHumanApproval}`);
  lines.push(
    `- blockedReasons: ${
      m.safety.blockedReasons.length ? m.safety.blockedReasons.join("; ") : "(nenhum)"
    }`,
  );
  lines.push("");

  lines.push("## Provenance");
  lines.push(`- generatedAt: ${m.provenance.generatedAt}`);
  lines.push(`- agentVersion: ${m.provenance.agentVersion}`);
  lines.push(
    `- llm: ${m.provenance.llmProvider} / ${m.provenance.llmModel} (externalCalls=${m.provenance.externalCallsEnabled})`,
  );
  if (m.provenance.sourceRiskId) lines.push(`- sourceRiskId: ${m.provenance.sourceRiskId}`);
  lines.push(
    `- sources (${m.provenance.sources.length}): ${m.provenance.sources.join(", ") || "(nenhuma)"}`,
  );
  lines.push("");

  lines.push("## Warnings");
  lines.push(m.warnings.length ? m.warnings.map((w) => `- ⚠ ${w}`).join("\n") : "- (nenhum)");
  lines.push("");

  return lines.join("\n");
}
