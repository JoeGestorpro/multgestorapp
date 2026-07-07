import type { ExecutionCommand, StepResult, Executor } from "../types.ts"
import { DriverRegistry } from "../drivers/DriverRegistry.ts"
import { DriverManager } from "../drivers/DriverManager.ts"
import { StubDriver } from "../drivers/StubDriver.ts"

const EXECUTOR_ID = "opencode"

/**
 * Executor = estrategia do Agent para o step "opencode". Ver ClaudeExecutor.ts
 * para o racional completo da separacao Executor (estrategia) vs Driver
 * (tecnologia). Sem driver real registrado, comportamento identico ao stub
 * anterior.
 */
export class OpenCodeExecutor implements Executor {
  readonly id = EXECUTOR_ID
  private manager: DriverManager

  constructor(registry: DriverRegistry = new DriverRegistry()) {
    if (!registry.get(EXECUTOR_ID)) {
      registry.register(new StubDriver(EXECUTOR_ID))
    }
    this.manager = new DriverManager(registry, EXECUTOR_ID)
  }

  canHandle(command: ExecutionCommand): boolean {
    return command.executor === EXECUTOR_ID
  }

  execute(command: ExecutionCommand): Promise<StepResult> {
    return this.manager.execute(EXECUTOR_ID, command)
  }
}
