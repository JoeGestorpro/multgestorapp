import { test } from "node:test";
import assert from "node:assert/strict";
import { DriverRegistry } from "./DriverRegistry.ts";
import { StubDriver } from "./StubDriver.ts";

test("DriverRegistry: registro dinamico e listagem", () => {
  const registry = new DriverRegistry();
  assert.equal(registry.total, 0);

  registry.register(new StubDriver("claude-code"));
  registry.register(new StubDriver("opencode"));

  assert.equal(registry.total, 2);
  assert.deepEqual(registry.list().sort(), ["claude-code", "opencode"]);
});

test("DriverRegistry: get retorna undefined para id nao registrado", () => {
  const registry = new DriverRegistry();
  assert.equal(registry.get("nao-existe"), undefined);
});

test("DriverRegistry: registrar o mesmo id substitui o driver anterior", () => {
  const registry = new DriverRegistry();
  const first = new StubDriver("claude-code");
  const second = new StubDriver("claude-code");
  registry.register(first);
  registry.register(second);

  assert.equal(registry.total, 1);
  assert.equal(registry.get("claude-code"), second);
});
