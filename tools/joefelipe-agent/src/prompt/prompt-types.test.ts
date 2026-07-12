// Testes do componente de tipos (prompt-types.ts) + varredura estática de segurança.
// prompt-types.ts é types-only (apagável pelo type-stripping): não deve ter runtime.
// A varredura garante que o Prompt Generator não introduz dependência de
// frontend, rede, LLM real, banco, shell ou secrets.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type {
  GeneratedPrompt,
  PromptGeneratorInput,
  PromptSafetyRules,
  PromptValidation,
} from "./prompt-types.ts";
import { makeMission } from "./prompt-test-fixtures.ts";

const SRC = ["./PromptGenerator.ts", "./PromptTemplate.ts", "./prompt-types.ts"] as const;

function read(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
}

test("prompt-types.ts é types-only (nenhum runtime emitido)", () => {
  const code = read("./prompt-types.ts");
  assert.ok(!/export\s+(function|const|let|var|class)\b/.test(code), "tem runtime exportado");
  assert.ok(/export\s+interface\b/.test(code), "deveria exportar interfaces");
  assert.ok(/^import type /m.test(code), "deveria importar apenas tipos");
});

test("shape de GeneratedPrompt é honrado (compatibilidade de tipos)", () => {
  const safety: PromptSafetyRules = {
    requiresHumanApproval: false,
    canExecute: false,
    externalCalls: false,
    noSecrets: true,
    noDangerousExecution: true,
    noPushMergeWithoutApproval: true,
    stopOnUnforeseen: true,
  };
  const validation: PromptValidation = { items: ["ok"] };
  const gp: GeneratedPrompt = {
    missionId: "x",
    classification: "READ_ONLY",
    safety,
    validation,
    text: "prompt",
  };
  const input: PromptGeneratorInput = { mission: makeMission() };
  assert.equal(gp.missionId, "x");
  assert.equal(gp.safety.canExecute, false);
  assert.equal(input.mission.provenance.externalCallsEnabled, false);
});

test("sem dependência de frontend nos fontes do Prompt Generator", () => {
  const forbidden = /from\s+["'](react|react-dom|vue|svelte|next|@angular)/;
  for (const f of SRC) {
    assert.ok(!forbidden.test(read(f)), `${f} importa frontend`);
    assert.ok(!/\b(document|window)\s*\./.test(read(f)), `${f} usa DOM`);
  }
});

test("sem chamada externa / rede nos fontes", () => {
  const net = /(from\s+["'](axios|undici|node-fetch)|node:(http|https|http2|net|dgram|tls)|\bfetch\s*\()/;
  for (const f of SRC) assert.ok(!net.test(read(f)), `${f} faz rede/chamada externa`);
});

test("sem LLM real / provider externo nos fontes", () => {
  const llm = /from\s+["'](openai|@anthropic-ai\/sdk|@google\/generative-ai|cohere|mistralai|openrouter)/;
  for (const f of SRC) assert.ok(!llm.test(read(f)), `${f} importa SDK de LLM real`);
});

test("sem acesso a banco nos fontes", () => {
  const db = /from\s+["'](pg|postgres|@supabase\/[^"']+|ioredis|redis|mysql2?|mongodb)/;
  for (const f of SRC) assert.ok(!db.test(read(f)), `${f} acessa banco`);
});

test("sem shell / execução de processo nos fontes", () => {
  const shell = /(child_process|\bexecSync\b|\bspawnSync\b|\bspawn\s*\(|\bexecFile)/;
  for (const f of SRC) assert.ok(!shell.test(read(f)), `${f} executa shell`);
});

test("sem leitura de secrets nos fontes (process.env / dotenv)", () => {
  const secrets = /(process\.env|from\s+["']dotenv)/;
  for (const f of SRC) assert.ok(!secrets.test(read(f)), `${f} lê secrets`);
});
