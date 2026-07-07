import type { ExecutionCommand } from "../types.ts"
import type { ExecutionPolicy, PolicyContext, PolicyVerdict } from "./types.ts"
import { detectSensitiveHits } from "../../llm/sensitive.ts"
import { isAlwaysForbidden } from "../../mission/scope.ts"
import { isSensitivePath } from "../../readers.ts"
import { loadLlmConfig } from "../../llm/llm-config.ts"

// ── ModePolicy ───────────────────────────────────────────────────────────
// Garante que o ExecutionMode é compatível com o KernelMode atual.
// Mínimos: READ_ONLY → kernel >= READ_ONLY, SAFE_WRITE → kernel >= SAFE_WRITE
const MODE_REQUIREMENTS: Record<string, string[]> = {
  READ_ONLY:  ["READ_ONLY", "PLAN_ONLY", "SAFE_WRITE", "HUMAN_APPROVAL_REQUIRED", "EXECUTE_APPROVED"],
  SAFE_WRITE: ["SAFE_WRITE", "HUMAN_APPROVAL_REQUIRED", "EXECUTE_APPROVED"],
  FULL_WRITE: ["EXECUTE_APPROVED"],
}

export class ModePolicy implements ExecutionPolicy {
  readonly name = "ModePolicy"

  evaluate(cmd: ExecutionCommand, ctx: PolicyContext): PolicyVerdict {
    if (ctx.kernelMode === "LOCKED") {
      return { allowed: false, reason: "Kernel esta LOCKED. Nenhuma execucao permitida.", requiredMode: "SAFE_WRITE" }
    }

    const allowedModes = MODE_REQUIREMENTS[cmd.mode]
    if (!allowedModes) {
      return { allowed: false, reason: "Modo de execucao desconhecido: " + cmd.mode }
    }

    if (allowedModes.includes(ctx.kernelMode)) {
      return { allowed: true }
    }

    const req = cmd.mode === "FULL_WRITE" ? "EXECUTE_APPROVED" : cmd.mode === "SAFE_WRITE" ? "SAFE_WRITE" : "READ_ONLY"
    return { allowed: false, reason: "Kernel em modo " + ctx.kernelMode + " nao permite " + cmd.mode, requiredMode: req }
  }
}

// ── StepTypePolicy ────────────────────────────────────────────────────────
// Bloqueia tipos de step perigosos quando o kernel esta em modo baixo.
const DANGEROUS_STEP_TYPES = new Set(["commit", "implement", "test"])
const REQUIRED_FOR_DANGEROUS = "SAFE_WRITE"

export class StepTypePolicy implements ExecutionPolicy {
  readonly name = "StepTypePolicy"

  evaluate(_cmd: ExecutionCommand, ctx: PolicyContext): PolicyVerdict {
    if (!DANGEROUS_STEP_TYPES.has(ctx.stepType)) {
      return { allowed: true }
    }

    const okModes = ["SAFE_WRITE", "HUMAN_APPROVAL_REQUIRED", "EXECUTE_APPROVED"]
    if (okModes.includes(ctx.kernelMode)) {
      return { allowed: true }
    }

    return { allowed: false, reason: "Step tipo '" + ctx.stepType + "' requer modo " + REQUIRED_FOR_DANGEROUS + ", atual: " + ctx.kernelMode, requiredMode: REQUIRED_FOR_DANGEROUS }
  }
}

// ── SafetyPolicy ──────────────────────────────────────────────────────────
// Reusa detectSensitiveHits para bloquear termos perigosos no prompt.
export class SafetyPolicy implements ExecutionPolicy {
  readonly name = "SafetyPolicy"

  evaluate(cmd: ExecutionCommand, ctx: PolicyContext): PolicyVerdict {
    if (cmd.mode === "READ_ONLY") {
      return { allowed: true }
    }

    const hits = detectSensitiveHits(cmd.prompt)
    const dangerous = hits.filter((h) => h.severity === "dangerous")
    if (dangerous.length === 0) {
      return { allowed: true }
    }

    if (ctx.kernelMode === "EXECUTE_APPROVED") {
      return { allowed: true }
    }

    const terms = dangerous.map((h) => h.label).join(", ")
    return { allowed: false, reason: "Termos perigosos detectados no prompt: " + terms + ". Requer modo EXECUTE_APPROVED.", requiredMode: "EXECUTE_APPROVED" }
  }
}

// ── ExternalCallPolicy ────────────────────────────────────────────────────
// Fase 9.19: cobre um risco que nenhuma policy anterior cobria — uma chamada
// real para uma API externa de LLM (custo, vazamento de prompt/codigo para
// fora). So se aplica a steps candidatos a chamada externa real (analyze/
// plan/report — os unicos aceitos pelo OpenRouterTextDriver) e SOMENTE
// quando ha de fato uma chamada externa habilitada (JOEFELIPE_LLM_PROVIDER=
// openrouter + chave). Sem isso, e no-op — nenhum comportamento muda para
// quem nunca configurou um provider real (o caminho simulado via StubDriver
// continua identico a antes).
//
// Diferente da SafetyPolicy, NAO tem bypass para ExecutionMode.READ_ONLY:
// mesmo um step "so leitura" pode vazar o prompt para uma API de terceiros,
// entao esse risco e independente de escrever ou nao em disco.
const EXTERNAL_CALL_STEP_TYPES = new Set(["analyze", "plan", "report"])
const EXTERNAL_CALL_OK_MODES = new Set(["HUMAN_APPROVAL_REQUIRED", "EXECUTE_APPROVED"])

export class ExternalCallPolicy implements ExecutionPolicy {
  readonly name = "ExternalCallPolicy"

  evaluate(cmd: ExecutionCommand, ctx: PolicyContext): PolicyVerdict {
    if (!EXTERNAL_CALL_STEP_TYPES.has(ctx.stepType)) {
      return { allowed: true }
    }

    if (!loadLlmConfig().externalCallsEnabled) {
      return { allowed: true }
    }

    // Termos sensiveis (mesma classificacao da SafetyPolicy) SEMPRE bloqueiam
    // aqui, mesmo em EXECUTE_APPROVED — diferente da SafetyPolicy, que abre
    // excecao para EXECUTE_APPROVED (aceitavel para escrita local; nao para
    // mandar o prompt para uma API externa).
    const dangerous = detectSensitiveHits(cmd.prompt).filter((h) => h.severity === "dangerous")
    if (dangerous.length > 0) {
      const terms = dangerous.map((h) => h.label).join(", ")
      return {
        allowed: false,
        reason: "Chamada externa de LLM bloqueada: termos sensiveis no prompt (" + terms + "). Nunca permitido, em nenhum modo.",
      }
    }

    if (EXTERNAL_CALL_OK_MODES.has(ctx.kernelMode)) {
      return { allowed: true }
    }

    return {
      allowed: false,
      reason: "Chamada externa de LLM requer aprovacao humana explicita (HUMAN_APPROVAL_REQUIRED ou EXECUTE_APPROVED). Kernel atual: " + ctx.kernelMode + ".",
      requiredMode: "HUMAN_APPROVAL_REQUIRED",
    }
  }
}

// ── ShellPolicy ───────────────────────────────────────────────────────────
// ShellExecutor ("local-shell") fica bloqueado por padrao nesta fase, mesmo
// que a CommandValidator (whitelist) aceite o comando. So permite execucao
// real se HABILITADA explicitamente via env (opt-in) E com o kernel em
// EXECUTE_APPROVED. Sem a flag, nenhuma execucao de shell passa.
const SHELL_EXECUTOR_ID = "local-shell"
const SHELL_ENABLE_ENV = "JOEFELIPE_SHELL_EXECUTION_ENABLED"

export class ShellPolicy implements ExecutionPolicy {
  readonly name = "ShellPolicy"

  evaluate(cmd: ExecutionCommand, ctx: PolicyContext): PolicyVerdict {
    if (cmd.executor !== SHELL_EXECUTOR_ID) {
      return { allowed: true }
    }

    const explicitlyEnabled = process.env[SHELL_ENABLE_ENV] === "1"
    if (!explicitlyEnabled) {
      return {
        allowed: false,
        reason: "ShellExecutor desabilitado por padrao nesta fase. Defina " + SHELL_ENABLE_ENV + "=1 para habilitar explicitamente.",
        requiredMode: "EXECUTE_APPROVED",
      }
    }

    if (ctx.kernelMode !== "EXECUTE_APPROVED") {
      return {
        allowed: false,
        reason: "ShellExecutor requer kernel em EXECUTE_APPROVED mesmo com " + SHELL_ENABLE_ENV + "=1.",
        requiredMode: "EXECUTE_APPROVED",
      }
    }

    return { allowed: true }
  }
}

// ── GitPolicy ─────────────────────────────────────────────────────────────
// Acoes de git que afetam estado compartilhado/remoto (push, merge) exigem
// aprovacao humana explicita, mesmo em SAFE_WRITE. Commit local continua
// governado pela StepTypePolicy (SAFE_WRITE ja e suficiente para isso).
const GIT_GATE_LABELS = new Set(["push", "merge"])
const GIT_GATE_OK_MODES = new Set(["HUMAN_APPROVAL_REQUIRED", "EXECUTE_APPROVED"])

export class GitPolicy implements ExecutionPolicy {
  readonly name = "GitPolicy"

  evaluate(cmd: ExecutionCommand, ctx: PolicyContext): PolicyVerdict {
    const hits = detectSensitiveHits(cmd.prompt).filter((h) => GIT_GATE_LABELS.has(h.label))
    if (hits.length === 0) {
      return { allowed: true }
    }
    if (GIT_GATE_OK_MODES.has(ctx.kernelMode)) {
      return { allowed: true }
    }
    const terms = hits.map((h) => h.label).join(", ")
    return {
      allowed: false,
      reason: "Acao de git (" + terms + ") bloqueada por padrao. Requer aprovacao humana (HUMAN_APPROVAL_REQUIRED ou EXECUTE_APPROVED).",
      requiredMode: "HUMAN_APPROVAL_REQUIRED",
    }
  }
}

// ── DeployPolicy ──────────────────────────────────────────────────────────
// Deploy nunca e permitido por padrao; exige EXECUTE_APPROVED explicito.
export class DeployPolicy implements ExecutionPolicy {
  readonly name = "DeployPolicy"

  evaluate(cmd: ExecutionCommand, ctx: PolicyContext): PolicyVerdict {
    const hasDeploy = detectSensitiveHits(cmd.prompt).some((h) => h.label === "deploy")
    if (!hasDeploy) {
      return { allowed: true }
    }
    if (ctx.kernelMode === "EXECUTE_APPROVED") {
      return { allowed: true }
    }
    return {
      allowed: false,
      reason: "Deploy bloqueado por padrao. Requer modo EXECUTE_APPROVED explicito.",
      requiredMode: "EXECUTE_APPROVED",
    }
  }
}

// ── SecretsPolicy ─────────────────────────────────────────────────────────
// Secrets NUNCA sao permitidos, independente do modo do kernel (nem mesmo
// EXECUTE_APPROVED abre excecao). Cobre caminho de trabalho sensivel, termo
// "secret" no prompt e qualquer environment customizado (risco de vazamento).
export class SecretsPolicy implements ExecutionPolicy {
  readonly name = "SecretsPolicy"

  evaluate(cmd: ExecutionCommand, _ctx: PolicyContext): PolicyVerdict {
    if (isSensitivePath(cmd.workingDirectory)) {
      return { allowed: false, reason: "Caminho sensivel (secrets/credenciais) nunca e permitido, em nenhum modo." }
    }
    const hasSecret = detectSensitiveHits(cmd.prompt).some((h) => h.label === "secret")
    if (hasSecret) {
      return { allowed: false, reason: "Termo 'secret' detectado no prompt. Secrets nunca sao permitidos, em nenhum modo." }
    }
    if (Object.keys(cmd.environment ?? {}).length > 0) {
      return { allowed: false, reason: "Environment customizado nao e permitido (risco de vazamento de secrets)." }
    }
    return { allowed: true }
  }
}

// ── ScopePolicy ───────────────────────────────────────────────────────────
// Reusa isAlwaysForbidden para bloquear diretorios proibidos.
export class ScopePolicy implements ExecutionPolicy {
  readonly name = "ScopePolicy"

  evaluate(cmd: ExecutionCommand, _ctx: PolicyContext): PolicyVerdict {
    if (isAlwaysForbidden(cmd.workingDirectory)) {
      return { allowed: false, reason: "Diretorio proibido: " + cmd.workingDirectory }
    }
    return { allowed: true }
  }
}

// ── ExecutionPolicyChain ───────────────────────────────────────────────────
// Executa multiplas policies em ordem. Primeira negacao vence.
export class ExecutionPolicyChain implements ExecutionPolicy {
  readonly name = "ExecutionPolicyChain"
  private policies: ExecutionPolicy[]

  constructor(policies: ExecutionPolicy[]) {
    this.policies = policies
  }

  evaluate(cmd: ExecutionCommand, ctx: PolicyContext): PolicyVerdict {
    for (const p of this.policies) {
      const v = p.evaluate(cmd, ctx)
      if (!v.allowed) return v
    }
    return { allowed: true }
  }
}