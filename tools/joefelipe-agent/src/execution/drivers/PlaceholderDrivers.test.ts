import { test } from "node:test";
import assert from "node:assert/strict";
import { ClaudeDriver } from "./ClaudeDriver.ts";
import { OpenCodeDriver } from "./OpenCodeDriver.ts";
import { AiderDriver } from "./AiderDriver.ts";
import { CodexDriver } from "./CodexDriver.ts";
import type { ExecutorDriver } from "./types.ts";
import type { ExecutionCommand } from "../types.ts";

function makeCmd(executor: string): ExecutionCommand {
  return {
    id: "cmd-test",
    missionId: "m1",
    stepId: "s1",
    executor,
    mode: "READ_ONLY",
    workingDirectory: "/tmp",
    prompt: "hello",
    timeout: 1000,
    retry: 0,
    environment: {},
    metadata: {},
  };
}

const placeholders: Array<{ label: string; make: () => ExecutorDriver; executorId: string }> = [
  { label: "ClaudeDriver", make: () => new ClaudeDriver(), executorId: "claude-code" },
  { label: "OpenCodeDriver", make: () => new OpenCodeDriver(), executorId: "opencode" },
  { label: "AiderDriver", make: () => new AiderDriver(), executorId: "aider" },
  { label: "CodexDriver", make: () => new CodexDriver(), executorId: "codex-cli" },
];

for (const { label, make, executorId } of placeholders) {
  test(label + ": health() reporta indisponivel ate a integracao real ser ligada", async () => {
    const driver = make();
    const health = await driver.health();
    assert.equal(health.available, false);
    assert.equal(health.version, null);
    assert.ok(health.message && health.message.length > 0);
  });

  test(label + ": declara capabilities mesmo estando indisponivel", async () => {
    const driver = make();
    const health = await driver.health();
    assert.ok(health.capabilities.length > 0);
  });

  test(label + ": supports() reconhece apenas o executor correspondente", () => {
    const driver = make();
    assert.equal(driver.supports(makeCmd(executorId)), true);
    assert.equal(driver.supports(makeCmd("executor-totalmente-diferente")), false);
  });

  test(label + ": execute() chamado diretamente falha com seguranca (nunca lanca, nunca chama rede)", async () => {
    const driver = make();
    const result = await driver.execute(makeCmd(executorId));
    assert.equal(result.success, false);
    assert.ok(result.error && result.error.length > 0);
  });

  test(label + ": cancel() e dispose() nunca lancam mesmo sem execucao em andamento", async () => {
    const driver = make();
    await assert.doesNotReject(() => driver.cancel("id-qualquer"));
    await assert.doesNotReject(() => driver.dispose());
  });
}
