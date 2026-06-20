// Consolida o estado do Agente JoeFelipe a partir de todas as fontes read-only.
// Também persiste snapshots locais em runtime/ (sem segredos).

import { join } from "node:path";
import { writeFileSync, appendFileSync, mkdirSync } from "node:fs";
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
import { LlmEngine } from "./llm/LlmEngine.ts";
import { loadLlmConfig } from "./llm/llm-config.ts";
import type { AgentMeta, AgentState, WatchEvent } from "./types.ts";

export const AGENT_META: AgentMeta = {
  name: "Agente JoeFelipe",
  technicalName: "joefelipe-personal-operating-agent",
  version: "3.0.0 (V3, Mission Builder)",
  mode: "READ_ONLY",
};

const LIVING_OS = ".opencodex/brain/living-os";
const ROOT_LIVING_OS = "living-os";

const llmConfig = loadLlmConfig();
const llmEngine = new LlmEngine(llmConfig);

export function buildState(root: string = findRepoRoot()): AgentState {
  const sources = collectSources(root);

  // ── Missão (fila) ──────────────────────────────────────────────
  const cur = readFirst(root, [".opencodex/queue/current-task.md"]);
  const nxt = readFirst(root, [".opencodex/queue/next-task.md"]);
  const curFm = cur ? parseFrontmatter(cur.content) : {};
  const nxtFm = nxt ? parseFrontmatter(nxt.content) : {};

  const currentStatus = curFm.status ?? null;
  const current =
    currentStatus && currentStatus !== "idle"
      ? (curFm.task_id ?? (cur ? firstHeading(cur.content) : null))
      : "idle (nenhuma missão em execução)";

  // ── Próxima melhor ação (Living OS) ────────────────────────────
  const nba = readFirst(root, [
    `${LIVING_OS}/05-proxima-melhor-acao.md`,
    `${ROOT_LIVING_OS}/05-proxima-melhor-acao.md`,
  ]);
  const nbaData = nba
    ? extractNextBestAction(nba.content)
    : { mission: null, rationale: null };

  // ── Riscos (Living OS) ─────────────────────────────────────────
  const riscos = readFirst(root, [
    `${LIVING_OS}/riscos/riscos-ativos.md`,
    `${ROOT_LIVING_OS}/riscos/riscos-ativos.md`,
  ]);
  const risksData = riscos
    ? extractRisks(riscos.content)
    : { total: null, summary: null, items: [] };

  // ── Decisões executivas pendentes (Living OS) ──────────────────
  const dec = readFirst(root, [
    `${LIVING_OS}/decisoes/decisoes-executivas.md`,
    `${ROOT_LIVING_OS}/decisoes/decisoes-executivas.md`,
  ]);
  const pending = dec ? extractPendingDecisions(dec.content) : [];

  // ── Git ────────────────────────────────────────────────────────
  const git = getGitInfo(root);

  // ── Ações humanas pendentes (derivadas, nunca inventadas) ──────
  const humanActions: string[] = [];
  if (
    nxtFm.requires_human_approval === "true" ||
    nxtFm.requires_human_action === "true"
  ) {
    humanActions.push(
      `Autorização humana pendente para a próxima missão: ${nxtFm.task_id ?? "(ver next-task.md)"}`,
    );
  }
  for (const d of pending) humanActions.push(`Decisão pendente: ${d.id} — ${d.title}`);
  humanActions.push("Nunca colar secrets/tokens no chat.");
  humanActions.push(
    "Validar escopo antes de commitar; nenhum push/deploy sem autorização.",
  );

  // ── Avisos ─────────────────────────────────────────────────────
  const warnings: string[] = [];
  for (const m of sources.missing) {
    warnings.push(`Fonte ausente: ${m.role} (${m.path})`);
  }
  const sensitive = git.changed.filter((c) => c.sensitive);
  if (sensitive.length) {
    warnings.push(
      `${sensitive.length} arquivo(s) sensível(eis) em git status — conteúdo IGNORADO por segurança.`,
    );
  }

  const llmInfo = llmEngine.getProviderInfo();

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
    /* runtime é best-effort; nunca derruba o agente */
  }
}

/** Anexa um evento de mudança em runtime/events.jsonl. */
export function logEvent(root: string, evt: WatchEvent): void {
  try {
    appendFileSync(join(runtimeDir(root), "events.jsonl"), JSON.stringify(evt) + "\n", "utf8");
  } catch {
    /* best-effort */
  }
}

/** Grava o resumo de sessão (morning/close) em runtime/session.md. */
export function writeSession(root: string, content: string): void {
  try {
    writeFileSync(join(runtimeDir(root), "session.md"), content, "utf8");
  } catch {
    /* best-effort */
  }
}
