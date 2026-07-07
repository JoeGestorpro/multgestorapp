import type { ExecutionCommand, StepResult, Executor } from "../types.ts"

export class NoopExecutor implements Executor {
  readonly id = "noop"

  canHandle(_command: ExecutionCommand): boolean {
    return true
  }

  execute(command: ExecutionCommand): Promise<StepResult> {
    return Promise.resolve({
      success: true,
      result: command.prompt,
      metadata: { executor: "noop", commandId: command.id },
    })
  }
}