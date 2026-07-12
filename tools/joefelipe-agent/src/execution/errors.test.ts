import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ExecutionError,
  PolicyDeniedError,
  ExecutorNotFoundError,
  AbortRequestedError,
  ApprovalRequiredError,
} from "./errors.ts";

test("ExecutionError e um Error com name proprio", () => {
  const e = new ExecutionError("falha generica");
  assert.ok(e instanceof Error);
  assert.equal(e.name, "ExecutionError");
  assert.equal(e.message, "falha generica");
});

test("PolicyDeniedError carrega motivo, policyName e requiredMode", () => {
  const e = new PolicyDeniedError("negado pela policy X", "SomePolicy", "EXECUTE_APPROVED");
  assert.ok(e instanceof ExecutionError);
  assert.equal(e.name, "PolicyDeniedError");
  assert.equal(e.policyName, "SomePolicy");
  assert.equal(e.requiredMode, "EXECUTE_APPROVED");
});

test("ExecutorNotFoundError inclui o id do executor na mensagem", () => {
  const e = new ExecutorNotFoundError("executor-fantasma");
  assert.ok(e instanceof ExecutionError);
  assert.equal(e.name, "ExecutorNotFoundError");
  assert.equal(e.executorId, "executor-fantasma");
  assert.ok(e.message.includes("executor-fantasma"));
});

test("AbortRequestedError tem mensagem clara de abort", () => {
  const e = new AbortRequestedError();
  assert.equal(e.name, "AbortRequestedError");
  assert.ok(e.message.toLowerCase().includes("abort"));
});

test("ApprovalRequiredError inclui o stepId na mensagem", () => {
  const e = new ApprovalRequiredError("step-123");
  assert.equal(e.name, "ApprovalRequiredError");
  assert.equal(e.stepId, "step-123");
  assert.ok(e.message.includes("step-123"));
});
