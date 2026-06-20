import { join } from "node:path";
import { watchSources } from "./watcher.ts";
import { startServer } from "./server.ts";
import { buildState, writeRuntimeState, writeSession, AGENT_META, logEvent } from "./state.ts";
import { findRepoRoot } from "./readers.ts";
import { buildMission, writeMissionArtifact } from "./mission/MissionBuilder.ts";
import { renderMissionMarkdown } from "./mission/render.ts";
import type { MissionInput } from "./mission/mission-types.ts";

const ROOT = findRepoRoot();
const cmd = process.argv[2];

// Missão de exemplo (demonstra elevação para DANGEROUS por banco/RLS/migration).
// Override por args: tsx src/index.ts mission "<title>" "<intent>"
const DEFAULT_MISSION_INPUT: MissionInput = {
  id: "security/rls-companies-users",
  title: "Adicionar policies RLS para companies e users",
  intent:
    "Criar a migration e as políticas RLS no banco para as tabelas companies e users, conforme o achado A-001 da auditoria.",
  executor: "claude-code",
  type: "security",
  allowedFilesHint: ["supabase/migrations/", "docs/security/rls.md"],
  sourceRiskId: "A-001",
};

switch (cmd) {
  case "dev": {
    const server = startServer(ROOT, 3333);
    const unwatch = watchSources(ROOT, (evt) => {
      logEvent(ROOT, evt);
    });
    console.log(`Agente ${AGENT_META.name} vivo em http://localhost:3333`);
    process.on("SIGINT", () => {
      unwatch();
      server.close();
      console.log("\nAgente encerrado.");
    });
    break;
  }

  case "status": {
    const state = buildState(ROOT);
    writeRuntimeState(ROOT, state);

    console.log(`Estado: missão atual ${state.mission.current} · próxima: ${state.mission.next ?? "—"} (${state.mission.nextStatus ?? "?"})`);
    if (state.nextBestAction.mission) {
      console.log(`Próxima melhor ação: ${state.nextBestAction.mission}`);
    }
    const p1 = state.risks.items.filter((r) => r.severity === "P1");
    if (p1.length) {
      console.log(`Riscos P1: ${p1.map((r) => r.id ?? r.title).join(" · ")}`);
    }
    console.log(`Git: ${state.git.branch ?? "?"} · ${state.git.changed.length} arquivo(s) modificado(s)`);
    if (state.decisions.pending.length) {
      console.log(`Decisões pendentes: ${state.decisions.pending.map((d) => d.id).join(", ")}`);
    }
    if (state.humanActions.length) {
      console.log("Ações humanas:");
      state.humanActions.forEach((a) => console.log(`  → ${a}`));
    }
    if (state.warnings.length) {
      console.log("Avisos:");
      state.warnings.forEach((w) => console.log(`  ⚠ ${w}`));
    }
    break;
  }

  case "morning": {
    const state = buildState(ROOT);
    writeRuntimeState(ROOT, state);
    const msg = [
      `Bom dia, JoeFelipe.`,
      `Hoje a fundação P1 ainda é a prioridade. Missão atual: ${state.mission.current}.`,
      `Próxima melhor ação: ${state.nextBestAction.mission ?? "—"}.`,
      `${state.humanActions.length} ação(ões) humana(s) pendente(s).`,
    ].join("\n");
    writeSession(ROOT, msg);
    console.log(msg);
    break;
  }

  case "close": {
    const state = buildState(ROOT);
    const msg = [
      `Sessão encerrada. Nada foi executado (modo read-only).`,
      `Pendências: ${state.humanActions.length} ação(ões) humana(s) pendente(s).`,
      `Próximo passo: revisar next-task.md antes de autorizar.`,
    ].join("\n");
    writeSession(ROOT, msg);
    console.log(msg);
    break;
  }

  case "mission": {
    const argTitle = process.argv[3];
    const argIntent = process.argv[4];
    const input: MissionInput = argTitle
      ? { title: argTitle, intent: argIntent ?? argTitle, executor: "claude-code" }
      : DEFAULT_MISSION_INPUT;

    (async () => {
      const mission = await buildMission(input, ROOT);
      const md = renderMissionMarkdown(mission);
      console.log(md);
      writeMissionArtifact(ROOT, md);
      console.log(
        "\n[mission] artefato gravado em tools/joefelipe-agent/runtime/mission.md (git-ignored).",
      );
    })().catch((err) => {
      console.error(`[mission] erro: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    });
    break;
  }

  default: {
    console.error("Uso: tsx src/index.ts {dev|status|morning|close|mission}");
    process.exit(1);
  }
}
