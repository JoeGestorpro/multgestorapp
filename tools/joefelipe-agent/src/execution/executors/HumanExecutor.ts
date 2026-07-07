import type { ExecutionCommand, StepResult, Executor } from "../types.ts"

// Executor para steps do tipo "approval" (aguardar decisao humana).
// Nunca executa nada: apenas sinaliza que o step depende do ApprovalManager
// (approval approve/reject via CLI) para avancar.
export class HumanExecutor implements Executor {
  readonly id = "human"

  canHandle(command: ExecutionCommand): boolean {
    return command.executor === "human"
  }

  execute(command: ExecutionCommand): Promise<StepResult> {
    return Promise.resolve({
      success: false,
      error: "Aguardando aprovacao humana. Use: tsx src/index.ts approval approve <id>",
      metadata: { executor: "human", commandId: command.id, pending: "true" },
    })
  }
}
