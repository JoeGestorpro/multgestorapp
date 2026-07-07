import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TaskOrchestrator } from "../../orchestrator/TaskOrchestrator.ts";
import { ExecutionEngine, SimpleRegistry } from "../ExecutionEngine.ts";
import { NoopExecutor } from "../executors/NoopExecutor.ts";
import { PolicyEngine, ModePolicy, StepTypePolicy, SafetyPolicy, ExternalCallPolicy, ScopePolicy, ShellPolicy, GitPolicy, DeployPolicy, SecretsPolicy, ExecutionPolicyChain } from "./index.ts";
import { ShellExecutor } from "../executors/ShellExecutor.ts";
import type { ExecutionCommand } from "../types.ts";

function tempRoot(): string {
  const d = mkdtempSync(join(tmpdir(), "joefelipe-policy-test-"));
  return d;
}

function clean(r: string) {
  try { rmSync(r, { recursive: true, force: true }); } catch { }
}

function makeCmd(over: Partial<ExecutionCommand> = {}): ExecutionCommand {
  return {
    id: "cmd-test",
    missionId: "m1",
    stepId: "s1",
    executor: "noop",
    mode: "READ_ONLY",
    workingDirectory: "/tmp/ok",
    prompt: "apenas ler arquivos de configuracao",
    timeout: 1000,
    retry: 0,
    environment: {},
    metadata: {},
    ...over,
  };
}

function makeCtx(over: Partial<{ kernelMode: string; canExecute: boolean; requiresHumanApproval: boolean; stepType: string }> = {}): { kernelMode: string; canExecute: boolean; requiresHumanApproval: boolean; stepType: string } {
  return {
    kernelMode: "SAFE_WRITE",
    canExecute: false,
    requiresHumanApproval: false,
    stepType: "read",
    ...over,
  };
}

test("ModePolicy nega SAFE_WRITE com kernel READ_ONLY", () => {
  const p = new ModePolicy();
  const v = p.evaluate(makeCmd({ mode: "SAFE_WRITE" }), makeCtx({ kernelMode: "READ_ONLY" }));
  assert.equal(v.allowed, false);
  assert.ok(v.reason);
  assert.equal(v.requiredMode, "SAFE_WRITE");
});

test("ModePolicy permite READ_ONLY com kernel READ_ONLY", () => {
  const p = new ModePolicy();
  const v = p.evaluate(makeCmd({ mode: "READ_ONLY" }), makeCtx({ kernelMode: "READ_ONLY" }));
  assert.equal(v.allowed, true);
});

test("SafetyPolicy nega com termo dangerous no prompt", () => {
  const p = new SafetyPolicy();
  const v = p.evaluate(
    makeCmd({ mode: "SAFE_WRITE", prompt: "rodar deploy em producao" }),
    makeCtx({ kernelMode: "SAFE_WRITE" }),
  );
  assert.equal(v.allowed, false);
  assert.ok(v.reason?.includes("deploy"));
  assert.equal(v.requiredMode, "EXECUTE_APPROVED");
});

test("SafetyPolicy permite prompt limpo", () => {
  const p = new SafetyPolicy();
  const v = p.evaluate(
    makeCmd({ mode: "SAFE_WRITE", prompt: "apenas atualizar documentacao" }),
    makeCtx({ kernelMode: "SAFE_WRITE" }),
  );
  assert.equal(v.allowed, true);
});

test("ScopePolicy nega workingDirectory proibido", () => {
  const p = new ScopePolicy();
  const v = p.evaluate(makeCmd({ workingDirectory: "/repo/.opencodex/queue/" }), makeCtx());
  assert.equal(v.allowed, false);
  assert.ok(v.reason);
});

test("PolicyEngine chain: primeira negacao vence", () => {
  const engine = new PolicyEngine([
    new ModePolicy(),
    new SafetyPolicy(),
  ]);
  const v = engine.evaluate(
    makeCmd({ mode: "SAFE_WRITE", prompt: "deploy em producao" }),
    makeCtx({ kernelMode: "READ_ONLY" }),
  );
  assert.equal(v.allowed, false);
  assert.ok(v.reason?.includes("READ_ONLY"));
});

test("Engine nao chama executor quando policy nega", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const mission = {
      id: "test-policy-block-1",
      goalId: "g1",
      order: 1,
      title: "Missao bloqueada",
      intent: "implementar algo perigoso",
      executorId: "noop",
      type: "security",
      status: "active" as const,
      dependsOn: [],
      classification: "SAFE_WRITE",
    };
    const o = orc.create(mission);

    let executorCalled = false;
    const trackingExecutor = new NoopExecutor();
    trackingExecutor.execute = async (cmd: ExecutionCommand) => {
      executorCalled = true;
      return { success: true, result: cmd.prompt };
    };

    const reg = new SimpleRegistry([trackingExecutor]);
    const blockingPolicy = new PolicyEngine([
      { name: "BlockAll", evaluate: () => ({ allowed: false, reason: "bloqueado para teste" }) },
    ]);
    const engine = new ExecutionEngine(orc, reg, blockingPolicy);

    const result = await engine.runOnce();
    assert.ok(result);
    assert.equal(result.result.success, false);
    assert.equal(result.result.error, "[Policy] bloqueado para teste");
    assert.equal(executorCalled, false, "Executor nao deve ser chamado quando policy nega");

    const updated = orc.get(o.id);
    assert.ok(updated);
    assert.equal(updated.steps[0].status, "failed");
  } finally {
    clean(root);
  }
});

test("Engine chama executor normalmente quando policy permite", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const mission = {
      id: "test-policy-allow-1",
      goalId: "g1",
      order: 1,
      title: "Missao de leitura",
      intent: "apenas ler arquivos",
      executorId: "noop",
      type: "audit",
      status: "active" as const,
      dependsOn: [],
      classification: "READ_ONLY",
    };
    const o = orc.create(mission);

    // Steps de uma missao "audit" usam o executor "claude-code" (StepDeriver).
    // Registramos um fake com esse mesmo id para o registry resolver no
    // lugar do ClaudeExecutor (stub) default.
    let executorCalled = false;
    const trackingExecutor = {
      id: "claude-code",
      canHandle: (_cmd: ExecutionCommand) => true,
      execute: async (cmd: ExecutionCommand) => {
        executorCalled = true;
        return { success: true, result: cmd.prompt };
      },
    };

    const reg = new SimpleRegistry([trackingExecutor]);
    const engine = new ExecutionEngine(orc, reg);

    const result = await engine.runOnce();
    assert.ok(result);
    assert.equal(result.result.success, true);
    assert.equal(executorCalled, true, "Executor deve ser chamado quando policy permite");

    const updated = orc.get(o.id);
    assert.ok(updated);
    assert.equal(updated.steps[0].status, "completed");
  } finally {
    clean(root);
  }
});

// ── ShellPolicy: bloqueio por padrao ─────────────────────────────────────

test("ShellPolicy nega local-shell por padrao (sem flag de habilitacao)", () => {
  const original = process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;
  delete process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;
  try {
    const p = new ShellPolicy();
    const v = p.evaluate(
      makeCmd({ executor: "local-shell", mode: "READ_ONLY", prompt: "git status" }),
      makeCtx({ kernelMode: "EXECUTE_APPROVED" }),
    );
    assert.equal(v.allowed, false);
    assert.ok(v.reason?.includes("desabilitado por padrao"));
    assert.equal(v.requiredMode, "EXECUTE_APPROVED");
  } finally {
    if (original !== undefined) process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED = original;
  }
});

test("ShellPolicy nega local-shell mesmo com flag se kernel nao esta EXECUTE_APPROVED", () => {
  const original = process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;
  process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED = "1";
  try {
    const p = new ShellPolicy();
    const v = p.evaluate(
      makeCmd({ executor: "local-shell", mode: "READ_ONLY", prompt: "git status" }),
      makeCtx({ kernelMode: "SAFE_WRITE" }),
    );
    assert.equal(v.allowed, false);
    assert.ok(v.reason?.includes("EXECUTE_APPROVED"));
  } finally {
    if (original === undefined) delete process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;
    else process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED = original;
  }
});

test("ShellPolicy permite local-shell somente com flag + EXECUTE_APPROVED", () => {
  const original = process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;
  process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED = "1";
  try {
    const p = new ShellPolicy();
    const v = p.evaluate(
      makeCmd({ executor: "local-shell", mode: "READ_ONLY", prompt: "git status" }),
      makeCtx({ kernelMode: "EXECUTE_APPROVED" }),
    );
    assert.equal(v.allowed, true);
  } finally {
    if (original === undefined) delete process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;
    else process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED = original;
  }
});

test("ShellPolicy nao interfere em outros executores", () => {
  const p = new ShellPolicy();
  const v = p.evaluate(makeCmd({ executor: "noop" }), makeCtx());
  assert.equal(v.allowed, true);
});

test("Engine bloqueia ShellExecutor por padrao mesmo registrado explicitamente (nao chama executor)", async () => {
  const root = tempRoot();
  const original = process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;
  delete process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;
  try {
    const orc = new TaskOrchestrator(root);
    const mission = {
      id: "test-shell-block-1",
      goalId: "g1",
      order: 1,
      title: "Missao shell",
      intent: "rodar comando de shell",
      executorId: "local-shell",
      type: "config",
      status: "active" as const,
      dependsOn: [],
      classification: "READ_ONLY",
    };
    const o = orc.create(mission);
    // Forca o primeiro step a apontar para o local-shell.
    o.steps[0].executor = "local-shell";
    o.steps[0].prompt = "git status";

    let executorCalled = false;
    const shellExecutor = new ShellExecutor();
    const origExecute = shellExecutor.execute.bind(shellExecutor);
    shellExecutor.execute = async (cmd) => {
      executorCalled = true;
      return origExecute(cmd);
    };

    const reg = new SimpleRegistry([shellExecutor]);
    const engine = new ExecutionEngine(orc, reg, new PolicyEngine());

    const result = await engine.runOnce();
    assert.ok(result);
    assert.equal(result.result.success, false);
    assert.ok(result.result.error?.includes("desabilitado por padrao"));
    assert.equal(executorCalled, false, "ShellExecutor nao deve ser chamado sem a flag explicita");

    const updated = orc.get(o.id);
    assert.ok(updated);
    assert.equal(updated.steps[0].status, "failed");
  } finally {
    if (original !== undefined) process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED = original;
    clean(root);
  }
});

// ── Parte 4: PolicyEngine forte (READ_ONLY / SAFE_WRITE / GIT / DEPLOY / SECRETS) ──

test("READ_ONLY bloqueia escrita (SAFE_WRITE) via ModePolicy", () => {
  const p = new ModePolicy();
  const v = p.evaluate(makeCmd({ mode: "SAFE_WRITE" }), makeCtx({ kernelMode: "READ_ONLY" }));
  assert.equal(v.allowed, false);
});

test("READ_ONLY bloqueia shell (ShellPolicy nega mesmo com flag, pois exige EXECUTE_APPROVED)", () => {
  const original = process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;
  process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED = "1";
  try {
    const p = new ShellPolicy();
    const v = p.evaluate(makeCmd({ executor: "local-shell", mode: "READ_ONLY" }), makeCtx({ kernelMode: "READ_ONLY" }));
    assert.equal(v.allowed, false);
  } finally {
    if (original === undefined) delete process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;
    else process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED = original;
  }
});

test("SAFE_WRITE permite apenas acoes seguras (commit local ok, push bloqueado)", () => {
  const gitPolicy = new GitPolicy();
  const commitVerdict = gitPolicy.evaluate(
    makeCmd({ mode: "SAFE_WRITE", prompt: "preparar e revisar commit local" }),
    makeCtx({ kernelMode: "SAFE_WRITE" }),
  );
  assert.equal(commitVerdict.allowed, true, "commit local nao e bloqueado pelo GitPolicy");

  const pushVerdict = gitPolicy.evaluate(
    makeCmd({ mode: "SAFE_WRITE", prompt: "rodar git push para o remoto" }),
    makeCtx({ kernelMode: "SAFE_WRITE" }),
  );
  assert.equal(pushVerdict.allowed, false, "push exige aprovacao humana mesmo em SAFE_WRITE");
});

test("EXECUTE_APPROVED ainda exige policy explicita para shell (flag ausente continua bloqueando)", () => {
  const original = process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;
  delete process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED;
  try {
    const p = new ShellPolicy();
    const v = p.evaluate(makeCmd({ executor: "local-shell", mode: "READ_ONLY" }), makeCtx({ kernelMode: "EXECUTE_APPROVED" }));
    assert.equal(v.allowed, false);
    assert.ok(v.reason?.includes("desabilitado por padrao"));
  } finally {
    if (original !== undefined) process.env.JOEFELIPE_SHELL_EXECUTION_ENABLED = original;
  }
});

test("GitPolicy bloqueia push/merge por padrao mesmo em SAFE_WRITE", () => {
  const p = new GitPolicy();
  const push = p.evaluate(makeCmd({ prompt: "fazer push da branch" }), makeCtx({ kernelMode: "SAFE_WRITE" }));
  assert.equal(push.allowed, false);
  assert.equal(push.requiredMode, "HUMAN_APPROVAL_REQUIRED");

  const merge = p.evaluate(makeCmd({ prompt: "fazer merge da branch" }), makeCtx({ kernelMode: "SAFE_WRITE" }));
  assert.equal(merge.allowed, false);
});

test("GitPolicy permite push/merge apenas com HUMAN_APPROVAL_REQUIRED ou EXECUTE_APPROVED", () => {
  const p = new GitPolicy();
  const withApproval = p.evaluate(makeCmd({ prompt: "fazer push da branch" }), makeCtx({ kernelMode: "HUMAN_APPROVAL_REQUIRED" }));
  assert.equal(withApproval.allowed, true);

  const withExecuteApproved = p.evaluate(makeCmd({ prompt: "fazer push da branch" }), makeCtx({ kernelMode: "EXECUTE_APPROVED" }));
  assert.equal(withExecuteApproved.allowed, true);
});

test("DeployPolicy bloqueia deploy por padrao (so libera com EXECUTE_APPROVED)", () => {
  const p = new DeployPolicy();
  const denied = p.evaluate(makeCmd({ prompt: "rodar deploy em producao" }), makeCtx({ kernelMode: "SAFE_WRITE" }));
  assert.equal(denied.allowed, false);
  assert.equal(denied.requiredMode, "EXECUTE_APPROVED");

  const allowed = p.evaluate(makeCmd({ prompt: "rodar deploy em producao" }), makeCtx({ kernelMode: "EXECUTE_APPROVED" }));
  assert.equal(allowed.allowed, true);
});

test("SecretsPolicy bloqueia termo 'secret' SEMPRE, mesmo em EXECUTE_APPROVED", () => {
  const p = new SecretsPolicy();
  const v = p.evaluate(makeCmd({ prompt: "ler o arquivo de secret da aplicacao" }), makeCtx({ kernelMode: "EXECUTE_APPROVED" }));
  assert.equal(v.allowed, false);
});

test("SecretsPolicy bloqueia workingDirectory sensivel (.env) SEMPRE", () => {
  const p = new SecretsPolicy();
  const v = p.evaluate(makeCmd({ workingDirectory: "/repo/.env" }), makeCtx({ kernelMode: "EXECUTE_APPROVED" }));
  assert.equal(v.allowed, false);
});

test("SecretsPolicy bloqueia environment customizado (risco de vazamento)", () => {
  const p = new SecretsPolicy();
  const v = p.evaluate(makeCmd({ environment: { API_KEY: "x" } }), makeCtx({ kernelMode: "EXECUTE_APPROVED" }));
  assert.equal(v.allowed, false);
});

test("SecretsPolicy permite prompt/ambiente limpos", () => {
  const p = new SecretsPolicy();
  const v = p.evaluate(makeCmd({ prompt: "apenas ler documentacao" }), makeCtx());
  assert.equal(v.allowed, true);
});

// ── Fase 9.19: ExternalCallPolicy ────────────────────────────────────────
// So se aplica quando ha chamada externa de LLM de fato habilitada
// (JOEFELIPE_LLM_PROVIDER=openrouter + chave) — sem isso, e no-op.

function withExternalCallsEnabled<T>(fn: () => T): T {
  const originalProvider = process.env.JOEFELIPE_LLM_PROVIDER;
  const originalKey = process.env.OPENROUTER_API_KEY;
  process.env.JOEFELIPE_LLM_PROVIDER = "openrouter";
  process.env.OPENROUTER_API_KEY = "sk-fake-key-for-policy-test";
  try {
    return fn();
  } finally {
    if (originalProvider === undefined) delete process.env.JOEFELIPE_LLM_PROVIDER;
    else process.env.JOEFELIPE_LLM_PROVIDER = originalProvider;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalKey;
  }
}

test("ExternalCallPolicy: no-op quando chamada externa nao esta habilitada (sem provider/chave configurados)", () => {
  const original = process.env.JOEFELIPE_LLM_PROVIDER;
  delete process.env.JOEFELIPE_LLM_PROVIDER;
  try {
    const p = new ExternalCallPolicy();
    const v = p.evaluate(
      makeCmd({ mode: "READ_ONLY", prompt: "analisar arquitetura atual", metadata: { type: "analyze" } }),
      makeCtx({ kernelMode: "READ_ONLY", stepType: "analyze" }),
    );
    assert.equal(v.allowed, true, "sem chamada externa habilitada, nada deveria ser bloqueado (mesmo comportamento de sempre)");
  } finally {
    if (original !== undefined) process.env.JOEFELIPE_LLM_PROVIDER = original;
  }
});

test("ExternalCallPolicy: nao interfere em steps que nao sao analyze/plan/report", () => {
  withExternalCallsEnabled(() => {
    const p = new ExternalCallPolicy();
    const v = p.evaluate(
      makeCmd({ mode: "SAFE_WRITE", prompt: "implementar a funcionalidade", metadata: { type: "implement" } }),
      makeCtx({ kernelMode: "READ_ONLY", stepType: "implement" }),
    );
    assert.equal(v.allowed, true);
  });
});

test("ExternalCallPolicy: bloqueia chamada externa fora de HUMAN_APPROVAL_REQUIRED/EXECUTE_APPROVED", () => {
  withExternalCallsEnabled(() => {
    const p = new ExternalCallPolicy();

    const underReadOnly = p.evaluate(
      makeCmd({ mode: "READ_ONLY", prompt: "analisar o estado atual do projeto", metadata: { type: "analyze" } }),
      makeCtx({ kernelMode: "READ_ONLY", stepType: "analyze" }),
    );
    assert.equal(underReadOnly.allowed, false);
    assert.ok(underReadOnly.reason?.includes("aprovacao humana"));

    const underSafeWrite = p.evaluate(
      makeCmd({ mode: "READ_ONLY", prompt: "planejar a proxima etapa", metadata: { type: "plan" } }),
      makeCtx({ kernelMode: "SAFE_WRITE", stepType: "plan" }),
    );
    assert.equal(underSafeWrite.allowed, false);
  });
});

test("ExternalCallPolicy: permite chamada externa em HUMAN_APPROVAL_REQUIRED ou EXECUTE_APPROVED", () => {
  withExternalCallsEnabled(() => {
    const p = new ExternalCallPolicy();

    const humanApproval = p.evaluate(
      makeCmd({ mode: "READ_ONLY", prompt: "gerar relatorio de resultados", metadata: { type: "report" } }),
      makeCtx({ kernelMode: "HUMAN_APPROVAL_REQUIRED", stepType: "report" }),
    );
    assert.equal(humanApproval.allowed, true);

    const executeApproved = p.evaluate(
      makeCmd({ mode: "READ_ONLY", prompt: "analisar o estado atual", metadata: { type: "analyze" } }),
      makeCtx({ kernelMode: "EXECUTE_APPROVED", stepType: "analyze" }),
    );
    assert.equal(executeApproved.allowed, true);
  });
});

test("ExternalCallPolicy: bloqueia termos sensiveis (dangerous) mesmo em EXECUTE_APPROVED (sem bypass, diferente da SafetyPolicy)", () => {
  withExternalCallsEnabled(() => {
    const p = new ExternalCallPolicy();
    const v = p.evaluate(
      makeCmd({ mode: "READ_ONLY", prompt: "analisar como fazer deploy em producao", metadata: { type: "analyze" } }),
      makeCtx({ kernelMode: "EXECUTE_APPROVED", stepType: "analyze" }),
    );
    assert.equal(v.allowed, false, "termo 'deploy' (dangerous) nunca deveria ser permitido, mesmo em EXECUTE_APPROVED");
    assert.ok(v.reason?.includes("deploy"));
  });
});

test("erro de policy (excecao) vira StepResult failed, nao derruba o engine", async () => {
  const root = tempRoot();
  try {
    const orc = new TaskOrchestrator(root);
    const mission = {
      id: "test-policy-throw-1",
      goalId: "g1",
      order: 1,
      title: "Missao com policy quebrada",
      intent: "testar resiliencia a excecao de policy",
      executorId: "noop",
      type: "audit",
      status: "active" as const,
      dependsOn: [],
      classification: "READ_ONLY",
    };
    orc.create(mission);

    const throwingPolicy = {
      name: "ThrowingPolicy",
      evaluate: (): never => {
        throw new Error("policy quebrada de proposito");
      },
    };
    const reg = new SimpleRegistry();
    const engine = new ExecutionEngine(orc, reg, new PolicyEngine([throwingPolicy]));

    const result = await engine.runOnce();
    assert.ok(result);
    assert.equal(result.result.success, false);
    assert.ok(result.result.error?.includes("policy quebrada de proposito"));
  } finally {
    clean(root);
  }
});