import { createServer, type Server } from "node:http";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { timingSafeEqual } from "node:crypto";
import { URL } from "node:url";
import { buildState, writeRuntimeState, AGENT_META } from "./state.ts";
import { findRepoRoot } from "./readers.ts";
import type { Kernel } from "./kernel/Kernel.ts";
import type { KernelMode } from "./kernel/types.ts";
import { GoalPlanner, RuleBasedPlanningStrategy, PlanStore, QueueManager } from "./planner/index.ts";
import { LlmEngine } from "./llm/index.ts";
import { EventStore, EventConsumer } from "./events/index.ts"
import { ApprovalManager } from "./approval/index.ts"
import { TaskOrchestrator, StepDeriver } from "./orchestrator/index.ts";
import {
  ExecutionEngine,
  ExecutionStateStore,
  SimpleRegistry,
  ClaudeExecutor,
  OpenCodeExecutor,
  createDefaultDriverRegistry,
  getDriverControlCenterStatus,
} from "./execution/index.ts";
import { SessionStore } from "./sessions/index.ts";
import { buildMission } from "./mission/MissionBuilder.ts";
import { MissionStore } from "./mission/MissionStore.ts";
import type { MissionInput } from "./mission/mission-types.ts";

const ROOT = findRepoRoot();

// B-004 (auditoria Fase 9.0): por padrao o servidor so escuta em loopback —
// nunca em 0.0.0.0/todas as interfaces. Override explicito via parametro ou
// env e responsabilidade de quem chama (ex.: acesso remoto controlado).
const DEFAULT_HOST = "127.0.0.1";

/**
 * Compara o token enviado (header Authorization: Bearer <token>) com o token
 * configurado, em tempo constante (evita timing attack). Retorna false se
 * os tamanhos diferem (timingSafeEqual exige buffers do mesmo tamanho).
 */
function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const AUTH_COOKIE = "joefelipe_token";

function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

/**
 * Extrai o token da requisicao, em ordem de preferencia:
 * 1) Authorization: Bearer <token> (clientes de API/CLI/testes);
 * 2) cookie joefelipe_token (navegador, apos login via ?token=);
 * 3) query string ?token= (usado so para "logar" o navegador uma vez —
 *    o painel guarda o resultado num cookie e nunca reusa a URL depois).
 */
function extractToken(req: import("node:http").IncomingMessage): string | null {
  const header = req.headers.authorization ?? "";
  if (header.startsWith("Bearer ")) return header.slice("Bearer ".length);
  const fromCookie = parseCookie(req.headers.cookie, AUTH_COOKIE);
  if (fromCookie) return fromCookie;
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    return url.searchParams.get("token");
  } catch {
    return null;
  }
}

export function startServer(root: string = ROOT, port = 3333, kernel?: Kernel, host?: string): Server {
  const bindHost = host ?? process.env.JOEFELIPE_SERVER_HOST ?? DEFAULT_HOST;
  const authToken = process.env.JOEFELIPE_SERVER_TOKEN?.trim() || null;

  // Fase 10 (LLM Cost Safety): o LlmEngine (e os wrappers Budget/RateLimit/
  // CircuitBreaker que ele carrega) PRECISA sobreviver entre requisicoes —
  // antes desta fase, `llm` era recriado a cada request HTTP dentro do
  // handler abaixo, o que e inofensivo para stores baseados em arquivo
  // (EventStore recarrega do disco a cada instancia) mas fatal para contadores
  // em memoria: um BudgetProvider recriado a cada request nunca acumula uso
  // de verdade, e o limite de custo nunca dispara. Por isso `llm` (e o
  // EventStore dedicado a persistir o custo) sao construidos UMA VEZ aqui,
  // fora do createServer(), e compartilhados por closure entre requests.
  const llm = kernel ? new LlmEngine(kernel) : null;

  // Fase 10 (item 8): persiste o evento "llm:cost" emitido pelo LlmEngine em
  // events.jsonl. O EventBus do kernel (kernel.events) e so pub/sub em
  // memoria — nao persiste nada por si so (isso e responsabilidade do
  // EventStore). A assinatura e feita uma unica vez (fora do handler) para
  // nao acumular um novo listener duplicado a cada requisicao HTTP.
  if (kernel) {
    const costEventStore = new EventStore(root);
    kernel.events.on("llm:cost", (payload) => {
      const p = payload as Record<string, unknown>;
      costEventStore.create(
        "llm:cost",
        "llm:usage",
        "info",
        `Custo LLM: ${p.provider ?? "?"}/${p.model ?? "?"} (${p.tokens ?? 0} tokens)`,
        p,
      );
    });
  }

  const server = createServer((req, res) => {
    // Auth opcional: se JOEFELIPE_SERVER_TOKEN estiver configurado, toda
    // rota exige o token (header, cookie ou ?token= — ver extractToken).
    // Sem a env, o servidor segue aberto (protegido pelo bind em loopback).
    if (authToken) {
      const provided = extractToken(req);
      if (!provided || !tokenMatches(provided, authToken)) {
        res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: "Nao autorizado. Envie Authorization: Bearer <token> (ou acesse com ?token=... uma vez para o painel salvar um cookie)." }));
        return;
      }
      // Login "silencioso" do navegador: se o token veio da query string
      // (primeiro acesso) e bateu, grava um cookie HttpOnly para as
      // proximas requisicoes (inclusive fetch() same-origin do painel)
      // nao precisarem mais expor o token na URL.
      const header = req.headers.authorization ?? "";
      const viaHeaderOrCookie = header.startsWith("Bearer ") || parseCookie(req.headers.cookie, AUTH_COOKIE) === provided;
      if (!viaHeaderOrCookie) {
        res.setHeader("Set-Cookie", AUTH_COOKIE + "=" + encodeURIComponent(provided) + "; Path=/; HttpOnly; SameSite=Lax");
      }
    }

    const state = buildState(root, kernel);
    writeRuntimeState(root, state);

    // Fase 9.15: PlanStore/QueueManager recebem o MESMO "root" do servidor
    // explicitamente — antes, o GoalPlanner do server.ts caia no default de
    // PlanStore/QueueManager (findRepoRoot()), lendo sempre o repo real
    // independente do root passado a startServer(). Isso acoplava
    // /api/planner/plan e /api/orchestrator/create ao estado real do
    // projeto mesmo em testes com tempRoot.
    const planner = kernel ? new GoalPlanner(kernel, new RuleBasedPlanningStrategy(), new PlanStore(root), new QueueManager(root)) : null;
    const eventStore = new EventStore(root);
    const eventConsumer = llm ? new EventConsumer(eventStore, llm) : new EventConsumer(eventStore)
    const approvalManager = new ApprovalManager(root, kernel);
    const orchestrator = new TaskOrchestrator(root);
    const stateStore = new ExecutionStateStore(root);
    // Fase 9.11: Work Sessions — cada conversa/execucao pertence a uma
    // sessao real e persistida (nunca mensagem solta). sessionStore guarda
    // so PONTEIROS (missionId/executionId/plannerGoalId) para o que ja
    // existe em planner/orchestrator — nao duplica o conteudo deles.
    const sessionStore = new SessionStore(root);
    // Fase 9.12: MissionStore e a UNICA fonte de verdade do conteudo de uma
    // Mission criada via MissionBuilder (ex.: pelo chat) — a Session so
    // guarda o id (missionId), nunca uma copia do conteudo.
    const missionStore = new MissionStore(root);
    // Fase 9.10: UM registry de drivers por requisicao, compartilhado entre
    // o engine de execucao e a rota /api/drivers — garante que o Driver
    // Control Center nunca mostre um estado diferente do que sera de fato
    // usado (nao ha snapshot/estado duplicado).
    const driverRegistry = createDefaultDriverRegistry();
    const executorRegistry = new SimpleRegistry([
      new ClaudeExecutor(driverRegistry),
      new OpenCodeExecutor(driverRegistry),
    ]);
    // C-001/C-002 (auditoria Fase 9.0): o engine PRECISA do kernel real — sem
    // ele, o PolicyEngine avalia com um fallback fixo (SAFE_WRITE) e ignora
    // o modo real (inclusive LOCKED). eventStore/stateStore garantem que
    // eventos e abort via HTTP sejam persistidos como na CLI.
    const engine = new ExecutionEngine(orchestrator, executorRegistry, undefined, kernel, eventStore, stateStore);

    const sendJson = (data: unknown, status = 200) => {
      res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(data, null, 2));
    };

    const llmMeta = () => llm?.getProviderInfo?.();
    const currentKernelMode = () => kernel?.context.getMode() ?? "READ_ONLY";

    // Fase 9.18A: estado real do engine, derivado de fontes persistidas
    // (TaskOrchestrator + ExecutionStateStore) — nunca do estado em memoria
    // do ExecutionEngine, que e reconstruido a cada request HTTP e por isso
    // sempre nasceria "parado" (running=false, currentStepId=null) mesmo com
    // uma execucao real em andamento. So confia nos campos transitorios do
    // ExecutionStateStore (running/abortRequested/currentStepId/error)
    // quando o orchestrationId bate com a execucao ativa/recente real —
    // caso contrario (snapshot de uma execucao antiga ja finalizada), ignora
    // esses campos e deriva tudo direto dos steps reais da orquestracao.
    const TERMINAL_STEP_STATUSES = new Set(["completed", "failed", "skipped"]);
    const buildEngineStatus = () => {
      const activeOrc = orchestrator.active();
      const recentOrc = orchestrator.list(1)[0] ?? null;
      const relevantOrc = activeOrc ?? recentOrc;
      const persisted = stateStore.load();
      const persistedMatches = !!(persisted && relevantOrc && persisted.orchestrationId === relevantOrc.id);

      const stepsSource: Array<{ id: string; title: string; type: string; status: string; error?: string }> =
        persistedMatches ? persisted!.steps : (relevantOrc?.steps ?? []);

      const pendingSteps = stepsSource.filter((s) => !TERMINAL_STEP_STATUSES.has(s.status)).length;
      const waitingHuman = stepsSource.filter((s) => s.status === "waiting_human").map((s) => ({ id: s.id, title: s.title, type: s.type }));
      const waitingExecutor = stepsSource.filter((s) => s.status === "waiting_executor").map((s) => ({ id: s.id, title: s.title, type: s.type }));
      const lastError = persistedMatches ? (persisted!.error ?? null) : (stepsSource.find((s) => s.error)?.error ?? null);
      const currentStepId = persistedMatches ? persisted!.currentStepId : null;
      const running = !!activeOrc && (persistedMatches ? persisted!.status === "running" : activeOrc.status === "running");
      const abortRequested = persistedMatches ? persisted!.abortRequested : false;
      const meta = llmMeta();

      return {
        ...engine.status,
        running,
        abortRequested,
        currentStepId,
        activeExecution: activeOrc
          ? { id: activeOrc.id, missionId: activeOrc.missionId, status: activeOrc.status, currentStepId, updatedAt: activeOrc.updatedAt }
          : null,
        recentExecution: recentOrc
          ? { id: recentOrc.id, missionId: recentOrc.missionId, status: recentOrc.status, updatedAt: recentOrc.updatedAt }
          : null,
        pendingSteps,
        waitingHuman,
        waitingExecutor,
        lastError,
        kernelMode: currentKernelMode(),
        driver: meta ? { provider: meta.provider, model: meta.model } : null,
      };
    };

    // Fase 9.18A: resumo minimo de uso de disco de tools/joefelipe-agent/runtime
    // (mesma pasta protegida pela rotacao/retencao da Fase 9.17) — so
    // contagem/tamanho, sem inspecionar conteudo de nenhum arquivo.
    const getRuntimeUsage = (): { diskUsageBytes: number; fileCount: number } => {
      try {
        const dir = join(root, "tools", "joefelipe-agent", "runtime");
        if (!existsSync(dir)) return { diskUsageBytes: 0, fileCount: 0 };
        const files = readdirSync(dir).filter((f) => f !== ".gitignore" && f !== ".gitkeep");
        let diskUsageBytes = 0;
        for (const f of files) {
          try { diskUsageBytes += statSync(join(dir, f)).size; } catch { /* best-effort */ }
        }
        return { diskUsageBytes, fileCount: files.length };
      } catch {
        return { diskUsageBytes: 0, fileCount: 0 };
      }
    };

    const readBody = (): Promise<Record<string, unknown>> => {
      return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error("JSON inv\u00E1lido")); }
        });
      });
    };

    try {
      if (req.method === "GET" && req.url === "/api/state") {
        sendJson(state);
        return;
      }

      if (req.method === "GET" && req.url === "/api/kernel") {
        sendJson(state.kernel ?? { health: "unavailable" });
        return;
      }

      if (req.method === "GET" && req.url === "/api/kernel/registry") {
        const registry = kernel?.registry ?? { total: 0, byType: {}, list: () => [] };
        sendJson({ total: registry.total, byType: registry.byType, entries: registry.list() });
        return;
      }

      if (req.method === "GET" && req.url === "/api/kernel/context") {
        sendJson(kernel?.context.get() ?? null);
        return;
      }

      if (req.method === "GET" && req.url === "/api/kernel/health") {
        const health = kernel ? { health: kernel.getStatus().health, lifecycle: kernel.lifecycle.status, uptime: kernel.getStatus().uptime } : { health: "unavailable" };
        sendJson(health);
        return;
      }

      if (req.method === "POST" && req.url === "/api/kernel/mode") {
        readBody().then(({ mode }) => {
          const m = mode as KernelMode;
          if (kernel && ["READ_ONLY","PLAN_ONLY","SAFE_WRITE","HUMAN_APPROVAL_REQUIRED","EXECUTE_APPROVED","LOCKED"].includes(m)) {
            kernel.permissions.setMode(m);
            kernel.context.setMode(m);
            sendJson({ success: true, mode: m });
          } else {
            sendJson({ success: false, error: "Modo inv\u00E1lido ou kernel n\u00E3o inicializado" }, 400);
          }
        }).catch(() => sendJson({ success: false, error: "JSON inv\u00E1lido" }, 400));
        return;
      }

      if (req.method === "GET" && req.url === "/api/planner/plan") {
        const planSummary = planner?.getStatus() ?? { plan: null, queue: { current: { taskId: null, status: null, mode: null }, next: { taskId: null, status: null, mode: null } } };
        sendJson(planSummary);
        return;
      }

      if (req.method === "GET" && req.url === "/api/llm/status") {
        // Fase 10: campos de custo/rate limit/circuit breaker (budgetActive,
        // tokensUsed, etc.) vem de getSafetyStatus() — sem BudgetProvider
        // ativo, colapsa para { budgetActive: false } (ver LlmEngine.ts).
        const status = llm
          ? { engine: llm.getProviderInfo(), registry: llm.getStatus(), ...llm.getSafetyStatus(sessionStore.getActive()?.id) }
          : { engine: "unavailable", budgetActive: false };
        sendJson(status);
        return;
      }

      // Fase 11-B.1: teste de conexao bruta, sem side effects — nao cria
      // sessao, nao persiste mensagem, nao emite "llm:cost" (ver
      // LlmEngine.test()). Funciona mesmo com kernel LOCKED, pois e
      // diagnostico (leitura), nunca uma acao proposta/executada.
      if (req.method === "GET" && req.url === "/api/llm/test") {
        if (!llm) { sendJson({ success: false, error: "LLM engine nao inicializado" }); return; }
        llm.test()
          .then((result) => sendJson(result))
          .catch((err) => sendJson({ success: false, error: String(err) }, 500));
        return;
      }

      // Fase 9.10: Driver Control Center — le health() ao vivo de cada
      // driver conhecido (Claude/OpenCode/Aider/Codex) + o fallback (Stub)
      // sempre no MESMO registry usado pelo engine (driverRegistry acima).
      // Nunca executa nenhum driver: so consulta health()/capabilities.
      if (req.method === "GET" && req.url === "/api/drivers") {
        getDriverControlCenterStatus(driverRegistry)
          .then((status) => sendJson(status))
          .catch((err) => sendJson({ error: String(err) }, 500));
        return;
      }

      if (req.method === "GET" && req.url === "/api/events") {
        const events = eventStore.list(20);
        sendJson({ events, stats: eventStore.stats() });
        return;
      }

      if (req.method === "GET" && req.url === "/api/events/stats") {
        sendJson(eventStore.stats());
        return;
      }

      if (req.method === "POST" && req.url === "/api/events/ingest") {
        readBody().then((body) => {
          const evt = eventStore.create(
            (body.type as string) ?? "api:ingest",
            (body.source as any) ?? "api:ingest",
            (body.severity as any) ?? "info",
            (body.summary as string) ?? "",
            body.payload as Record<string, unknown> ?? {},
          );
          sendJson({ success: true, event: evt });
        }).catch(() => sendJson({ success: false, error: "JSON inv\u00E1lido" }, 400));
        return;
      }

      if (req.method === "POST" && req.url === "/api/events/process") {
        eventConsumer.processPending().then((processed) => {
          sendJson({ success: true, processed: processed.length, events: processed.map((e) => ({ id: e.id, status: e.status, type: e.type })) });
        }).catch((err) => sendJson({ success: false, error: String(err) }, 500));
        return;
      }
      if (req.method === "GET" && req.url === "/api/approval") {
        const pending = approvalManager.list()
        sendJson({ pending, total: approvalManager.getPendingCount() })
        return
      }

      if (req.method === "POST" && req.url?.startsWith("/api/approval/approve/")) {
        const id = req.url.slice("/api/approval/approve/".length)
        if (!id) { sendJson({ error: "ID nao fornecido" }, 400); return }
        readBody().then((body) => {
          const result = approvalManager.approve(id, (body.decidedBy as string) ?? "human", body.reason as string)
          if (result.success) {
            sendJson({ success: true, mode: "EXECUTE_APPROVED" })
          } else {
            sendJson({ success: false, error: result.error }, 400)
          }
        }).catch(() => sendJson({ success: false, error: "JSON invalido" }, 400))
        return
      }

      if (req.method === "POST" && req.url?.startsWith("/api/approval/reject/")) {
        const id = req.url.slice("/api/approval/reject/".length)
        if (!id) { sendJson({ error: "ID nao fornecido" }, 400); return }
        readBody().then((body) => {
          const result = approvalManager.reject(id, (body.decidedBy as string) ?? "human", body.reason as string)
          if (result.success) {
            sendJson({ success: true })
          } else {
            sendJson({ success: false, error: result.error }, 400)
          }
        }).catch(() => sendJson({ success: false, error: "JSON invalido" }, 400))
        return
      }

      if (req.method === "GET" && req.url === "/api/orchestrator/status") {
        const active = orchestrator.active()
        sendJson({ active, list: orchestrator.list(5) })
        return
      }

      if (req.method === "POST" && req.url === "/api/orchestrator/create") {
        readBody().then((body) => {
          const missionId = body.missionId as string
          if (!missionId) { sendJson({ error: "missionId obrigatorio" }, 400); return }
          const plan = planner?.loadPlan()
          if (!plan) { sendJson({ error: "Nenhum plano ativo" }, 400); return }
          const mission = plan.missions.find((m) => m.id === missionId)
          if (!mission) { sendJson({ error: "Missao nao encontrada" }, 400); return }
          const orc = orchestrator.create(mission)
          // Fase 9.14: quando uma missao vira execucao real, a Work Session
          // ativa passa a apontar para ela — so os ponteiros (missionId,
          // plannerGoalId, executionId), nunca uma copia da missao/execucao.
          // orchestrator.create() so persiste os steps derivados; NAO roda
          // nem aprova nada sozinho (isso continua exigindo /api/engine/*
          // e /api/executions/:id/approve, sempre por acao explicita).
          const meta = llmMeta()
          const session = sessionStore.getOrCreateActive({
            provider: meta?.provider ?? "mock",
            model: meta?.model ?? "mock-safe-v1",
            kernelMode: currentKernelMode(),
          })
          sessionStore.linkContext(session.id, {
            missionId: mission.id,
            plannerGoalId: mission.goalId ?? session.plannerGoalId,
            executionId: orc.id,
          })
          sendJson({ success: true, orchestration: orc, sessionId: session.id })
        }).catch(() => sendJson({ error: "JSON invalido" }, 400))
        return
      }

      if (req.method === "POST" && req.url === "/api/orchestrator/next") {
        const result = orchestrator.nextStep()
        sendJson({ step: result.step, orchestration: result.orchestration })
        return
      }

      // C-003 (auditoria Fase 9.0): estas duas rotas mutavam o status de um
      // step diretamente no orchestrator, sem passar pelo PolicyEngine nem
      // pelo ExecutorRegistry — um bypass total das politicas de execucao.
      // Bloqueadas por padrao; use /api/engine/once ou /api/engine/run, que
      // sempre avaliam o PolicyEngine antes de tocar em qualquer step.
      if (req.method === "POST" && req.url?.startsWith("/api/orchestrator/complete/")) {
        const stepId = req.url.slice("/api/orchestrator/complete/".length)
        eventStore.create(
          "policy_bypass_blocked",
          "execution:engine",
          "warning",
          "Tentativa de completar step " + stepId + " direto via HTTP, contornando o PolicyEngine",
          { stepId, route: "/api/orchestrator/complete" },
        )
        sendJson({ success: false, error: "Rota desabilitada: contorna o PolicyEngine. Use /api/engine/once ou /api/engine/run." }, 403)
        return
      }

      if (req.method === "POST" && req.url?.startsWith("/api/orchestrator/fail/")) {
        const stepId = req.url.slice("/api/orchestrator/fail/".length)
        eventStore.create(
          "policy_bypass_blocked",
          "execution:engine",
          "warning",
          "Tentativa de falhar step " + stepId + " direto via HTTP, contornando o PolicyEngine",
          { stepId, route: "/api/orchestrator/fail" },
        )
        sendJson({ success: false, error: "Rota desabilitada: contorna o PolicyEngine. Use /api/engine/once ou /api/engine/run." }, 403)
        return
      }

      // Fase 9.3: superficie HTTP oficial para ver e decidir aprovacoes
      // humanas pendentes (steps "waiting_human"). ":id" e sempre o id da
      // execucao/orquestracao — approve/reject resolvem sozinhos qual step
      // esta pendente dentro dela (ou exigem "stepId" no corpo se houver
      // mais de um, caso hoje incomum dado que o engine para no primeiro
      // step pendente).
      const pendingHumanSteps = (o: ReturnType<typeof orchestrator.get>) =>
        o ? o.steps.filter((s) => s.status === "waiting_human") : []

      if (req.method === "GET" && req.url === "/api/executions") {
        const executions = orchestrator.list(20).map((o) => ({
          id: o.id,
          missionId: o.missionId,
          status: o.status,
          stepCount: o.steps.length,
          pendingHuman: pendingHumanSteps(o).map((s) => ({ id: s.id, title: s.title, type: s.type })),
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
        }))
        sendJson({ executions })
        return
      }

      if (req.method === "GET" && req.url?.startsWith("/api/executions/")) {
        const id = req.url.slice("/api/executions/".length)
        const o = orchestrator.get(id)
        if (!o) { sendJson({ success: false, error: "Execucao nao encontrada: " + id }, 404); return }
        sendJson({ execution: o, pendingHuman: pendingHumanSteps(o).map((s) => ({ id: s.id, title: s.title, type: s.type })) })
        return
      }

      if (req.method === "POST" && req.url?.match(/^\/api\/executions\/[^/]+\/approve$/)) {
        const id = req.url.slice("/api/executions/".length, -"/approve".length)
        readBody().then((body) => {
          const o = orchestrator.get(id)
          if (!o) { sendJson({ success: false, error: "Execucao nao encontrada: " + id }, 404); return }
          const pending = pendingHumanSteps(o)
          if (pending.length === 0) { sendJson({ success: false, error: "Nenhum step aguardando aprovacao nesta execucao." }, 400); return }
          const stepId = (body.stepId as string) ?? (pending.length === 1 ? pending[0].id : undefined)
          if (!stepId) {
            sendJson({ success: false, error: "Mais de um step pendente; especifique stepId no corpo.", pending: pending.map((s) => s.id) }, 409)
            return
          }
          const result = orchestrator.approveStepHuman(stepId, body.note as string | undefined)
          if (!result.success) { sendJson({ success: false, error: result.error }, 400); return }
          eventStore.create(
            "approval_granted_http",
            "execution:engine",
            "info",
            "Step " + stepId + " aprovado via HTTP",
            { orchestrationId: id, stepId },
          )
          sendJson({ success: true, execution: orchestrator.get(id) })
        }).catch(() => sendJson({ success: false, error: "JSON invalido" }, 400))
        return
      }

      if (req.method === "POST" && req.url?.match(/^\/api\/executions\/[^/]+\/reject$/)) {
        const id = req.url.slice("/api/executions/".length, -"/reject".length)
        readBody().then((body) => {
          const o = orchestrator.get(id)
          if (!o) { sendJson({ success: false, error: "Execucao nao encontrada: " + id }, 404); return }
          const pending = pendingHumanSteps(o)
          if (pending.length === 0) { sendJson({ success: false, error: "Nenhum step aguardando aprovacao nesta execucao." }, 400); return }
          const stepId = (body.stepId as string) ?? (pending.length === 1 ? pending[0].id : undefined)
          if (!stepId) {
            sendJson({ success: false, error: "Mais de um step pendente; especifique stepId no corpo.", pending: pending.map((s) => s.id) }, 409)
            return
          }
          const result = orchestrator.rejectStepHuman(stepId, body.reason as string | undefined)
          if (!result.success) { sendJson({ success: false, error: result.error }, 400); return }
          eventStore.create(
            "approval_rejected_http",
            "execution:engine",
            "info",
            "Step " + stepId + " rejeitado via HTTP",
            { orchestrationId: id, stepId },
          )
          sendJson({ success: true, execution: orchestrator.get(id) })
        }).catch(() => sendJson({ success: false, error: "JSON invalido" }, 400))
        return
      }

      if (req.method === "GET" && req.url === "/api/engine/status") {
        sendJson(buildEngineStatus())
        return
      }

      // Fase 9.18A: endpoint agregado de observabilidade — resumo estavel em
      // JSON para uma futura UI/health-check consumir sem depender de scraping
      // do dashboard HTML nem de conhecer os detalhes internos de cada store.
      // So leitura: nunca aprova, executa ou muda nenhum estado.
      if (req.method === "GET" && req.url === "/api/health") {
        getDriverControlCenterStatus(driverRegistry).then((driverStatus) => {
          const driverSummary = {
            total: driverStatus.drivers.length,
            available: driverStatus.drivers.filter((d) => d.status === "disponivel").length,
            unavailable: driverStatus.drivers.filter((d) => d.status === "indisponivel").length,
            error: driverStatus.drivers.filter((d) => d.status === "erro").length,
            active: driverStatus.drivers.filter((d) => d.active).map((d) => d.id),
          };
          const kernelHealthInfo = kernel
            ? { health: kernel.getStatus().health, lifecycle: kernel.lifecycle.status, uptime: kernel.getStatus().uptime }
            : { health: "unavailable" as const };
          const eventStats = eventStore.stats();
          const recentErrors = eventStore.list(20)
            .filter((e) => e.severity === "warning" || e.severity === "critical")
            .map((e) => ({ id: e.id, type: e.type, severity: e.severity, summary: e.summary, createdAt: e.createdAt }));
          const stepApprovals = orchestrator.list(20).reduce((sum, o) => sum + o.steps.filter((s) => s.status === "waiting_human").length, 0);
          const ok = kernelHealthInfo.health !== "error" && kernelHealthInfo.health !== "unavailable";

          sendJson({
            ok,
            kernel: kernelHealthInfo,
            planner: planner?.getStatus() ?? { plan: null, queue: { current: { taskId: null, status: null, mode: null }, next: { taskId: null, status: null, mode: null } } },
            engine: buildEngineStatus(),
            drivers: driverSummary,
            runtime: getRuntimeUsage(),
            events: eventStats,
            approvals: { missions: approvalManager.getPendingCount(), steps: stepApprovals },
            sessions: { total: sessionStore.list(20).length, activeId: sessionStore.getActive()?.id ?? null },
            recentErrors,
          });
        }).catch((err) => sendJson({ ok: false, error: String(err) }, 500));
        return;
      }

      if (req.method === "POST" && req.url === "/api/engine/once") {
        engine.runOnce().then((res) => {
          if (res) sendJson({ success: true, step: (res.step as any)?.id, result: res.result })
          else sendJson({ success: true, step: null, result: null })
        }).catch((err) => sendJson({ success: false, error: String(err) }, 500))
        return
      }

      if (req.method === "POST" && req.url === "/api/engine/run") {
        engine.runAll().then((results) => {
          sendJson({ success: true, total: results.length, results })
        }).catch((err) => sendJson({ success: false, error: String(err) }, 500))
        return
      }

      if (req.method === "POST" && req.url === "/api/engine/abort") {
        engine.abort()
        sendJson({ success: true })
        return
      }



      // -- Fase 9.11: Work Sessions — a conversa deixou de ser mensagens
      // soltas; toda mensagem/execucao/missao pertence a uma Session real,
      // persistida em sessions.jsonl (ver sessions/SessionStore.ts). --

      if (req.method === "GET" && req.url === "/api/chat/history") {
        const session = sessionStore.getActive();
        sendJson({ sessionId: session?.id ?? null, messages: session?.messages ?? [] });
        return;
      }

      if (req.method === "POST" && req.url === "/api/chat/message") {
        readBody().then(async (body) => {
          const text = (body.text as string) ?? "";
          const mode = currentKernelMode();
          const meta = llmMeta();
          // Criterio de aceite: nenhuma mensagem fica sem sessao — se nao
          // houver sessao ativa, cria uma automaticamente.
          const session = sessionStore.getOrCreateActive({
            provider: meta?.provider ?? "mock",
            model: meta?.model ?? "mock-safe-v1",
            kernelMode: mode,
          });
          sessionStore.appendMessage(session.id, { role: "user", content: text, timestamp: new Date().toISOString() });

          // Vincula a sessao ao que ja existe em Planner/Orchestrator agora
          // (so o ponteiro/id — nunca uma copia do plano/execucao reais).
          const activeOrc = orchestrator.active();
          const activePlan = planner?.loadPlan();
          sessionStore.linkContext(session.id, {
            executionId: activeOrc?.id ?? session.executionId,
            missionId: activeOrc?.missionId ?? session.missionId,
            plannerGoalId: activePlan?.goal.id ?? session.plannerGoalId,
            provider: meta?.provider ?? session.provider,
            model: meta?.model ?? session.model,
            kernelMode: mode,
          });

          // Fase 9.5: a conversa consulta a LLM (mock ou provider real via
          // OPENROUTER_API_KEY), mas SO propoe texto. LlmEngine.complete()
          // nunca dispara o ExecutionEngine e ja tem fallback amigavel
          // embutido para erro de provider (nunca lanca); o try/catch aqui
          // e defesa extra para garantir que o endpoint nunca derruba com 500.
          const respond = (payload: Record<string, unknown>) => {
            sessionStore.appendMessage(session.id, {
              role: "assistant",
              content: String(payload.response ?? ""),
              timestamp: new Date().toISOString(),
            });
            sendJson({ ...payload, sessionId: session.id });
          };

          if (!llm) {
            respond({ response: "mock: " + text, provider: "mock", model: "mock-safe-v1", mode, timestamp: new Date().toISOString() });
            return;
          }
          try {
            const result = await llm.complete({ mode, task: text, sessionId: session.id });
            respond({
              response: result.text,
              provider: result.provider,
              model: result.model,
              mode: result.mode,
              safety: result.safety,
              timestamp: new Date().toISOString(),
            });
          } catch {
            respond({
              response: "Nao foi possivel obter resposta da LLM agora. Nenhuma acao foi executada; modo seguro mantido.",
              provider: "mock",
              model: "mock-safe-v1",
              mode,
              timestamp: new Date().toISOString(),
            });
          }
        }).catch(() => sendJson({ error: "JSON invalido" }, 400));
        return;
      }

      if (req.method === "DELETE" && req.url === "/api/chat/history") {
        const session = sessionStore.getActive();
        if (session) sessionStore.clearMessages(session.id);
        sendJson({ success: true, cleared: true });
        return;
      }

      if (req.method === "GET" && req.url?.startsWith("/api/brain/search")) {
        const q = new URL(req.url, "http://localhost").searchParams.get("q") ?? "";
        sendJson({ query: q, results: [] });
        return;
      }

      // Fase 9.13: enriquece cada sessao com dados MINIMOS da missao/execucao
      // vinculadas, sempre lidos ao vivo do MissionStore/TaskOrchestrator —
      // a sessao em si (SessionStore) continua guardando so os ponteiros
      // (missionId/executionId/plannerGoalId); nada disso e persistido de
      // volta na sessao, e so um join computado na resposta HTTP.
      const enrichSessionSummary = (session: ReturnType<typeof sessionStore.get>) => {
        if (!session) return session;
        const mission = session.missionId ? missionStore.get(session.missionId) ?? null : null;
        const execution = session.executionId ? orchestrator.get(session.executionId) ?? null : null;
        const pendingApprovalCount = execution
          ? execution.steps.filter((s) => s.status === "waiting_human").length
          : 0;
        return {
          ...session,
          missionTitle: mission?.title ?? null,
          classification: mission?.classification ?? null,
          requiresHumanApproval: mission?.requiresHumanApproval ?? false,
          pendingApprovalCount,
        };
      };

      if (req.method === "GET" && req.url === "/api/sessions") {
        const active = sessionStore.getActive();
        sendJson({ sessions: sessionStore.list(20).map(enrichSessionSummary), activeId: active?.id ?? null });
        return;
      }

      if (req.method === "POST" && req.url === "/api/sessions") {
        const createSession = (title?: string) => {
          const meta = llmMeta();
          const session = sessionStore.create({
            title,
            provider: meta?.provider ?? "mock",
            model: meta?.model ?? "mock-safe-v1",
            kernelMode: currentKernelMode(),
          });
          sendJson({ success: true, session });
        };
        readBody()
          .then((body) => createSession(body.title as string | undefined))
          .catch(() => createSession(undefined));
        return;
      }

      if (req.method === "GET" && req.url?.match(/^\/api\/sessions\/[^/]+$/)) {
        const id = req.url.slice("/api/sessions/".length);
        const session = sessionStore.get(id);
        if (!session) { sendJson({ success: false, error: "Sessão não encontrada: " + id }, 404); return; }
        // "Restaurar sessao" (item 7): devolve tudo que a UI precisa para
        // repopular chat/planner/execucao/approval de uma vez, sempre lendo
        // o estado real do orchestrator/eventStore — nunca uma copia salva
        // na propria sessao.
        const execution = session.executionId ? orchestrator.get(session.executionId) ?? null : null;
        const pendingApprovals = execution
          ? execution.steps.filter((s) => s.status === "waiting_human").map((s) => ({ id: s.id, title: s.title, type: s.type }))
          : [];
        const eventCount = session.executionId
          ? eventStore.list(200).filter((e) => (e.payload as Record<string, unknown>)?.orchestrationId === session.executionId).length
          : 0;
        // Fase 9.12: se a sessao tem uma missao vinculada (via MissionBuilder),
        // devolve o status/classificacao dela — lida do MissionStore, nunca
        // uma copia guardada na propria sessao.
        const mission = session.missionId ? missionStore.get(session.missionId) ?? null : null;
        sendJson({ session, execution, pendingApprovals, eventCount, mission });
        return;
      }

      if (req.method === "POST" && req.url?.match(/^\/api\/sessions\/[^/]+\/activate$/)) {
        const id = req.url.slice("/api/sessions/".length, -"/activate".length);
        const result = sessionStore.activate(id);
        if (!result.success) { sendJson({ success: false, error: result.error }, 400); return; }
        sendJson({ success: true, session: sessionStore.get(id) });
        return;
      }

      // Fase 9.12: Chat -> Nova Missao via MissionBuilder real. NUNCA
      // aprova/executa nada sozinho — so classifica risco e monta o prompt
      // operacional (MissionBuilder ja garante isso). O resultado fica
      // vinculado a sessao ativa por PONTEIRO (missionId), nunca copiado.
      if (req.method === "POST" && req.url === "/api/missions") {
        readBody().then(async (body) => {
          const goalText = ((body.goal as string) ?? (body.message as string) ?? "").trim();
          if (!goalText) {
            sendJson({ success: false, error: "Informe 'goal' ou 'message' para criar a missão." }, 400);
            return;
          }
          const source = body.source === "manual" ? "manual" : "chat";
          const title = (body.title as string)?.trim() || goalText.slice(0, 80);

          try {
            const input: MissionInput = { title, intent: goalText, executor: "claude-code" };
            const mission = await buildMission(input, root);
            missionStore.save(mission);

            const meta = llmMeta();
            const session = sessionStore.getOrCreateActive({
              provider: meta?.provider ?? "mock",
              model: meta?.model ?? "mock-safe-v1",
              kernelMode: currentKernelMode(),
            });
            const activeOrc = orchestrator.active();
            const activePlan = planner?.loadPlan();
            sessionStore.linkContext(session.id, {
              missionId: mission.id,
              plannerGoalId: activePlan?.goal.id ?? session.plannerGoalId,
              executionId: activeOrc?.id ?? session.executionId,
            });

            sendJson({
              success: true,
              missionId: mission.id,
              plannerGoalId: activePlan?.goal.id ?? null,
              executionId: activeOrc?.id ?? null,
              sessionId: session.id,
              source,
              mission,
            });
          } catch (err) {
            sendJson({ success: false, error: String(err) }, 500);
          }
        }).catch(() => sendJson({ success: false, error: "JSON inválido" }, 400));
        return;
      }

      if (req.method === "GET" && req.url === "/api/config") {
        // Fase 9.9: "mode" precisa refletir o Kernel real (state.kernel.mode),
        // nunca o AGENT_META.mode hardcoded (constante fixa em state.ts) —
        // senao a tela de Configuracoes mente sobre o modo apos uma troca
        // real via /api/kernel/mode.
        sendJson({
          mode: state.kernel?.mode ?? state.agent.mode,
          llm: state.llm,
          kernel: state.kernel ?? null,
          git: { branch: state.git.branch },
        });
        return;
      }

    } catch (err) {
      sendJson({ error: String(err) }, 500);
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderHTML(state, llm, eventStore.stats(), sessionStore.getActive()?.id));
  });

  server.listen(port, bindHost, () => {});
  return server;
}

const KERNEL_MODES = ["READ_ONLY", "PLAN_ONLY", "SAFE_WRITE", "HUMAN_APPROVAL_REQUIRED", "EXECUTE_APPROVED", "LOCKED"] as const;

function renderHTML(s: any, llm: any, eventStats?: any, activeSessionId?: string): string {
  const k = s.kernel;
  const kHealth = k?.health ?? "unavailable";
  const es = eventStats ?? { total: 0, byStatus: {} };
  // Fase 9.9: o modo exibido tem que refletir o Kernel real (s.kernel.mode),
  // nunca o AGENT_META.mode hardcoded (constante "READ_ONLY" fixa em
  // state.ts) — senao o badge de seguranca mente para o usuario apos uma
  // troca de modo real via /api/kernel/mode.
  const mode = k?.mode ?? s.agent.mode;

  function safetyBadge(): string {
    if (mode === "READ_ONLY") return `<div class="safety-badge safety-readonly">🛡 READ_ONLY ativo — execução bloqueada</div>`;
    if (mode === "HUMAN_APPROVAL_REQUIRED") return `<div class="safety-badge safety-warning">⚠ HUMAN_APPROVAL_REQUIRED — aprovação pendente</div>`;
    if (mode === "EXECUTE_APPROVED") return `<div class="safety-badge safety-active">⚡ EXECUTE_APPROVED — execução autorizada</div>`;
    if (mode === "LOCKED") return `<div class="safety-badge safety-error">🔒 LOCKED — agente bloqueado</div>`;
    if (mode === "SAFE_WRITE") return `<div class="safety-badge safety-warning">🖊 SAFE_WRITE ativo — escrita segura</div>`;
    if (mode === "PLAN_ONLY") return `<div class="safety-badge safety-readonly">📋 PLAN_ONLY ativo — apenas planejamento</div>`;
    return `<div class="safety-badge safety-readonly">🛡 ${mode} — execução bloqueada</div>`;
  }

  function healthLabel(): string {
    if (kHealth === "ready") return "Pronto";
    if (kHealth === "degraded") return "Degradado";
    if (kHealth === "error") return "Erro";
    return kHealth;
  }

  function healthBadgeClass(): string {
    if (kHealth === "ready") return "badge-ok";
    if (kHealth === "degraded") return "badge-warn";
    if (kHealth === "error") return "badge-err";
    return "badge-idle";
  }

function escapeHtml(s: string | null | undefined): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}﻿
  const kernelEntries = k?.entries ?? [];
  const kRegistry = { total: k?.registry?.total ?? 0, byType: k?.registry?.byType ?? {} };
  const gitBranch = s.git?.branch ?? "desconhecido";
  const llmInfo = llm?.getProviderInfo?.() ?? { provider: "indispon\u00EDvel" };
  // Fase 10: estado inicial (SSR) do card "LLM Cost" \u2014 evita o flash de
  // "Carregando..." no primeiro render; loadLlmCost() (JS) mantem atualizado
  // a cada refreshAll() depois disso.
  const llmSafety = (llm?.getSafetyStatus?.(activeSessionId) ?? { budgetActive: false }) as Record<string, unknown>;
  const llmCostCardHtml = llmSafety.budgetActive
    ? `<div class="kv"><span class="k">Tokens</span><span class="v">${llmSafety.tokensUsed} / ${llmSafety.tokensLimit ?? "-"}</span></div>
       <div class="kv"><span class="k">Custo estimado</span><span class="v">$${Number(llmSafety.budgetUsed ?? 0).toFixed(4)} / ${llmSafety.budgetLimit != null ? "$" + Number(llmSafety.budgetLimit).toFixed(4) : "-"}</span></div>
       <div class="kv"><span class="k">Rate limit restante</span><span class="v">${llmSafety.rateLimitRemaining ?? "-"}</span></div>
       <div class="kv"><span class="k">Circuit breaker</span><span class="v">${escapeHtml(String(llmSafety.circuitState ?? "-"))}</span></div>`
    : `<div style="color:#8a6d00;background:rgba(181,138,0,0.15);padding:6px 8px;border-radius:4px">Sem controle de custo ativo</div>`;
  const approvalPending = s.approval?.pending ?? 0;
  const eventTotal = es.total ?? 0;
  // Fase 9.18B: state.warnings ja era calculado por buildState() (fonte
  // ausente, arquivo sensivel em git status) mas nunca chegava a ser
  // renderizado — o card "Avisos" era hardcoded "Nenhum aviso.". Agora o
  // SSR inicial usa os avisos reais; loadHealth() (client) re-busca
  // /api/state + /api/health a cada refresh e mescla com avisos derivados
  // de health (drivers/runtime).
  const stateWarnings: string[] = s.warnings ?? [];
  const warningsHtml = stateWarnings.length === 0
    ? `<span style="color:var(--text-muted)">Nenhum aviso.</span>`
    : stateWarnings.map((w) => `<div style="padding:3px 0">${escapeHtml(w)}</div>`).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>JoeFelipe Agent</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --sidebar-w: 220px; --sidebar-bg: #1e1e2e; --sidebar-hover: #2a2a3e;
    --accent: #6c5ce7; --accent-light: #a29bfe; --bg: #f5f5f8; --card: #fff;
    --text: #1a1a2e; --text-muted: #6c6c8a; --border: #e0e0ec;
    --green: #00b894; --yellow: #fdcb6e; --red: #e17055; --blue: #0984e3;
    --radius: 8px; --shadow: 0 1px 4px rgba(0,0,0,.08);
  }
  html, body { height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); }
  body { display: flex; }
  .sidebar { width: var(--sidebar-w); background: var(--sidebar-bg); color: #cdd6f4; display: flex; flex-direction: column; flex-shrink: 0; }
  .sidebar-logo { padding: 20px 16px 12px; font-size: 15px; font-weight: 700; letter-spacing: -.3px; border-bottom: 1px solid #313244; display: flex; align-items: center; gap: 8px; }
  .sidebar-logo span { background: var(--accent); color: #fff; font-size: 12px; border-radius: 4px; padding: 1px 6px; }
  .sidebar-nav { flex: 1; padding: 8px 0; overflow-y: auto; }
  .sidebar-nav a { display: flex; align-items: center; gap: 10px; padding: 10px 16px; color: #a6adc8; text-decoration: none; font-size: 13.5px; cursor: pointer; transition: .15s; border-left: 3px solid transparent; }
  .sidebar-nav a:hover { background: var(--sidebar-hover); color: #cdd6f4; }
  .sidebar-nav a.active { background: var(--sidebar-hover); color: #fff; border-left-color: var(--accent); }
  .sidebar-nav a .icon { font-size: 16px; width: 20px; text-align: center; }
  .sidebar-footer { padding: 12px 16px; border-top: 1px solid #313244; font-size: 11px; color: #6c7086; }
  .sidebar-footer .safety-badge { font-size: 11px; padding: 4px 8px; border-radius: 4px; margin-top: 6px; display: block; }
  .main { flex: 1; display: flex; flex-direction: column; min-width: 0; padding: 0; overflow: hidden; }
  .tab-content { display: none; flex: 1; overflow-y: auto; padding: 24px; }
  .tab-content.active { display: flex; flex-direction: column; }
  .card { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); border: 1px solid var(--border); padding: 20px; margin-bottom: 16px; }
  .card h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--text); }
  .card p { font-size: 13px; color: var(--text-muted); margin-bottom: 6px; }
  .card .stat-row { display: flex; gap: 12px; flex-wrap: wrap; margin: 8px 0; }
  .card .stat { background: var(--bg); border-radius: 6px; padding: 12px 16px; flex: 1; min-width: 120px; }
  .card .stat .num { font-size: 22px; font-weight: 700; color: var(--accent); }
  .card .stat .label { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .chat-messages { flex: 1; overflow-y: auto; padding: 16px 0; display: flex; flex-direction: column; gap: 12px; min-height: 300px; }
  .chat-msg { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 13.5px; line-height: 1.5; }
  .chat-msg.user { align-self: flex-end; background: var(--accent); color: #fff; border-bottom-right-radius: 4px; }
  .chat-msg.assistant { align-self: flex-start; background: var(--card); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
  .chat-input-row { display: flex; gap: 8px; margin-top: 12px; }
  .chat-input-row input { flex: 1; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 13px; outline: none; }
  .chat-input-row input:focus { border-color: var(--accent); }
  .chat-input-row button { padding: 10px 18px; background: var(--accent); color: #fff; border: none; border-radius: var(--radius); font-size: 13px; cursor: pointer; font-weight: 500; }
  .chat-input-row button:hover { opacity: .9; }
  .chat-actions { display: flex; gap: 8px; margin-top: 8px; }
  .chat-actions button { padding: 6px 14px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--card); cursor: pointer; font-size: 12px; color: var(--text); }
  .chat-actions button:hover { background: var(--bg); }
  .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .info-card { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); border: 1px solid var(--border); padding: 16px; }
  .info-card h3 { font-size: 13px; font-weight: 600; color: var(--accent); margin-bottom: 8px; text-transform: uppercase; letter-spacing: .5px; }
  .kv { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12.5px; border-bottom: 1px solid var(--border); }
  .kv:last-child { border-bottom: none; }
  .kv .k { color: var(--text-muted); }
  .kv .v { font-weight: 500; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
  .badge-ok { background: #dfe6e9; color: #00b894; }
  .badge-warn { background: #ffeaa7; color: #b7950b; }
  .badge-err { background: #fab1a0; color: #d63031; }
  .badge-idle { background: #dfe6e9; color: #636e72; }
  .safety-badge { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; }
  .safety-readonly { background: #dfe6e9; color: #636e72; }
  .safety-warning { background: #ffeaa7; color: #b7950b; }
  .safety-active { background: #55efc4; color: #00695c; }
  .safety-error { background: #fab1a0; color: #c0392b; }
  .toast-container { position: fixed; top: 16px; right: 16px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
  .toast { padding: 12px 18px; border-radius: var(--radius); box-shadow: 0 4px 12px rgba(0,0,0,.15); font-size: 13px; animation: slideIn .25s ease; max-width: 360px; }
  .toast.info { background: var(--blue); color: #fff; }
  .toast.success { background: var(--green); color: #fff; }
  .toast.error { background: var(--red); color: #fff; }
  @keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
  .token-bar { padding: 10px 16px; background: var(--card); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; font-size: 12px; flex-wrap: wrap; }
  .token-bar input { padding: 5px 10px; border: 1px solid var(--border); border-radius: 4px; font-size: 12px; width: 200px; }
  .token-bar button { padding: 5px 12px; background: var(--accent); color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
  .empty-state { text-align: center; padding: 40px 20px; color: var(--text-muted); }
  .empty-state .big-icon { font-size: 48px; margin-bottom: 12px; }
  .empty-state p { font-size: 14px; }
  .search-row { display: flex; gap: 8px; margin-bottom: 16px; }
  .search-row input { flex: 1; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 13px; }
  .search-row button { padding: 8px 16px; background: var(--accent); color: #fff; border: none; border-radius: var(--radius); cursor: pointer; }
  @media (max-width: 640px) { :root { --sidebar-w: 56px; } .sidebar-logo span, .sidebar-nav a span:not(.icon) { display: none; } .sidebar-nav a { justify-content: center; padding: 12px; } }
</style>
</head>
<body>

<div class="sidebar">
  <div class="sidebar-logo">JoeFelipe <span>Agent</span></div>
  <nav class="sidebar-nav">
    <a class="active" data-tab="conversas" href="#" onclick="tab('conversas');return false;"><span class="icon">\u{1F4AC}</span> <span>Conversas</span></a>
    <a data-tab="desenvolvimento" href="#" onclick="tab('desenvolvimento');return false;"><span class="icon">\u{1F4BB}</span> <span>Desenvolvimento</span></a>
    <a data-tab="agente" href="#" onclick="tab('agente');return false;"><span class="icon">\u{1F916}</span> <span>Agente</span></a>
    <a data-tab="segundo-cerebro" href="#" onclick="tab('segundo-cerebro');return false;"><span class="icon">\u{1F9E0}</span> <span>Segundo C\u00E9rebro</span></a>
    <a data-tab="configuracoes" href="#" onclick="tab('configuracoes');return false;"><span class="icon">\u2699\uFE0F</span> <span>Configura\u00E7\u00F5es</span></a>
  </nav>
  <div class="sidebar-footer">
    <div style="font-size:12px;font-weight:600;">${mode}</div>
    ${safetyBadge()}
    <div id="healthBadge" class="badge badge-idle" style="margin-top:6px">Verificando saúde...</div>
  </div>
</div>

<div class="main">
  <div class="token-bar" id="tokenBar">
    <span>Token:</span>
    <input type="password" id="tokenInput" placeholder="JOEFELIPE_SERVER_TOKEN" />
    <button onclick="saveToken()">Salvar</button>
    <span id="tokenStatus" style="color:var(--green);font-size:11px;"></span>
    <button onclick="refreshAll()" style="margin-left:auto">\u{1F504} Recarregar Estado</button>
  </div>

  <div class="tab-content active" id="tab-conversas">
    <div class="card">
      <h2>Sess\u00E3o Atual (Work Session)</h2>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Cada conversa \u00E9 uma Miss\u00E3o em potencial \u2014 nada fica solto fora de uma sess\u00E3o.</p>
      <div id="sessionCurrentPanel" style="font-size:12px;">Carregando...</div>
      <div class="chat-actions" style="margin-top:8px">
        <button onclick="novaSessao()">+ Nova Sess\u00E3o</button>
      </div>
    </div>
    <div class="card">
      <h2>Sess\u00F5es Recentes</h2>
      <div id="sessionsListPanel" style="font-size:12px;">Carregando...</div>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column">
      <h2>Conversas</h2>
      <div id="llmIndicator" style="font-size:11px;color:var(--text-muted);margin-bottom:10px">Carregando status da LLM...</div>
      <div class="chat-messages" id="chatMessages">
        <div class="chat-msg assistant">Ol\u00E1! Sou o JoeFelipe Agent. Como posso ajudar?</div>
      </div>
      <div class="chat-input-row">
        <input type="text" id="chatInput" placeholder="Digite sua mensagem..." onkeydown="if(event.key==='Enter')sendMessage()" />
        <button onclick="sendMessage()">Enviar</button>
      </div>
      <div class="chat-actions">
        <button onclick="copySolicitacao()">Copiar Solicita\u00E7\u00E3o</button>
        <button onclick="testarLlm()">Testar LLM</button>
        <button onclick="transformarEmMissao()">Transformar em Miss\u00E3o</button>
        <button onclick="clearChat()" style="color:var(--red)">Limpar Conversa</button>
      </div>
      <div id="llmTestResult" style="font-size:12px;color:var(--text-muted);margin-top:8px"></div>
      <div id="missionCreateResult" style="font-size:12px;color:var(--text-muted);margin-top:4px"></div>
    </div>
  </div>

  <div class="tab-content" id="tab-desenvolvimento">
    <div class="card">
      <h2>Desenvolvimento</h2>
      <div class="stat-row">
        <div class="stat"><div class="num">${kRegistry.total}</div><div class="label">Ferramentas Registradas</div></div>
        <div class="stat"><div class="num">${eventTotal}</div><div class="label">Eventos</div></div>
        <div class="stat"><div class="num">${approvalPending}</div><div class="label">Aprova\u00E7\u00F5es Pendentes</div></div>
      </div>
    </div>
    <div class="card">
      <h2>Planejamento</h2>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Plano ativo (via GoalPlanner) e miss\u00F5es prontas para virar execu\u00E7\u00E3o.</p>
      <div id="plannerPanel" style="font-size:12px;">Carregando...</div>
    </div>
    <div class="card">
      <h2>Execu\u00E7\u00F5es</h2>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Execu\u00E7\u00F5es criadas a partir do plano (orquestra\u00E7\u00F5es).</p>
      <div id="executionsList" style="font-size:12px;">Carregando...</div>
    </div>
    <div class="card">
      <h2>Engine \u2014 Painel Operacional</h2>
      <div id="enginePanel" style="font-size:12px;margin-bottom:10px">Carregando...</div>
      <div class="chat-actions">
        <button onclick="engineOnce()">Rodar Pr\u00F3ximo Passo</button>
        <button onclick="engineRun()">Rodar Tudo Permitido</button>
        <button onclick="engineAbort()" style="color:var(--red)">Parar Execu\u00E7\u00E3o</button>
      </div>
    </div>
    <div class="card">
      <h2>Eventos Recentes</h2>
      <div id="eventsList" style="font-size:12px;">Carregando...</div>
    </div>
    <div class="card">
      <h2>Erros Recentes</h2>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Eventos com severidade warning/critical, via /api/health.</p>
      <div id="recentErrorsPanel" style="font-size:12px;">Carregando...</div>
    </div>
  </div>

  <div class="tab-content" id="tab-agente">
    <div class="info-grid">
      <div class="info-card"><h3>Kernel</h3>
        <div class="kv"><span class="k">Status</span><span class="v"><span class="badge ${healthBadgeClass()}">${healthLabel()}</span></span></div>
        <div class="kv"><span class="k">Modo</span><span class="v">${mode}</span></div>
        ${k?.lifecycle ? `<div class="kv"><span class="k">Lifecycle</span><span class="v">${escapeHtml(k.lifecycle.status)}</span></div>` : ""}
        ${k?.uptime ? `<div class="kv"><span class="k">Uptime</span><span class="v">${Math.floor(k.uptime / 1000)}s</span></div>` : ""}
        <div class="kv"><span class="k">Registry</span><span class="v">${kRegistry.total} itens</span></div>
        <div id="kernelPermissions" style="margin-top:8px">Carregando permiss\u00F5es...</div>
        <div style="margin-top:10px;display:flex;gap:6px;align-items:center">
          <select id="modeSelect" style="flex:1;padding:5px;border:1px solid var(--border);border-radius:4px;font-size:12px">
            ${KERNEL_MODES.map((m) => `<option value="${m}" ${m === mode ? "selected" : ""}>${m}</option>`).join("")}
          </select>
          <button onclick="trocarModo()">Trocar Modo</button>
        </div>
      </div>
      <div class="info-card"><h3>LLM</h3>
        <div class="kv"><span class="k">Provider</span><span class="v">${escapeHtml(llmInfo.provider)}</span></div>
        <div class="kv"><span class="k">Modelo</span><span class="v">${llmInfo.model ? escapeHtml(llmInfo.model) : "-"}</span></div>
      </div>
      <div class="info-card"><h3>LLM Cost</h3>
        <div id="llmCostPanel" style="font-size:12px">${llmCostCardHtml}</div>
      </div>
      <div class="info-card"><h3>Git</h3>
        <div class="kv"><span class="k">Branch</span><span class="v" id="gitBranch">${escapeHtml(gitBranch)}</span></div>
      </div>
      <div class="info-card"><h3>Eventos</h3>
        <div class="kv"><span class="k">Total</span><span class="v">${eventTotal}</span></div>
      </div>
      <div class="info-card"><h3>Registro do Kernel (por tipo)</h3>
        ${Object.keys(kRegistry.byType).length === 0
          ? `<span style="color:var(--text-muted);font-size:12px">Nenhum item registrado.</span>`
          : Object.entries(kRegistry.byType).map(([type, count]) => `<div class="kv"><span class="k">${escapeHtml(type)}</span><span class="v">${count}</span></div>`).join("")}
      </div>
      <div class="info-card" style="grid-column:1 / -1"><h3>Aprova\u00E7\u00F5es Pendentes (Steps)</h3>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Execu\u00E7\u00F5es com steps aguardando decis\u00E3o humana (waiting_human).</p>
        <div id="approvalList" style="font-size:12px;">Carregando...</div>
      </div>
      <div class="info-card" style="grid-column:1 / -1"><h3>Drivers (Driver Control Center)</h3>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Estado real da camada de drivers (Fase 9.8) \u2014 health check ao vivo, sem executar nenhum driver.</p>
        <div id="driversPanel" style="font-size:12px;">Carregando...</div>
        <div class="chat-actions" style="margin-top:8px">
          <button onclick="loadDrivers()">Atualizar Drivers</button>
        </div>
      </div>
      <div class="info-card"><h3>Avisos</h3>
        <div id="warnings" style="font-size:12px;color:var(--text-muted);">${warningsHtml}</div>
      </div>
    </div>
  </div>

  <div class="tab-content" id="tab-segundo-cerebro">
    <div class="card">
      <h2>Segundo C\u00E9rebro</h2>
      <div class="search-row">
        <input type="text" id="brainSearch" placeholder="Pesquisar no segundo c\u00E9rebro..." onkeydown="if(event.key==='Enter')brainSearch()" />
        <button onclick="brainSearch()">Buscar</button>
      </div>
      <div id="brainResults" class="empty-state">
        <div class="big-icon">\u{1F50D}</div>
        <p>Digite um termo para pesquisar.</p>
      </div>
    </div>
  </div>

  <div class="tab-content" id="tab-configuracoes">
    <div class="card">
      <h2>Configura\u00E7\u00F5es</h2>
      <div class="stat-row">
        <div class="stat"><div class="num">${mode}</div><div class="label">Modo Atual</div></div>
        <div class="stat"><div class="num">${escapeHtml(gitBranch)}</div><div class="label">Branch</div></div>
      </div>
      <div id="configPanel" style="font-size:12px;margin-top:12px">Carregando /api/config...</div>
      <p style="margin-top:12px">Use a env <code>JOEFELIPE_SERVER_TOKEN</code> para prote\u00E7\u00E3o por token.</p>
    </div>
  </div>
</div>

<div class="toast-container" id="toastContainer"></div>

<script>
function getCookie(name) {
  var parts = document.cookie ? document.cookie.split('; ') : [];
  for (var i = 0; i < parts.length; i++) {
    var eq = parts[i].indexOf('=');
    if (eq === -1) continue;
    if (parts[i].slice(0, eq) === name) return decodeURIComponent(parts[i].slice(eq + 1));
  }
  return null;
}

function authHeaders() {
  var t = getCookie('joefelipe_token');
  return t ? { 'Authorization': 'Bearer ' + t } : {};
}

function tab(t) {
  document.querySelectorAll('.sidebar-nav a').forEach(function(a) { a.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
  var link = document.querySelector('[data-tab="' + t + '"]');
  if (link) link.classList.add('active');
  var panel = document.getElementById('tab-' + t);
  if (panel) panel.classList.add('active');
}

function toast(msg, type) {
  type = type || 'info';
  var c = document.getElementById('toastContainer');
  var t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(function() { t.remove(); }, 4000);
}

function api(path, opts) {
  opts = opts || {};
  var h = opts.headers || {};
  var hdrs = { 'Content-Type': 'application/json' };
  for (var k in h) hdrs[k] = h[k];
  var auth = authHeaders();
  for (var k in auth) hdrs[k] = auth[k];
  return fetch(path, { method: opts.method || 'GET', headers: hdrs, body: opts.body || undefined }).then(function(r) {
    if (!r.ok) { return r.json().then(function(d) { throw new Error(d.error || 'HTTP ' + r.status); }); }
    return r.json();
  });
}

function renderChatMessages(messages) {
  var msgs = document.getElementById('chatMessages');
  if (!msgs) return;
  if (!messages || messages.length === 0) {
    msgs.innerHTML = '<div class="chat-msg assistant">Ol\u00E1! Sou o JoeFelipe Agent. Como posso ajudar?</div>';
    return;
  }
  msgs.innerHTML = messages.map(function(m) {
    var cls = m.role === 'user' ? 'user' : 'assistant';
    return '<div class="chat-msg ' + cls + '">' + escapeHtmlClient(m.content) + '</div>';
  }).join('');
  msgs.scrollTop = msgs.scrollHeight;
}

function loadChatHistory() {
  api('/api/chat/history').then(function(d) {
    renderChatMessages(d.messages);
  }).catch(function() {});
}

function sendMessage() {
  var input = document.getElementById('chatInput');
  var text = input.value.trim();
  if (!text) return;
  var msgs = document.getElementById('chatMessages');
  var userDiv = document.createElement('div');
  userDiv.className = 'chat-msg user';
  userDiv.textContent = text;
  msgs.appendChild(userDiv);
  input.value = '';
  msgs.scrollTop = msgs.scrollHeight;
  // Fase 9.11: a mensagem pertence a uma Work Session real (o backend cria
  // uma automaticamente se ainda nao houver sessao ativa) \u2014 apos a resposta,
  // recarregamos o historico real da sessao (fonte da verdade) em vez de so
  // confiar no DOM local.
  api('/api/chat/message', { method: 'POST', body: JSON.stringify({ text: text }) }).then(function() {
    loadChatHistory();
    loadSessionCurrent();
    loadSessionsList();
  }).catch(function(e) { toast(e.message, 'error'); });
}

function clearChat() {
  api('/api/chat/history', { method: 'DELETE' }).then(function() {
    loadChatHistory();
    toast('Conversa limpa.', 'success');
  }).catch(function() {
    toast('Erro ao limpar conversa.', 'error');
  });
}

function loadSessionCurrent() {
  var el = document.getElementById('sessionCurrentPanel');
  if (!el) return;
  api('/api/sessions').then(function(d) {
    if (!d.activeId) {
      el.innerHTML = '<span style="color:var(--text-muted)">Nenhuma sess\u00E3o ativa ainda \u2014 envie uma mensagem ou crie uma sess\u00E3o.</span>';
      return null;
    }
    return api('/api/sessions/' + encodeURIComponent(d.activeId));
  }).then(function(detail) {
    if (!detail) return;
    var s = detail.session;
    var html = '';
    html += '<div class="kv"><span class="k">Nome</span><span class="v">' + escapeHtmlClient(s.title) + '</span></div>';
    html += '<div class="kv"><span class="k">Status</span><span class="v">' + escapeHtmlClient(s.status) + '</span></div>';
    html += '<div class="kv"><span class="k">Miss\u00E3o</span><span class="v">' + escapeHtmlClient(s.missionId || 'nenhuma') + (detail.mission ? ' (' + escapeHtmlClient(detail.mission.classification) + (detail.mission.requiresHumanApproval ? ', aguardando aprova\u00E7\u00E3o' : '') + ')' : '') + '</span></div>';
    html += '<div class="kv"><span class="k">Plano/Goal</span><span class="v">' + escapeHtmlClient(s.plannerGoalId || 'nenhum') + '</span></div>';
    html += '<div class="kv"><span class="k">Provider</span><span class="v">' + escapeHtmlClient(s.provider) + '</span></div>';
    html += '<div class="kv"><span class="k">Modelo</span><span class="v">' + escapeHtmlClient(s.model) + '</span></div>';
    html += '<div class="kv"><span class="k">Modo</span><span class="v">' + escapeHtmlClient(s.kernelMode) + '</span></div>';
    html += '<div class="kv"><span class="k">Execu\u00E7\u00E3o</span><span class="v">' + escapeHtmlClient(s.executionId || 'nenhuma') + (detail.execution ? ' (' + escapeHtmlClient(detail.execution.status) + ')' : '') + '</span></div>';
    html += '<div class="kv"><span class="k">Eventos</span><span class="v">' + (detail.eventCount || 0) + '</span></div>';
    html += '<div class="kv"><span class="k">\u00DAltima atividade</span><span class="v">' + escapeHtmlClient(new Date(s.updatedAt).toLocaleString()) + '</span></div>';
    if (detail.pendingApprovals && detail.pendingApprovals.length > 0) {
      html += '<div class="kv"><span class="k">Aprova\u00E7\u00F5es pendentes</span><span class="v">' + detail.pendingApprovals.length + '</span></div>';
      // Fase 9.13: atalho \u2014 leva o usuario ate a aba onde a aprovacao ja
      // existe (aba Agente). NUNCA aprova nada sozinho; so navega.
      html += '<div class="chat-actions" style="margin-top:8px"><button onclick="irParaAprovacao()">Ir para aprova\u00E7\u00E3o</button></div>';
    }
    el.innerHTML = html;
  }).catch(function() {
    el.innerHTML = '<span style="color:var(--red)">Erro ao carregar sess\u00E3o atual.</span>';
  });
}

function irParaAprovacao() {
  tab('agente');
  var el = document.getElementById('approvalList');
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth' });
}

function loadSessionsList() {
  var el = document.getElementById('sessionsListPanel');
  if (!el) return;
  api('/api/sessions').then(function(d) {
    var list = d.sessions || [];
    if (list.length === 0) {
      el.innerHTML = '<span style="color:var(--text-muted)">Nenhuma sess\u00E3o ainda.</span>';
      return;
    }
    var html = '';
    list.forEach(function(s) {
      var isActive = s.id === d.activeId;
      html += '<div style="border-top:1px solid var(--border);padding:8px 0;display:flex;justify-content:space-between;align-items:center;gap:8px">';
      html += '<div>';
      html += '<span class="badge ' + (isActive ? 'badge-ok' : 'badge-idle') + '">' + (isActive ? 'ativa' : escapeHtmlClient(s.status)) + '</span> ' + escapeHtmlClient(s.title);
      // Fase 9.13: mostra a missao vinculada (se houver) de forma compacta \u2014
      // titulo + classificacao + indicador de aprovacao pendente, sem poluir.
      if (s.missionTitle) {
        html += '<br><span style="font-size:11px;color:var(--text-muted)">Miss\u00E3o: ' + escapeHtmlClient(s.missionTitle) + ' \u00B7 <span class="badge badge-idle">' + escapeHtmlClient(s.classification) + '</span>';
        if (s.pendingApprovalCount > 0) {
          html += ' \u00B7 <span class="badge badge-warn">' + s.pendingApprovalCount + ' aprova\u00E7\u00E3o pendente</span>';
        }
        html += '</span>';
      }
      html += '</div>';
      if (!isActive) html += '<button onclick="ativarSessao(\\'' + s.id + '\\')">Continuar</button>';
      html += '</div>';
    });
    el.innerHTML = html;
  }).catch(function() {
    el.innerHTML = '<span style="color:var(--red)">Erro ao carregar sess\u00F5es.</span>';
  });
}

function ativarSessao(id) {
  api('/api/sessions/' + encodeURIComponent(id) + '/activate', { method: 'POST' }).then(function() {
    toast('Sess\u00E3o ativada.', 'success');
    loadChatHistory();
    loadSessionCurrent();
    loadSessionsList();
  }).catch(function(e) { toast('Erro: ' + e.message, 'error'); });
}

function novaSessao() {
  api('/api/sessions', { method: 'POST' }).then(function() {
    toast('Nova sess\u00E3o criada.', 'success');
    loadChatHistory();
    loadSessionCurrent();
    loadSessionsList();
  }).catch(function(e) { toast('Erro: ' + e.message, 'error'); });
}

function copySolicitacao() {
  var msgs = document.getElementById('chatMessages');
  var text = '';
  msgs.querySelectorAll('.chat-msg').forEach(function(m) { text += m.textContent + '\\n'; });
  navigator.clipboard.writeText(text).then(function() { toast('Solicita\u00E7\u00E3o copiada!', 'success'); });
}

function escapeHtmlClient(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function brainSearch() {
  var q = document.getElementById('brainSearch').value.trim();
  var r = document.getElementById('brainResults');
  if (!q) { r.innerHTML = '<div class="big-icon">\u{1F50D}</div><p>Digite um termo para pesquisar.</p>'; return; }
  r.innerHTML = '<p>Buscando...</p>';
  api('/api/brain/search?q=' + encodeURIComponent(q)).then(function(d) {
    if (d.results && d.results.length > 0) {
      r.innerHTML = d.results.map(function(ri) { return '<p style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>' + ri.title + '</strong><br><span style="color:var(--text-muted);font-size:12px">' + (ri.snippet || '') + '</span></p>'; }).join('');
    } else {
      r.innerHTML = '<div class="big-icon">\u{1F50D}</div><p>Nenhum resultado encontrado para "' + q + '".</p>';
    }
  }).catch(function(e) { r.innerHTML = '<p style="color:var(--red)">Erro: ' + e.message + '</p>'; });
}

function loadApprovals() {
  var el = document.getElementById('approvalList');
  if (!el) return;
  api('/api/executions').then(function(d) {
    var pending = (d.executions || []).filter(function(e) { return e.pendingHuman && e.pendingHuman.length > 0; });
    if (pending.length === 0) {
      el.innerHTML = '<span style="color:var(--text-muted)">Nenhuma execu\u00E7\u00E3o aguardando aprova\u00E7\u00E3o humana.</span>';
      return;
    }
    var html = '';
    pending.forEach(function(exec) {
      exec.pendingHuman.forEach(function(step) {
        var noteId = 'note-' + step.id;
        html += '<div style="border-top:1px solid var(--border);padding:8px 0">';
        html += '<div><span class="badge badge-warn">waiting_human</span> <strong>' + (step.title || step.id) + '</strong></div>';
        html += '<div style="font-size:11px;color:var(--text-muted);margin:4px 0">Execu\u00E7\u00E3o: ' + exec.id + '</div>';
        html += '<input type="text" id="' + noteId + '" placeholder="nota/motivo (opcional)" style="width:100%;padding:5px 8px;border:1px solid var(--border);border-radius:4px;font-size:12px;margin-bottom:6px" />';
        html += '<div class="chat-actions">';
        html += '<button onclick="decideExecution(\\'' + exec.id + '\\',\\'' + step.id + '\\',\\'approve\\')">\u2705 Aprovar</button>';
        html += '<button onclick="decideExecution(\\'' + exec.id + '\\',\\'' + step.id + '\\',\\'reject\\')" style="color:var(--red)">\u26D4 Rejeitar</button>';
        html += '</div></div>';
      });
    });
    el.innerHTML = html;
  }).catch(function() {
    el.innerHTML = '<span style="color:var(--red)">Erro ao carregar aprova\u00E7\u00F5es.</span>';
  });
}

function decideExecution(execId, stepId, action) {
  var noteEl = document.getElementById('note-' + stepId);
  var noteValue = noteEl ? noteEl.value.trim() : '';
  var payload = { stepId: stepId };
  if (noteValue) payload[action === 'approve' ? 'note' : 'reason'] = noteValue;
  api('/api/executions/' + encodeURIComponent(execId) + '/' + action, { method: 'POST', body: JSON.stringify(payload) }).then(function() {
    toast(action === 'approve' ? 'Step aprovado.' : 'Step rejeitado.', 'success');
    refreshAll();
  }).catch(function(e) {
    toast('Erro: ' + e.message, 'error');
  });
}

function saveToken() {
  var input = document.getElementById('tokenInput');
  var t = input.value.trim();
  if (!t) { toast('Digite um token.', 'error'); return; }
  document.cookie = 'joefelipe_token=' + encodeURIComponent(t) + '; Path=/; SameSite=Lax';
  document.getElementById('tokenStatus').textContent = 'Token salvo!';
  setTimeout(function() { document.getElementById('tokenStatus').textContent = ''; }, 3000);
  toast('Token salvo no cookie.', 'success');
}

function loadGitBranch() {
  api('/api/state').then(function(d) {
    var el = document.getElementById('gitBranch');
    if (el && d.git && d.git.branch) el.textContent = d.git.branch;
  }).catch(function() {});
}

function loadLlmStatus() {
  var el = document.getElementById('llmIndicator');
  if (!el) return;
  api('/api/llm/status').then(function(d) {
    var engine = d.engine || {};
    var provider = engine.provider || 'indisponivel';
    var model = engine.model || '-';
    el.innerHTML = 'Provider: <strong>' + provider + '</strong> &middot; Modelo: <strong>' + model + '</strong> &middot; Modo: <strong>READ_ONLY (conversa nunca executa acoes)</strong>';
  }).catch(function() {
    el.textContent = 'Nao foi possivel carregar o status da LLM.';
  });
}

function loadLlmCost() {
  var el = document.getElementById('llmCostPanel');
  if (!el) return;
  api('/api/llm/status').then(function(d) {
    if (!d.budgetActive) {
      el.innerHTML = '<div style="color:#8a6d00;background:rgba(181,138,0,0.15);padding:6px 8px;border-radius:4px">Sem controle de custo ativo</div>';
      return;
    }
    var tokensLimit = (d.tokensLimit === null || d.tokensLimit === undefined) ? '-' : d.tokensLimit;
    var budgetLimit = (d.budgetLimit === null || d.budgetLimit === undefined) ? '-' : ('$' + Number(d.budgetLimit).toFixed(4));
    var rateLimitRemaining = (d.rateLimitRemaining === null || d.rateLimitRemaining === undefined) ? '-' : d.rateLimitRemaining;
    var circuitState = d.circuitState || '-';
    el.innerHTML =
      '<div class="kv"><span class="k">Tokens</span><span class="v">' + (d.tokensUsed || 0) + ' / ' + tokensLimit + '</span></div>' +
      '<div class="kv"><span class="k">Custo estimado</span><span class="v">$' + Number(d.budgetUsed || 0).toFixed(4) + ' / ' + budgetLimit + '</span></div>' +
      '<div class="kv"><span class="k">Rate limit restante</span><span class="v">' + rateLimitRemaining + '</span></div>' +
      '<div class="kv"><span class="k">Circuit breaker</span><span class="v">' + escapeHtmlClient(circuitState) + '</span></div>';
  }).catch(function() {
    el.textContent = 'Nao foi possivel carregar o custo da LLM.';
  });
}

function testarLlm() {
  var el = document.getElementById('llmTestResult');
  if (el) el.textContent = 'Testando LLM...';
  api('/api/llm/test').then(function(d) {
    if (el) {
      if (d.success) {
        el.innerHTML = 'OK (' + escapeHtmlClient(d.provider) + '/' + escapeHtmlClient(d.model) + ', ' + d.latencyMs + 'ms)';
        toast('LLM respondeu em ' + d.latencyMs + 'ms.', 'success');
      } else {
        el.innerHTML = 'Falhou: ' + escapeHtmlClient(d.error || 'erro desconhecido');
        toast('Erro ao testar LLM: ' + (d.error || 'erro desconhecido'), 'error');
      }
    }
  }).catch(function(e) {
    if (el) el.textContent = 'Falhou: ' + e.message;
    toast('Erro ao testar LLM: ' + e.message, 'error');
  });
}

function transformarEmMissao() {
  var el = document.getElementById('missionCreateResult');
  var userMsgs = document.querySelectorAll('#chatMessages .chat-msg.user');
  var lastUser = userMsgs.length ? userMsgs[userMsgs.length - 1].textContent : '';
  if (!lastUser) {
    toast('Envie uma mensagem antes de transformar em missão.', 'error');
    return;
  }
  if (el) el.textContent = 'Criando missão...';
  // Fase 9.12: MissionBuilder real classifica risco e monta o prompt
  // operacional — NUNCA aprova nem executa nada sozinho.
  api('/api/missions', { method: 'POST', body: JSON.stringify({ message: lastUser, source: 'chat' }) }).then(function(d) {
    if (el) el.innerHTML = 'Missão criada: <strong>' + escapeHtmlClient(d.missionId) + '</strong> (' + escapeHtmlClient(d.mission.classification) + (d.mission.requiresHumanApproval ? ', aguardando aprovação' : '') + ')';
    toast('Missão criada e vinculada à sessão.', 'success');
    loadSessionCurrent();
    loadSessionsList();
  }).catch(function(e) {
    if (el) el.textContent = 'Falhou: ' + e.message;
    toast('Erro ao criar missão: ' + e.message, 'error');
  });
}

function loadPlanner() {
  var el = document.getElementById('plannerPanel');
  if (!el) return;
  api('/api/planner/plan').then(function(d) {
    if (!d.plan) {
      el.innerHTML = '<span style="color:var(--text-muted)">Nenhum plano ativo.</span>';
      return;
    }
    var p = d.plan;
    var html = '<div class="kv"><span class="k">Goal</span><span class="v">' + escapeHtmlClient(p.goal.title) + '</span></div>';
    html += '<div class="kv"><span class="k">Status do plano</span><span class="v">' + escapeHtmlClient(p.status) + '</span></div>';
    (p.missions || []).forEach(function(m) {
      html += '<div style="border-top:1px solid var(--border);padding:8px 0;display:flex;justify-content:space-between;align-items:center;gap:8px">';
      html += '<div><span class="badge badge-idle">' + escapeHtmlClient(m.status) + '</span> ' + escapeHtmlClient(m.title) + '</div>';
      if (m.status === 'planned') {
        html += '<button onclick="criarExecucao(\\'' + m.id + '\\')">Criar Execu\u00E7\u00E3o</button>';
      }
      html += '</div>';
    });
    el.innerHTML = html;
  }).catch(function() {
    el.innerHTML = '<span style="color:var(--red)">Erro ao carregar o planner.</span>';
  });
}

function criarExecucao(missionId) {
  api('/api/orchestrator/create', { method: 'POST', body: JSON.stringify({ missionId: missionId }) }).then(function() {
    toast('Execu\u00E7\u00E3o criada a partir da miss\u00E3o.', 'success');
    refreshAll();
  }).catch(function(e) { toast('Erro: ' + e.message, 'error'); });
}

function statusBadgeClass(status) {
  if (status === 'completed') return 'badge-ok';
  if (status === 'failed' || status === 'aborted') return 'badge-err';
  if (status === 'running') return 'badge-warn';
  return 'badge-idle';
}

function loadExecutions() {
  var el = document.getElementById('executionsList');
  if (!el) return;
  api('/api/executions').then(function(d) {
    var list = d.executions || [];
    if (list.length === 0) {
      el.innerHTML = '<span style="color:var(--text-muted)">Nenhuma execu\u00E7\u00E3o registrada.</span>';
      return;
    }
    var html = '<table style="width:100%;font-size:12px;border-collapse:collapse">';
    html += '<tr style="text-align:left;color:var(--text-muted)"><th>ID</th><th>Miss\u00E3o</th><th>Status</th><th>Steps</th></tr>';
    list.forEach(function(e) {
      html += '<tr style="border-top:1px solid var(--border)">';
      html += '<td style="padding:4px 0">' + escapeHtmlClient(e.id.slice(0, 8)) + '</td>';
      html += '<td>' + escapeHtmlClient(e.missionId) + '</td>';
      html += '<td><span class="badge ' + statusBadgeClass(e.status) + '">' + escapeHtmlClient(e.status) + '</span></td>';
      html += '<td>' + e.stepCount + '</td>';
      html += '</tr>';
    });
    html += '</table>';
    el.innerHTML = html;
  }).catch(function() {
    el.innerHTML = '<span style="color:var(--red)">Erro ao carregar execu\u00E7\u00F5es.</span>';
  });
}

function loadEngine() {
  var el = document.getElementById('enginePanel');
  if (!el) return;
  api('/api/engine/status').then(function(d) {
    var html = '';
    html += '<div class="kv"><span class="k">Rodando</span><span class="v">' + (d.running ? 'sim' : 'n\u00E3o') + '</span></div>';
    html += '<div class="kv"><span class="k">Step atual</span><span class="v">' + escapeHtmlClient(d.currentStepId || '-') + '</span></div>';
    html += '<div class="kv"><span class="k">Executores</span><span class="v">' + escapeHtmlClient((d.executors || []).join(', ')) + '</span></div>';
    if (d.lastResult) {
      html += '<div class="kv"><span class="k">\u00DAltimo resultado</span><span class="v">' + (d.lastResult.success ? 'sucesso' : 'falhou') + '</span></div>';
    }
    // Fase 9.18B: campos reais adicionados na Fase 9.18A (antes /api/engine/status
    // sempre "nascia parado" \u2014 engine reconstruido a cada request).
    html += '<div class="kv"><span class="k">Modo do kernel</span><span class="v">' + escapeHtmlClient(d.kernelMode || '-') + '</span></div>';
    html += '<div class="kv"><span class="k">Driver/Modelo</span><span class="v">' + (d.driver ? escapeHtmlClient(d.driver.provider) + ' / ' + escapeHtmlClient(d.driver.model) : '-') + '</span></div>';
    html += '<div class="kv"><span class="k">Execu\u00E7\u00E3o ativa</span><span class="v">' + (d.activeExecution ? escapeHtmlClient(d.activeExecution.id.slice(0, 8)) + ' (' + escapeHtmlClient(d.activeExecution.status) + ')' : 'nenhuma') + '</span></div>';
    if (d.recentExecution) {
      html += '<div class="kv"><span class="k">Execu\u00E7\u00E3o recente</span><span class="v">' + escapeHtmlClient(d.recentExecution.id.slice(0, 8)) + ' (' + escapeHtmlClient(d.recentExecution.status) + ')</span></div>';
    }
    html += '<div class="kv"><span class="k">Steps pendentes</span><span class="v">' + (d.pendingSteps || 0) + '</span></div>';
    if (d.waitingHuman && d.waitingHuman.length > 0) {
      html += '<div class="kv"><span class="k">Aguardando humano</span><span class="v"><span class="badge badge-warn">' + d.waitingHuman.length + '</span></span></div>';
    }
    if (d.waitingExecutor && d.waitingExecutor.length > 0) {
      html += '<div class="kv"><span class="k">Aguardando executor</span><span class="v"><span class="badge badge-idle">' + d.waitingExecutor.length + '</span></span></div>';
    }
    if (d.lastError) {
      html += '<div class="kv"><span class="k">\u00DAltimo erro</span><span class="v" style="color:var(--red)">' + escapeHtmlClient(d.lastError) + '</span></div>';
    }
    el.innerHTML = html;
  }).catch(function() {
    el.innerHTML = '<span style="color:var(--red)">Erro ao carregar status do engine.</span>';
  });
}

function engineOnce() {
  api('/api/engine/once', { method: 'POST' }).then(function() {
    toast('Pr\u00F3ximo passo executado.', 'success');
    refreshAll();
  }).catch(function(e) { toast('Erro: ' + e.message, 'error'); });
}

function engineRun() {
  api('/api/engine/run', { method: 'POST' }).then(function(d) {
    toast((d.total || 0) + ' passo(s) executado(s).', 'success');
    refreshAll();
  }).catch(function(e) { toast('Erro: ' + e.message, 'error'); });
}

function engineAbort() {
  api('/api/engine/abort', { method: 'POST' }).then(function() {
    toast('Execu\u00E7\u00E3o abortada.', 'success');
    refreshAll();
  }).catch(function(e) { toast('Erro: ' + e.message, 'error'); });
}

function severityBadgeClass(sev) {
  if (sev === 'critical') return 'badge-err';
  if (sev === 'warning') return 'badge-warn';
  return 'badge-idle';
}

function loadEvents() {
  var el = document.getElementById('eventsList');
  if (!el) return;
  api('/api/events').then(function(d) {
    var events = d.events || [];
    if (events.length === 0) {
      el.innerHTML = '<span style="color:var(--text-muted)">Nenhum evento registrado.</span>';
      return;
    }
    var html = '';
    events.slice(0, 10).forEach(function(e) {
      html += '<div style="border-top:1px solid var(--border);padding:6px 0">';
      html += '<span class="badge ' + severityBadgeClass(e.severity) + '">' + escapeHtmlClient(e.severity) + '</span> ' + escapeHtmlClient(e.summary || e.type);
      html += '</div>';
    });
    el.innerHTML = html;
  }).catch(function() {
    el.innerHTML = '<span style="color:var(--red)">Erro ao carregar eventos.</span>';
  });
}

function loadKernelPanel() {
  var el = document.getElementById('kernelPermissions');
  if (!el) return;
  api('/api/kernel').then(function(d) {
    if (!d || d.health === 'unavailable') { el.textContent = 'Kernel indispon\u00EDvel.'; return; }
    var perm = d.permissions || {};
    el.innerHTML = '<div class="kv"><span class="k">Pode executar</span><span class="v">' + (perm.canExecute ? 'sim' : 'n\u00E3o') + '</span></div>' +
      '<div class="kv"><span class="k">Exige aprova\u00E7\u00E3o</span><span class="v">' + (perm.requiresHumanApproval ? 'sim' : 'n\u00E3o') + '</span></div>';
  }).catch(function() {
    el.textContent = 'Erro ao carregar permiss\u00F5es do kernel.';
  });
}

function trocarModo() {
  var select = document.getElementById('modeSelect');
  if (!select) return;
  var m = select.value;
  api('/api/kernel/mode', { method: 'POST', body: JSON.stringify({ mode: m }) }).then(function(d) {
    toast('Modo alterado para ' + d.mode + '.', 'success');
    setTimeout(function() { location.reload(); }, 600);
  }).catch(function(e) { toast('Erro: ' + e.message, 'error'); });
}

function loadConfig() {
  var el = document.getElementById('configPanel');
  if (!el) return;
  api('/api/config').then(function(d) {
    var html = '';
    html += '<div class="kv"><span class="k">Modo</span><span class="v">' + escapeHtmlClient(d.mode) + '</span></div>';
    html += '<div class="kv"><span class="k">LLM Provider</span><span class="v">' + escapeHtmlClient(d.llm && d.llm.provider) + '</span></div>';
    html += '<div class="kv"><span class="k">LLM Modelo</span><span class="v">' + escapeHtmlClient(d.llm && d.llm.model) + '</span></div>';
    html += '<div class="kv"><span class="k">Chamadas externas</span><span class="v">' + (d.llm && d.llm.externalCallsEnabled ? 'ligadas' : 'desligadas') + '</span></div>';
    html += '<div class="kv"><span class="k">Kernel</span><span class="v">' + escapeHtmlClient(d.kernel ? d.kernel.health : 'indispon\u00EDvel') + '</span></div>';
    html += '<div class="kv"><span class="k">Branch</span><span class="v">' + escapeHtmlClient(d.git && d.git.branch) + '</span></div>';
    el.innerHTML = html;
  }).catch(function() {
    el.innerHTML = '<span style="color:var(--red)">Erro ao carregar /api/config.</span>';
  });
}

function driverStatusBadgeClass(status) {
  if (status === 'disponivel') return 'badge-ok';
  if (status === 'erro') return 'badge-err';
  return 'badge-warn';
}

function capabilitiesHtmlClient(caps) {
  if (!caps || caps.length === 0) return '<span style="color:var(--text-muted)">nenhuma</span>';
  return caps.map(function(c) {
    return '<span class="badge badge-idle" style="margin-right:4px">' + escapeHtmlClient(c) + '</span>';
  }).join('');
}

function loadDrivers() {
  var el = document.getElementById('driversPanel');
  if (!el) return;
  api('/api/drivers').then(function(d) {
    var html = '';
    (d.drivers || []).forEach(function(dr) {
      html += '<div style="border-top:1px solid var(--border);padding:10px 0">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center">';
      html += '<strong>' + escapeHtmlClient(dr.name) + '</strong> <span class="badge ' + driverStatusBadgeClass(dr.status) + '">' + escapeHtmlClient(dr.status) + '</span>';
      html += '</div>';
      html += '<div class="kv"><span class="k">id</span><span class="v">' + escapeHtmlClient(dr.id) + '</span></div>';
      html += '<div class="kv"><span class="k">Versão</span><span class="v">' + escapeHtmlClient(dr.version || '-') + '</span></div>';
      html += '<div class="kv"><span class="k">Driver padrão</span><span class="v">' + (dr.isDefault ? escapeHtmlClient(dr.name) : '-') + '</span></div>';
      html += '<div class="kv"><span class="k">Ativo agora</span><span class="v">' + (dr.active ? escapeHtmlClient(dr.name) : 'Stub (fallback)') + '</span></div>';
      html += '<div style="margin:6px 0">' + capabilitiesHtmlClient(dr.capabilities) + '</div>';
      if (dr.message) html += '<div style="font-size:11px;color:var(--text-muted)">' + escapeHtmlClient(dr.message) + '</div>';
      html += '</div>';
    });
    if (d.fallback) {
      html += '<div style="border-top:2px solid var(--border);padding:10px 0;margin-top:6px">';
      html += '<strong>' + escapeHtmlClient(d.fallback.name) + '</strong> <span class="badge badge-ok">fallback sempre disponível</span>';
      html += '<div class="kv"><span class="k">Versão</span><span class="v">' + escapeHtmlClient(d.fallback.version || '-') + '</span></div>';
      html += '<div style="margin:6px 0">' + capabilitiesHtmlClient(d.fallback.capabilities) + '</div>';
      html += '</div>';
    }
    el.innerHTML = html || '<span style="color:var(--text-muted)">Nenhum driver registrado.</span>';
  }).catch(function() {
    el.innerHTML = '<span style="color:var(--red)">Erro ao carregar drivers.</span>';
  });
}

// Fase 9.18B: unico consumidor de /api/health — alimenta o badge global de
// saude (sidebar), o card "Erros Recentes" (Desenvolvimento) e o card
// "Avisos" (Agente, antes hardcoded "Nenhum aviso."). Busca /api/state em
// paralelo so para reaproveitar state.warnings (real, calculado por
// buildState()) sem perder esses avisos a cada refresh de 5s.
function loadHealth() {
  Promise.all([api('/api/health'), api('/api/state')]).then(function(results) {
    var d = results[0];
    var st = results[1];

    var badge = document.getElementById('healthBadge');
    if (badge) {
      badge.className = 'badge ' + (d.ok ? 'badge-ok' : 'badge-err');
      badge.textContent = (d.ok ? 'Saudável' : 'Degradado') + ' · ' + (d.kernel && d.kernel.health ? d.kernel.health : '-');
    }

    var errEl = document.getElementById('recentErrorsPanel');
    if (errEl) {
      var errors = d.recentErrors || [];
      if (errors.length === 0) {
        errEl.innerHTML = '<span style="color:var(--text-muted)">Nenhum erro/aviso recente.</span>';
      } else {
        var errHtml = '';
        errors.forEach(function(e) {
          errHtml += '<div style="border-top:1px solid var(--border);padding:6px 0">';
          errHtml += '<span class="badge ' + severityBadgeClass(e.severity) + '">' + escapeHtmlClient(e.severity) + '</span> ' + escapeHtmlClient(e.summary || e.type);
          errHtml += '</div>';
        });
        errEl.innerHTML = errHtml;
      }
    }

    var warnEl = document.getElementById('warnings');
    if (warnEl) {
      var items = (st.warnings || []).slice();
      if (d.drivers && d.drivers.error > 0) items.push(d.drivers.error + ' driver(s) com erro.');
      if (d.drivers && d.drivers.unavailable > 0) items.push(d.drivers.unavailable + ' driver(s) indisponível(eis).');
      if (d.runtime && d.runtime.diskUsageBytes > 50 * 1024 * 1024) {
        items.push('runtime/ ocupando ' + Math.round(d.runtime.diskUsageBytes / (1024 * 1024)) + ' MB.');
      }
      warnEl.innerHTML = items.length === 0
        ? '<span style="color:var(--text-muted)">Nenhum aviso.</span>'
        : items.map(function(w) { return '<div style="padding:3px 0">' + escapeHtmlClient(w) + '</div>'; }).join('');
    }
  }).catch(function() {
    var badge = document.getElementById('healthBadge');
    if (badge) { badge.className = 'badge badge-err'; badge.textContent = 'Indisponível'; }
  });
}

function refreshAll() {
  loadApprovals();
  loadGitBranch();
  loadLlmStatus();
  loadLlmCost();
  loadPlanner();
  loadExecutions();
  loadEngine();
  loadEvents();
  loadKernelPanel();
  loadConfig();
  loadDrivers();
  loadHealth();
  // Fase 9.11: todo polling passa a respeitar a sessao ativa — chat,
  // sessao atual e lista de sessoes recarregam junto com o resto do estado.
  loadChatHistory();
  loadSessionCurrent();
  loadSessionsList();
}

document.addEventListener('DOMContentLoaded', function() {
  refreshAll();
  setInterval(refreshAll, 5000);
});
</script>
</body>
</html>`;
}
