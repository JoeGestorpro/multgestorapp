// Monta o "prompt recomendado" para Claude Code / OpenCode a partir do estado.
// O prompt sempre reforça as regras de governança (read-only / aprovação humana).

import type { AgentState } from "./types.ts";

export function buildRecommendedPrompt(s: AgentState): string {
  const p1 = s.risks.items
    .filter((r) => r.severity === "P1")
    .map((r) => `${r.id ?? ""} ${r.title}`.trim());

  const lines: string[] = [];
  lines.push(
    "Você está no repositório do MultGestor. Contexto gerado pelo Agente JoeFelipe (read-only):",
  );
  lines.push("");
  lines.push(
    `- Missão atual: ${s.mission.current ?? "idle"}${
      s.mission.currentStatus ? ` (${s.mission.currentStatus})` : ""
    }`,
  );
  if (s.mission.next) {
    lines.push(
      `- Próxima missão (fila): ${s.mission.next}${
        s.mission.nextStatus ? ` — ${s.mission.nextStatus}` : ""
      }${s.mission.nextMode ? ` [${s.mission.nextMode}]` : ""}`,
    );
  }
  if (s.nextBestAction.mission) {
    lines.push(
      `- Próxima melhor ação (Living OS): ${s.nextBestAction.mission}${
        s.nextBestAction.rationale ? ` — ${s.nextBestAction.rationale}` : ""
      }`,
    );
  }
  if (p1.length) lines.push(`- Riscos P1 ativos: ${p1.join("; ")}`);
  if (s.decisions.pending.length) {
    const ids = s.decisions.pending.map((d) => d.id).filter(Boolean);
    lines.push(`- Decisões pendentes: ${ids.join(", ")}`);
  }
  lines.push(
    `- Git: branch ${s.git.branch ?? "?"} · ${s.git.changed.length} arquivo(s) modificado(s)`,
  );
  lines.push("");
  lines.push("Regras de governança (não negociáveis):");
  lines.push(
    "- O Living OS é a AUTORIDADE EXECUTIVA; o Segundo Cérebro (.opencodex/brain) é a MEMÓRIA OFICIAL.",
  );
  lines.push(
    "- NÃO iniciar execução de missão PLAN_ONLY / requires_human_approval sem autorização humana explícita.",
  );
  lines.push("- NÃO colar secrets no chat. NÃO push / merge / deploy sem autorização.");
  lines.push("");
  lines.push("Tarefa solicitada:");
  lines.push("[descreva aqui o que você quer que o Claude Code / OpenCode faça]");
  return lines.join("\n");
}
