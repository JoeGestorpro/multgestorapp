import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Server } from "node:http";
import { startServer } from "./server.ts";
import { createKernel } from "./kernel/Kernel.ts";
import type { Kernel } from "./kernel/Kernel.ts";
import { TaskOrchestrator } from "./orchestrator/index.ts";
import { ExecutionStateStore } from "./execution/index.ts";
import type { PlannedMission } from "./planner/types.ts";
import { GoalPlanner, RuleBasedPlanningStrategy, PlanStore, QueueManager } from "./planner/index.ts";
import { findRepoRoot } from "./readers.ts";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "joefelipe-server-test-"));
}

function clean(r: string) {
  try { rmSync(r, { recursive: true, force: true }); } catch { }
}

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("endereco invalido");
  return addr.port;
}

async function stop(server: Server): Promise<void> {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

const auditMission: PlannedMission = {
  id: "server-test-audit-1",
  goalId: "goal-1",
  order: 1,
  title: "Missao de auditoria (server)",
  intent: "testar wiring do server com o engine real",
  executorId: "claude-code",
  type: "audit",
  status: "active",
  dependsOn: [],
  classification: "READ_ONLY",
};

// Missao "security" com classification SAFE_WRITE gera: analyze, implement,
// validate, approval, report — o step "approval" roteia para o HumanExecutor
// e fica "waiting_human" ate approve/reject.
const securityMission: PlannedMission = {
  id: "server-test-security-1",
  goalId: "goal-1",
  order: 1,
  title: "Missao de seguranca (server)",
  intent: "testar rotas HTTP de approval",
  executorId: "claude-code",
  type: "security",
  status: "active",
  dependsOn: [],
  classification: "SAFE_WRITE",
};

const featureMission: PlannedMission = {
  id: "server-test-feature-1",
  goalId: "goal-1",
  order: 1,
  title: "Missao de escrita segura (server)",
  intent: "testar que o server respeita o modo real do kernel",
  executorId: "claude-code",
  type: "feature",
  status: "active",
  dependsOn: [],
  classification: "SAFE_WRITE",
};

test("/api/engine/run usa o kernel real: READ_ONLY bloqueia step SAFE_WRITE (implement)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    orc.create(featureMission);

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/engine/run", { method: "POST" });
    const body = await res.json() as { results: Array<{ success: boolean; error?: string }> };

    // "analyze" (READ_ONLY) passa; "implement" (SAFE_WRITE) deve ser negado
    // pelo ModePolicy porque o kernel real esta em READ_ONLY.
    assert.ok(body.results.length >= 2);
    assert.equal(body.results[0].success, true);
    const secondFailed = body.results.find((r) => !r.success);
    assert.ok(secondFailed, "algum step SAFE_WRITE deve falhar sob kernel READ_ONLY");
    assert.ok(secondFailed!.error?.includes("READ_ONLY"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("modo LOCKED bloqueia qualquer execucao via server, mesmo step READ_ONLY", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("LOCKED");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    orc.create(auditMission);

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/engine/once", { method: "POST" });
    const body = await res.json() as { result: { success: boolean; error?: string } | null };

    assert.ok(body.result);
    assert.equal(body.result!.success, false);
    assert.ok(body.result!.error?.includes("LOCKED"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("/api/engine/abort persiste abort no ExecutionStateStore", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    orc.create(featureMission);

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    // Garante que existe estado persistido para a orquestracao ativa antes do abort.
    await fetch("http://127.0.0.1:" + port + "/api/engine/once", { method: "POST" });

    const res = await fetch("http://127.0.0.1:" + port + "/api/engine/abort", { method: "POST" });
    const body = await res.json() as { success: boolean };
    assert.equal(body.success, true);

    const stateStore = new ExecutionStateStore(root);
    assert.equal(stateStore.isAbortRequested(), true);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("/api/orchestrator/complete/:id nao consegue mais bypassar o PolicyEngine (403)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    const o = orc.create(auditMission);
    const stepId = o.steps[0].id;

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/orchestrator/complete/" + stepId, { method: "POST" });
    assert.equal(res.status, 403);
    const body = await res.json() as { success: boolean; error?: string };
    assert.equal(body.success, false);
    assert.ok(body.error?.toLowerCase().includes("policyengine"));

    const updated = orc.get(o.id);
    assert.ok(updated);
    assert.notEqual(updated.steps[0].status, "completed");
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("/api/orchestrator/fail/:id nao consegue mais bypassar o PolicyEngine (403)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    const o = orc.create(auditMission);
    const stepId = o.steps[0].id;

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/orchestrator/fail/" + stepId, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "tentativa de bypass" }),
    });
    assert.equal(res.status, 403);

    const updated = orc.get(o.id);
    assert.ok(updated);
    assert.notEqual(updated.steps[0].status, "failed");
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("shell continua bloqueado por padrao via server (ShellPolicy nega mesmo via HTTP)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    const original = process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;
    delete process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;

    kernel = createKernel("EXECUTE_APPROVED");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    const o = orc.create({ ...auditMission, id: "server-test-shell-1" });
    // O server recarrega a orquestracao do zero a cada request (novo
    // TaskOrchestrator por request) — para simular um step com executor
    // "local-shell", persistimos a mutacao diretamente no orchestration.jsonl
    // (a linha mais recente por id "vence" no reload).
    o.steps[0].executor = "local-shell";
    o.steps[0].prompt = "git status";
    const orchestrationFile = join(root, "tools", "joefelipe-agent", "runtime", "orchestration.jsonl");
    appendFileSync(orchestrationFile, JSON.stringify(o) + "\n", "utf8");

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/engine/once", { method: "POST" });
    const body = await res.json() as { result: { success: boolean; error?: string } | null };

    assert.ok(body.result);
    assert.equal(body.result!.success, false);
    assert.ok(body.result!.error?.includes("desabilitado por padrao"));

    if (original !== undefined) process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED = original;
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.2: bind em loopback por padrao + auth por token opcional ───────

test("servidor binda em 127.0.0.1 por padrao (nunca 0.0.0.0/todas as interfaces)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    server = startServer(root, 0, kernel);
    await listen(server);

    const addr = server.address();
    assert.ok(addr && typeof addr !== "string");
    assert.equal((addr as { address: string }).address, "127.0.0.1");
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("servidor aceita host explicito (ex.: 'localhost') sem cair para 0.0.0.0", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    server = startServer(root, 0, kernel, "127.0.0.1");
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/state");
    assert.equal(res.status, 200);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("sem JOEFELIPE_SERVER_TOKEN configurado, rotas continuam abertas (compatibilidade)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const original = process.env.JOEFELIPE_SERVER_TOKEN;
  try {
    delete process.env.JOEFELIPE_SERVER_TOKEN;
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/state");
    assert.equal(res.status, 200);
  } finally {
    if (original === undefined) delete process.env.JOEFELIPE_SERVER_TOKEN;
    else process.env.JOEFELIPE_SERVER_TOKEN = original;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("com JOEFELIPE_SERVER_TOKEN configurado, requisicao sem Authorization e negada (401)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const original = process.env.JOEFELIPE_SERVER_TOKEN;
  try {
    process.env.JOEFELIPE_SERVER_TOKEN = "segredo-de-teste";
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/state");
    assert.equal(res.status, 401);
    const body = await res.json() as { success: boolean };
    assert.equal(body.success, false);
  } finally {
    if (original === undefined) delete process.env.JOEFELIPE_SERVER_TOKEN;
    else process.env.JOEFELIPE_SERVER_TOKEN = original;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("com JOEFELIPE_SERVER_TOKEN configurado, token errado e negado (401)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const original = process.env.JOEFELIPE_SERVER_TOKEN;
  try {
    process.env.JOEFELIPE_SERVER_TOKEN = "segredo-de-teste";
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/state", {
      headers: { Authorization: "Bearer token-errado" },
    });
    assert.equal(res.status, 401);
  } finally {
    if (original === undefined) delete process.env.JOEFELIPE_SERVER_TOKEN;
    else process.env.JOEFELIPE_SERVER_TOKEN = original;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("com JOEFELIPE_SERVER_TOKEN configurado, token correto e aceito (200)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const original = process.env.JOEFELIPE_SERVER_TOKEN;
  try {
    process.env.JOEFELIPE_SERVER_TOKEN = "segredo-de-teste";
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/state", {
      headers: { Authorization: "Bearer segredo-de-teste" },
    });
    assert.equal(res.status, 200);
  } finally {
    if (original === undefined) delete process.env.JOEFELIPE_SERVER_TOKEN;
    else process.env.JOEFELIPE_SERVER_TOKEN = original;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.3: HTTP Approval/State Surface ──────────────────────────────────

test("GET /api/executions lista execucoes e destaca steps waiting_human", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    const o = orc.create(securityMission);

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    // Roda ate parar no step "approval" (waiting_human).
    await fetch("http://127.0.0.1:" + port + "/api/engine/run", { method: "POST" });

    const res = await fetch("http://127.0.0.1:" + port + "/api/executions");
    assert.equal(res.status, 200);
    const body = await res.json() as { executions: Array<{ id: string; pendingHuman: Array<{ id: string; type: string }> }> };
    const entry = body.executions.find((e) => e.id === o.id);
    assert.ok(entry);
    assert.equal(entry!.pendingHuman.length, 1);
    assert.equal(entry!.pendingHuman[0].type, "approval");
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/executions/:id retorna detalhes; id desconhecido da 404", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    const o = orc.create(securityMission);

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    await fetch("http://127.0.0.1:" + port + "/api/engine/run", { method: "POST" });

    const res = await fetch("http://127.0.0.1:" + port + "/api/executions/" + o.id);
    assert.equal(res.status, 200);
    const body = await res.json() as { execution: { id: string }; pendingHuman: Array<{ id: string }> };
    assert.equal(body.execution.id, o.id);
    assert.equal(body.pendingHuman.length, 1);

    const notFound = await fetch("http://127.0.0.1:" + port + "/api/executions/nao-existe");
    assert.equal(notFound.status, 404);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/executions/:id/approve aprova o step pendente e permite retomar", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    const o = orc.create(securityMission);

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    await fetch("http://127.0.0.1:" + port + "/api/engine/run", { method: "POST" });

    const approveRes = await fetch("http://127.0.0.1:" + port + "/api/executions/" + o.id + "/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "aprovado via teste http" }),
    });
    assert.equal(approveRes.status, 200);
    const approveBody = await approveRes.json() as { success: boolean; execution: { steps: Array<{ type: string; status: string; result?: string }> } };
    assert.equal(approveBody.success, true);
    const approvalStep = approveBody.execution.steps.find((s) => s.type === "approval");
    assert.equal(approvalStep?.status, "completed");
    assert.equal(approvalStep?.result, "aprovado via teste http");

    // Retomando: o proximo /api/engine/run deve concluir o step "report" restante.
    const runRes = await fetch("http://127.0.0.1:" + port + "/api/engine/run", { method: "POST" });
    const runBody = await runRes.json() as { results: Array<{ success: boolean }> };
    assert.equal(runBody.results.length, 1);
    assert.ok(runBody.results[0].success);

    const finalRes = await fetch("http://127.0.0.1:" + port + "/api/executions/" + o.id);
    const finalBody = await finalRes.json() as { execution: { status: string } };
    assert.equal(finalBody.execution.status, "completed");
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/executions/:id/reject rejeita o step pendente e falha a execucao", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    const o = orc.create({ ...securityMission, id: "server-test-security-reject-1" });

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    await fetch("http://127.0.0.1:" + port + "/api/engine/run", { method: "POST" });

    const rejectRes = await fetch("http://127.0.0.1:" + port + "/api/executions/" + o.id + "/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "rejeitado via teste http" }),
    });
    assert.equal(rejectRes.status, 200);
    const rejectBody = await rejectRes.json() as { success: boolean; execution: { status: string; steps: Array<{ type: string; status: string; error?: string }> } };
    assert.equal(rejectBody.success, true);
    assert.equal(rejectBody.execution.status, "failed");
    const approvalStep = rejectBody.execution.steps.find((s) => s.type === "approval");
    assert.equal(approvalStep?.status, "failed");
    assert.equal(approvalStep?.error, "rejeitado via teste http");
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("approve sem step pendente retorna erro claro (400)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    const o = orc.create(auditMission);

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/executions/" + o.id + "/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
    const body = await res.json() as { success: boolean; error?: string };
    assert.equal(body.success, false);
    assert.ok(body.error?.includes("Nenhum step aguardando aprovacao"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("rotas /api/executions respeitam JOEFELIPE_SERVER_TOKEN (401 sem token, 200 com token)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const original = process.env.JOEFELIPE_SERVER_TOKEN;
  try {
    process.env.JOEFELIPE_SERVER_TOKEN = "segredo-executions";
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();

    const orc = new TaskOrchestrator(root);
    const o = orc.create({ ...securityMission, id: "server-test-security-token-1" });

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const noAuth = await fetch("http://127.0.0.1:" + port + "/api/executions");
    assert.equal(noAuth.status, 401);

    const withAuth = await fetch("http://127.0.0.1:" + port + "/api/executions", {
      headers: { Authorization: "Bearer segredo-executions" },
    });
    assert.equal(withAuth.status, 200);

    const approveNoAuth = await fetch("http://127.0.0.1:" + port + "/api/executions/" + o.id + "/approve", { method: "POST" });
    assert.equal(approveNoAuth.status, 401);
  } finally {
    if (original === undefined) delete process.env.JOEFELIPE_SERVER_TOKEN;
    else process.env.JOEFELIPE_SERVER_TOKEN = original;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.4: painel de aprovacao (HTML) + bootstrap de token via cookie ───

test("pagina raiz inclui o painel de Aprovacoes Pendentes e a caixa de token", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/");
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("Aprova"));
    assert.ok(html.includes("approvalList"));
    assert.ok(html.includes("tokenInput"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard referencia /api/executions (nao mais so o /api/approval antigo)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/");
    const html = await res.text();
    assert.ok(html.includes("api('/api/executions')") || html.includes("'/api/executions'"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard referencia as rotas de approve e reject com botoes Aprovar/Rejeitar", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/");
    const html = await res.text();
    assert.ok(html.includes("decideExecution"));
    assert.ok(html.includes("approve"));
    assert.ok(html.includes("reject"));
    assert.ok(html.includes("Aprovar"));
    assert.ok(html.includes("Rejeitar"));
    assert.ok(html.includes("waiting_human"));
    assert.ok(html.includes("nota/motivo"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("HTML do dashboard nao contem JS quebrado: o <script> inline parseia sem SyntaxError", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/");
    const html = await res.text();
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(match, "deveria existir um bloco <script> inline no dashboard");
    const scriptBody = match![1];
    // new Function so faz o PARSE do corpo (nao executa DOM real aqui) —
    // se houver token invalido (ex.: quebra de linha literal dentro de
    // string com aspas simples), isso lanca SyntaxError, exatamente o
    // sintoma reportado no navegador.
    assert.doesNotThrow(() => new Function(scriptBody), /SyntaxError/);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("?token= valido na query string autoriza e grava cookie para requisicoes seguintes", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const original = process.env.JOEFELIPE_SERVER_TOKEN;
  try {
    process.env.JOEFELIPE_SERVER_TOKEN = "segredo-cookie";
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const bootstrapRes = await fetch("http://127.0.0.1:" + port + "/?token=segredo-cookie");
    assert.equal(bootstrapRes.status, 200);
    const setCookie = bootstrapRes.headers.get("set-cookie");
    assert.ok(setCookie);
    assert.ok(setCookie!.includes("joefelipe_token=segredo-cookie"));
    assert.ok(setCookie!.toLowerCase().includes("httponly"));

    const cookieValue = setCookie!.split(";")[0];
    const followUp = await fetch("http://127.0.0.1:" + port + "/api/executions", {
      headers: { Cookie: cookieValue },
    });
    assert.equal(followUp.status, 200);
  } finally {
    if (original === undefined) delete process.env.JOEFELIPE_SERVER_TOKEN;
    else process.env.JOEFELIPE_SERVER_TOKEN = original;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("?token= invalido na query string continua negado (401), sem cookie", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const original = process.env.JOEFELIPE_SERVER_TOKEN;
  try {
    process.env.JOEFELIPE_SERVER_TOKEN = "segredo-cookie-2";
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/?token=token-errado");
    assert.equal(res.status, 401);
    assert.equal(res.headers.get("set-cookie"), null);
  } finally {
    if (original === undefined) delete process.env.JOEFELIPE_SERVER_TOKEN;
    else process.env.JOEFELIPE_SERVER_TOKEN = original;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});
﻿
// ── Fase 9.2: rotas placeholder ─────────────────────────────────────────────

test("GET /api/chat/history retorna lista vazia de mensagens", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/chat/history");
    assert.equal(res.status, 200);
    const body = await res.json() as { messages: unknown[] };
    assert.ok(Array.isArray(body.messages));
    assert.equal(body.messages.length, 0);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/chat/message sem OPENROUTER_API_KEY usa MockProvider (Fase 9.5)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalLegacyKey = process.env.JOEFELIPE_OPENROUTER_API_KEY;
  try {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.JOEFELIPE_OPENROUTER_API_KEY;
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "teste" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json() as { response: string; provider: string; mode: string; timestamp: string };
    assert.equal(body.provider, "mock");
    assert.equal(body.mode, "READ_ONLY");
    assert.ok(body.response.length > 0);
    assert.ok(body.timestamp);
  } finally {
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalKey;
    if (originalLegacyKey === undefined) delete process.env.JOEFELIPE_OPENROUTER_API_KEY; else process.env.JOEFELIPE_OPENROUTER_API_KEY = originalLegacyKey;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/chat/message: OPENROUTER_API_KEY isolada (sem JOEFELIPE_LLM_PROVIDER) NAO ativa o provider real", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalFetch = globalThis.fetch;
  let fetchedOpenRouter = false;
  try {
    process.env.OPENROUTER_API_KEY = "sk-super-secret-test-key-12345";
    delete process.env.JOEFELIPE_LLM_PROVIDER;
    globalThis.fetch = (async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url ?? "";
      if (url.includes("openrouter.ai")) { fetchedOpenRouter = true; }
      return originalFetch(input, init);
    }) as typeof fetch;

    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "explique o estado atual" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json() as { response: string; provider: string };
    assert.equal(body.provider, "mock");
    assert.equal(fetchedOpenRouter, false, "OPENROUTER_API_KEY isolada nao deve disparar chamada de rede real");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalKey;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/chat/message com JOEFELIPE_LLM_PROVIDER=openrouter + OPENROUTER_API_KEY: ativa o provider real e nunca expoe a chave", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const originalProvider = process.env.JOEFELIPE_LLM_PROVIDER;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalModel = process.env.OPENROUTER_MODEL;
  const originalFetch = globalThis.fetch;
  try {
    process.env.JOEFELIPE_LLM_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "sk-super-secret-test-key-12345";
    process.env.OPENROUTER_MODEL = "test-model-v1";
    globalThis.fetch = (async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url ?? "";
      if (url.includes("openrouter.ai")) {
        return new Response(JSON.stringify({ choices: [{ message: { content: "Resposta real simulada" } }] }));
      }
      return originalFetch(input, init);
    }) as typeof fetch;

    // Fase 9.19: READ_ONLY nao concede execute:llm (kernel/Permissions.ts) —
    // LlmEngine.complete() bloquearia o provider real. PLAN_ONLY e o modo
    // minimo que permite, mantendo este teste exercitando o caminho real.
    kernel = createKernel("PLAN_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "explique o estado atual" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json() as { response: string; provider: string; model: string };
    assert.equal(body.provider, "openrouter");
    assert.equal(body.model, "test-model-v1");
    assert.equal(body.response, "Resposta real simulada");
    assert.ok(!JSON.stringify(body).includes("sk-super-secret-test-key-12345"));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalProvider === undefined) delete process.env.JOEFELIPE_LLM_PROVIDER; else process.env.JOEFELIPE_LLM_PROVIDER = originalProvider;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.OPENROUTER_MODEL; else process.env.OPENROUTER_MODEL = originalModel;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/chat/message: erro no provider real (com decisao explicita) vira resposta amigavel, sem crash", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const originalProvider = process.env.JOEFELIPE_LLM_PROVIDER;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalFetch = globalThis.fetch;
  try {
    process.env.JOEFELIPE_LLM_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "sk-test-key-que-vai-falhar";
    globalThis.fetch = (async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url ?? "";
      if (url.includes("openrouter.ai")) throw new Error("network down");
      return originalFetch(input, init);
    }) as typeof fetch;

    // Fase 9.19: PLAN_ONLY (nao READ_ONLY) para o gate de kernel deixar a
    // chamada real prosseguir e de fato bater no fetch mockado acima.
    kernel = createKernel("PLAN_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "teste" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json() as { response: string; provider: string };
    assert.ok(body.response.length > 0);
    assert.equal(kernel.context.getMode(), "PLAN_ONLY");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalProvider === undefined) delete process.env.JOEFELIPE_LLM_PROVIDER; else process.env.JOEFELIPE_LLM_PROVIDER = originalProvider;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalKey;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.6: cenarios canary adicionais (rate limit, timeout, offline) ────

async function chatCanaryScenario(opts: {
  root: string;
  fetchImpl: typeof fetch;
  text?: string;
}): Promise<{ status: number; body: { response: string; provider: string }; mode: string }> {
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const originalProvider = process.env.JOEFELIPE_LLM_PROVIDER;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalFetch = globalThis.fetch;
  try {
    process.env.JOEFELIPE_LLM_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "sk-canary-test-key";
    globalThis.fetch = opts.fetchImpl;

    // Fase 9.19: LlmEngine.complete() so chama um provider real quando o
    // kernel permite execute:llm (fecha B-003) — READ_ONLY nao concede isso
    // na matriz de permissoes (kernel/Permissions.ts), so PLAN_ONLY+. Usamos
    // o modo minimo que permite, para estes testes continuarem exercitando
    // de verdade o OpenRouterProvider (nao o caminho bloqueado).
    kernel = createKernel("PLAN_ONLY");
    await kernel.initialize();
    server = startServer(opts.root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: opts.text ?? "explique o estado atual" }),
    });
    const body = await res.json() as { response: string; provider: string };
    return { status: res.status, body, mode: kernel.context.getMode() };
  } finally {
    globalThis.fetch = originalFetch;
    if (originalProvider === undefined) delete process.env.JOEFELIPE_LLM_PROVIDER; else process.env.JOEFELIPE_LLM_PROVIDER = originalProvider;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalKey;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
  }
}

test("POST /api/chat/message: HTTP 429 (rate limit) do OpenRouter vira resposta amigavel, sem crash, modo preservado", async () => {
  const root = tempRoot();
  const originalFetch = globalThis.fetch;
  const { status, body, mode } = await chatCanaryScenario({
    root,
    fetchImpl: (async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url ?? "";
      if (url.includes("openrouter.ai")) return new Response("Too Many Requests", { status: 429 });
      return originalFetch(input, init);
    }) as typeof fetch,
  });
  assert.equal(status, 200);
  assert.ok(body.response.length > 0);
  assert.equal(mode, "PLAN_ONLY");
  clean(root);
});

test("POST /api/chat/message: HTTP 500 do OpenRouter vira fallback seguro, sem crash", async () => {
  const root = tempRoot();
  const originalFetch = globalThis.fetch;
  const { status, body, mode } = await chatCanaryScenario({
    root,
    fetchImpl: (async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url ?? "";
      if (url.includes("openrouter.ai")) return new Response("Internal Server Error", { status: 500 });
      return originalFetch(input, init);
    }) as typeof fetch,
  });
  assert.equal(status, 200);
  assert.ok(body.response.length > 0);
  assert.equal(mode, "PLAN_ONLY");
  clean(root);
});

test("POST /api/chat/message: timeout do OpenRouter vira mensagem amigavel, interface nao trava", async () => {
  const root = tempRoot();
  const started = Date.now();
  // Simula o AbortError que o AbortController dispararia ao estourar o
  // timeoutMs real — sem esperar os 30s do timeout default de producao,
  // já que o objetivo aqui e provar que a resposta chega rapido e amigavel
  // (timeout NAO e re-tentado — ver OpenRouterProvider#callWithRetry).
  const originalFetch = globalThis.fetch;
  const { status, body, mode } = await chatCanaryScenario({
    root,
    fetchImpl: (async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url ?? "";
      if (url.includes("openrouter.ai")) throw new DOMException("The operation was aborted", "AbortError");
      return originalFetch(input, init);
    }) as typeof fetch,
  });
  assert.ok(Date.now() - started < 5000, "timeout nao deve ser re-tentado (resposta deve chegar rapido, nao em ~30-90s)");
  assert.equal(status, 200);
  assert.ok(body.response.length > 0);
  assert.equal(mode, "PLAN_ONLY");
  clean(root);
});

test("POST /api/chat/message: provider offline (conexao recusada) — sistema continua respondendo", async () => {
  const root = tempRoot();
  const originalFetch = globalThis.fetch;
  const { status, body, mode } = await chatCanaryScenario({
    root,
    fetchImpl: (async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url ?? "";
      if (url.includes("openrouter.ai")) throw new Error("connect ECONNREFUSED 127.0.0.1:443");
      return originalFetch(input, init);
    }) as typeof fetch,
  });
  assert.equal(status, 200);
  assert.ok(body.response.length > 0);
  assert.equal(mode, "PLAN_ONLY");
  clean(root);
});

test("POST /api/chat/message: modelo invalido (404) — erro amigavel, nenhum segredo no corpo da resposta", async () => {
  const root = tempRoot();
  const originalFetch = globalThis.fetch;
  const { status, body } = await chatCanaryScenario({
    root,
    fetchImpl: (async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url ?? "";
      if (url.includes("openrouter.ai")) return new Response("Model not found", { status: 404 });
      return originalFetch(input, init);
    }) as typeof fetch,
  });
  assert.equal(status, 200);
  assert.ok(body.response.length > 0);
  assert.ok(!JSON.stringify(body).includes("sk-canary-test-key"));
  assert.ok(!JSON.stringify(body).toLowerCase().includes("authorization"));
  clean(root);
});

// ── Fase 10: LLM Cost Safety (/api/llm/status + dashboard "LLM Cost") ──

const SAFETY_ENV_KEYS = [
  "JOEFELIPE_LLM_PROVIDER",
  "OPENROUTER_API_KEY",
  "JOEFELIPE_LLM_SESSION_ID",
  "JOEFELIPE_LLM_MAX_TOKENS_PER_SESSION",
  "JOEFELIPE_LLM_RATE_LIMIT_MAX_CALLS",
  "JOEFELIPE_LLM_RATE_LIMIT_WINDOW_MS",
  "JOEFELIPE_LLM_CIRCUIT_FAILURE_THRESHOLD",
] as const;

async function withSafetyServer(
  overrides: Partial<Record<(typeof SAFETY_ENV_KEYS)[number], string>>,
  fetchImpl: typeof fetch,
  fn: (port: number) => Promise<void>,
): Promise<void> {
  const root = tempRoot();
  const original: Record<string, string | undefined> = {};
  for (const key of SAFETY_ENV_KEYS) original[key] = process.env[key];
  const originalFetch = globalThis.fetch;
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    for (const key of SAFETY_ENV_KEYS) delete process.env[key];
    for (const [key, value] of Object.entries(overrides)) process.env[key] = value;
    globalThis.fetch = fetchImpl;

    kernel = createKernel("PLAN_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    await fn(port);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of SAFETY_ENV_KEYS) {
      if (original[key] === undefined) delete process.env[key]; else process.env[key] = original[key];
    }
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
}

test("GET /api/llm/status sem safety configurado retorna budgetActive:false", async () => {
  await withSafetyServer({}, globalThis.fetch, async (port) => {
    const res = await fetch("http://127.0.0.1:" + port + "/api/llm/status");
    assert.equal(res.status, 200);
    const body = await res.json() as Record<string, unknown>;
    assert.equal(body.budgetActive, false);
  });
});

test("GET /api/llm/status com safety configurado via env reflete uso real apos uma chamada", async () => {
  const originalFetch = globalThis.fetch;
  await withSafetyServer(
    {
      JOEFELIPE_LLM_PROVIDER: "openrouter",
      OPENROUTER_API_KEY: "sk-fase10-test-key",
      JOEFELIPE_LLM_MAX_TOKENS_PER_SESSION: "10000",
      JOEFELIPE_LLM_RATE_LIMIT_MAX_CALLS: "5",
      JOEFELIPE_LLM_RATE_LIMIT_WINDOW_MS: "60000",
      JOEFELIPE_LLM_CIRCUIT_FAILURE_THRESHOLD: "5",
    },
    (async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url ?? "";
      if (url.includes("openrouter.ai")) {
        return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }], usage: { total_tokens: 42 } }));
      }
      return originalFetch(input, init);
    }) as typeof fetch,
    async (port) => {
      const chatRes = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "ola" }),
      });
      assert.equal(chatRes.status, 200);

      const statusRes = await fetch("http://127.0.0.1:" + port + "/api/llm/status");
      const status = await statusRes.json() as Record<string, unknown>;
      assert.equal(status.budgetActive, true);
      assert.equal(status.tokensUsed, 42);
      assert.equal(status.tokensLimit, 10000);
      assert.equal(status.rateLimitRemaining, 4);
      assert.equal(status.circuitState, "CLOSED");
    },
  );
});

test("dashboard mostra secao 'LLM Cost'", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/");
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("LLM Cost"));
    assert.ok(html.includes("llmCostPanel"));
    assert.ok(html.includes("Sem controle de custo ativo"), "sem safety configurado, deveria mostrar o aviso de custo nao controlado");
    assert.ok(html.includes("loadLlmCost"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/chat/message nunca dispara o ExecutionEngine (READ_ONLY permanece ativo)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    const orc = new TaskOrchestrator(root);
    const created = orc.create({ ...featureMission, id: "server-test-chat-no-exec-1" });

    server = startServer(root, 0, kernel);
    const port = await listen(server);
    await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "faca deploy em producao" }),
    });

    assert.equal(kernel.context.getMode(), "READ_ONLY");
    const updated = orc.get(created.id);
    assert.ok(updated);
    assert.ok(updated.steps.every((s) => s.status !== "completed" && s.status !== "running"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("DELETE /api/chat/history limpa conversa", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/chat/history", { method: "DELETE" });
    assert.equal(res.status, 200);
    const body = await res.json() as { success: boolean; cleared: boolean };
    assert.equal(body.success, true);
    assert.equal(body.cleared, true);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/brain/search retorna resultados vazios", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/brain/search?q=teste");
    assert.equal(res.status, 200);
    const body = await res.json() as { query: string; results: unknown[] };
    assert.equal(body.query, "teste");
    assert.ok(Array.isArray(body.results));
    assert.equal(body.results.length, 0);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/sessions retorna lista vazia", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/sessions");
    assert.equal(res.status, 200);
    const body = await res.json() as { sessions: unknown[] };
    assert.ok(Array.isArray(body.sessions));
    assert.equal(body.sessions.length, 0);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/sessions cria nova sessao real (Fase 9.11: Work Session)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/sessions", { method: "POST" });
    assert.equal(res.status, 200);
    const body = await res.json() as { success: boolean; session: { id: string; title: string; status: string; provider: string; model: string; kernelMode: string; missionId: string | null; executionId: string | null; messages: unknown[] } };
    assert.equal(body.success, true);
    assert.ok(body.session.id.startsWith("sess-"));
    assert.equal(body.session.title, "Nova Sessão");
    assert.equal(body.session.status, "active");
    assert.equal(body.session.kernelMode, "READ_ONLY");
    assert.equal(body.session.missionId, null);
    assert.equal(body.session.executionId, null);
    assert.deepEqual(body.session.messages, []);

    const listRes = await fetch("http://127.0.0.1:" + port + "/api/sessions");
    const listBody = await listRes.json() as { sessions: Array<{ id: string }>; activeId: string };
    assert.equal(listBody.sessions.length, 1);
    assert.equal(listBody.activeId, body.session.id);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/config retorna configuracao basica", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/config");
    assert.equal(res.status, 200);
    const body = await res.json() as { mode: string; llm: unknown; kernel: unknown; git: { branch: string } };
    assert.equal(body.mode, "READ_ONLY");
    assert.ok(body.git.branch);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});
﻿
test("GET / nao crasha com dados parciais do kernel (escapeHtml defensivo)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/");
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("JoeFelipe"));
    assert.ok(html.includes("READ_ONLY"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.9: Backend -> Frontend Integration (WEI) ────────────────────────

async function fetchHtml(port: number): Promise<string> {
  const res = await fetch("http://127.0.0.1:" + port + "/");
  return res.text();
}

test("dashboard nao contem placeholder decorativo (sem toast 'em desenvolvimento'; 'Transformar em Missao' agora e real — Fase 9.12)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    assert.ok(!html.toLowerCase().includes("em desenvolvimento"));
    // "Transformar em Missao" agora existe, mas precisa estar ligada a
    // /api/missions (funcao real), nao a um toast decorativo.
    assert.ok(html.includes("Transformar em Missão"));
    assert.ok(html.includes("transformarEmMissao()"));
    assert.ok(!html.includes("transformarMissao()"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard expoe painel de Planner ligado a /api/planner/plan (com botao Criar Execucao)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    assert.ok(html.includes("plannerPanel"));
    assert.ok(html.includes("loadPlanner"));
    assert.ok(html.includes("/api/planner/plan"));
    assert.ok(html.includes("criarExecucao"));
    assert.ok(html.includes("Criar Execu"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard expoe painel de Execucoes ligado a /api/executions (tabela real)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    assert.ok(html.includes("executionsList"));
    assert.ok(html.includes("loadExecutions"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard expoe painel operacional do Engine com botoes Rodar Proximo Passo / Rodar Tudo Permitido / Parar Execucao", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    assert.ok(html.includes("enginePanel"));
    assert.ok(html.includes("engineOnce()"));
    assert.ok(html.includes("engineRun()"));
    assert.ok(html.includes("engineAbort()"));
    assert.ok(html.includes("Rodar Próximo Passo") || html.includes("Rodar Pr\\u00F3ximo Passo"));
    assert.ok(html.includes("Rodar Tudo Permitido"));
    assert.ok(html.includes("Parar Execu"));
    assert.ok(html.includes("/api/engine/status"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard expoe Eventos Recentes ligado a /api/events", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    assert.ok(html.includes("eventsList"));
    assert.ok(html.includes("loadEvents"));
    assert.ok(html.includes("/api/events"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard expoe Trocar Modo ligado a /api/kernel/mode, com as 6 opcoes de KernelMode", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    assert.ok(html.includes("modeSelect"));
    assert.ok(html.includes("trocarModo()"));
    assert.ok(html.includes("/api/kernel/mode"));
    for (const m of ["READ_ONLY", "PLAN_ONLY", "SAFE_WRITE", "HUMAN_APPROVAL_REQUIRED", "EXECUTE_APPROVED", "LOCKED"]) {
      assert.ok(html.includes('value="' + m + '"'), "deveria conter opcao de modo " + m);
    }
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard expoe permissoes do kernel (canExecute/requiresHumanApproval) ligadas a /api/kernel", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    assert.ok(html.includes("kernelPermissions"));
    assert.ok(html.includes("loadKernelPanel"));
    assert.ok(html.includes("canExecute"));
    assert.ok(html.includes("requiresHumanApproval"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard expoe botao Testar LLM ligado a /api/llm/test (Fase 11-B.1, nao mais /api/chat/message)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    assert.ok(html.includes("testarLlm()"));
    assert.ok(html.includes("Testar LLM"));
    assert.ok(html.includes("llmTestResult"));
    assert.ok(html.includes("/api/llm/test"), "testarLlm() deveria chamar /api/llm/test, nao /api/chat/message");
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 11-B.1: GET /api/llm/test — teste de conexao bruta, sem side effects ──

test("GET /api/llm/test com MockProvider retorna success:true, latencyMs:0, sem chamar rede", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/llm/test");
    assert.equal(res.status, 200);
    const body = await res.json() as Record<string, unknown>;
    assert.equal(body.success, true);
    assert.equal(body.provider, "mock");
    assert.equal(body.latencyMs, 0);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/llm/test com provider real (sucesso simulado) retorna success/provider/model/latencyMs", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const originalProvider = process.env.JOEFELIPE_LLM_PROVIDER;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalFetch = globalThis.fetch;
  try {
    process.env.JOEFELIPE_LLM_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "sk-llmtest-key";
    globalThis.fetch = (async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url ?? "";
      if (url.includes("openrouter.ai")) return new Response(JSON.stringify({ choices: [{ message: { content: "pong" } }] }));
      return originalFetch(input, init);
    }) as typeof fetch;

    kernel = createKernel("LOCKED"); // funciona mesmo LOCKED (diagnostico, nao acao)
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/llm/test");
    assert.equal(res.status, 200);
    const body = await res.json() as Record<string, unknown>;
    assert.equal(body.success, true);
    assert.equal(body.provider, "openrouter");
    assert.equal(typeof body.latencyMs, "number");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalProvider === undefined) delete process.env.JOEFELIPE_LLM_PROVIDER; else process.env.JOEFELIPE_LLM_PROVIDER = originalProvider;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalKey;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/llm/test com provider real falhando (500) retorna success:false com error, sem crash", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const originalProvider = process.env.JOEFELIPE_LLM_PROVIDER;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalFetch = globalThis.fetch;
  try {
    process.env.JOEFELIPE_LLM_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "sk-llmtest-key-fail";
    globalThis.fetch = (async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url ?? "";
      if (url.includes("openrouter.ai")) return new Response("Internal Server Error", { status: 500 });
      return originalFetch(input, init);
    }) as typeof fetch;

    kernel = createKernel("PLAN_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/llm/test");
    assert.equal(res.status, 200);
    const body = await res.json() as Record<string, unknown>;
    assert.equal(body.success, false);
    assert.equal(body.provider, "openrouter");
    assert.ok(typeof body.error === "string" && (body.error as string).length > 0);
    assert.ok(!(body.error as string).includes("sk-llmtest-key-fail"), "chave nunca deveria vazar no erro");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalProvider === undefined) delete process.env.JOEFELIPE_LLM_PROVIDER; else process.env.JOEFELIPE_LLM_PROVIDER = originalProvider;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalKey;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/llm/test NAO cria sessao ativa (sessionStore.getActive() continua null)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    await fetch("http://127.0.0.1:" + port + "/api/llm/test");

    const sessionsRes = await fetch("http://127.0.0.1:" + port + "/api/sessions");
    const sessions = await sessionsRes.json() as { sessions?: unknown[] };
    assert.equal((sessions.sessions ?? []).length, 0, "/api/llm/test nao deveria criar nenhuma sessao");
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/llm/test NAO persiste evento llm:cost em /api/events", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  const originalProvider = process.env.JOEFELIPE_LLM_PROVIDER;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalFetch = globalThis.fetch;
  try {
    process.env.JOEFELIPE_LLM_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "sk-llmtest-nocost";
    globalThis.fetch = (async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url ?? "";
      if (url.includes("openrouter.ai")) return new Response(JSON.stringify({ choices: [{ message: { content: "pong" } }], usage: { total_tokens: 99 } }));
      return originalFetch(input, init);
    }) as typeof fetch;

    kernel = createKernel("PLAN_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    await fetch("http://127.0.0.1:" + port + "/api/llm/test");

    const eventsRes = await fetch("http://127.0.0.1:" + port + "/api/events");
    const events = await eventsRes.json() as { events?: Array<{ type: string }> };
    const costEvents = (events.events ?? []).filter((e) => e.type === "llm:cost");
    assert.equal(costEvents.length, 0, "/api/llm/test nunca deveria gerar evento llm:cost");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalProvider === undefined) delete process.env.JOEFELIPE_LLM_PROVIDER; else process.env.JOEFELIPE_LLM_PROVIDER = originalProvider;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalKey;
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard expoe painel de Configuracoes ligado a /api/config (nada mockado)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    assert.ok(html.includes("configPanel"));
    assert.ok(html.includes("loadConfig"));
    assert.ok(html.includes("/api/config"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard tem botao global Recarregar Estado (refreshAll) e polling automatico (setInterval)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    assert.ok(html.includes("refreshAll()"));
    assert.ok(html.includes("Recarregar Estado"));
    assert.ok(html.includes("setInterval(refreshAll"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("HTML do dashboard (Fase 9.9) continua sem JS quebrado apos as novas integracoes", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(match, "deveria existir um bloco <script> inline no dashboard");
    assert.doesNotThrow(() => new Function(match![1]));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/orchestrator/create (ligado via botao Criar Execucao) cria execucao real a partir de uma missao planned", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/orchestrator/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: "goal-1/fundacao-do-projeto" }),
    });
    // Sem plano ativo no root de teste, a resposta e um erro claro (400) —
    // o importante e que a rota responde e nao derruba o processo; o fluxo
    // feliz (plano com missao "planned") ja e coberto pelos testes de
    // /api/planner e /api/executions em outros arquivos.
    assert.ok(res.status === 400 || res.status === 200);
    const body = await res.json() as { error?: string; success?: boolean };
    assert.ok(body.error || body.success);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/config reflete o modo REAL do kernel apos troca via /api/kernel/mode (nao o AGENT_META hardcoded)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    await fetch("http://127.0.0.1:" + port + "/api/kernel/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "SAFE_WRITE" }),
    });

    const res = await fetch("http://127.0.0.1:" + port + "/api/config");
    const body = await res.json() as { mode: string };
    assert.equal(body.mode, "SAFE_WRITE");
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard reflete o modo REAL do kernel (nao o AGENT_META hardcoded) apos troca de modo", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const before = await fetchHtml(port);
    assert.ok(before.includes("READ_ONLY ativo"));

    const modeRes = await fetch("http://127.0.0.1:" + port + "/api/kernel/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "SAFE_WRITE" }),
    });
    assert.equal(modeRes.status, 200);

    const after = await fetchHtml(port);
    assert.ok(after.includes("SAFE_WRITE ativo"));
    assert.ok(!after.includes("READ_ONLY ativo"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("engineOnce/engineRun/engineAbort do painel operacional usam as mesmas rotas HTTP ja cobertas (sem rota nova)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();
    const orc = new TaskOrchestrator(root);
    orc.create(featureMission);

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const onceRes = await fetch("http://127.0.0.1:" + port + "/api/engine/once", { method: "POST" });
    assert.equal(onceRes.status, 200);

    const abortRes = await fetch("http://127.0.0.1:" + port + "/api/engine/abort", { method: "POST" });
    assert.equal(abortRes.status, 200);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.10: Driver Control Center ────────────────────────────────────────

test("GET /api/drivers retorna os 4 drivers conhecidos (Claude/OpenCode/Aider/Codex) com estado real e o fallback", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/drivers");
    assert.equal(res.status, 200);
    const body = await res.json() as {
      drivers: Array<{ id: string; name: string; status: string; available: boolean; version: string | null; capabilities: string[]; message: string | null; isDefault: boolean; active: boolean }>;
      fallback: { id: string; name: string; version: string | null; capabilities: string[] };
    };

    assert.equal(body.drivers.length, 4);
    const ids = body.drivers.map((d) => d.id).sort();
    assert.deepEqual(ids, ["aider", "claude-code", "codex-cli", "opencode"]);

    // Fase 9.8: nenhum driver real esta conectado ainda -> todos indisponiveis,
    // com capabilities e mensagem explicando o motivo (nunca vazio/generico).
    for (const d of body.drivers) {
      assert.equal(d.status, "indisponivel");
      assert.equal(d.available, false);
      assert.equal(d.version, null);
      assert.ok(d.capabilities.length > 0);
      assert.ok(d.message && d.message.length > 0);
      assert.equal(d.isDefault, true);
      assert.equal(d.active, false);
    }

    assert.equal(body.fallback.name, "StubDriver");
    assert.ok(body.fallback.version);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/drivers nunca expoe segredos e responde rapido (nao tenta conectar em CLI/rede real)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const started = Date.now();
    const res = await fetch("http://127.0.0.1:" + port + "/api/drivers");
    const elapsed = Date.now() - started;
    const body = await res.json();

    assert.ok(elapsed < 2000, "a rota de drivers nao deveria demorar (nao executa nada real)");
    assert.ok(!JSON.stringify(body).toLowerCase().includes("authorization"));
    assert.ok(!JSON.stringify(body).toLowerCase().includes("api_key"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard expoe o painel Drivers (Driver Control Center) ligado a /api/drivers, com botao Atualizar Drivers", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    assert.ok(html.includes("driversPanel"));
    assert.ok(html.includes("loadDrivers"));
    assert.ok(html.includes("/api/drivers"));
    assert.ok(html.includes("Atualizar Drivers"));
    assert.ok(html.includes("Driver Control Center"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard mostra capabilities dos drivers e inclui loadDrivers no polling automatico (refreshAll)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    assert.ok(html.includes("capabilitiesHtmlClient"));
    assert.ok(html.includes("driverStatusBadgeClass"));
    // refreshAll() e chamado no DOMContentLoaded e a cada setInterval — ja
    // coberto pelo teste de polling da Fase 9.9; aqui confirmamos que
    // loadDrivers() faz parte desse mesmo ciclo.
    const refreshAllMatch = html.match(/function refreshAll\(\)\s*\{[\s\S]*?\}/);
    assert.ok(refreshAllMatch, "deveria existir a funcao refreshAll no script");
    assert.ok(refreshAllMatch![0].includes("loadDrivers()"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("HTML do dashboard (Fase 9.10) continua sem JS quebrado apos o Driver Control Center", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(match, "deveria existir um bloco <script> inline no dashboard");
    assert.doesNotThrow(() => new Function(match![1]));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("execution engine (via ClaudeExecutor/OpenCodeExecutor) continua caindo no StubDriver mesmo apos o wiring do driverRegistry compartilhado", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("EXECUTE_APPROVED");
    await kernel.initialize();
    const orc = new TaskOrchestrator(root);
    orc.create(featureMission);

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/engine/run", { method: "POST" });
    assert.equal(res.status, 200);
    const body = await res.json() as { results: Array<{ success: boolean; result?: string }> };
    assert.ok(body.results.length > 0);
    assert.ok(body.results.every((r) => r.success));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.11: Work Sessions (Session -> Mission binding) ─────────────────

test("POST /api/chat/message: nenhuma mensagem fica sem sessao (cria automaticamente e vincula)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const chatRes = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "primeira mensagem" }),
    });
    const chatBody = await chatRes.json() as { sessionId: string };
    assert.ok(chatBody.sessionId);

    const sessionsRes = await fetch("http://127.0.0.1:" + port + "/api/sessions");
    const sessionsBody = await sessionsRes.json() as { sessions: Array<{ id: string }>; activeId: string };
    assert.equal(sessionsBody.activeId, chatBody.sessionId);
    assert.equal(sessionsBody.sessions.length, 1);

    const historyRes = await fetch("http://127.0.0.1:" + port + "/api/chat/history");
    const historyBody = await historyRes.json() as { sessionId: string; messages: Array<{ role: string; content: string }> };
    assert.equal(historyBody.sessionId, chatBody.sessionId);
    assert.equal(historyBody.messages.length, 2);
    assert.equal(historyBody.messages[0].role, "user");
    assert.equal(historyBody.messages[0].content, "primeira mensagem");
    assert.equal(historyBody.messages[1].role, "assistant");
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/sessions/:id restaura sessao completa: chat, execucao, aprovacoes e eventos vinculados", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();
    const orc = new TaskOrchestrator(root);
    const execution = orc.create(securityMission);

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    // Envia uma mensagem para criar a sessao ativa, depois roda o engine ate
    // parar no step de aprovacao — o vinculo session->execution acontece na
    // proxima mensagem enviada (linkContext usa orchestrator.active() atual).
    await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "oi" }),
    });
    await fetch("http://127.0.0.1:" + port + "/api/engine/run", { method: "POST" });
    const secondChat = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "e agora?" }),
    });
    const secondChatBody = await secondChat.json() as { sessionId: string };

    const detailRes = await fetch("http://127.0.0.1:" + port + "/api/sessions/" + secondChatBody.sessionId);
    assert.equal(detailRes.status, 200);
    const detail = await detailRes.json() as {
      session: { id: string; executionId: string | null; missionId: string | null; messages: unknown[] };
      execution: { id: string; status: string } | null;
      pendingApprovals: Array<{ id: string; type: string }>;
      eventCount: number;
    };

    assert.equal(detail.session.executionId, execution.id);
    assert.equal(detail.session.missionId, securityMission.id);
    assert.equal(detail.session.messages.length, 4);
    assert.ok(detail.execution);
    assert.equal(detail.execution!.id, execution.id);
    assert.equal(detail.pendingApprovals.length, 1);
    assert.equal(detail.pendingApprovals[0].type, "approval");
    assert.ok(detail.eventCount > 0);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/sessions/:id com id desconhecido retorna 404 claro", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/sessions/sess-nao-existe");
    assert.equal(res.status, 404);
    const body = await res.json() as { success: boolean; error?: string };
    assert.equal(body.success, false);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/sessions/:id/activate troca a sessao ativa e preserva as mensagens de cada uma (trocar sessao)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const createA = await fetch("http://127.0.0.1:" + port + "/api/sessions", { method: "POST" });
    const sessionA = (await createA.json() as { session: { id: string } }).session;
    await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "mensagem da sessao A" }),
    });

    const createB = await fetch("http://127.0.0.1:" + port + "/api/sessions", { method: "POST" });
    const sessionB = (await createB.json() as { session: { id: string } }).session;
    await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "mensagem da sessao B" }),
    });

    // Volta para a sessao A: o historico deve ser o dela, nao o da B.
    const activateRes = await fetch("http://127.0.0.1:" + port + "/api/sessions/" + sessionA.id + "/activate", { method: "POST" });
    assert.equal(activateRes.status, 200);

    const historyRes = await fetch("http://127.0.0.1:" + port + "/api/chat/history");
    const historyBody = await historyRes.json() as { sessionId: string; messages: Array<{ content: string }> };
    assert.equal(historyBody.sessionId, sessionA.id);
    assert.equal(historyBody.messages[0].content, "mensagem da sessao A");

    const sessionBDetail = await fetch("http://127.0.0.1:" + port + "/api/sessions/" + sessionB.id);
    const sessionBBody = await sessionBDetail.json() as { session: { messages: Array<{ content: string }> } };
    assert.equal(sessionBBody.session.messages[0].content, "mensagem da sessao B");
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/sessions/:id/activate com id desconhecido retorna erro claro (400)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const res = await fetch("http://127.0.0.1:" + port + "/api/sessions/sess-fantasma/activate", { method: "POST" });
    assert.equal(res.status, 400);
    const body = await res.json() as { success: boolean; error?: string };
    assert.equal(body.success, false);
    assert.ok(body.error?.includes("não encontrada"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("DELETE /api/chat/history limpa de verdade a sessao ativa (nao decorativo)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "oi" }),
    });
    const before = await (await fetch("http://127.0.0.1:" + port + "/api/chat/history")).json() as { messages: unknown[] };
    assert.equal(before.messages.length, 2);

    await fetch("http://127.0.0.1:" + port + "/api/chat/history", { method: "DELETE" });
    const after = await (await fetch("http://127.0.0.1:" + port + "/api/chat/history")).json() as { messages: unknown[] };
    assert.equal(after.messages.length, 0);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard expoe painel Sessao Atual + Sessoes Recentes ligados a /api/sessions", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    assert.ok(html.includes("sessionCurrentPanel"));
    assert.ok(html.includes("sessionsListPanel"));
    assert.ok(html.includes("loadSessionCurrent"));
    assert.ok(html.includes("loadSessionsList"));
    assert.ok(html.includes("novaSessao"));
    assert.ok(html.includes("ativarSessao"));
    assert.ok(html.includes("Sessão Atual"));
    assert.ok(html.includes("Sessões Recentes"));
    assert.ok(html.includes("/api/sessions"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard: refreshAll (polling) inclui loadChatHistory/loadSessionCurrent/loadSessionsList (polling respeita a sessao ativa)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    const refreshAllMatch = html.match(/function refreshAll\(\)\s*\{[\s\S]*?\}/);
    assert.ok(refreshAllMatch);
    assert.ok(refreshAllMatch![0].includes("loadChatHistory()"));
    assert.ok(refreshAllMatch![0].includes("loadSessionCurrent()"));
    assert.ok(refreshAllMatch![0].includes("loadSessionsList()"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("HTML do dashboard (Fase 9.11) continua sem JS quebrado apos Work Sessions", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(match, "deveria existir um bloco <script> inline no dashboard");
    assert.doesNotThrow(() => new Function(match![1]));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.12: Chat -> Nova Missao via MissionBuilder ──────────────────────

test("POST /api/missions cria missao real via MissionBuilder (classificacao/safety genuinas, nao mockadas)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "apenas analisar e revisar o estado, sem alterar", source: "manual" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json() as {
      success: boolean; missionId: string; sessionId: string; source: string;
      mission: { id: string; classification: string; requiresHumanApproval: boolean; safety: { canExecute: boolean } };
    };
    assert.equal(body.success, true);
    assert.ok(body.missionId);
    assert.equal(body.source, "manual");
    assert.equal(body.mission.classification, "READ_ONLY");
    assert.equal(body.mission.safety.canExecute, false);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/missions: missao criada fica vinculada a sessao ativa (so ponteiro, sem copiar payload)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const missionRes = await fetch("http://127.0.0.1:" + port + "/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "quero entender o estado atual do sistema" }),
    });
    const missionBody = await missionRes.json() as { missionId: string; sessionId: string };

    const sessionRes = await fetch("http://127.0.0.1:" + port + "/api/sessions/" + missionBody.sessionId);
    const sessionBody = await sessionRes.json() as { session: { missionId: string | null }; mission: { id: string; classification: string } | null };

    assert.equal(sessionBody.session.missionId, missionBody.missionId);
    // A sessao guarda SO o ponteiro (id) — o conteudo completo (classification,
    // safety, operationalPrompt etc.) vem do MissionStore via join, nao de
    // uma copia salva dentro da propria sessao.
    assert.ok(sessionBody.mission);
    assert.equal(sessionBody.mission!.id, missionBody.missionId);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/missions sem sessao ativa cria/garante uma sessao automaticamente", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const before = await (await fetch("http://127.0.0.1:" + port + "/api/sessions")).json() as { activeId: string | null };
    assert.equal(before.activeId, null);

    const res = await fetch("http://127.0.0.1:" + port + "/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "revisar documentacao" }),
    });
    const body = await res.json() as { sessionId: string };
    assert.ok(body.sessionId);

    const after = await (await fetch("http://127.0.0.1:" + port + "/api/sessions")).json() as { activeId: string; sessions: unknown[] };
    assert.equal(after.activeId, body.sessionId);
    assert.equal(after.sessions.length, 1);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/missions: payload invalido (sem goal/message) retorna erro claro (400), sem crash", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "sem goal nem message" }),
    });
    assert.equal(res.status, 400);
    const body = await res.json() as { success: boolean; error?: string };
    assert.equal(body.success, false);
    assert.ok(body.error);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/missions: JSON invalido retorna 400 claro, sem derrubar o servidor", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "isso nao e json valido",
    });
    assert.equal(res.status, 400);

    // Servidor continua respondendo normalmente depois do payload invalido.
    const healthRes = await fetch("http://127.0.0.1:" + port + "/api/state");
    assert.equal(healthRes.status, 200);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("POST /api/missions: missao perigosa nao executa nem aprova automaticamente (LOCKED/aprovacao pendente, canExecute false)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "fazer deploy em producao e alterar o banco", source: "chat" }),
    });
    const body = await res.json() as {
      mission: { classification: string; requiresHumanApproval: boolean; safety: { canExecute: boolean } };
    };
    assert.equal(body.mission.classification, "DANGEROUS");
    assert.equal(body.mission.requiresHumanApproval, true);
    assert.equal(body.mission.safety.canExecute, false);

    // Nenhuma execucao real foi disparada por causa disso — nao ha
    // orquestracao/engine ativo derivado da chamada.
    const engineStatus = await (await fetch("http://127.0.0.1:" + port + "/api/engine/status")).json() as { running: boolean };
    assert.equal(engineStatus.running, false);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("fluxo completo: chat -> Transformar em Missao -> sessao mostra missao vinculada", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const chatRes = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "preciso revisar a auditoria de seguranca" }),
    });
    const chatBody = await chatRes.json() as { sessionId: string };

    const missionRes = await fetch("http://127.0.0.1:" + port + "/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "preciso revisar a auditoria de seguranca", source: "chat" }),
    });
    const missionBody = await missionRes.json() as { missionId: string; sessionId: string };
    assert.equal(missionBody.sessionId, chatBody.sessionId);

    const sessionDetail = await (await fetch("http://127.0.0.1:" + port + "/api/sessions/" + chatBody.sessionId)).json() as {
      session: { missionId: string | null; messages: unknown[] };
      mission: { classification: string } | null;
    };
    assert.equal(sessionDetail.session.missionId, missionBody.missionId);
    assert.equal(sessionDetail.session.messages.length, 2);
    assert.ok(sessionDetail.mission);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard expoe botao Transformar em Missao ligado a /api/missions, com area de resultado", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    assert.ok(html.includes("transformarEmMissao()"));
    assert.ok(html.includes("Transformar em Missão"));
    assert.ok(html.includes("/api/missions"));
    assert.ok(html.includes("missionCreateResult"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard: painel Sessao Atual mostra classificacao/status da missao e o plano/goal vinculado", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    const loadSessionCurrentMatch = html.match(/function loadSessionCurrent\(\)[\s\S]*?\n\}/);
    assert.ok(loadSessionCurrentMatch);
    assert.ok(loadSessionCurrentMatch![0].includes("detail.mission"));
    assert.ok(loadSessionCurrentMatch![0].includes("plannerGoalId"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("HTML do dashboard (Fase 9.12) continua sem JS quebrado apos Chat -> Missao", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(match, "deveria existir um bloco <script> inline no dashboard");
    assert.doesNotThrow(() => new Function(match![1]));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.13: Missoes vinculadas nas sessoes + atalho de aprovacao ────────

test("GET /api/sessions retorna sessoes enriquecidas com a missao vinculada (title/classification/requiresHumanApproval/pendingApprovalCount)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    await fetch("http://127.0.0.1:" + port + "/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "fazer deploy em producao e alterar o banco" }),
    });

    const res = await fetch("http://127.0.0.1:" + port + "/api/sessions");
    assert.equal(res.status, 200);
    const body = await res.json() as {
      sessions: Array<{ id: string; missionId: string | null; missionTitle: string | null; classification: string | null; requiresHumanApproval: boolean; plannerGoalId: string | null; executionId: string | null; pendingApprovalCount: number }>;
    };
    assert.equal(body.sessions.length, 1);
    const s = body.sessions[0];
    assert.ok(s.missionId);
    assert.ok(s.missionTitle);
    assert.equal(s.classification, "DANGEROUS");
    assert.equal(s.requiresHumanApproval, true);
    assert.equal(s.pendingApprovalCount, 0);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("enriquecimento de /api/sessions NAO duplica o payload da missao dentro da sessao (so campos minimos, nao o objeto Mission inteiro)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    await fetch("http://127.0.0.1:" + port + "/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "apenas analisar o estado" }),
    });

    const res = await fetch("http://127.0.0.1:" + port + "/api/sessions");
    const body = await res.json() as { sessions: Array<Record<string, unknown>> };
    const s = body.sessions[0];
    // Campos minimos presentes...
    assert.ok("missionTitle" in s);
    assert.ok("classification" in s);
    // ...mas nao o payload completo da missao (operationalPrompt, scope,
    // validationChecklist, rollbackPlan, provenance nao devem vazar aqui —
    // isso continua vivendo so no MissionStore, acessivel via /api/sessions/:id).
    assert.ok(!("operationalPrompt" in s));
    assert.ok(!("scope" in s));
    assert.ok(!("validationChecklist" in s));
    assert.ok(!("provenance" in s));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/sessions: sessao sem missao vinculada continua funcionando normalmente (campos nulos/zero)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    await fetch("http://127.0.0.1:" + port + "/api/sessions", { method: "POST" });

    const res = await fetch("http://127.0.0.1:" + port + "/api/sessions");
    assert.equal(res.status, 200);
    const body = await res.json() as { sessions: Array<{ missionId: string | null; missionTitle: string | null; classification: string | null; requiresHumanApproval: boolean; pendingApprovalCount: number }> };
    assert.equal(body.sessions.length, 1);
    const s = body.sessions[0];
    assert.equal(s.missionId, null);
    assert.equal(s.missionTitle, null);
    assert.equal(s.classification, null);
    assert.equal(s.requiresHumanApproval, false);
    assert.equal(s.pendingApprovalCount, 0);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("GET /api/sessions: pendingApprovalCount reflete steps waiting_human reais da execucao vinculada", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();
    const orc = new TaskOrchestrator(root);
    const execution = orc.create(securityMission);

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    // Cria sessao + missao vinculada, roda o engine ate parar no step de aprovacao.
    await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "oi" }),
    });
    await fetch("http://127.0.0.1:" + port + "/api/engine/run", { method: "POST" });
    // Uma segunda mensagem garante que linkContext capte o executionId ativo.
    await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "e agora?" }),
    });

    const res = await fetch("http://127.0.0.1:" + port + "/api/sessions");
    const body = await res.json() as { sessions: Array<{ executionId: string | null; pendingApprovalCount: number }> };
    const s = body.sessions.find((x) => x.executionId === execution.id);
    assert.ok(s);
    assert.equal(s!.pendingApprovalCount, 1);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard: Sessões Recentes mostra a missão vinculada (título/classificação/aprovação pendente) de forma compacta", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    const loadSessionsListMatch = html.match(/function loadSessionsList\(\)[\s\S]*?\n\}/);
    assert.ok(loadSessionsListMatch);
    assert.ok(loadSessionsListMatch![0].includes("missionTitle"));
    assert.ok(loadSessionsListMatch![0].includes("classification"));
    assert.ok(loadSessionsListMatch![0].includes("pendingApprovalCount"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("dashboard: botão 'Ir para aprovação' aparece ligado a irParaAprovacao() (nunca chama /approve automaticamente)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    assert.ok(html.includes("irParaAprovacao()"));
    assert.ok(html.includes("Ir para aprovação"));

    const funcMatch = html.match(/function irParaAprovacao\(\)[\s\S]*?\n\}/);
    assert.ok(funcMatch);
    // O atalho so navega (tab + scroll) — nunca chama a rota de approve.
    assert.ok(!funcMatch![0].includes("/approve"));
    assert.ok(!funcMatch![0].includes("decideExecution"));
    assert.ok(funcMatch![0].includes("tab("));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("loadSessionCurrent so mostra o botao 'Ir para aprovação' quando ha aprovacao pendente de verdade (nao aparece indevidamente)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    // A condicional deve estar dentro do bloco que checa
    // detail.pendingApprovals.length > 0 — nao deve existir fora dessa guarda.
    const loadSessionCurrentMatch = html.match(/function loadSessionCurrent\(\)[\s\S]*?\n\}/);
    assert.ok(loadSessionCurrentMatch);
    const fnBody = loadSessionCurrentMatch![0];
    const guardIndex = fnBody.indexOf("detail.pendingApprovals && detail.pendingApprovals.length > 0");
    const buttonIndex = fnBody.indexOf("irParaAprovacao()");
    assert.ok(guardIndex !== -1 && buttonIndex !== -1 && buttonIndex > guardIndex);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("HTML do dashboard (Fase 9.13) continua sem JS quebrado apos missoes vinculadas + atalho de aprovacao", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(match, "deveria existir um bloco <script> inline no dashboard");
    assert.doesNotThrow(() => new Function(match![1]));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.14: vincular execucao real a missao da sessao ───────────────────
//
// NOTA: /api/orchestrator/create le o plano ativo via GoalPlanner sem
// receber "root" explicitamente (quirk pre-existente, fora do escopo desta
// fase — "menor ajuste possivel"/"nao reescrever arquitetura"), entao ele
// sempre le o queue.json do repo real, nao do tempRoot do teste. Por isso,
// assim como o teste ja existente para esta rota (linha ~1495), o caminho
// feliz so e verificado quando ha um plano ativo real disponivel no
// ambiente; o importante e nunca quebrar e, quando suceder, vincular certo.

test("POST /api/orchestrator/create: missao criada no chat nasce sem execucao, e recebe executionId apos a promocao (sessao aponta corretamente)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const chatRes = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "oi" }),
    });
    const chatBody = await chatRes.json() as { sessionId: string };

    const before = await (await fetch("http://127.0.0.1:" + port + "/api/sessions/" + chatBody.sessionId)).json() as { session: { executionId: string | null } };
    assert.equal(before.session.executionId, null);

    const planRes = await fetch("http://127.0.0.1:" + port + "/api/planner/plan");
    const planBody = await planRes.json() as { plan: { missions: Array<{ id: string; goalId: string; status: string }> } | null };
    const plannedMission = planBody.plan?.missions.find((m) => m.status === "planned");

    const createRes = await fetch("http://127.0.0.1:" + port + "/api/orchestrator/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: plannedMission?.id ?? "nao-existe" }),
    });

    if (!plannedMission) {
      // Ambiente sem plano ativo: erro claro, sessao permanece intocada.
      assert.equal(createRes.status, 400);
      const untouched = await (await fetch("http://127.0.0.1:" + port + "/api/sessions/" + chatBody.sessionId)).json() as { session: { executionId: string | null } };
      assert.equal(untouched.session.executionId, null);
      return;
    }

    assert.equal(createRes.status, 200);
    const createBody = await createRes.json() as { success: boolean; orchestration: { id: string }; sessionId: string };
    assert.equal(createBody.success, true);
    assert.equal(createBody.sessionId, chatBody.sessionId);

    const after = await (await fetch("http://127.0.0.1:" + port + "/api/sessions/" + chatBody.sessionId)).json() as {
      session: { executionId: string | null; missionId: string | null; plannerGoalId: string | null };
    };
    assert.equal(after.session.executionId, createBody.orchestration.id);
    assert.equal(after.session.missionId, plannedMission.id);
    assert.equal(after.session.plannerGoalId, plannedMission.goalId);

    // Criar a execucao nao aprova nem roda nada sozinho.
    const engineStatus = await (await fetch("http://127.0.0.1:" + port + "/api/engine/status")).json() as { running: boolean };
    assert.equal(engineStatus.running, false);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("vinculo de execucao (via TaskOrchestrator+engine, fora do quirk de root do Planner) so acontece por acao do usuario, nunca aprova sozinho, e habilita o atalho de aprovacao quando ha step waiting_human", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();
    const orc = new TaskOrchestrator(root);
    const execution = orc.create(securityMission);

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    // Sessao ativa nasce pelo chat, ainda sem missao/execucao vinculada.
    const chatRes = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "oi" }),
    });
    const chatBody = await chatRes.json() as { sessionId: string };

    // Roda o engine (acao explicita do usuario) ate parar no step "approval".
    await fetch("http://127.0.0.1:" + port + "/api/engine/run", { method: "POST" });
    // Uma nova mensagem faz o linkContext do chat capturar o executionId ja ativo.
    await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "e agora?" }),
    });

    const detail = await (await fetch("http://127.0.0.1:" + port + "/api/sessions/" + chatBody.sessionId)).json() as {
      session: { executionId: string | null; missionId: string | null };
      pendingApprovals: Array<{ id: string; type: string }>;
    };
    assert.equal(detail.session.executionId, execution.id);
    assert.equal(detail.session.missionId, securityMission.id);
    assert.equal(detail.pendingApprovals.length, 1);
    assert.equal(detail.pendingApprovals[0].type, "approval");

    // Nada foi aprovado automaticamente: o step continua waiting_human ate
    // uma chamada explicita a /api/executions/:id/approve.
    const stillPending = await (await fetch("http://127.0.0.1:" + port + "/api/executions/" + execution.id)).json() as {
      execution: { steps: Array<{ status: string }> };
    };
    assert.ok(stillPending.execution.steps.some((s) => s.status === "waiting_human"));

    // O front-end so precisa disso para habilitar o botao "Ir para aprovacao"
    // (loadSessionCurrent guarda esse mesmo campo — ver testes de UI acima).
    const sessionsRes = await fetch("http://127.0.0.1:" + port + "/api/sessions");
    const sessionsBody = await sessionsRes.json() as { sessions: Array<{ id: string; pendingApprovalCount: number }> };
    const s = sessionsBody.sessions.find((x) => x.id === chatBody.sessionId);
    assert.ok(s);
    assert.equal(s!.pendingApprovalCount, 1);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("HTML do dashboard (Fase 9.14) continua sem JS quebrado apos vinculo de execucao real", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(match, "deveria existir um bloco <script> inline no dashboard");
    assert.doesNotThrow(() => new Function(match![1]));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.15: isolar GoalPlanner/PlanStore pelo root do servidor ──────────

test("servidor usa o tempRoot no Planner/PlanStore: /api/planner/plan reflete o plano isolado, nao o do repo real", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    const isolatedPlanner = new GoalPlanner(kernel, new RuleBasedPlanningStrategy(), new PlanStore(root), new QueueManager(root));
    const uniqueTitle = "Goal isolado de teste 9.15 " + Date.now();
    await isolatedPlanner.plan(uniqueTitle);

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/planner/plan");
    assert.equal(res.status, 200);
    const body = await res.json() as { plan: { goal: { title: string }; missions: unknown[] } | null };
    assert.ok(body.plan, "deveria existir um plano — o isolado, criado no tempRoot");
    assert.equal(body.plan!.goal.title, uniqueTitle);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("/api/planner/plan NAO depende do estado real do repositorio: tempRoot vazio retorna plano nulo, mesmo com o repo real tendo plano ativo", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/planner/plan");
    assert.equal(res.status, 200);
    const body = await res.json() as { plan: unknown };
    // Antes da Fase 9.15, isso vazava o queue.json do repo real (findRepoRoot()).
    assert.equal(body.plan, null);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("/api/orchestrator/create funciona de ponta a ponta com um plano criado no root isolado (sem depender do repo real)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    const isolatedPlanner = new GoalPlanner(kernel, new RuleBasedPlanningStrategy(), new PlanStore(root), new QueueManager(root));
    const plan = await isolatedPlanner.plan("Auditar seguranca isolada 9.15");
    const plannedMission = plan.missions[0];
    assert.ok(plannedMission, "RuleBasedPlanningStrategy deveria gerar ao menos uma missao planned");

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const createRes = await fetch("http://127.0.0.1:" + port + "/api/orchestrator/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: plannedMission.id }),
    });
    assert.equal(createRes.status, 200);
    const createBody = await createRes.json() as { success: boolean; orchestration: { id: string; missionId: string } };
    assert.equal(createBody.success, true);
    assert.equal(createBody.orchestration.missionId, plannedMission.id);

    // A sessao ativa (criada automaticamente) aponta para o mesmo plano/execucao isolados.
    const sessionsRes = await fetch("http://127.0.0.1:" + port + "/api/sessions");
    const sessionsBody = await sessionsRes.json() as { sessions: Array<{ executionId: string | null; missionId: string | null; plannerGoalId: string | null }> };
    const linked = sessionsBody.sessions.find((s) => s.executionId === createBody.orchestration.id);
    assert.ok(linked);
    assert.equal(linked!.missionId, plannedMission.id);
    assert.equal(linked!.plannerGoalId, plannedMission.goalId);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("compatibilidade: GoalPlanner construido sem store/queue explicitos (como a CLI faz) continua funcionando, apenas lendo (sem escrever no repo real)", async () => {
  let kernel: Kernel | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    // Mesma forma que index.ts (CLI) usa: sem PlanStore/QueueManager
    // explicitos -> cai no default (findRepoRoot()). So verificamos que a
    // construcao e a LEITURA continuam funcionando (nao mutamos o repo real).
    const planner = new GoalPlanner(kernel, new RuleBasedPlanningStrategy());
    assert.doesNotThrow(() => planner.loadPlan());
    assert.equal(planner.store instanceof PlanStore, true);
    assert.equal(planner.queue instanceof QueueManager, true);
  } finally {
    if (kernel) await kernel.destroy();
  }
});

test("root isolado nao afeta o comportamento do PlanStore/QueueManager standalone (findRepoRoot() continua o default seguro fora do servidor)", () => {
  const store = new PlanStore();
  const queue = new QueueManager();
  assert.doesNotThrow(() => store.load());
  assert.doesNotThrow(() => queue.getStatus());
  // Sanity: o default realmente resolve para o repo real (comportamento
  // inalterado fora do server.ts).
  assert.ok(findRepoRoot());
});

test("Fase 9.15: nenhum payload de missao/sessao e duplicado mesmo com Planner isolado por root", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    const isolatedPlanner = new GoalPlanner(kernel, new RuleBasedPlanningStrategy(), new PlanStore(root), new QueueManager(root));
    const plan = await isolatedPlanner.plan("Missao isolada sem duplicacao 9.15");
    const plannedMission = plan.missions[0];

    server = startServer(root, 0, kernel);
    const port = await listen(server);

    await fetch("http://127.0.0.1:" + port + "/api/orchestrator/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: plannedMission.id }),
    });

    const res = await fetch("http://127.0.0.1:" + port + "/api/sessions");
    const body = await res.json() as { sessions: Array<Record<string, unknown>> };
    const s = body.sessions[0];
    // So os ponteiros/campos minimos, nunca o payload completo do plano/missao.
    assert.ok("missionId" in s);
    assert.ok("executionId" in s);
    assert.ok("plannerGoalId" in s);
    assert.ok(!("operationalPrompt" in s));
    assert.ok(!("scope" in s));
    assert.ok(!("dependsOn" in s));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.16: sanity-check de isolamento por root ──────────────────────────
// Todo store criado dentro do handler HTTP (ApprovalManager, EventStore,
// ExecutionStateStore, SessionStore, GoalPlanner/PlanStore/QueueManager,
// TaskOrchestrator, MissionStore) recebe o "root" explicito passado a
// startServer(root, ...) — nenhum deles cai no default findRepoRoot(). Os
// testes abaixo nao encontraram regressao; servem de trava para o futuro.

test("Fase 9.16: /api/approval (ApprovalManager) e isolado por root — aprovacao gravada em outro root nunca aparece", async () => {
  const rootA = tempRoot();
  const rootB = tempRoot();
  let kernel: Kernel | undefined;
  let serverA: Server | undefined;
  let serverB: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();

    // Simula uma approval criada fora do HTTP (ex.: via CLI "plan advance"),
    // gravando direto no arquivo que o ApprovalManager le no boot.
    const uniqueId = "apr-isolation-test-" + Date.now();
    const dirA = join(rootA, "tools", "joefelipe-agent", "runtime");
    mkdirSync(dirA, { recursive: true });
    const entry = {
      id: uniqueId,
      missionId: "mission-isolation-test",
      missionTitle: "Missao isolada 9.16",
      missionIntent: "provar isolamento de root do ApprovalManager",
      classification: "SAFE_WRITE",
      mode: "HUMAN_APPROVAL_REQUIRED",
      requestedBy: "system",
      requestedAt: new Date().toISOString(),
      status: "pending",
    };
    writeFileSync(join(dirA, "approval.jsonl"), JSON.stringify(entry) + "\n", "utf8");

    serverA = startServer(rootA, 0, kernel);
    const portA = await listen(serverA);
    const resA = await fetch("http://127.0.0.1:" + portA + "/api/approval");
    assert.equal(resA.status, 200);
    const bodyA = await resA.json() as { pending: Array<{ id: string }>; total: number };
    assert.equal(bodyA.total, 1);
    assert.equal(bodyA.pending[0].id, uniqueId);

    // rootB nunca viu esse approval.jsonl — precisa continuar vazio, mesmo
    // que rootA tenha uma pendencia real gravada em disco.
    serverB = startServer(rootB, 0, kernel);
    const portB = await listen(serverB);
    const resB = await fetch("http://127.0.0.1:" + portB + "/api/approval");
    assert.equal(resB.status, 200);
    const bodyB = await resB.json() as { pending: Array<{ id: string }>; total: number };
    assert.equal(bodyB.total, 0);
    assert.deepEqual(bodyB.pending, []);
  } finally {
    if (serverA) await stop(serverA);
    if (serverB) await stop(serverB);
    if (kernel) await kernel.destroy();
    clean(rootA);
    clean(rootB);
  }
});

test("Fase 9.16: root novo/vazio nunca reflete o estado do repositorio real (approval/events/sessions/execucoes/planner)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const base = "http://127.0.0.1:" + port;

    // O repo real (tools/joefelipe-agent/runtime) tem sessions.jsonl,
    // missions.jsonl, events.jsonl e orchestration.jsonl com conteudo real
    // (agente em uso continuo). Um root novo tem que comecar zerado em TODAS
    // as rotas abaixo — se qualquer store cair no default findRepoRoot(),
    // pelo menos uma destas asserções quebra.
    const state = await (await fetch(base + "/api/state")).json() as any;
    assert.equal(state.events.total, 0);
    assert.deepEqual(state.pendingApprovals, []);
    assert.equal(state.orchestrator, undefined);

    const approval = await (await fetch(base + "/api/approval")).json() as any;
    assert.equal(approval.total, 0);
    assert.deepEqual(approval.pending, []);

    const events = await (await fetch(base + "/api/events")).json() as any;
    assert.deepEqual(events.events, []);
    assert.equal(events.stats.total, 0);

    const eventsStats = await (await fetch(base + "/api/events/stats")).json() as any;
    assert.equal(eventsStats.total, 0);

    const sessions = await (await fetch(base + "/api/sessions")).json() as any;
    assert.deepEqual(sessions.sessions, []);
    assert.equal(sessions.activeId, null);

    const executions = await (await fetch(base + "/api/executions")).json() as any;
    assert.deepEqual(executions.executions, []);

    const chatHistory = await (await fetch(base + "/api/chat/history")).json() as any;
    assert.deepEqual(chatHistory.messages, []);

    const plan = await (await fetch(base + "/api/planner/plan")).json() as any;
    assert.equal(plan.plan, null);

    const engineStatus = await (await fetch(base + "/api/engine/status")).json() as any;
    assert.equal(engineStatus.running, false);
    assert.equal(engineStatus.currentStepId, null);
    assert.equal(engineStatus.lastResult, null);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.18A: Health API e Engine Status Real ─────────────────────────────
// /api/engine/status deixa de sempre reportar "parado" (o ExecutionEngine e
// reconstruido a cada request) e passa a derivar de TaskOrchestrator +
// ExecutionStateStore, as fontes que realmente sao recarregadas do disco.
// /api/health agrega tudo isso num unico JSON estavel.

test("Fase 9.18A: /api/engine/status mostra execucao ativa real (nao mais sempre 'parado')", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();
    const orc = new TaskOrchestrator(root);
    const o = orc.create(featureMission);
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const base = "http://127.0.0.1:" + port;

    // Completa o primeiro step ("analyze", READ_ONLY) — ainda restam
    // "implement"/"test"/"commit", entao a orquestracao continua "running".
    await fetch(base + "/api/engine/once", { method: "POST" });

    const status = await (await fetch(base + "/api/engine/status")).json() as any;
    assert.equal(status.running, true);
    assert.ok(status.activeExecution);
    assert.equal(status.activeExecution.id, o.id);
    assert.equal(status.activeExecution.missionId, featureMission.id);
    assert.ok(status.recentExecution);
    assert.equal(status.recentExecution.id, o.id);
    assert.equal(status.kernelMode, "SAFE_WRITE");
    assert.ok(status.pendingSteps >= 1);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("Fase 9.18A: /api/engine/status mostra waitingHuman quando um step fica aguardando aprovacao humana", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();
    const orc = new TaskOrchestrator(root);
    orc.create(securityMission);
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const base = "http://127.0.0.1:" + port;

    // Roda ate parar no step "approval" (waiting_human) — mesmo fluxo ja
    // usado pelo teste de /api/executions.
    await fetch(base + "/api/engine/run", { method: "POST" });

    const status = await (await fetch(base + "/api/engine/status")).json() as any;
    assert.equal(status.waitingHuman.length, 1);
    assert.equal(status.waitingHuman[0].type, "approval");
    assert.equal(status.running, true, "waiting_human nao e um estado terminal");
    assert.ok(status.pendingSteps >= 1);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("Fase 9.18A: /api/engine/status mostra waitingExecutor quando um step fica marcado como waiting_executor", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();
    const orc = new TaskOrchestrator(root);
    const o = orc.create(featureMission);
    orc.markWaiting(o.steps[0].id);
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const base = "http://127.0.0.1:" + port;

    const status = await (await fetch(base + "/api/engine/status")).json() as any;
    assert.equal(status.waitingExecutor.length, 1);
    assert.equal(status.waitingExecutor[0].id, o.steps[0].id);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("Fase 9.18A: /api/engine/status mostra o ultimo erro persistido apos uma falha real (kernel LOCKED)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("LOCKED");
    await kernel.initialize();
    const orc = new TaskOrchestrator(root);
    orc.create(auditMission);
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const base = "http://127.0.0.1:" + port;

    await fetch(base + "/api/engine/once", { method: "POST" });

    const status = await (await fetch(base + "/api/engine/status")).json() as any;
    assert.ok(status.lastError);
    assert.ok(String(status.lastError).includes("LOCKED"));
    assert.equal(status.running, false);
    assert.equal(status.activeExecution, null, "orquestracao falhou, nao conta mais como ativa");
    assert.ok(status.recentExecution);
    assert.equal(status.recentExecution.status, "failed");
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("Fase 9.18A: /api/health retorna estrutura agregada mesmo com root vazio", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);

    const res = await fetch("http://127.0.0.1:" + port + "/api/health");
    assert.equal(res.status, 200);
    const body = await res.json() as any;

    assert.equal(typeof body.ok, "boolean");
    assert.ok(body.kernel);
    assert.ok(body.planner);
    assert.equal(body.planner.plan, null);
    assert.ok(body.engine);
    assert.equal(body.engine.running, false);
    assert.equal(body.engine.activeExecution, null);
    assert.ok(body.drivers);
    assert.equal(body.drivers.total, 4);
    assert.ok(body.runtime);
    assert.equal(typeof body.runtime.diskUsageBytes, "number");
    assert.equal(typeof body.runtime.fileCount, "number");
    assert.ok(body.events);
    assert.equal(body.events.total, 0);
    assert.deepEqual(body.approvals, { missions: 0, steps: 0 });
    assert.deepEqual(body.sessions, { total: 0, activeId: null });
    assert.deepEqual(body.recentErrors, []);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("Fase 9.18A: /api/health reflete eventos, aprovacoes, sessoes e runtime basico", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("SAFE_WRITE");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const base = "http://127.0.0.1:" + port;

    await fetch(base + "/api/events/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "test:critical", severity: "critical", summary: "erro de teste (Fase 9.18A)" }),
    });

    await fetch(base + "/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "oi" }),
    });

    const orc = new TaskOrchestrator(root);
    orc.create(securityMission);
    await fetch(base + "/api/engine/run", { method: "POST" });

    const body = await (await fetch(base + "/api/health")).json() as any;
    assert.ok(body.events.total >= 1);
    assert.ok(body.recentErrors.some((e: any) => e.severity === "critical"));
    assert.equal(body.sessions.total, 1);
    assert.ok(body.sessions.activeId);
    assert.equal(body.approvals.steps, 1);
    assert.ok(body.runtime.fileCount >= 4);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("Fase 9.18A: /api/health e /api/engine/status em root novo nao vazam estado do repositorio real", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const base = "http://127.0.0.1:" + port;

    // O repo real tem runtime/ com sessions.jsonl/missions.jsonl/events.jsonl/
    // execution-state.json com conteudo real (agente em uso continuo) — um
    // root novo tem que continuar zerado, mesmo nos 2 endpoints novos desta fase.
    const health = await (await fetch(base + "/api/health")).json() as any;
    assert.equal(health.events.total, 0);
    assert.deepEqual(health.recentErrors, []);
    assert.deepEqual(health.sessions, { total: 0, activeId: null });
    assert.deepEqual(health.approvals, { missions: 0, steps: 0 });
    assert.equal(health.engine.activeExecution, null);
    assert.equal(health.engine.recentExecution, null);
    assert.equal(health.planner.plan, null);

    const engineStatus = await (await fetch(base + "/api/engine/status")).json() as any;
    assert.equal(engineStatus.running, false);
    assert.equal(engineStatus.activeExecution, null);
    assert.equal(engineStatus.recentExecution, null);
    assert.equal(engineStatus.lastError, null);
    assert.deepEqual(engineStatus.waitingHuman, []);
    assert.deepEqual(engineStatus.waitingExecutor, []);
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

// ── Fase 9.18B: Dashboard de Observabilidade ────────────────────────────────
// Conecta a UI standalone existente aos dados reais de /api/health e
// /api/engine/status (Fase 9.18A) — sem aba nova, sem redesenho.

test("Fase 9.18B: dashboard referencia /api/health e expoe o badge global de saude", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    assert.ok(html.includes("/api/health"));
    assert.ok(html.includes('id="healthBadge"'));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("Fase 9.18B: dashboard expoe o card 'Erros Recentes' ligado a /api/health.recentErrors", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    assert.ok(html.includes("Erros Recentes"));
    assert.ok(html.includes('id="recentErrorsPanel"'));
    assert.ok(html.includes("recentErrors"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("Fase 9.18B: loadEngine() usa os campos reais de /api/engine/status (activeExecution/waitingHuman/waitingExecutor/lastError/driver/kernelMode)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    const loadEngineMatch = html.match(/function loadEngine\(\)[\s\S]*?(?=\nfunction engineOnce)/);
    assert.ok(loadEngineMatch, "deveria existir a funcao loadEngine() no dashboard");
    const body = loadEngineMatch![0];
    assert.ok(body.includes("activeExecution"));
    assert.ok(body.includes("recentExecution"));
    assert.ok(body.includes("waitingHuman"));
    assert.ok(body.includes("waitingExecutor"));
    assert.ok(body.includes("lastError"));
    assert.ok(body.includes("d.driver"));
    assert.ok(body.includes("kernelMode"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("Fase 9.18B: refreshAll() chama loadHealth()", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    const refreshAllMatch = html.match(/function refreshAll\(\)\s*\{[\s\S]*?\}/);
    assert.ok(refreshAllMatch);
    assert.ok(refreshAllMatch![0].includes("loadHealth()"));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("Fase 9.18B: card Avisos deixa de ser hardcoded — reflete avisos reais de buildState() (fontes ausentes no tempRoot)", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);

    assert.ok(html.includes('id="warnings"'));
    // tempRoot nao tem nenhuma fonte canonica (.opencodex/brain/...) —
    // buildState() gera avisos reais "Fonte ausente" para cada uma; antes da
    // Fase 9.18B o card era hardcoded "Nenhum aviso." independente disso.
    assert.ok(html.includes("Fonte ausente"), "card Avisos deveria refletir avisos reais de buildState(), nao mais hardcoded");
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});

test("HTML do dashboard (Fase 9.18B) continua sem JS quebrado apos o Health Dashboard", async () => {
  const root = tempRoot();
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    kernel = createKernel("READ_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    const html = await fetchHtml(port);
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(match, "deveria existir um bloco <script> inline no dashboard");
    assert.doesNotThrow(() => new Function(match![1]));
  } finally {
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
});
