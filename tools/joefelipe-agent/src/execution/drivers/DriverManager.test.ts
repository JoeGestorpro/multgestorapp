import { test } from "node:test";
import assert from "node:assert/strict";
import { DriverManager } from "./DriverManager.ts";
import { DriverRegistry } from "./DriverRegistry.ts";
import { StubDriver } from "./StubDriver.ts";
import type { ExecutorDriver, DriverHealth } from "./types.ts";
import type { ExecutionCommand } from "../types.ts";

function makeCmd(over: Partial<ExecutionCommand> = {}): ExecutionCommand {
  return {
    id: "cmd-test",
    missionId: "m1",
    stepId: "s1",
    executor: "claude-code",
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

/** Driver falso e saudavel — simula um driver real "conectado e funcionando". */
function healthyFakeDriver(id: string, resultText = "resposta do driver real"): ExecutorDriver {
  let cancelled = false;
  return {
    id,
    async initialize() {},
    async health(): Promise<DriverHealth> {
      return { available: true, version: "1.0.0-fake", capabilities: ["read", "write"] };
    },
    supports: () => true,
    async execute(command: ExecutionCommand) {
      return { success: true, result: resultText, metadata: { driver: id, cancelled: String(cancelled), commandId: command.id } };
    },
    async cancel() {
      cancelled = true;
    },
    async dispose() {},
  };
}

/** Driver falso indisponivel — simula CLI nao instalada / sem chave / versao incompativel. */
function unhealthyFakeDriver(id: string): ExecutorDriver {
  return {
    id,
    async initialize() {},
    async health(): Promise<DriverHealth> {
      return { available: false, version: null, capabilities: [], message: "indisponivel para teste" };
    },
    supports: () => true,
    async execute() {
      throw new Error("nao deveria ser chamado: health().available e false");
    },
    async cancel() {},
    async dispose() {},
  };
}

/** Driver falso cujo health() lanca excecao (ex.: CLI trava ao verificar versao). */
function throwingHealthDriver(id: string): ExecutorDriver {
  return {
    id,
    async initialize() {},
    async health(): Promise<DriverHealth> {
      throw new Error("falha ao verificar saude do driver");
    },
    supports: () => true,
    async execute() {
      throw new Error("nao deveria ser chamado");
    },
    async cancel() {},
    async dispose() {},
  };
}

test("DriverManager: resolve seleciona o driver registrado quando saudavel", async () => {
  const registry = new DriverRegistry();
  registry.register(healthyFakeDriver("claude-code"));
  const manager = new DriverManager(registry, "claude-code");

  const driver = await manager.resolve("claude-code");
  assert.equal(driver.id, "claude-code");
  const health = await driver.health();
  assert.equal(health.available, true);
});

test("DriverManager: execute delega ao driver saudavel e retorna o resultado real", async () => {
  const registry = new DriverRegistry();
  registry.register(healthyFakeDriver("claude-code", "ola do driver real"));
  const manager = new DriverManager(registry, "claude-code");

  const result = await manager.execute("claude-code", makeCmd());
  assert.equal(result.success, true);
  assert.equal(result.result, "ola do driver real");
});

test("DriverManager: fallback para StubDriver quando o driver nao esta registrado", async () => {
  const registry = new DriverRegistry();
  const manager = new DriverManager(registry, "claude-code");

  const driver = await manager.resolve("claude-code");
  assert.equal(driver.id, "claude-code");
  const result = await driver.execute(makeCmd({ prompt: "tarefa simulada" }));
  assert.equal(result.metadata?.stub, "true");
  assert.equal(result.result, "tarefa simulada");
});

test("DriverManager: fallback para StubDriver quando o driver registrado esta indisponivel (health false)", async () => {
  const registry = new DriverRegistry();
  registry.register(unhealthyFakeDriver("claude-code"));
  const manager = new DriverManager(registry, "claude-code");

  const result = await manager.execute("claude-code", makeCmd({ prompt: "tarefa X" }));
  assert.equal(result.success, true);
  assert.equal(result.metadata?.stub, "true");
  assert.equal(result.result, "tarefa X");
});

test("DriverManager: fallback para StubDriver quando health() lanca excecao", async () => {
  const registry = new DriverRegistry();
  registry.register(throwingHealthDriver("claude-code"));
  const manager = new DriverManager(registry, "claude-code");

  const result = await manager.execute("claude-code", makeCmd({ prompt: "tarefa Y" }));
  assert.equal(result.success, true);
  assert.equal(result.metadata?.stub, "true");
});

test("DriverManager: driver.cancel() e chamavel e reflete no proximo execute (driver cancelado)", async () => {
  const registry = new DriverRegistry();
  const driver = healthyFakeDriver("claude-code");
  registry.register(driver);
  const manager = new DriverManager(registry, "claude-code");

  const resolved = await manager.resolve("claude-code");
  await resolved.cancel("cmd-test");
  const result = await resolved.execute(makeCmd());
  assert.equal(result.metadata?.cancelled, "true");
});

test("DriverManager: capabilities do driver saudavel ficam visiveis via health()", async () => {
  const registry = new DriverRegistry();
  registry.register(healthyFakeDriver("claude-code"));
  const manager = new DriverManager(registry, "claude-code");

  const driver = await manager.resolve("claude-code");
  const health = await driver.health();
  assert.deepEqual(health.capabilities, ["read", "write"]);
});

test("DriverManager: um StubDriver isolado nunca falha (garantia de fallback seguro)", async () => {
  const registry = new DriverRegistry();
  const manager = new DriverManager(registry, "opencode");
  const result = await manager.execute("opencode", makeCmd({ executor: "opencode", prompt: "ok" }));
  assert.equal(result.success, true);
});
