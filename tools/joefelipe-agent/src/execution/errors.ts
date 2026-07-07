// Erros padronizados do pipeline de execucao. Nunca devem escapar do
// ExecutionEngine sem contexto: o engine sempre os converte em StepResult
// estruturado antes de retornar ao chamador (CLI, testes, etc.).

export class ExecutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ExecutionError"
  }
}

export class PolicyDeniedError extends ExecutionError {
  readonly policyName?: string
  readonly requiredMode?: string

  constructor(reason: string, policyName?: string, requiredMode?: string) {
    super(reason)
    this.name = "PolicyDeniedError"
    this.policyName = policyName
    this.requiredMode = requiredMode
  }
}

export class ExecutorNotFoundError extends ExecutionError {
  readonly executorId: string

  constructor(executorId: string) {
    super("Executor nao encontrado: " + executorId + ". Nenhum fallback seguro disponivel.")
    this.name = "ExecutorNotFoundError"
    this.executorId = executorId
  }
}

export class AbortRequestedError extends ExecutionError {
  constructor() {
    super("Execucao abortada por solicitacao (abort persistente ou runtime).")
    this.name = "AbortRequestedError"
  }
}

export class ApprovalRequiredError extends ExecutionError {
  readonly stepId: string

  constructor(stepId: string) {
    super("Step " + stepId + " aguarda aprovacao humana antes de continuar.")
    this.name = "ApprovalRequiredError"
    this.stepId = stepId
  }
}
