import type { ExecutionCommand, StepResult, Executor, ExecutorRegistry } from "./types.ts"
import type { TaskOrchestrator } from "../orchestrator/TaskOrchestrator.ts"
import type { OrchestrationStep, Orchestration } from "../orchestrator/types.ts"
import type { PolicyContext, PolicyVerdict } from "./policy/types.ts"
import { PolicyEngine } from "./policy/PolicyEngine.ts"
import { NoopExecutor } from "./executors/NoopExecutor.ts"
import { HumanExecutor } from "./executors/HumanExecutor.ts"
import { ClaudeExecutor } from "./executors/ClaudeExecutor.ts"
import { OpenCodeExecutor } from "./executors/OpenCodeExecutor.ts"
import { ExecutorNotFoundError } from "./errors.ts"
import { ExecutionStateStore } from "./ExecutionStateStore.ts"
import type { EventStore } from "../events/EventStore.ts"
import type { Kernel } from "../kernel/Kernel.ts"

// ShellExecutor NAO entra nos defaults: executa comandos reais (mesmo que
// restritos por whitelist) e so deve ser usado quando registrado
// explicitamente pelo chamador. Mesmo assim, o PolicyEngine (ShellPolicy)
// bloqueia por padrao qualquer step roteado para "local-shell".
const DEFAULT_EXECUTORS: Executor[] = [
  new NoopExecutor(),
  new HumanExecutor(),
  new ClaudeExecutor(),
  new OpenCodeExecutor(),
]

export class SimpleRegistry implements ExecutorRegistry {
  private executors: Map<string, Executor>

  constructor(extras: Executor[] = []) {
    this.executors = new Map()
    for (const ex of [...DEFAULT_EXECUTORS, ...extras]) {
      this.executors.set(ex.id, ex)
    }
  }

  /** Fallback tolerante: id desconhecido cai para noop (usado por chamadores legados). */
  resolve(command: ExecutionCommand): Executor {
    const ex = this.executors.get(command.executor)
    if (ex && ex.canHandle(command)) return ex
    const fallback = this.executors.get("noop")
    if (fallback) return fallback
    return new NoopExecutor()
  }

  /** Resolucao estrita: sem match exato, falha com erro claro (sem fallback silencioso). */
  resolveStrict(command: ExecutionCommand): Executor {
    const ex = this.executors.get(command.executor)
    if (ex && ex.canHandle(command)) return ex
    throw new ExecutorNotFoundError(command.executor)
  }

  list(): string[] {
    return Array.from(this.executors.keys())
  }
}

type PersistedStatus = "running" | "completed" | "failed" | "aborted"

export class ExecutionEngine {
  private orchestrator: TaskOrchestrator
  private registry: ExecutorRegistry
  private policyEngine: PolicyEngine
  private kernel: Kernel | null
  private eventStore: EventStore | null
  private stateStore: ExecutionStateStore | null
  private running = false
  private abortRequested = false
  private currentStepId: string | null = null
  private lastResult: StepResult | null = null
  private lastVerdict: PolicyVerdict | null = null

  constructor(
    orchestrator: TaskOrchestrator,
    registry?: ExecutorRegistry,
    policyEngine?: PolicyEngine,
    kernel?: Kernel,
    eventStore?: EventStore,
    stateStore?: ExecutionStateStore,
  ) {
    this.orchestrator = orchestrator
    this.registry = registry ?? new SimpleRegistry()
    this.policyEngine = policyEngine ?? new PolicyEngine()
    this.kernel = kernel ?? null
    this.eventStore = eventStore ?? null
    this.stateStore = stateStore ?? null
  }

  get status() {
    return {
      running: this.running,
      abortRequested: this.abortRequested,
      currentStepId: this.currentStepId,
      lastResult: this.lastResult,
      lastVerdict: this.lastVerdict,
      executors: this.registry.list(),
    }
  }

  private buildPolicyContext(step: OrchestrationStep): PolicyContext {
    if (this.kernel) {
      return {
        kernelMode: this.kernel.context.getMode(),
        canExecute: this.kernel.permissions.canExecute(),
        requiresHumanApproval: this.kernel.permissions.requiresHumanApproval(),
        stepType: step.type,
      }
    }
    return {
      kernelMode: "SAFE_WRITE",
      canExecute: false,
      requiresHumanApproval: false,
      stepType: step.type,
    }
  }

  // ── Eventos (best-effort; nunca derruba a execucao) ─────────────────────
  // Payload nunca inclui environment/prompt completo/secrets — apenas
  // identificadores e metadados curtos e seguros.
  private emitEvent(
    type: string,
    severity: "info" | "warning" | "critical",
    summary: string,
    payload: Record<string, unknown>,
  ): void {
    if (!this.eventStore) return
    try {
      this.eventStore.create(type, "execution:engine", severity, summary, payload)
    } catch {
      /* best-effort */
    }
  }

  // ── Estado persistido ────────────────────────────────────────────────────
  private buildSnapshot(orc: Orchestration, status: PersistedStatus, error?: string) {
    const prev = this.stateStore?.load()
    const now = new Date().toISOString()
    return {
      orchestrationId: orc.id,
      missionId: orc.missionId,
      status,
      abortRequested: this.abortRequested,
      currentStepId: this.currentStepId,
      steps: orc.steps.map((s) => ({
        id: s.id,
        order: s.order,
        title: s.title,
        type: s.type,
        status: s.status,
        executor: s.executor,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        result: s.result,
        error: s.error,
      })),
      startedAt: prev && prev.orchestrationId === orc.id ? prev.startedAt : now,
      updatedAt: now,
      completedAt: status !== "running" ? now : undefined,
      error,
    }
  }

  private persistState(orc: Orchestration, status: PersistedStatus, error?: string): void {
    if (!this.stateStore) return
    this.stateStore.save(this.buildSnapshot(orc, status, error))
  }

  /** True se abort foi pedido (em memoria OU persistido para esta mesma orquestracao). */
  private checkAbort(orc: Orchestration): boolean {
    if (this.abortRequested) return true
    if (this.stateStore) {
      const persisted = this.stateStore.load()
      if (persisted && persisted.orchestrationId === orc.id && persisted.abortRequested) {
        this.abortRequested = true
        return true
      }
    }
    return false
  }

  async runOnce(): Promise<{ step: unknown; result: StepResult } | null> {
    const activeBefore = this.orchestrator.active()
    if (activeBefore && this.checkAbort(activeBefore)) {
      return null
    }

    const { step, orchestration: orc } = this.orchestrator.nextStep()
    if (!step || !orc) return null

    this.currentStepId = step.id
    this.running = true

    const cmd: ExecutionCommand = this.orchestrator.buildCommand(step)
    this.orchestrator.markWaiting(step.id)

    const ctx = this.buildPolicyContext(step as OrchestrationStep)
    let verdict: PolicyVerdict
    try {
      verdict = this.policyEngine.evaluate(cmd, ctx)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      verdict = { allowed: false, reason: "Policy lancou excecao: " + message }
    }
    this.lastVerdict = verdict

    if (!verdict.allowed) {
      const reason = "[Policy] " + (verdict.reason ?? "negado pela policy")
      const failResult: StepResult = { success: false, error: reason, metadata: { policy: "ExecutionPolicyChain" } }
      this.orchestrator.failStep(step.id, failResult.error)
      this.emitEvent("policy_denied", "warning", "Policy negou o step " + step.id, {
        orchestrationId: orc.id,
        missionId: orc.missionId,
        stepId: step.id,
        stepType: step.type,
        reason: verdict.reason,
        requiredMode: verdict.requiredMode,
      })
      this.lastResult = failResult
      this.currentStepId = null
      this.running = false
      this.persistState(orc, "failed", failResult.error)
      return { step, result: failResult }
    }

    this.orchestrator.markRunning(step.id)
    this.emitEvent("step_started", "info", "Step " + step.id + " iniciado", {
      orchestrationId: orc.id,
      missionId: orc.missionId,
      stepId: step.id,
      stepType: step.type,
    })
    this.persistState(orc, "running")

    const startedAt = Date.now()
    let executor: Executor
    try {
      executor = this.registry.resolveStrict(cmd)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const failResult: StepResult = { success: false, error: message, metadata: { commandId: cmd.id } }
      this.orchestrator.failStep(step.id, message)
      this.emitEvent("executor_error", "critical", "Executor nao resolvido para o step " + step.id, {
        orchestrationId: orc.id,
        missionId: orc.missionId,
        stepId: step.id,
        executor: cmd.executor,
        error: message,
      })
      this.lastResult = failResult
      this.currentStepId = null
      this.running = false
      this.persistState(orc, "failed", message)
      return { step, result: failResult }
    }

    this.emitEvent("executor_resolved", "info", "Executor " + executor.id + " resolvido para o step " + step.id, {
      orchestrationId: orc.id,
      missionId: orc.missionId,
      stepId: step.id,
      executor: executor.id,
    })

    let result: StepResult
    try {
      result = await executor.execute(cmd)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      result = {
        success: false,
        error: "[Executor:" + executor.id + "] " + message,
        metadata: { executor: executor.id, commandId: cmd.id },
      }
      this.emitEvent("executor_error", "critical", "Executor " + executor.id + " lancou excecao no step " + step.id, {
        orchestrationId: orc.id,
        missionId: orc.missionId,
        stepId: step.id,
        executor: executor.id,
        error: message,
      })
    }

    const durationMs = Date.now() - startedAt
    const pendingHuman = !result.success && result.metadata?.pending === "true"

    if (pendingHuman) {
      // Nao e falha terminal: pausa o step aguardando approve-step/reject-step.
      // A orquestracao segue com status "running".
      this.orchestrator.markWaitingHuman(step.id)
      step.error = result.error
      this.emitEvent("step_started", "info", "Step " + step.id + " aguardando aprovacao humana", {
        orchestrationId: orc.id,
        missionId: orc.missionId,
        stepId: step.id,
        executor: executor.id,
        durationMs,
      })
      this.lastResult = result
      this.currentStepId = null
      this.running = false
      this.persistState(orc, "running")
      return { step, result }
    }

    step.result = result.result
    step.error = result.error

    if (result.success) {
      this.orchestrator.completeStep(step.id)
      this.emitEvent("step_completed", "info", "Step " + step.id + " concluido", {
        orchestrationId: orc.id,
        missionId: orc.missionId,
        stepId: step.id,
        executor: executor.id,
        durationMs,
      })
    } else {
      this.orchestrator.failStep(step.id, result.error)
      this.emitEvent("step_failed", "warning", "Step " + step.id + " falhou", {
        orchestrationId: orc.id,
        missionId: orc.missionId,
        stepId: step.id,
        executor: executor.id,
        durationMs,
        error: result.error,
      })
    }

    this.lastResult = result
    this.currentStepId = null
    this.running = false
    this.persistState(orc, result.success ? "running" : "failed", result.success ? undefined : result.error)

    return { step, result }
  }

  async runAll(): Promise<StepResult[]> {
    this.abortRequested = false
    const results: StepResult[] = []

    const initialOrc = this.orchestrator.active()
    if (initialOrc) {
      this.persistState(initialOrc, "running")
      this.emitEvent("execution_started", "info", "Execucao iniciada para orquestracao " + initialOrc.id, {
        orchestrationId: initialOrc.id,
        missionId: initialOrc.missionId,
        stepCount: initialOrc.steps.length,
      })
    }

    let res = await this.runOnce()
    while (res) {
      results.push(res.result)
      if (!res.result.success) break
      if (this.abortRequested) break
      res = await this.runOnce()
    }

    this.running = false

    const finalOrc = initialOrc ? this.orchestrator.get(initialOrc.id) : null
    if (finalOrc) {
      if (this.abortRequested) {
        this.persistState(finalOrc, "aborted")
        this.emitEvent("execution_aborted", "warning", "Execucao abortada para orquestracao " + finalOrc.id, {
          orchestrationId: finalOrc.id,
          missionId: finalOrc.missionId,
        })
      } else if (finalOrc.status === "completed") {
        this.emitEvent("execution_completed", "info", "Execucao concluida para orquestracao " + finalOrc.id, {
          orchestrationId: finalOrc.id,
          missionId: finalOrc.missionId,
          stepCount: finalOrc.steps.length,
        })
        this.stateStore?.clear()
      } else if (finalOrc.status === "failed") {
        const lastError = results.length ? results[results.length - 1].error : undefined
        this.persistState(finalOrc, "failed", lastError)
        this.emitEvent("execution_failed", "critical", "Execucao falhou para orquestracao " + finalOrc.id, {
          orchestrationId: finalOrc.id,
          missionId: finalOrc.missionId,
          error: lastError,
        })
      } else {
        this.persistState(finalOrc, "running")
      }
    }

    return results
  }

  abort(): void {
    this.abortRequested = true
    this.running = false
    const orc = this.orchestrator.active()
    if (orc) {
      this.persistState(orc, "aborted")
    } else {
      this.stateStore?.markAbortRequested()
    }
  }
}
