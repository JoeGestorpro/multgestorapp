// Templates do Prompt Generator (V4): deriva regras de segurança e monta o texto.
// Funções puras, determinísticas. Nenhum efeito colateral, nenhuma chamada externa.

import type { Mission } from "../mission/mission-types.ts";
import type {
  GeneratedPrompt,
  PromptGeneratorInput,
  PromptSafetyRules,
  PromptValidation,
} from "./prompt-types.ts";

/** Deriva as regras de segurança a partir da missão (nunca afrouxa as invariantes). */
export function deriveSafetyRules(mission: Mission): PromptSafetyRules {
  return {
    requiresHumanApproval: mission.requiresHumanApproval,
    canExecute: mission.safety.canExecute, // sempre false
    externalCalls: mission.provenance.externalCallsEnabled, // sempre false
    noSecrets: true,
    noDangerousExecution: true,
    noPushMergeWithoutApproval: true,
    stopOnUnforeseen: true,
  };
}

/** Validações obrigatórias = checklist da missão + invariantes da V4. */
export function buildValidation(mission: Mission): PromptValidation {
  const items = [...mission.validationChecklist];
  items.push("Confirmar canExecute=false e externalCalls=false ao final");
  items.push("Confirmar que nenhum secret/token foi exposto");
  return { items };
}

/** Regras de segurança textuais (sempre presentes; reforçadas se gated/perigoso). */
export function buildSecurityRules(mission: Mission, safety: PromptSafetyRules): string[] {
  const rules: string[] = [];
  if (safety.requiresHumanApproval) {
    rules.push(
      "⚠ requiresHumanApproval: true — NÃO inicie execução sem autorização humana explícita.",
    );
  }
  rules.push(`canExecute: ${safety.canExecute} — propor, nunca executar diretamente.`);
  rules.push(`externalCalls: ${safety.externalCalls} — sem chamadas externas / sem LLM real.`);
  rules.push("NÃO colar, imprimir ou logar secrets/tokens/chaves; NÃO ler arquivos .env.");
  rules.push(
    "NÃO executar ações perigosas: banco, migrations, RLS, Redis, WhatsApp real, B2/upload, produção, deploy, comandos destrutivos.",
  );
  rules.push("NÃO fazer push / merge / deploy sem autorização humana explícita.");
  rules.push("NÃO usar `git add .`; staging explícito por caminho.");
  rules.push(
    "PARE imediatamente se encontrar estado sujo (git status inesperado), divergência de branch ou risco não previsto, e reporte antes de prosseguir.",
  );
  if (mission.classification === "DANGEROUS") {
    rules.push(
      "Classificação DANGEROUS: trate tudo como bloqueado por padrão; apenas planeje e aguarde aprovação humana para cada passo.",
    );
  }
  return rules;
}

/** Relatório final que o executor deve entregar. */
export function buildFinalReport(): string[] {
  return [
    "O que foi feito (arquivos criados/alterados, por caminho).",
    "Resultado das validações (build/type-check e smokes).",
    "git status --short e git diff --stat.",
    "Confirmação: canExecute=false, externalCalls=false, nenhum secret exposto.",
    "Confirmação de que nada fora do escopo permitido foi tocado.",
    "Pendências, próximos passos e o que requer autorização humana.",
  ];
}

function bullets(items: string[], emptyText: string): string {
  if (!items.length) return `- ${emptyText}`;
  return items.map((i) => `- ${i}`).join("\n");
}

/** Monta o texto final do prompt seguro (pronto para colar). */
export function renderPromptText(input: PromptGeneratorInput): string {
  const { mission } = input;
  const safety = deriveSafetyRules(mission);
  const validation = buildValidation(mission);
  const securityRules = buildSecurityRules(mission, safety);
  const finalReport = buildFinalReport();

  const objective = input.objective ?? mission.title;
  const context =
    input.context ??
    `Missão ${mission.id} (executor-alvo: ${mission.executor}) gerada pelo Mission Builder do Agente JoeFelipe. ` +
      `Provider de inteligência: ${mission.provenance.llmProvider}/${mission.provenance.llmModel} ` +
      `(externalCalls=${mission.provenance.externalCallsEnabled}).`;

  const lines: string[] = [];
  lines.push("Você está autorizado a executar somente a missão descrita abaixo.");
  lines.push("");
  lines.push("Contexto:");
  lines.push(context);
  lines.push("");
  lines.push("Objetivo:");
  lines.push(objective);
  lines.push("");
  lines.push("Escopo permitido:");
  lines.push(bullets(mission.scope.allowed, "(nenhum arquivo de escrita — leitura/planejamento)"));
  lines.push("");
  lines.push("Escopo proibido:");
  lines.push(bullets(mission.scope.forbidden, "(nenhum)"));
  lines.push("");
  lines.push("Classificação de risco:");
  lines.push(`${mission.classification} (llmMode ${mission.llmMode})`);
  lines.push("");
  lines.push("Aprovação humana:");
  lines.push(
    safety.requiresHumanApproval
      ? "requiresHumanApproval: true — OBRIGATÓRIA antes de qualquer execução."
      : "requiresHumanApproval: false — não requerida para o escopo acima (ainda assim, sem push/merge/deploy sem autorização).",
  );
  lines.push("");
  lines.push("Validações obrigatórias:");
  lines.push(bullets(validation.items, "(nenhuma)"));
  lines.push("");
  lines.push("Regras de segurança:");
  lines.push(bullets(securityRules, "(nenhuma)"));
  lines.push("");
  lines.push("Relatório final obrigatório:");
  lines.push(bullets(finalReport, "(nenhum)"));
  lines.push("");
  lines.push("Pare após o relatório final.");

  return lines.join("\n");
}

/** Embala o prompt gerado como seção markdown (para a saída da missão / artefato). */
export function renderGeneratedPromptMarkdown(gp: GeneratedPrompt): string {
  return [
    "## Prompt seguro gerado (V4 — Prompt Generator)",
    "",
    "```text",
    gp.text,
    "```",
    "",
  ].join("\n");
}
