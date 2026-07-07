import { test } from "node:test";
import assert from "node:assert/strict";
import { StubDriver } from "./StubDriver.ts";
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

test("StubDriver: health sempre disponivel, sem chamada externa", async () => {
  const driver = new StubDriver("claude-code");
  const health = await driver.health();
  assert.equal(health.available, true);
  assert.ok(health.version);
});

test("StubDriver: supports aceita qualquer comando", () => {
  const driver = new StubDriver("claude-code");
  assert.equal(driver.supports(makeCmd()), true);
});

test("StubDriver: execute devolve o prompt simulado, com metadata stub/simulated", async () => {
  const driver = new StubDriver("opencode");
  const result = await driver.execute(makeCmd({ prompt: "tarefa X" }));
  assert.equal(result.success, true);
  assert.equal(result.result, "tarefa X");
  assert.equal(result.metadata?.stub, "true");
  assert.equal(result.metadata?.simulated, "true");
  assert.equal(result.metadata?.driver, "opencode");
});

test("StubDriver: cancel e dispose sao no-ops seguros (nunca lancam)", async () => {
  const driver = new StubDriver("claude-code");
  await assert.doesNotReject(() => driver.cancel("qualquer-id"));
  await assert.doesNotReject(() => driver.dispose());
});
