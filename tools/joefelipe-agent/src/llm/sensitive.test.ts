// Testes da fonte única de termos sensíveis (segurança do agente).
// node:test nativo — zero dependências, zero rede, zero secrets.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SENSITIVE_RULES,
  SENSITIVE_PATTERNS,
  detectSensitive,
  detectSensitiveHits,
} from "./sensitive.ts";

test("SENSITIVE_PATTERNS espelha SENSITIVE_RULES (mesmo tamanho)", () => {
  assert.equal(SENSITIVE_PATTERNS.length, SENSITIVE_RULES.length);
});

test("severidade: push/commit/merge = gated; deploy/migration/banco/RLS = dangerous", () => {
  const sev = (label: string) => SENSITIVE_RULES.find((r) => r.label === label)?.severity;
  assert.equal(sev("push"), "gated");
  assert.equal(sev("commit"), "gated");
  assert.equal(sev("merge"), "gated");
  assert.equal(sev("deploy"), "dangerous");
  assert.equal(sev("migration"), "dangerous");
  assert.equal(sev("banco"), "dangerous");
  assert.equal(sev("RLS"), "dangerous");
});

test("detectSensitive: detecta termos e retorna em minúsculas", () => {
  const hits = detectSensitive("fazer deploy em produção");
  assert.ok(hits.includes("deploy"));
  assert.ok(hits.includes("produção"));
});

test("detectSensitive: tarefa de leitura pura não tem termos sensíveis", () => {
  assert.deepEqual(detectSensitive("apenas ler e consolidar o estado do painel"), []);
});

test("regex com word-boundary: não casa 'rm' em 'transformar' nem 'drop' em 'dropdown'", () => {
  assert.ok(!detectSensitive("transformar o painel").includes("rm"));
  assert.ok(!detectSensitive("abrir o dropdown do menu").includes("drop"));
});

test("detectSensitiveHits: inclui severidade por termo (migration+banco = dangerous)", () => {
  const hits = detectSensitiveHits("rodar migration no banco");
  const labels = hits.map((h) => h.label);
  assert.ok(labels.includes("migration"));
  assert.ok(labels.includes("banco"));
  assert.ok(hits.every((h) => h.severity === "dangerous"));
});

test("detectSensitiveHits: 'push' é gated (fluxo normal de git, exige aprovação)", () => {
  const hits = detectSensitiveHits("git push para origin");
  assert.equal(hits.find((h) => h.label === "push")?.severity, "gated");
});
