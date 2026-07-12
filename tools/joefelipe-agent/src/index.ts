import { join } from "node:path";
import { watchSources } from "./watcher.ts";
import { startServer } from "./server.ts";
import { buildState, writeRuntimeState, writeSession, AGENT_META } from "./state.ts";
import { findRepoRoot } from "./readers.ts";
import { buildMission, writeMissionArtifact } from "./mission/MissionBuilder.ts";
import { renderMissionMarkdown } from "./mission/render.ts";
import type { MissionInput } from "./mission/mission-types.ts"
import { GoalPlanner, RuleBasedPlanningStrategy, LLMPlanningStrategy } from "./planner/index.ts";
import { Kernel, createKernel } from "./kernel/Kernel.ts";
import type { KernelMode } from "./kernel/types.ts";
import { LlmEngine } from "./llm/index.ts";
import { EventStore, EventConsumer } from "./events/index.ts"
import { ApprovalManager } from "./approval/index.ts"
import { TaskOrchestrator } from "./orchestrator/index.ts";
import { ExecutionEngine, SimpleRegistry, ExecutionStateStore } from "./execution/index.ts";

const ROOT = findRepoRoot();
const cmd = process.argv[2];

const DEFAULT_MISSION_INPUT: MissionInput = {
  id: "security/rls-companies-users",
  title: "Adicionar policies RLS para companies e users",
  intent:
    "Criar a migration e as pol\u00EDticas RLS no banco para as tabelas companies e users, conforme o achado A-001 da auditoria.",
  executor: "claude-code",
  type: "security",
  allowedFilesHint: ["supabase/migrations/", "docs/security/rls.md"],
  sourceRiskId: "A-001",
};

const kernel = createKernel();

(async () => {
  switch (cmd) {
    case "dev": {
      await kernel.initialize();
      const planner = new GoalPlanner(kernel, new RuleBasedPlanningStrategy());
      kernel.registry.register({
        id: "planner",
        type: "skill" as const,
        name: "Mission Planner",
        version: "1.0.0",
        status: "active" as const,
        tags: ["planning", "fase2"],
        metadata: { strategy: planner.strategy.name },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("Planner: " + planner.name + " \u00B7 " + (planner.loadPlan() ? "plano ativo" : "sem plano"));
      const llm = new LlmEngine(kernel);
      console.log("LLM Engine: " + llm.getProviderInfo().provider + " \u00B7 " + llm.registry.total + " provider(s)");
      const server = startServer(ROOT, 3333, kernel);
      const unwatch = watchSources(ROOT, undefined, kernel);
      console.log(AGENT_META.name + " vivo em http://localhost:3333");
      console.log("Kernel: " + kernel.getStatus().health + " \u00B7 modo " + kernel.getStatus().mode + " \u00B7 " + kernel.registry.total + " entry(s)");
      process.on("SIGINT", async () => {
        unwatch();
        await kernel.destroy();
        server.close();
        console.log("\nAgente encerrado.");
      });
      break;
    }

    case "status": {
      await kernel.initialize();
      const state = buildState(ROOT, kernel);
      writeRuntimeState(ROOT, state);

      console.log("Kernel: " + kernel.getStatus().health + " \u00B7 modo " + kernel.getStatus().mode + " \u00B7 " + kernel.registry.total + " entry(s) \u00B7 memoria " + kernel.getStatus().memory.totalSlots + " slot(s)");
      console.log("Estado: missao atual " + state.mission.current + " \u00B7 proxima: " + (state.mission.next ?? "\u2014") + " (" + (state.mission.nextStatus ?? "?") + ")");
      if (state.nextBestAction.mission) {
        console.log("Proxima melhor acao: " + state.nextBestAction.mission);
      }
      const p1 = state.risks.items.filter((r) => r.severity === "P1");
      if (p1.length) {
        console.log("Riscos P1: " + p1.map((r) => r.id ?? r.title).join(" \u00B7 "));
      }
      console.log("Git: " + (state.git.branch ?? "?") + " \u00B7 " + state.git.changed.length + " arquivo(s) modificado(s)");
      if (state.decisions.pending.length) {
        console.log("Decisoes pendentes: " + state.decisions.pending.map((d) => d.id).join(", "));
      }
      if (state.humanActions.length) {
        console.log("Acoes humanas:");
        state.humanActions.forEach((a) => console.log("  -> " + a));
      }
      if (state.warnings.length) {
        console.log("Avisos:");
        state.warnings.forEach((w) => console.log("  " + w));
      }
      const planStatus = new GoalPlanner(kernel, new RuleBasedPlanningStrategy());
      const plan = planStatus.loadPlan();
      if (plan) {
        console.log("Planner: " + plan.missions.length + " missao(oes) \u00B7 status " + plan.status + " \u00B7 goal: " + plan.goal.title);
      } else {
        console.log("Planner: nenhum plano ativo");
      }
      const llmInfo = new LlmEngine().getProviderInfo();
      console.log("LLM: " + llmInfo.provider + " \u00B7 " + llmInfo.model + " \u00B7 externas: " + (llmInfo.externalCallsEnabled ? "sim" : "nao"));
      if (state.events) {
        console.log("Eventos: " + state.events.total + " total \u00B7 " + state.events.pending + " pendente(s)");
      }
      await kernel.destroy();
      break;
    }

    case "morning": {
      await kernel.initialize();
      const state = buildState(ROOT, kernel);
      writeRuntimeState(ROOT, state);
      const msg = [
        "Bom dia, JoeFelipe.",
        "Kernel: " + kernel.getStatus().health + " \u00B7 modo " + kernel.getStatus().mode,
        "Hoje a fundacao P1 ainda e a prioridade. Missao atual: " + state.mission.current + ".",
        "Proxima melhor acao: " + (state.nextBestAction.mission ?? "\u2014") + ".",
        state.humanActions.length + " acao(oes) humana(s) pendente(s).",
      ].join("\n");
      writeSession(ROOT, msg);
      console.log(msg);
      await kernel.destroy();
      break;
    }

    case "close": {
      const state = buildState(ROOT);
      const msg = [
        "Sessao encerrada. Nada foi executado (modo read-only).",
        "Pendencias: " + state.humanActions.length + " acao(oes) humana(s) pendente(s).",
        "Proximo passo: revisar next-task.md antes de autorizar.",
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

      const mission = await buildMission(input, ROOT);
      const md = renderMissionMarkdown(mission);
      console.log(md);
      writeMissionArtifact(ROOT, md);
      console.log(
        "\n[mission] artefato gravado em tools/joefelipe-agent/runtime/mission.md (git-ignored).",
      );
      break;
    }

    case "mode": {
      const modeArg = process.argv[3]?.toUpperCase() as KernelMode | undefined;
      if (!modeArg || !["READ_ONLY","PLAN_ONLY","SAFE_WRITE","HUMAN_APPROVAL_REQUIRED","EXECUTE_APPROVED","LOCKED"].includes(modeArg)) {
        console.error("Uso: tsx src/index.ts mode {READ_ONLY|PLAN_ONLY|SAFE_WRITE|HUMAN_APPROVAL_REQUIRED|EXECUTE_APPROVED|LOCKED}");
        process.exit(1);
      }
      await kernel.initialize();
      kernel.permissions.setMode(modeArg);
      kernel.context.setMode(modeArg);
      console.log("Modo alterado para: " + modeArg);
      await kernel.destroy();
      break;
    }

    case "plan": {
      const useLlm = process.env.JOEFELIPE_USE_LLM === "1" || process.argv.includes("--use-llm")
      const args = process.argv.filter((a) => a !== "--use-llm" && a !== "--")
      const subcmd = args[3];
      await kernel.initialize();
      const strategy = useLlm ? new LLMPlanningStrategy(new LlmEngine(kernel)) : new RuleBasedPlanningStrategy()
      const goalPlanner = new GoalPlanner(kernel, strategy);

      if (!subcmd || subcmd === "help") {
        console.log("Uso: tsx src/index.ts plan {<goal>|status|advance|complete <id>|help}");
        if (useLlm) console.log("Modo LLM ativo: goal sera decomposto pela IA.");
        await kernel.destroy();
        process.exit(0);
      }

      if (subcmd === "status") {
        const summary = goalPlanner.getStatus();
        if (summary.plan) {
          const p = summary.plan;
          console.log("Plano: " + p.id + " \u00B7 goal: " + p.goal.title + " \u00B7 status: " + p.status);
          console.log("Missoes (" + p.missions.length + "):");
          for (const m of p.missions) {
            const depInfo = m.dependsOn.length ? " [depends: " + m.dependsOn.join(", ") + "]" : "";
            console.log("  " + m.order + ". [" + m.status + "] " + m.title + " (" + m.executorId + ")" + depInfo);
          }
        } else {
          console.log("Nenhum plano ativo. Crie um com: tsx src/index.ts plan \"<goal>\"");
        }
        const q = summary.queue;
        console.log("Queue: current=" + (q.current.taskId ?? "\u2014") + " \u00B7 next=" + (q.next.taskId ?? "\u2014"));
        await kernel.destroy();
        process.exit(0);
      }

      if (subcmd === "advance") {
        const result = goalPlanner.advance();
        if (result.success) {
          console.log("Missao avancada para next-task.md");
        } else {
          console.error("Erro: " + result.error);
          await kernel.destroy();
          process.exit(1);
        }
        await kernel.destroy();
        process.exit(0);
      }

      if (subcmd === "complete") {
        const missionId = args[4];
        if (!missionId) {
          console.error("Uso: tsx src/index.ts plan complete <mission-id>");
          await kernel.destroy();
          process.exit(1);
        }
        const result = goalPlanner.complete(missionId);
        if (result.success) {
          console.log("Missao " + missionId + " marcada como completed");
        } else {
          console.error("Erro: " + result.error);
          await kernel.destroy();
          process.exit(1);
        }
        await kernel.destroy();
        process.exit(0);
      }

      const plan = await goalPlanner.plan(subcmd);
      console.log("Plano criado: " + plan.id);
      console.log("Goal: " + plan.goal.title + " (" + plan.goal.id + ")");
      console.log("Missoes geradas: " + plan.missions.length);
      if (useLlm) {
        console.log("Estrategia: " + strategy.name + " (via LLM)");
      }
      for (const m of plan.missions) {
        console.log("  " + m.order + ". [" + m.status + "] " + m.title + " (" + m.executorId + ")");
      }
      console.log("Plano salvo em runtime/queue.json (git-ignored).");
      console.log("Use 'tsx src/index.ts plan status' para ver.");
      await kernel.destroy();
      break;
    }

    case "llm": {
      const subcmd = process.argv[3];
      await kernel.initialize();
      const llm = new LlmEngine(kernel);

      if (!subcmd || subcmd === "help") {
        console.log("Uso: tsx src/index.ts llm {prompt <text>|providers|status|help}");
        await kernel.destroy();
        process.exit(0);
      }

      if (subcmd === "providers") {
        const providers = llm.getProviders();
        if (providers.length === 0) {
          console.log("Nenhum provider registrado.");
        } else {
          console.log("Providers (" + providers.length + "):");
          for (const p of providers) {
            console.log("  " + p.id + " \u00B7 " + p.name + " \u00B7 " + p.model + (p.enabled ? " [ativo]" : " [inativo]"));
          }
        }
        await kernel.destroy();
        process.exit(0);
      }

      if (subcmd === "status") {
        const info = llm.getProviderInfo();
        const status = llm.getStatus();
        console.log("LLM Engine status:");
        console.log("  Provider config: " + info.provider);
        console.log("  Model: " + info.model);
        console.log("  Chamadas externas: " + (info.externalCallsEnabled ? "ligadas" : "desligadas"));
        console.log("  Providers registrados: " + status.providers);
        for (const p of status.list) {
          console.log("    " + p.id + " \u00B7 " + p.status);
        }
        await kernel.destroy();
        process.exit(0);
      }

      if (subcmd === "prompt") {
        const text = process.argv.slice(4).join(" ");
        if (!text) {
          console.error("Uso: tsx src/index.ts llm prompt \"<texto>\"");
          await kernel.destroy();
          process.exit(1);
        }
        const mode = kernel.context.getMode();
        const response = await llm.complete({ mode, task: text });
        console.log("[" + response.provider + "/" + response.model + "] modo=" + response.mode);
        console.log("");
        console.log(response.text);
        if (response.safety.blockedReasons.length > 0) {
          console.log("");
          console.log("Razoes de bloqueio:");
          for (const r of response.safety.blockedReasons) {
            console.log("  " + r);
          }
        }
        await kernel.destroy();
        process.exit(0);
      }

      console.error("Uso: tsx src/index.ts llm {prompt <text>|providers|status|help}");
      await kernel.destroy();
      process.exit(1);
    }

    case "approval": {
      const subcmd = process.argv[3];
      const approvalManager = new ApprovalManager(ROOT, kernel);

      if (!subcmd || subcmd === "help") {
        console.log("Uso: tsx src/index.ts approval {list|show <id>|approve <id>|reject <id>|status|help}");
        process.exit(0);
      }

      if (subcmd === "list") {
        const pending = approvalManager.list();
        if (pending.length === 0) {
          console.log("Nenhuma aprovacao pendente.");
        } else {
          console.log("Aprovacoes pendentes (" + pending.length + "):");
          for (const r of pending) {
            console.log("  " + r.id + " [" + r.classification + "] " + r.missionTitle + " (" + r.mode + ")");
          }
        }
        process.exit(0);
      }

      if (subcmd === "show") {
        const id = process.argv[4];
        if (!id) { console.error("Uso: tsx src/index.ts approval show <id>"); process.exit(1); }
        const req = approvalManager.get(id);
        if (!req) { console.error("Aprovacao nao encontrada: " + id); process.exit(1); }
        console.log(JSON.stringify(req, null, 2));
        process.exit(0);
      }

      if (subcmd === "approve") {
        const id = process.argv[4];
        if (!id) { console.error("Uso: tsx src/index.ts approval approve <id>"); process.exit(1); }
        await kernel.initialize();
        const result = approvalManager.approve(id);
        if (result.success) {
          console.log("Aprovacao registrada. Modo alterado para EXECUTE_APPROVED.");
          const planner = new GoalPlanner(kernel, new RuleBasedPlanningStrategy());
          const advanceResult = planner.advance();
          if (advanceResult.success) {
            console.log("Missao promovida para next-task.md.");
          } else {
            console.log("Aprovacao registrada, mas avance manual: " + advanceResult.error);
          }
        } else {
          console.error("Erro: " + result.error);
          await kernel.destroy();
          process.exit(1);
        }
        await kernel.destroy();
        process.exit(0);
      }

      if (subcmd === "reject") {
        const id = process.argv[4];
        const reason = process.argv.slice(5).join(" ");
        if (!id) { console.error("Uso: tsx src/index.ts approval reject <id> [motivo]"); process.exit(1); }
        const result = approvalManager.reject(id, "human", reason || undefined);
        if (result.success) {
          console.log("Aprovacao rejeitada.");
        } else {
          console.error("Erro: " + result.error);
          process.exit(1);
        }
        process.exit(0);
      }

      if (subcmd === "status") {
        const pending = approvalManager.getPendingCount();
        const all = approvalManager.getRequests();
        console.log("Aprovacoes: " + all.length + " total, " + pending + " pendente(s)");
        const last5 = all.slice(0, 5);
        for (const r of last5) {
          console.log("  " + r.id + " [" + r.status + "] " + r.missionTitle + " (" + (r.decidedBy || "---") + ")");
        }
        process.exit(0);
      }

      console.error("Uso: tsx src/index.ts approval {list|show <id>|approve <id>|reject <id>|status|help}");
      process.exit(1);
    }

    case "events": {
      const subcmd = process.argv[3];
      const eventStore = new EventStore(ROOT);
      const llm = new LlmEngine();

      if (!subcmd || subcmd === "help") {
        console.log("Uso: tsx src/index.ts events {list|stats|pending|process|ack <id>|show <id>|help}");
        process.exit(0);
      }

      if (subcmd === "stats") {
        const stats = eventStore.stats();
        console.log("Eventos: " + stats.total + " total");
        console.log("  Por severidade: " + JSON.stringify(stats.bySeverity));
        console.log("  Por status: " + JSON.stringify(stats.byStatus));
        console.log("  Por fonte: " + JSON.stringify(stats.bySource));
        process.exit(0);
      }

      if (subcmd === "pending") {
        const pending = eventStore.pending();
        if (pending.length === 0) {
          console.log("Nenhum evento pendente.");
        } else {
          console.log("Eventos pendentes (" + pending.length + "):");
          for (const e of pending) {
            console.log("  " + e.id + " [" + e.severity + "] " + e.summary + " (" + e.type + ")");
          }
        }
        process.exit(0);
      }

      if (subcmd === "list") {
        const events = eventStore.list(20);
        if (events.length === 0) {
          console.log("Nenhum evento registrado.");
        } else {
          console.log("\u00DAltimos eventos (" + events.length + "):");
          for (const e of events) {
            const analysis = e.analysis ? " [analisado]" : "";
            console.log("  " + e.id + " [" + e.severity + "] " + e.summary + " (" + e.status + ")" + analysis);
          }
        }
        process.exit(0);
      }

      if (subcmd === "show") {
        const id = process.argv[4];
        if (!id) { console.error("Uso: tsx src/index.ts events show <id>"); process.exit(1); }
        const evt = eventStore.get(id);
        if (!evt) { console.error("Evento nao encontrado: " + id); process.exit(1); }
        console.log(JSON.stringify(evt, null, 2));
        process.exit(0);
      }

      if (subcmd === "ack") {
        const id = process.argv[4];
        if (!id) { console.error("Uso: tsx src/index.ts events ack <id>"); process.exit(1); }
        const ok = eventStore.acknowledge(id);
        if (ok) { console.log("Evento " + id + " reconhecido."); }
        else { console.error("Evento nao encontrado: " + id); process.exit(1); }
        process.exit(0);
      }

      if (subcmd === "process") {
        console.log("Processando eventos pendentes...");
        await kernel.initialize();
        const consumer = new EventConsumer(eventStore, new LlmEngine(kernel));
        const processed = await consumer.processPending();
        console.log("Processados: " + processed.length + " evento(s)");
        for (const e of processed) {
          console.log("  " + e.id + " [" + e.severity + "] " + e.summary + " -> " + e.status);
          if (e.analysis?.recommendedMissions?.length) {
            console.log("    Missoes recomendadas: " + e.analysis.recommendedMissions.length);
          }
        }
        await kernel.destroy();
        process.exit(0);
      }

      console.error("Uso: tsx src/index.ts events {list|stats|pending|process|ack <id>|show <id>|help}");
      process.exit(1);
    }


    case "run": {
      const subcmd = process.argv[3];
      await kernel.initialize();
      const goalPlanner = new GoalPlanner(kernel, new RuleBasedPlanningStrategy());
      const eventStore = new EventStore(ROOT);
      const stateStore = new ExecutionStateStore(ROOT);

      try {
        if (subcmd === "help") {
          console.log("Uso: tsx src/index.ts run {[mission-id]|status|abort|approve-step <id>|reject-step <id>|help}");
          console.log("  run                        Executa (ou retoma) a orquestracao ativa, ou a primeira missao planned");
          console.log("  run <mission-id>           Executa missao especifica (retoma se ja houver orquestracao ativa dela)");
          console.log("  run status                 Mostra orquestracao ativa + estado persistido");
          console.log("  run abort                  Aborta execucao ativa (persistente, nao so runtime)");
          console.log("  run approve-step <id>      Aprova um step aguardando decisao humana (waiting_human)");
          console.log("  run reject-step <id> [msg] Rejeita um step aguardando decisao humana");
          await kernel.destroy();
          process.exit(0);
        }

        if (subcmd === "status") {
          const orc = new TaskOrchestrator(ROOT);
          const active = orc.active();
          if (!active) {
            console.log("Nenhuma orquestracao ativa.");
          } else {
            console.log("Orquestracao: " + active.id + " [" + active.status + "]");
            console.log("Missao: " + active.missionId);
            for (const step of active.steps) {
              const icon = step.status === "completed" ? "OK" : step.status === "failed" ? "FAIL" : step.status === "waiting_human" ? "HUMAN" : step.status === "running" ? "RUN" : "--";
              const err = step.error ? " (" + step.error + ")" : "";
              console.log("  " + step.order + ". [" + icon + "] " + step.title + " (" + step.status + ")" + err);
            }
            const pending = active.steps.filter((s) => s.status === "waiting_human");
            if (pending.length) {
              console.log("");
              console.log("Aguardando aprovacao humana:");
              for (const s of pending) {
                console.log("  Step " + s.id + " (" + s.title + ") — use: run approve-step " + s.id + " | run reject-step " + s.id);
              }
            }
          }

          const persisted = stateStore.load();
          if (persisted) {
            console.log("");
            console.log("Estado persistido: " + persisted.status + " · abortRequested=" + persisted.abortRequested);
          }
          await kernel.destroy();
          process.exit(0);
        }

        if (subcmd === "abort") {
          const orc = new TaskOrchestrator(ROOT);
          const active = orc.active();
          if (!active) {
            console.log("Nenhuma orquestracao ativa para abortar.");
          } else {
            const engine = new ExecutionEngine(orc, undefined, undefined, kernel, eventStore, stateStore);
            engine.abort();
            console.log("Abort persistente solicitado para a orquestracao " + active.id + ".");
          }
          await kernel.destroy();
          process.exit(0);
        }

        if (subcmd === "approve-step" || subcmd === "reject-step") {
          const stepId = process.argv[4];
          if (!stepId) {
            console.error("Uso: tsx src/index.ts run " + subcmd + " <step-id>" + (subcmd === "reject-step" ? " [motivo]" : " [nota]"));
            await kernel.destroy();
            process.exit(1);
          }
          const orc = new TaskOrchestrator(ROOT);
          const note = process.argv.slice(5).join(" ") || undefined;
          const result = subcmd === "approve-step"
            ? orc.approveStepHuman(stepId, note)
            : orc.rejectStepHuman(stepId, note);

          if (!result.success) {
            console.error("Erro: " + result.error);
            await kernel.destroy();
            process.exit(1);
          }
          console.log(subcmd === "approve-step"
            ? "Step " + stepId + " aprovado. Rode 'run' novamente para continuar a missao."
            : "Step " + stepId + " rejeitado.");
          await kernel.destroy();
          process.exit(0);
        }

        // run [mission-id] ou run (retoma ativa OU primeira planned)
        const plan = goalPlanner.loadPlan();
        if (!plan) {
          console.error("Nenhum plano ativo. Crie um com: tsx src/index.ts plan \"<goal>\"");
          await kernel.destroy();
          process.exit(1);
        }

        const orc = new TaskOrchestrator(ROOT);
        const existingActive = orc.active();

        let mission;
        if (subcmd) {
          mission = plan.missions.find((m) => m.id === subcmd);
          if (!mission) {
            console.error("Missao nao encontrada: " + subcmd);
            console.log("Missoes disponiveis:");
            for (const m of plan.missions) {
              console.log("  " + m.order + ". [" + m.status + "] " + m.id + " " + m.title);
            }
            await kernel.destroy();
            process.exit(1);
          }
        } else if (existingActive) {
          mission = plan.missions.find((m) => m.id === existingActive.missionId);
        } else {
          mission = plan.missions.find((m) => m.status === "planned");
          if (!mission) {
            console.error("Nenhuma missao planned disponivel. Use plan <goal> ou plan advance.");
            await kernel.destroy();
            process.exit(1);
          }
        }

        if (!mission) {
          console.error("Nao foi possivel resolver a missao para execucao.");
          await kernel.destroy();
          process.exit(1);
        }

        const resuming = !!(existingActive && existingActive.missionId === mission.id);
        console.log((resuming ? "Retomando" : "Executando") + " missao: " + mission.title + " (" + mission.id + ")");
        console.log("Tipo: " + (mission.type ?? "generic") + " · Classificacao: " + (mission.classification ?? "?"));
        console.log("");

        const o = resuming && existingActive ? existingActive : orc.create(mission);
        if (resuming) {
          console.log("Orquestracao retomada: " + o.id + " (" + o.steps.length + " step(s))");
          const pending = o.steps.filter((s) => s.status === "waiting_human");
          if (pending.length) {
            console.log("Aviso: " + pending.length + " step(s) ainda aguardando aprovacao humana — nada sera executado ate approve-step/reject-step.");
          }
        } else {
          console.log("Orquestracao criada: " + o.id + " (" + o.steps.length + " step(s))");
        }

        const engine = new ExecutionEngine(orc, undefined, undefined, kernel, eventStore, stateStore);
        const results = await engine.runAll();

        console.log("");
        console.log("Resultados:");
        for (let i = 0; i < o.steps.length; i++) {
          const step = o.steps[i];
          const result = results[i];
          if (result) {
            const status = result.success ? "OK" : (result.metadata?.pending === "true" ? "HUMAN" : "FAIL");
            const detail = result.error ? " (" + result.error + ")" : "";
            console.log("  " + step.order + ". [" + status + "] " + step.title + detail);
          } else {
            console.log("  " + step.order + ". [--] " + step.title + " (sem resultado)");
          }
        }

        const allOk = results.length > 0 && results.every((r) => r.success);
        const waitingHuman = results.some((r) => r.metadata?.pending === "true");
        console.log("");
        if (allOk) {
          goalPlanner.complete(mission.id);
          console.log("Missao " + mission.id + " completada com sucesso.");
        } else if (waitingHuman) {
          console.log("Missao " + mission.id + " pausada: ha step(s) aguardando aprovacao humana (run status para detalhes).");
        } else {
          console.log("Missao " + mission.id + " falhou. Verifique os erros acima.");
        }
      } finally {
        await kernel.destroy();
      }
      break;
    }
    default: {
      console.error("Uso: tsx src/index.ts {dev|status|morning|close|mission|mode|plan|llm|events|approval|run}");
      process.exit(1);
    }
  }
})().catch((err) => {
  console.error("[kernel] erro: " + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
});