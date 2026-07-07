import { test } from "node:test";
import assert from "node:assert/strict";
import { DriverRegistry } from "./DriverRegistry.ts";
import { createDefaultDriverRegistry, getDriverControlCenterStatus, KNOWN_DRIVER_IDS } from "./DriverStatusService.ts";
import type { ExecutorDriver, DriverHealth } from "./types.ts";

function healthyFakeDriver(id: string, name: string): ExecutorDriver {
  const driver = {
    id,
    async initialize() {},
    async health(): Promise<DriverHealth> {
      return { available: true, version: "9.9.9-fake", capabilities: ["read", "write"] };
    },
    supports: () => true,
    async execute() {
      return { success: true, result: "ok" };
    },
    async cancel() {},
    async dispose() {},
  };
  Object.defineProperty(driver, "constructor", { value: { name } });
  return driver as ExecutorDriver;
}

function throwingHealthDriver(id: string): ExecutorDriver {
  return {
    id,
    async initialize() {},
    async health(): Promise<DriverHealth> {
      throw new Error("falha ao verificar CLI");
    },
    supports: () => true,
    async execute() {
      throw new Error("nao deveria ser chamado");
    },
    async cancel() {},
    async dispose() {},
  };
}

test("createDefaultDriverRegistry registra os 4 drivers conhecidos", () => {
  const registry = createDefaultDriverRegistry();
  assert.equal(registry.total, 4);
  for (const id of KNOWN_DRIVER_IDS) {
    assert.ok(registry.get(id), "deveria ter um driver registrado para " + id);
  }
});

test("getDriverControlCenterStatus: drivers placeholder (Fase 9.8) aparecem como indisponiveis, com capabilities e mensagem", async () => {
  const registry = createDefaultDriverRegistry();
  const status = await getDriverControlCenterStatus(registry);

  assert.equal(status.drivers.length, KNOWN_DRIVER_IDS.length);
  for (const entry of status.drivers) {
    assert.equal(entry.status, "indisponivel");
    assert.equal(entry.available, false);
    assert.equal(entry.version, null);
    assert.ok(entry.capabilities.length > 0);
    assert.ok(entry.message && entry.message.length > 0);
    assert.equal(entry.isDefault, true);
    assert.equal(entry.active, false);
  }
});

test("getDriverControlCenterStatus: driver saudavel aparece como disponivel e ativo, com versao e capabilities", async () => {
  const registry = new DriverRegistry();
  registry.register(healthyFakeDriver("claude-code", "ClaudeDriverFake"));
  const status = await getDriverControlCenterStatus(registry);

  const claude = status.drivers.find((d) => d.id === "claude-code");
  assert.ok(claude);
  assert.equal(claude!.status, "disponivel");
  assert.equal(claude!.available, true);
  assert.equal(claude!.version, "9.9.9-fake");
  assert.deepEqual(claude!.capabilities, ["read", "write"]);
  assert.equal(claude!.active, true);
});

test("getDriverControlCenterStatus: id sem driver registrado aparece como indisponivel/nao registrado", async () => {
  const registry = new DriverRegistry();
  const status = await getDriverControlCenterStatus(registry);

  for (const entry of status.drivers) {
    assert.equal(entry.status, "indisponivel");
    assert.equal(entry.isDefault, false);
    assert.ok(entry.message?.includes("Nenhum driver registrado"));
  }
});

test("getDriverControlCenterStatus: health() lancando excecao vira status 'erro', nunca derruba a chamada", async () => {
  const registry = new DriverRegistry();
  registry.register(throwingHealthDriver("aider"));
  const status = await getDriverControlCenterStatus(registry);

  const aider = status.drivers.find((d) => d.id === "aider");
  assert.ok(aider);
  assert.equal(aider!.status, "erro");
  assert.equal(aider!.available, false);
  assert.ok(aider!.message?.includes("falha ao verificar CLI"));
});

test("getDriverControlCenterStatus: fallback (StubDriver) sempre presente e sempre disponivel", async () => {
  const registry = createDefaultDriverRegistry();
  const status = await getDriverControlCenterStatus(registry);

  assert.equal(status.fallback.name, "StubDriver");
  assert.ok(status.fallback.version);
});

test("getDriverControlCenterStatus: nunca lanca, mesmo com registry totalmente vazio", async () => {
  const registry = new DriverRegistry();
  await assert.doesNotReject(() => getDriverControlCenterStatus(registry));
});
