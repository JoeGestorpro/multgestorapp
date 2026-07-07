import { test } from "node:test";
import assert from "node:assert/strict";
import { HumanExecutor } from "./HumanExecutor.ts";
import { ClaudeExecutor } from "./ClaudeExecutor.ts";
import { OpenCodeExecutor } from "./OpenCodeExecutor.ts";
import { ShellExecutor } from "./ShellExecutor.ts";
import { SimpleRegistry } from "../ExecutionEngine.ts";
import { ExecutorNotFoundError } from "../errors.ts";
import type { ExecutionCommand } from "../types.ts";

function makeCmd(over: Partial<ExecutionCommand> = {}): ExecutionCommand {
  return {
    id: "cmd-test",
    missionId: "m1",
    stepId: "s1",
    executor: "noop",
    mode: "READ_ONLY",
    workingDirectory: "/tmp",
    prompt: "hello",
    timeout: 1000,
    retry: 0,
    environment: {},
    metadata: {},
    ...over,
  };
}

// ── HumanExecutor ──────────────────────────────────────────────────────────

test("HumanExecutor.canHandle so aceita executor human", () => {
  const ex = new HumanExecutor();
  assert.equal(ex.canHandle(makeCmd({ executor: "human" })), true);
  assert.equal(ex.canHandle(makeCmd({ executor: "claude-code" })), false);
});

test("HumanExecutor.execute nao pede input interativo e retorna pendencia controlada", async () => {
  const ex = new HumanExecutor();
  const result = await ex.execute(makeCmd({ executor: "human" }));
  assert.equal(result.success, false);
  assert.ok(result.error?.includes("aprovacao"));
  assert.equal(result.metadata?.pending, "true");
});

// ── ClaudeExecutor (stub) ──────────────────────────────────────────────────

test("ClaudeExecutor.canHandle so aceita executor claude-code", () => {
  const ex = new ClaudeExecutor();
  assert.equal(ex.canHandle(makeCmd({ executor: "claude-code" })), true);
  assert.equal(ex.canHandle(makeCmd({ executor: "opencode" })), false);
});

test("ClaudeExecutor.execute e stub: nao faz chamada externa, retorna simulado", async () => {
  const ex = new ClaudeExecutor();
  const result = await ex.execute(makeCmd({ executor: "claude-code", prompt: "tarefa X" }));
  assert.equal(result.success, true);
  assert.equal(result.result, "tarefa X");
  assert.equal(result.metadata?.stub, "true");
  assert.equal(result.metadata?.simulated, "true");
});

// ── OpenCodeExecutor (stub) ─────────────────────────────────────────────────

test("OpenCodeExecutor.canHandle so aceita executor opencode", () => {
  const ex = new OpenCodeExecutor();
  assert.equal(ex.canHandle(makeCmd({ executor: "opencode" })), true);
  assert.equal(ex.canHandle(makeCmd({ executor: "claude-code" })), false);
});

test("OpenCodeExecutor.execute e stub: nao faz chamada externa, retorna simulado", async () => {
  const ex = new OpenCodeExecutor();
  const result = await ex.execute(makeCmd({ executor: "opencode", prompt: "tarefa Y" }));
  assert.equal(result.success, true);
  assert.equal(result.result, "tarefa Y");
  assert.equal(result.metadata?.stub, "true");
});

// ── Registry defaults ────────────────────────────────────────────────────

test("SimpleRegistry ja registra noop, human, claude-code e opencode por padrao", () => {
  const reg = new SimpleRegistry();
  const ids = reg.list();
  assert.ok(ids.includes("noop"));
  assert.ok(ids.includes("human"));
  assert.ok(ids.includes("claude-code"));
  assert.ok(ids.includes("opencode"));
  assert.ok(!ids.includes("local-shell"), "ShellExecutor nao deve ser default (execucao real)");
});

test("SimpleRegistry resolve human/claude-code/opencode para os executores corretos", () => {
  const reg = new SimpleRegistry();
  assert.equal(reg.resolve(makeCmd({ executor: "human" })).id, "human");
  assert.equal(reg.resolve(makeCmd({ executor: "claude-code" })).id, "claude-code");
  assert.equal(reg.resolve(makeCmd({ executor: "opencode" })).id, "opencode");
});

// ── Parte 5: ExecutorRegistry definitivo (resolveStrict) ───────────────────

test("resolveStrict resolve noop", () => {
  const reg = new SimpleRegistry();
  assert.equal(reg.resolveStrict(makeCmd({ executor: "noop" })).id, "noop");
});

test("resolveStrict resolve human", () => {
  const reg = new SimpleRegistry();
  assert.equal(reg.resolveStrict(makeCmd({ executor: "human" })).id, "human");
});

test("resolveStrict resolve claude-code (stub)", () => {
  const reg = new SimpleRegistry();
  assert.equal(reg.resolveStrict(makeCmd({ executor: "claude-code" })).id, "claude-code");
});

test("resolveStrict resolve opencode (stub)", () => {
  const reg = new SimpleRegistry();
  assert.equal(reg.resolveStrict(makeCmd({ executor: "opencode" })).id, "opencode");
});

test("resolveStrict falha com erro claro para executor desconhecido (sem fallback silencioso)", () => {
  const reg = new SimpleRegistry();
  assert.throws(
    () => reg.resolveStrict(makeCmd({ executor: "executor-fantasma" })),
    (err: unknown) => err instanceof ExecutorNotFoundError && /executor-fantasma/.test(err.message),
  );
});

test("shell nao vem no default registry (so entra via opt-in explicito)", () => {
  const reg = new SimpleRegistry();
  assert.ok(!reg.list().includes("local-shell"));
  assert.throws(() => reg.resolveStrict(makeCmd({ executor: "local-shell" })), ExecutorNotFoundError);
});

test("shell registrado manualmente resolve, mas ainda seria bloqueado pelo PolicyEngine (ShellPolicy)", () => {
  const reg = new SimpleRegistry([new ShellExecutor()]);
  assert.ok(reg.list().includes("local-shell"));
  assert.equal(reg.resolveStrict(makeCmd({ executor: "local-shell", mode: "READ_ONLY" })).id, "local-shell");
  // A garantia de bloqueio em si e responsabilidade do PolicyEngine (ver
  // ExecutionPolicy.test.ts: "Engine bloqueia ShellExecutor por padrao...").
});
