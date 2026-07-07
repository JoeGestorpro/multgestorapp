// Fase 11-B.1 — E2E Foundation.
//
// Estes testes exercitam o pipeline completo (servidor HTTP real, fetch()
// global mockado para simular a API do OpenRouter) em vez de unidades
// isoladas — o objetivo e provar que chat, fallback, budget e planejamento
// se comportam corretamente com uma resposta REALISTA de LLM (texto solto,
// markdown, JSON imperfeito), nao so com fixtures artificiais.
//
// Nota sobre o "Teste 5" da missao original (planner com resposta realista
// da LLM via HTTP): nao existe nenhuma rota HTTP neste servidor que dispare
// GoalPlanner.plan() (a unica rota de planner, GET /api/planner/plan, so
// LE o estado ja persistido — nunca invoca a LLM). Criar uma rota nova so
// para este teste seria adicionar uma superficie exposta que gera custo real
// de LLM sem que a missao tenha pedido isso explicitamente (ver checklist de
// protecao de rotas do CLAUDE.md). Em vez disso, o Teste 5 abaixo exercita
// GoalPlanner + LLMPlanningStrategy + LlmEngine diretamente — mesmas classes
// reais, mesmo fetch mockado, sem atalho — so sem o salto HTTP que nao existe
// hoje.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Server } from "node:http";
import { startServer } from "./server.ts";
import { createKernel } from "./kernel/Kernel.ts";
import type { Kernel } from "./kernel/Kernel.ts";
import { LlmEngine } from "./llm/index.ts";
import { GoalPlanner, LLMPlanningStrategy, PlanStore, QueueManager } from "./planner/index.ts";
import type { Goal } from "./planner/index.ts";

// Referencia estavel ao fetch real, capturada antes de qualquer teste trocar
// globalThis.fetch — usada como fallback pelos mocks (nunca reconstruir um
// "original" a partir de globalThis.fetch DEPOIS de um mock ja instalado,
// isso captura o proprio mock e causa recursao infinita).
const unmockedFetch = globalThis.fetch;

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "joefelipe-e2e-"));
}

function clean(root: string): void {
  try { rmSync(root, { recursive: true, force: true }); } catch { /* best-effort */ }
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

const LLM_ENV_KEYS = [
  "JOEFELIPE_LLM_PROVIDER",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
  "JOEFELIPE_LLM_MAX_TOKENS_PER_SESSION",
] as const;

/** Roda `fn` com um servidor real (root isolado, kernel real) e um
 * globalThis.fetch mockado — tudo restaurado no finally, mesmo padrao ja
 * usado em server.test.ts para os testes de OpenRouter. */
async function withE2EServer(
  opts: {
    env?: Partial<Record<(typeof LLM_ENV_KEYS)[number], string>>;
    fetchImpl?: typeof fetch;
    kernelMode?: Parameters<typeof createKernel>[0];
  },
  fn: (port: number, kernel: Kernel, root: string) => Promise<void>,
): Promise<void> {
  const root = tempRoot();
  const original: Record<string, string | undefined> = {};
  for (const key of LLM_ENV_KEYS) original[key] = process.env[key];
  const originalFetch = globalThis.fetch;
  let kernel: Kernel | undefined;
  let server: Server | undefined;
  try {
    for (const key of LLM_ENV_KEYS) delete process.env[key];
    for (const [key, value] of Object.entries(opts.env ?? {})) process.env[key] = value;
    if (opts.fetchImpl) globalThis.fetch = opts.fetchImpl;

    kernel = createKernel(opts.kernelMode ?? "PLAN_ONLY");
    await kernel.initialize();
    server = startServer(root, 0, kernel);
    const port = await listen(server);
    await fn(port, kernel, root);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of LLM_ENV_KEYS) {
      if (original[key] === undefined) delete process.env[key]; else process.env[key] = original[key];
    }
    if (server) await stop(server);
    if (kernel) await kernel.destroy();
    clean(root);
  }
}

function fakeOpenRouterFetch(handler: (body: any) => { status: number; content?: string; raw?: string }): typeof fetch {
  return (async (input: any, init?: any) => {
    const url = typeof input === "string" ? input : input?.url ?? "";
    if (!url.includes("openrouter.ai")) return unmockedFetch(input, init);
    const body = JSON.parse((init?.body as string) ?? "{}");
    const { status, content, raw } = handler(body);
    if (raw !== undefined) return new Response(raw, { status });
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status });
  }) as typeof fetch;
}

test("E2E: chat com provider OpenRouter simulado retorna resposta realista", async () => {
  await withE2EServer(
    {
      env: { JOEFELIPE_LLM_PROVIDER: "openrouter", OPENROUTER_API_KEY: "sk-e2e-chat-key", OPENROUTER_MODEL: "e2e-model" },
      fetchImpl: fakeOpenRouterFetch((body) => ({
        status: 200,
        content: "Resposta simulada do OpenRouter para: " + (body.messages?.[1]?.content ?? ""),
      })),
    },
    async (port) => {
      const res = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "teste e2e" }),
      });
      assert.equal(res.status, 200);
      const data = await res.json() as { response: string; provider: string; model: string };
      assert.ok(data.response.includes("Resposta simulada"));
      assert.ok(data.response.includes("teste e2e"));
      assert.equal(data.provider, "openrouter");
      assert.equal(data.model, "e2e-model");
    },
  );
});

test("E2E: chat seguido de criacao de missao (chat -> missao)", async () => {
  await withE2EServer(
    {
      env: { JOEFELIPE_LLM_PROVIDER: "openrouter", OPENROUTER_API_KEY: "sk-e2e-mission-key" },
      fetchImpl: fakeOpenRouterFetch(() => ({ status: 200, content: "Posso ajudar com o login. Vou levantar os requisitos primeiro." })),
    },
    async (port) => {
      const chatRes = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Implementar login" }),
      });
      assert.equal(chatRes.status, 200);
      const chatData = await chatRes.json() as { sessionId: string };
      assert.ok(chatData.sessionId);

      const missionRes = await fetch("http://127.0.0.1:" + port + "/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Implementar login", source: "chat" }),
      });
      assert.equal(missionRes.status, 200);
      const missionData = await missionRes.json() as { success: boolean; missionId: string; sessionId: string; mission: { title: string; classification: string; requiresHumanApproval: boolean } };
      assert.equal(missionData.success, true);
      assert.ok(missionData.missionId);
      assert.ok(missionData.mission.title.length > 0);
      assert.ok(["READ_ONLY", "PLAN_ONLY", "SAFE_WRITE", "HUMAN_GATED", "DANGEROUS"].includes(missionData.mission.classification));

      // A missao criada fica vinculada a MESMA sessao da conversa (nao cria
      // uma sessao nova solta) — prova que o pipeline chat->missao e coeso.
      assert.equal(missionData.sessionId, chatData.sessionId);
    },
  );
});

test("E2E: provider offline (503) retorna fallback mock via HTTP, sistema nao quebra", async () => {
  await withE2EServer(
    {
      env: { JOEFELIPE_LLM_PROVIDER: "openrouter", OPENROUTER_API_KEY: "sk-e2e-offline-key" },
      fetchImpl: fakeOpenRouterFetch(() => ({ status: 503, raw: "Service Unavailable" })),
    },
    async (port) => {
      const res = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "teste offline" }),
      });
      assert.equal(res.status, 200, "endpoint nunca deveria retornar 5xx para o cliente, mesmo com o provider real fora do ar");
      const data = await res.json() as { response: string; provider: string };
      assert.equal(data.provider, "mock");
      assert.ok(data.response.toLowerCase().includes("fallback"));
    },
  );
});

test("E2E: budget zerado bloqueia a chamada com safety message, sem tentar a rede", async () => {
  let fetchCalls = 0;
  await withE2EServer(
    {
      env: {
        JOEFELIPE_LLM_PROVIDER: "openrouter",
        OPENROUTER_API_KEY: "sk-e2e-budget-key",
        JOEFELIPE_LLM_MAX_TOKENS_PER_SESSION: "0",
      },
      // So conta chamadas para a API do OpenRouter — globalThis.fetch e
      // process-wide, e a propria chamada HTTP deste teste para o servidor
      // local (linha abaixo) tambem passa por aqui; sem o filtro de URL,
      // contariamos a nossa propria requisicao de teste, nao a rede real.
      fetchImpl: (async (input: any, init?: any) => {
        const url = typeof input === "string" ? input : input?.url ?? "";
        if (url.includes("openrouter.ai")) fetchCalls += 1;
        return unmockedFetch(input, init);
      }) as typeof fetch,
    },
    async (port) => {
      const res = await fetch("http://127.0.0.1:" + port + "/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "teste budget" }),
      });
      assert.equal(res.status, 200);
      const data = await res.json() as { response: string; safety?: { blockedReasons?: string[] } };
      assert.ok((data.safety?.blockedReasons?.length ?? 0) > 0, "budget zerado deveria bloquear com blockedReasons preenchido");
      assert.match(data.safety!.blockedReasons![0], /Limite de tokens/);
      assert.equal(fetchCalls, 0, "BudgetProvider deveria bloquear antes de qualquer chamada de rede");
    },
  );
});

test("E2E: planner com resposta realista da LLM (markdown + texto solto) gera missoes reais", async () => {
  const root = tempRoot();
  const original = { provider: process.env.JOEFELIPE_LLM_PROVIDER, key: process.env.OPENROUTER_API_KEY };
  const originalFetch = globalThis.fetch;
  let kernel: Kernel | undefined;
  try {
    process.env.JOEFELIPE_LLM_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "sk-e2e-planner-key";
    globalThis.fetch = fakeOpenRouterFetch(() => ({
      status: 200,
      content:
        "Aqui esta o plano:\n\n```json\n" +
        JSON.stringify({
          missions: [
            { title: "Analisar requisitos", intent: "Levantar todos os requisitos do sistema", type: "analysis", order: 1 },
            { title: "Implementar feature", intent: "Codificar a feature solicitada", type: "feat", dependsOn: ["Analisar requisitos"], order: 2 },
          ],
          warnings: ["Requer acesso ao repositorio"],
        }) +
        "\n```\n\nPosso ajudar com mais alguma coisa?",
    }));

    kernel = createKernel("PLAN_ONLY");
    await kernel.initialize();

    const llm = new LlmEngine(kernel);
    const strategy = new LLMPlanningStrategy(llm);
    const planner = new GoalPlanner(kernel, strategy, new PlanStore(root), new QueueManager(root));

    const goal: Omit<Goal, "id" | "createdAt" | "updatedAt"> = {
      title: "Implementar login",
      intent: "Adicionar tela e fluxo de login de usuario",
      status: "planned",
      priority: 3,
      tags: ["feat"],
    };

    const plan = await planner.plan(goal);
    assert.equal(plan.missions.length, 2);
    assert.equal(plan.missions[0].title, "Analisar requisitos");
    assert.equal(plan.missions[1].title, "Implementar feature");
    assert.deepEqual(plan.missions[1].dependsOn, ["Analisar requisitos"]);

    const loaded = planner.loadPlan();
    assert.equal(loaded?.id, plan.id, "plano deveria ter sido persistido no PlanStore isolado (root temporario)");
  } finally {
    globalThis.fetch = originalFetch;
    if (original.provider === undefined) delete process.env.JOEFELIPE_LLM_PROVIDER; else process.env.JOEFELIPE_LLM_PROVIDER = original.provider;
    if (original.key === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = original.key;
    if (kernel) await kernel.destroy();
    clean(root);
  }
});
