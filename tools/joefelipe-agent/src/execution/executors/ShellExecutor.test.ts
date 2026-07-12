import { test } from "node:test";
import assert from "node:assert/strict";
import { ShellExecutor } from "./ShellExecutor.ts";
import { CommandValidator } from "./CommandValidator.ts";
import { SimpleRegistry } from "../ExecutionEngine.ts";
import type { ExecutionCommand } from "../types.ts";

function makeCmd(over: Partial<ExecutionCommand> = {}): ExecutionCommand {
  return {
    id: "cmd-test",
    missionId: "m1",
    stepId: "s1",
    executor: "local-shell",
    mode: "READ_ONLY",
    workingDirectory: "/tmp",
    prompt: "git status",
    timeout: 1000,
    retry: 0,
    environment: {},
    metadata: {},
    ...over,
  };
}

// ── Test 1: canHandle aceita local-shell + READ_ONLY ─────────────────────
test("canHandle aceita local-shell + READ_ONLY", () => {
  const ex = new ShellExecutor();
  assert.equal(ex.canHandle(makeCmd()), true);
});

// ── Test 2: canHandle rejeita SAFE_WRITE ────────────────────────────────
test("canHandle rejeita SAFE_WRITE", () => {
  const ex = new ShellExecutor();
  assert.equal(ex.canHandle(makeCmd({ mode: "SAFE_WRITE" })), false);
});

// ── Test 3: CommandValidator aceita git status ───────────────────────────
test("CommandValidator aceita git status", () => {
  const v = new CommandValidator();
  assert.equal(v.validate("git status").allowed, true);
  assert.equal(v.validate("git status --porcelain").allowed, true);
});

// ── Test 4: CommandValidator aceita Get-ChildItem ───────────────────────
test("CommandValidator aceita Get-ChildItem", () => {
  const v = new CommandValidator();
  assert.equal(v.validate("Get-ChildItem").allowed, true);
  assert.equal(v.validate("Get-ChildItem -Path .").allowed, true);
  assert.equal(v.validate("Get-ChildItem -Recurse -Filter \"*.ts\"").allowed, true);
});

// ── Test 5: CommandValidator rejeita com encadeamento ; ──────────────────
test("CommandValidator rejeita com encadeamento ;", () => {
  const v = new CommandValidator();
  const r = v.validate("git status; Remove-Item -Recurse .");
  assert.equal(r.allowed, false);
  assert.ok(r.reason);
});

// ── Test 6: CommandValidator rejeita com pipe | ──────────────────────────
test("CommandValidator rejeita com pipe |", () => {
  const v = new CommandValidator();
  const r = v.validate("git log | Select-String pattern");
  assert.equal(r.allowed, false);
});

// ── Test 7: CommandValidator rejeita com && ──────────────────────────────
test("CommandValidator rejeita com &&", () => {
  const v = new CommandValidator();
  const r = v.validate("git status && deploy");
  assert.equal(r.allowed, false);
});

// ── Test 8: CommandValidator rejeita multilinha \n ───────────────────────
test("CommandValidator rejeita multilinha \\n", () => {
  const v = new CommandValidator();
  const r = v.validate("git status\nRemove-Item .");
  assert.equal(r.allowed, false);
});

// ── Test 9: CommandValidator rejeita redirecionamento > ──────────────────
test("CommandValidator rejeita redirecionamento >", () => {
  const v = new CommandValidator();
  const r = v.validate("git log > log.txt");
  assert.equal(r.allowed, false);
});

// ── Test 10: CommandValidator rejeita comando vazio ──────────────────────
test("CommandValidator rejeita comando vazio", () => {
  const v = new CommandValidator();
  assert.equal(v.validate("").allowed, false);
  assert.equal(v.validate("   ").allowed, false);
});

// ── Test 11: ShellExecutor executa comando valido (mock) ─────────────────
test("ShellExecutor executa comando valido (mock)", async () => {
  let execCalled = false;
  let execCmd = "";
  const mockExec = async (cmd: string, _opts: any) => {
    execCalled = true;
    execCmd = cmd;
    return { stdout: "ok", stderr: "" };
  };

  const ex = new ShellExecutor(mockExec);
  const result = await ex.execute(makeCmd({ prompt: "git status" }));
  assert.equal(result.success, true);
  assert.equal(result.result, "ok");
  assert.equal(execCalled, true);
  assert.equal(execCmd, "git status");
});

// ── Test 12: ShellExecutor rejeita comando invalido (mock nao chamado) ───
test("ShellExecutor rejeita comando invalido (mock nao chamado)", async () => {
  let execCalled = false;
  const mockExec = async (_cmd: string, _opts: any) => {
    execCalled = true;
    return { stdout: "", stderr: "" };
  };

  const ex = new ShellExecutor(mockExec);
  const result = await ex.execute(makeCmd({ prompt: "git status; rm -rf ." }));
  assert.equal(result.success, false);
  assert.equal(execCalled, false);
});

// ── Test 13: Registry integrado com ShellExecutor ────────────────────────
test("Registry integrado com ShellExecutor", () => {
  const reg = new SimpleRegistry([new ShellExecutor()]);
  const ids = reg.list();
  assert.ok(ids.includes("local-shell"));
  const resolved = reg.resolve(makeCmd({ executor: "local-shell" }));
  assert.equal(resolved.id, "local-shell");
});