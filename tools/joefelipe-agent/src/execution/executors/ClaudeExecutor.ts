import type { ExecutionCommand, StepResult, Executor } from "../types.ts"
import { DriverRegistry } from "../drivers/DriverRegistry.ts"
import { DriverManager } from "../drivers/DriverManager.ts"
import { StubDriver } from "../drivers/StubDriver.ts"

const EXECUTOR_ID = "claude-code"

/**
 * Executor = estrategia do Agent para o step "claude-code": decide SE um
 * comando pertence a ela (canHandle) e delega a execucao para o
 * DriverManager, que escolhe QUAL tecnologia (Driver) executa de fato. O
 * ExecutionEngine so conhece este Executor — nunca sabe se por tras ha um
 * driver simulado ou o Claude Code real.
 *
 * Sem um driver real registrado (ou com um indisponivel), o comportamento
 * e identico ao stub anterior: simula e devolve o prompt, sem chamada
 * externa. Para conectar um driver real, registre-o em um DriverRegistry
 * proprio e injete via construtor (ver DriverManager.ts para o racional de
 * fallback seguro).
 */
export class ClaudeExecutor implements Executor {
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
