import type { ExecutionCommand, StepResult } from "../types.ts"
import type { ExecutorDriver } from "./types.ts"
import { DriverRegistry } from "./DriverRegistry.ts"
import { StubDriver } from "./StubDriver.ts"

/**
 * Resolve e executa o driver ativo para um id de tecnologia (ex.:
 * "claude-code"), sempre validando health() antes de usar. Um driver real
 * indisponivel (nao instalado, sem chave, versao incompativel) NUNCA trava
 * o pipeline: o manager cai para um StubDriver seguro em vez de propagar o
 * erro — a falha vira um resultado simulado, nao uma excecao de infra.
 */
export class DriverManager {
  private registry: DriverRegistry
  private fallback: ExecutorDriver

  constructor(registry: DriverRegistry, fallbackId: string) {
    this.registry = registry
    this.fallback = new StubDriver(fallbackId)
  }

  async resolve(preferredId: string): Promise<ExecutorDriver> {
    const driver = this.registry.get(preferredId)
    if (!driver) return this.fallback

    try {
      const health = await driver.health()
      if (!health.available) return this.fallback
      return driver
    } catch {
      return this.fallback
    }
  }

  async execute(preferredId: string, command: ExecutionCommand): Promise<StepResult> {
    const driver = await this.resolve(preferredId)
    return driver.execute(command)
  }
}
