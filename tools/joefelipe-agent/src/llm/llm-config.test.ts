import { test } from "node:test";
import assert from "node:assert/strict";
import { loadLlmConfig, loadSafetyConfig } from "./llm-config.ts";

const ENV_KEYS = [
  "JOEFELIPE_LLM_PROVIDER",
  "JOEFELIPE_LLM_MODEL",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
  "JOEFELIPE_OPENROUTER_API_KEY",
  "JOEFELIPE_OPENROUTER_MODEL",
  "NVIDIA_API_KEY",
  "NVIDIA_MODEL",
  "JOEFELIPE_NVIDIA_API_KEY",
  "JOEFELIPE_NVIDIA_MODEL",
] as const;

function withEnv(overrides: Partial<Record<(typeof ENV_KEYS)[number], string>>, fn: () => void) {
  const original: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) original[key] = process.env[key];
  try {
    for (const key of ENV_KEYS) delete process.env[key];
    for (const [key, value] of Object.entries(overrides)) process.env[key] = value;
    fn();
  } finally {
    for (const key of ENV_KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
}

// Caso 1: sem nenhuma variavel — MockProvider.
test("sem nenhuma env configurada: usa MockProvider", () => {
  withEnv({}, () => {
    const cfg = loadLlmConfig();
    assert.equal(cfg.provider, "mock");
    assert.equal(cfg.externalCallsEnabled, false);
  });
});

// Caso 2 (regressao da Fase 9.5, corrigida na 9.5.1): OPENROUTER_API_KEY
// isolada NUNCA deve ativar o provider real — precisa de decisao explicita.
test("OPENROUTER_API_KEY isolada (sem JOEFELIPE_LLM_PROVIDER): continua MockProvider", () => {
  withEnv({ OPENROUTER_API_KEY: "sk-test-123", OPENROUTER_MODEL: "meta/llama-test" }, () => {
    const cfg = loadLlmConfig();
    assert.equal(cfg.provider, "mock");
    assert.equal(cfg.externalCallsEnabled, false);
  });
});

test("OPENROUTER_API_KEY (nome legado JOEFELIPE_OPENROUTER_API_KEY) isolada: continua MockProvider", () => {
  withEnv({ JOEFELIPE_OPENROUTER_API_KEY: "sk-legacy-123" }, () => {
    const cfg = loadLlmConfig();
    assert.equal(cfg.provider, "mock");
    assert.equal(cfg.externalCallsEnabled, false);
  });
});

// Caso 3: OPENROUTER_API_KEY + JOEFELIPE_LLM_PROVIDER=openrouter — decisao
// explicita, agora sim ativa o provider real.
test("JOEFELIPE_LLM_PROVIDER=openrouter + OPENROUTER_API_KEY: ativa OpenRouter", () => {
  withEnv({ JOEFELIPE_LLM_PROVIDER: "openrouter", OPENROUTER_API_KEY: "sk-test-123", OPENROUTER_MODEL: "meta/llama-test" }, () => {
    const cfg = loadLlmConfig();
    assert.equal(cfg.provider, "openrouter");
    assert.equal(cfg.model, "meta/llama-test");
    assert.equal(cfg.externalCallsEnabled, true);
  });
});

test("JOEFELIPE_LLM_PROVIDER=openrouter sem OPENROUTER_MODEL: usa modelo padrao seguro", () => {
  withEnv({ JOEFELIPE_LLM_PROVIDER: "openrouter", OPENROUTER_API_KEY: "sk-test-123" }, () => {
    const cfg = loadLlmConfig();
    assert.equal(cfg.provider, "openrouter");
    assert.ok(cfg.model.length > 0);
  });
});

test("JOEFELIPE_LLM_PROVIDER=openrouter com nomes legados JOEFELIPE_OPENROUTER_*: continua funcionando", () => {
  withEnv({ JOEFELIPE_LLM_PROVIDER: "openrouter", JOEFELIPE_OPENROUTER_API_KEY: "sk-legacy-123", JOEFELIPE_OPENROUTER_MODEL: "legacy-model" }, () => {
    const cfg = loadLlmConfig();
    assert.equal(cfg.provider, "openrouter");
    assert.equal(cfg.model, "legacy-model");
  });
});

// Caso 3b: JOEFELIPE_LLM_PROVIDER=openrouter mas SEM chave -> fallback seguro.
test("JOEFELIPE_LLM_PROVIDER=openrouter sem chave: cai para MockProvider com aviso, sem crash", () => {
  withEnv({ JOEFELIPE_LLM_PROVIDER: "openrouter" }, () => {
    const cfg = loadLlmConfig();
    assert.equal(cfg.provider, "mock");
    assert.equal(cfg.externalCallsEnabled, false);
  });
});

// Caso 4: provider invalido -> fallback seguro, sem crash.
test("JOEFELIPE_LLM_PROVIDER invalido: fallback seguro para MockProvider, sem crash", () => {
  withEnv({ JOEFELIPE_LLM_PROVIDER: "nao-existe-esse-provider" }, () => {
    assert.doesNotThrow(() => {
      const cfg = loadLlmConfig();
      assert.equal(cfg.provider, "mock");
    });
  });
});

test("chave OpenRouter nunca vaza para dentro do provider/model retornados", () => {
  withEnv({ JOEFELIPE_LLM_PROVIDER: "openrouter", OPENROUTER_API_KEY: "sk-should-not-leak-anywhere" }, () => {
    const cfg = loadLlmConfig();
    assert.notEqual(cfg.provider, "sk-should-not-leak-anywhere");
    assert.notEqual(cfg.model, "sk-should-not-leak-anywhere");
    assert.ok(!JSON.stringify({ provider: cfg.provider, model: cfg.model, externalCallsEnabled: cfg.externalCallsEnabled }).includes("sk-should-not-leak-anywhere"));
  });
});

// ── NVIDIA (Fase 9.19) — mesmas regras de seguranca do OpenRouter ──────────

test("NVIDIA_API_KEY isolada (sem JOEFELIPE_LLM_PROVIDER): continua MockProvider", () => {
  withEnv({ NVIDIA_API_KEY: "nvapi-test-123" }, () => {
    const cfg = loadLlmConfig();
    assert.equal(cfg.provider, "mock");
    assert.equal(cfg.externalCallsEnabled, false);
  });
});

test("NVIDIA_API_KEY (nome legado JOEFELIPE_NVIDIA_API_KEY) isolada: continua MockProvider", () => {
  withEnv({ JOEFELIPE_NVIDIA_API_KEY: "nvapi-legacy-123" }, () => {
    const cfg = loadLlmConfig();
    assert.equal(cfg.provider, "mock");
    assert.equal(cfg.externalCallsEnabled, false);
  });
});

test("JOEFELIPE_LLM_PROVIDER=nvidia + NVIDIA_API_KEY: ativa NvidiaProvider", () => {
  withEnv({ JOEFELIPE_LLM_PROVIDER: "nvidia", NVIDIA_API_KEY: "nvapi-test-123", NVIDIA_MODEL: "deepseek-ai/deepseek-v4-flash" }, () => {
    const cfg = loadLlmConfig();
    assert.equal(cfg.provider, "nvidia");
    assert.equal(cfg.model, "deepseek-ai/deepseek-v4-flash");
    assert.equal(cfg.externalCallsEnabled, true);
  });
});

test("JOEFELIPE_LLM_PROVIDER=nvidia sem NVIDIA_MODEL: usa deepseek-ai/deepseek-v4-flash como default", () => {
  withEnv({ JOEFELIPE_LLM_PROVIDER: "nvidia", NVIDIA_API_KEY: "nvapi-test-123" }, () => {
    const cfg = loadLlmConfig();
    assert.equal(cfg.provider, "nvidia");
    assert.equal(cfg.model, "deepseek-ai/deepseek-v4-flash");
  });
});

test("JOEFELIPE_LLM_PROVIDER=nvidia com nomes legados JOEFELIPE_NVIDIA_*: continua funcionando", () => {
  withEnv({ JOEFELIPE_LLM_PROVIDER: "nvidia", JOEFELIPE_NVIDIA_API_KEY: "nvapi-legacy-123", JOEFELIPE_NVIDIA_MODEL: "legacy-model" }, () => {
    const cfg = loadLlmConfig();
    assert.equal(cfg.provider, "nvidia");
    assert.equal(cfg.model, "legacy-model");
  });
});

test("JOEFELIPE_LLM_PROVIDER=nvidia sem chave: cai para MockProvider com aviso, sem crash", () => {
  withEnv({ JOEFELIPE_LLM_PROVIDER: "nvidia" }, () => {
    const cfg = loadLlmConfig();
    assert.equal(cfg.provider, "mock");
    assert.equal(cfg.externalCallsEnabled, false);
  });
});

test("chave NVIDIA nunca vaza para dentro do provider/model retornados", () => {
  withEnv({ JOEFELIPE_LLM_PROVIDER: "nvidia", NVIDIA_API_KEY: "nvapi-should-not-leak-anywhere" }, () => {
    const cfg = loadLlmConfig();
    assert.notEqual(cfg.provider, "nvapi-should-not-leak-anywhere");
    assert.notEqual(cfg.model, "nvapi-should-not-leak-anywhere");
    assert.ok(!JSON.stringify({ provider: cfg.provider, model: cfg.model, externalCallsEnabled: cfg.externalCallsEnabled }).includes("nvapi-should-not-leak-anywhere"));
  });
});

// ── Fase 10 (LLM Cost Safety): loadSafetyConfig() ──

const SAFETY_ENV_KEYS = [
  "JOEFELIPE_LLM_SESSION_ID",
  "JOEFELIPE_LLM_MAX_TOKENS_PER_SESSION",
  "JOEFELIPE_LLM_MAX_COST_PER_SESSION",
  "JOEFELIPE_LLM_RATE_PER_TOKEN",
  "JOEFELIPE_LLM_RATE_LIMIT_MAX_CALLS",
  "JOEFELIPE_LLM_RATE_LIMIT_WINDOW_MS",
  "JOEFELIPE_LLM_CIRCUIT_FAILURE_THRESHOLD",
  "JOEFELIPE_LLM_CIRCUIT_RESET_TIMEOUT_MS",
] as const;

function withSafetyEnv(overrides: Partial<Record<(typeof SAFETY_ENV_KEYS)[number], string>>, fn: () => void) {
  const original: Record<string, string | undefined> = {};
  for (const key of SAFETY_ENV_KEYS) original[key] = process.env[key];
  try {
    for (const key of SAFETY_ENV_KEYS) delete process.env[key];
    for (const [key, value] of Object.entries(overrides)) process.env[key] = value;
    fn();
  } finally {
    for (const key of SAFETY_ENV_KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
}

test("loadSafetyConfig: sem nenhuma env, todos os wrappers ficam undefined (backward compat)", () => {
  withSafetyEnv({}, () => {
    const cfg = loadSafetyConfig();
    assert.equal(cfg.sessionId, undefined);
    assert.equal(cfg.budget, undefined);
    assert.equal(cfg.rateLimit, undefined);
    assert.equal(cfg.circuitBreaker, undefined);
  });
});

test("loadSafetyConfig: budget e ativado so com maxTokensPerSession ou maxCostPerSession presentes", () => {
  withSafetyEnv({ JOEFELIPE_LLM_MAX_TOKENS_PER_SESSION: "5000", JOEFELIPE_LLM_RATE_PER_TOKEN: "0.00001" }, () => {
    const cfg = loadSafetyConfig();
    assert.deepEqual(cfg.budget, { maxTokensPerSession: 5000, maxCostPerSession: undefined, ratePerToken: 0.00001 });
  });
});

test("loadSafetyConfig: rateLimit so e ativado quando maxCalls E windowMs estao ambos presentes", () => {
  withSafetyEnv({ JOEFELIPE_LLM_RATE_LIMIT_MAX_CALLS: "10" }, () => {
    const cfg = loadSafetyConfig();
    assert.equal(cfg.rateLimit, undefined, "sem windowMs, rateLimit nao deveria ser ativado");
  });
  withSafetyEnv({ JOEFELIPE_LLM_RATE_LIMIT_MAX_CALLS: "10", JOEFELIPE_LLM_RATE_LIMIT_WINDOW_MS: "60000" }, () => {
    const cfg = loadSafetyConfig();
    assert.deepEqual(cfg.rateLimit, { maxCalls: 10, windowMs: 60000 });
  });
});

test("loadSafetyConfig: circuitBreaker e ativado com qualquer um dos dois campos presente", () => {
  withSafetyEnv({ JOEFELIPE_LLM_CIRCUIT_FAILURE_THRESHOLD: "3" }, () => {
    const cfg = loadSafetyConfig();
    assert.deepEqual(cfg.circuitBreaker, { failureThreshold: 3, resetTimeoutMs: undefined });
  });
});

test("loadSafetyConfig: sessionId vem de JOEFELIPE_LLM_SESSION_ID quando presente", () => {
  withSafetyEnv({ JOEFELIPE_LLM_SESSION_ID: "agent-prod-1" }, () => {
    const cfg = loadSafetyConfig();
    assert.equal(cfg.sessionId, "agent-prod-1");
  });
});

test("loadSafetyConfig: valores nao-numericos sao ignorados (undefined), sem crash", () => {
  withSafetyEnv({ JOEFELIPE_LLM_MAX_TOKENS_PER_SESSION: "nao-e-numero" }, () => {
    const cfg = loadSafetyConfig();
    assert.equal(cfg.budget, undefined);
  });
});
