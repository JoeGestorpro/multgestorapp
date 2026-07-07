import { test } from "node:test";
import assert from "node:assert/strict";
import { OpenRouterTextDriver } from "./OpenRouterTextDriver.ts";
import type { ExecutionCommand } from "../types.ts";

function withEnv<T>(vars: Record<string, string | undefined>, fn: () => T): T {
  const originals: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    originals[key] = process.env[key];
    if (vars[key] === undefined) delete process.env[key];
    else process.env[key] = vars[key];
  }
  try {
    return fn();
  } finally {
    for (const key of Object.keys(originals)) {
      if (originals[key] === undefined) delete process.env[key];
      else process.env[key] = originals[key];
    }
  }
}

function makeCmd(over: Partial<ExecutionCommand> = {}): ExecutionCommand {
  return {
    id: "cmd-test",
    missionId: "m1",
    stepId: "s1",
    executor: "claude-code",
    mode: "READ_ONLY",
    workingDirectory: "/tmp",
    prompt: "analisar o estado atual do projeto",
    timeout: 1000,
    retry: 0,
    environment: {},
    metadata: { type: "analyze" },
    ...over,
  };
}

// ── health(): reflete presenca/ausencia da chave ────────────────────────────

test("OpenRouterTextDriver.health(): indisponivel sem provider/chave configurados", async () => {
  await withEnv({ JOEFELIPE_LLM_PROVIDER: undefined, OPENROUTER_API_KEY: undefined, JOEFELIPE_OPENROUTER_API_KEY: undefined }, async () => {
    const driver = new OpenRouterTextDriver();
    const health = await driver.health();
    assert.equal(health.available, false);
    assert.equal(health.version, null);
    assert.ok(health.capabilities.length > 0);
    assert.ok(health.message && health.message.length > 0);
  });
});

test("OpenRouterTextDriver.health(): disponivel com JOEFELIPE_LLM_PROVIDER=openrouter + chave", async () => {
  await withEnv({ JOEFELIPE_LLM_PROVIDER: "openrouter", OPENROUTER_API_KEY: "sk-fake-key-for-test" }, async () => {
    const driver = new OpenRouterTextDriver();
    const health = await driver.health();
    assert.equal(health.available, true);
    assert.ok(health.version);
  });
});

test("OpenRouterTextDriver.health(): permanece indisponivel com chave mas SEM JOEFELIPE_LLM_PROVIDER=openrouter", async () => {
  await withEnv({ JOEFELIPE_LLM_PROVIDER: undefined, OPENROUTER_API_KEY: "sk-fake-key-for-test" }, async () => {
    const driver = new OpenRouterTextDriver();
    const health = await driver.health();
    assert.equal(health.available, false, "chave isolada, sem o provider explicito, nunca deveria ativar (mesma regra de llm-config.ts)");
  });
});

// ── execute(): so aceita analyze/plan/report, rejeita o resto ───────────────

const ACCEPTED_TYPES = ["analyze", "plan", "report"];
const REJECTED_TYPES = ["implement", "commit", "test", "deploy", "shell"];

for (const type of ACCEPTED_TYPES) {
  test("OpenRouterTextDriver.execute(): aceita step type '" + type + "' (sem chave configurada, falha por indisponibilidade, nao por tipo)", async () => {
    await withEnv({ JOEFELIPE_LLM_PROVIDER: undefined, OPENROUTER_API_KEY: undefined }, async () => {
      const driver = new OpenRouterTextDriver();
      const result = await driver.execute(makeCmd({ metadata: { type } }));
      assert.equal(result.success, false);
      assert.ok(!result.error?.includes("so aceita steps de texto"), "nao deveria rejeitar por tipo — " + type + " e aceito");
    });
  });
}

for (const type of REJECTED_TYPES) {
  test("OpenRouterTextDriver.execute(): rejeita step type '" + type + "' mesmo com chave configurada (nunca escreve/executa)", async () => {
    await withEnv({ JOEFELIPE_LLM_PROVIDER: "openrouter", OPENROUTER_API_KEY: "sk-fake-key-for-test" }, async () => {
      const driver = new OpenRouterTextDriver();
      const result = await driver.execute(makeCmd({ mode: "SAFE_WRITE", metadata: { type } }));
      assert.equal(result.success, false);
      assert.ok(result.error?.includes("so aceita steps de texto"), "deveria rejeitar explicitamente o step type '" + type + "'");
    });
  });
}

test("OpenRouterTextDriver.execute(): rejeita mesmo um step analyze/plan/report se o mode nao for READ_ONLY (defesa em profundidade)", async () => {
  await withEnv({ JOEFELIPE_LLM_PROVIDER: "openrouter", OPENROUTER_API_KEY: "sk-fake-key-for-test" }, async () => {
    const driver = new OpenRouterTextDriver();
    const result = await driver.execute(makeCmd({ mode: "SAFE_WRITE", metadata: { type: "analyze" } }));
    assert.equal(result.success, false);
    assert.ok(result.error?.includes("READ_ONLY"));
  });
});

test("OpenRouterTextDriver.supports(): reconhece apenas o executor correspondente ao seu id", () => {
  const driver = new OpenRouterTextDriver("claude-code");
  assert.equal(driver.supports(makeCmd({ executor: "claude-code" })), true);
  assert.equal(driver.supports(makeCmd({ executor: "outro-executor" })), false);
});

test("OpenRouterTextDriver: cancel()/dispose() nunca lancam", async () => {
  const driver = new OpenRouterTextDriver();
  await assert.doesNotReject(() => driver.cancel("qualquer-id"));
  await assert.doesNotReject(() => driver.dispose());
});
