// Testes do escopo permitido/proibido (blocklist de governança do Mission Builder).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildScope, isAlwaysForbidden, ALWAYS_FORBIDDEN } from "./scope.ts";

test("isAlwaysForbidden bloqueia .obsidian, archive e queue (ambos separadores)", () => {
  assert.ok(isAlwaysForbidden(".obsidian/config"));
  assert.ok(isAlwaysForbidden(".opencodex/archive/x.md"));
  assert.ok(isAlwaysForbidden(".opencodex/queue/next-task.md"));
  assert.ok(isAlwaysForbidden(".opencodex\\queue\\next-task.md"));
  assert.ok(!isAlwaysForbidden("tools/joefelipe-agent/src/index.ts"));
});

test("buildScope mantém caminho normal e fixa o forbidden de governança", () => {
  const { scope, warnings } = buildScope(["docs/security/rls.md"]);
  assert.deepEqual(scope.allowed, ["docs/security/rls.md"]);
  assert.equal(scope.forbidden.length, ALWAYS_FORBIDDEN.length);
  assert.ok(scope.forbidden.some((f) => f.includes("secrets")));
  assert.equal(warnings.length, 0);
});

test("buildScope remove caminho sensível (.env) com aviso", () => {
  const { scope, warnings } = buildScope([".env", "docs/ok.md"]);
  assert.ok(!scope.allowed.includes(".env"));
  assert.ok(scope.allowed.includes("docs/ok.md"));
  assert.ok(warnings.some((w) => w.toLowerCase().includes("sensível")));
});

test("buildScope remove caminho proibido (.opencodex/queue) com aviso", () => {
  const { scope, warnings } = buildScope([".opencodex/queue/next-task.md"]);
  assert.equal(scope.allowed.length, 0);
  assert.ok(warnings.some((w) => w.toLowerCase().includes("proibido")));
});

test("buildScope vazio → allowed vazio, forbidden = governança", () => {
  const { scope } = buildScope([]);
  assert.deepEqual(scope.allowed, []);
  assert.deepEqual(scope.forbidden, [...ALWAYS_FORBIDDEN]);
});
