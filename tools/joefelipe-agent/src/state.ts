// Consolida o estado do Agente JoeFelipe a partir de todas as fontes read-only.
// Tamb\u00E9m persiste snapshots locais em runtime/ (sem segredos).

import { join } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import {
  findRepoRoot,
  collectSources,
  readFirst,
  parseFrontmatter,
  firstHeading,
  extractRisks,
  extractPendingDecisions,
  extractNextBestAction,
} from "./readers.ts";
import { getGitInfo } from "./git.ts";
import { buildRecommendedPrompt } from "./prompt-builder.ts";
import { EventStore } from "./events/EventStore.ts"
import { ApprovalManager } from "./approval/ApprovalManager.ts"
import { TaskOrchestrator } from "./orchestrator/TaskOrchestrator.ts"
import { ExecutionEngine } from "./execution/ExecutionEngine.ts";
import { LlmEngine } from "./llm/LlmEngine.ts";
import { loadLlmConfig } from "./llm/llm-config.ts";
import type { AgentMeta, AgentState } from "./types.ts";
import type { Kernel } from "./kernel/Kernel.ts";

export const AGENT_META: AgentMeta = {
  name: "Agente JoeFelipe",
  technicalName: "joefelipe-personal-operating-agent",
  version: "3.0.0 (V3, Mission Builder)",
  mode: "READ_ONLY",
};

const LIVING_OS = ".opencodex/brain/living-os";
const ROOT_LIVING_OS = "living-os";

const llmConfig = loadLlmConfig();
const llmEngine = new LlmEngine();

export function buildState(root: string = findRepoRoot(), kernel?: Kernel): AgentState {
  const sources = collectSources(root);

  // \u2500\u2500 Miss\u00E3o (fila) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const cur = readFirst(root, [".opencodex/queue/current-task.md"]);
  const nxt = readFirst(root, [".opencodex/queue/next-task.md"]);
  const curFm = cur ? parseFrontmatter(cur.content) : {};
  const nxtFm = nxt ? parseFrontmatter(nxt.content) : {};

  const currentStatus = curFm.status ?? null;
  const current =
    currentStatus && currentStatus !== "idle"
      ? (curFm.task_id ?? (cur ? firstHeading(cur.content) : null))
      : "idle (nenhuma miss\u00E3o em execu\u00E7\u00E3o)";

  // \u2500\u2500 Pr\u00F3xima melhor a\u00E7\u00E3o (Living OS) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const nba = readFirst(root, [
    `${LIVING_OS}/05-proxima-melhor-acao.md`,
    `${ROOT_LIVING_OS}/05-proxima-melhor-acao.md`,
  ]);
  const nbaData = nba
    ? extractNextBestAction(nba.content)
    : { mission: null, rationale: null };

  // \u2500\u2500 Riscos (Living OS) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const riscos = readFirst(root, [
    `${LIVING_OS}/riscos/riscos-ativos.md`,
    `${ROOT_LIVING_OS}/riscos/riscos-ativos.md`,
  ]);
  const risksData = riscos
    ? extractRisks(riscos.content)
    : { total: null, summary: null, items: [] };

  // \u2500\u2500 Decis\u00F5es executivas pendentes (Living OS) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const dec = readFirst(root, [
    `${LIVING_OS}/decisoes/decisoes-executivas.md`,
    `${ROOT_LIVING_OS}/decisoes/decisoes-executivas.md`,
  ]);
  const pending = dec ? extractPendingDecisions(dec.content) : [];

  // \u2500\u2500 Git \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const git = getGitInfo(root);

  // \u2500\u2500 A\u00E7\u00F5es humanas pendentes (derivadas, nunca inventadas) \u2500\u2500\u2500\u2500
  const humanActions: string[] = [];
  if (
    nxtFm.requires_human_approval === "true" ||
    nxtFm.requires_human_action === "true"
  ) {
    humanActions.push(
      `Autoriza\u00E7\u00E3o humana pendente para a pr\u00F3xima miss\u00E3o: ${nxtFm.task_id ?? "(ver next-task.md)"}`,
    );
  }
  for (const d of pending) humanActions.push(`Decis\u00E3o pendente: ${d.id} \u2014 ${d.title}`);
  humanActions.push("Nunca colar secrets/tokens no chat.");
  humanActions.push(
    "Validar escopo antes de commitar; nenhum push/deploy sem autoriza\u00E7\u00E3o.",
  );

  // \u2500\u2500 Avisos \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const warnings: string[] = [];
  for (const m of sources.missing) {
    warnings.push(`Fonte ausente: ${m.role} (${m.path})`);
  }
  const sensitive = git.changed.filter((c) => c.sensitive);
  if (sensitive.length) {
    warnings.push(
      `${sensitive.length} arquivo(s) sens\u00EDvel(eis) em git status \u2014 conte\u00FAdo IGNORADO por seguran\u00E7a.`,
    );
  }

  const llmInfo = llmEngine.getProviderInfo();
  const eventStore = new EventStore(root);
  const eventStats = eventStore.stats()
  const approvalManager = new ApprovalManager(root)
  const pendingApprovals = approvalManager.list();
  const orchestrator = new TaskOrchestrator(root)
  const activeOrc = orchestrator.active()
  const orcSteps = activeOrc ? { steps: activeOrc.steps.length, completed: activeOrc.steps.filter((s) => s.status === "completed").length, failed: activeOrc.steps.filter((s) => s.status === "failed").length, status: activeOrc.status } : undefined

  const state: AgentState = {
    agent: AGENT_META,
    generatedAt: new Date().toISOString(),
    repoRoot: root,
    sources,
    mission: {
      current,
      currentStatus,
      next: nxtFm.task_id ?? (nxt ? firstHeading(nxt.content) : null),
      nextStatus: nxtFm.status ?? null,
      nextMode: nxtFm.mode ?? null,
      source: cur?.path ?? nxt?.path ?? null,
    },
    nextBestAction: {
      mission: nbaData.mission,
      rationale: nbaData.rationale,
      source: nba?.path ?? null,
    },
    risks: {
      total: risksData.total,
      summary: risksData.summary,
      items: risksData.items,
      source: riscos?.path ?? null,
    },
    decisions: { pending, source: dec?.path ?? null },
    humanActions,
    git,
    llm: llmInfo,
    recommendedPrompt: "",
    warnings,
    kernel: kernel?.getStatus(),
    events: { total: eventStats.total, pending: eventStats.byStatus["received"] ?? 0 },
    pendingApprovals,
    orchestrator: orcSteps,
  };

  state.recommendedPrompt = buildRecommendedPrompt(state);
  return state;
}

function runtimeDir(root: string): string {
  const dir = join(root, "tools", "joefelipe-agent", "runtime");
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Grava o snapshot atual em runtime/state.json (sem segredos). */
export function writeRuntimeState(root: string, state: AgentState): void {
  try {
    writeFileSync(
      join(runtimeDir(root), "state.json"),
      JSON.stringify(state, null, 2),
      "utf8",
    );
  } catch {
    /* runtime \u00E9 best-effort; nunca derruba o agente */
  }
}

/** Grava o resumo de sess\u00E3o (morning/close) em runtime/session.md. */
export function writeSession(root: string, content: string): void {
  try {
    writeFileSync(join(runtimeDir(root), "session.md"), content, "utf8");
  } catch {
    /* best-effort */
  }
}