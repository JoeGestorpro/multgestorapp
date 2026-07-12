// Fase 9.10 — Driver Control Center: torna a camada de Drivers (Fase 9.8)
// observavel via HTTP/UI, sempre consultando os drivers reais em tempo real
// (nunca um snapshot guardado em memoria) — nao ha estado duplicado aqui,
// so leitura ao vivo do mesmo DriverRegistry usado pelos Executors.

import { DriverRegistry } from "./DriverRegistry.ts"
import { StubDriver } from "./StubDriver.ts"
import { OpenRouterTextDriver } from "./OpenRouterTextDriver.ts"
import { OpenCodeDriver } from "./OpenCodeDriver.ts"
import { AiderDriver } from "./AiderDriver.ts"
import { CodexDriver } from "./CodexDriver.ts"
import type { DriverCapability } from "./types.ts"

/** Ids de driver conhecidos pelo Agent OS nesta fase (Claude Code, OpenCode,
 * Aider, Codex CLI). Novos drivers futuros devem ser adicionados aqui E em
 * createDefaultDriverRegistry() — unica fonte de verdade dos "slots". */
export const KNOWN_DRIVER_IDS = ["claude-code", "opencode", "aider", "codex-cli"] as const

/**
 * Registry padrao do processo: registra os drivers reais sob seus ids de
 * executor. Deve ser criado UMA vez por servidor/processo e reaproveitado
 * tanto pelos Executors (ClaudeExecutor/OpenCodeExecutor) quanto pela rota
 * HTTP de status — garantindo que a UI nunca mostre um estado diferente do
 * que sera de fato usado na execucao.
 *
 * Fase 9.19: o slot "claude-code" deixou de usar o ClaudeDriver placeholder
 * (fundacao para spawnar o Claude Code CLI real — Fase 9.8, ainda fora de
 * escopo) e passou a usar o OpenRouterTextDriver — um driver REAL, mas
 * restrito a steps de texto (analyze/plan/report). ClaudeDriver.ts continua
 * existindo e testado (PlaceholderDrivers.test.ts o testa direto), so nao e
 * mais o que roda de fato atras do executor "claude-code". opencode/aider/
 * codex-cli continuam como fundacao nao conectada.
 */
export function createDefaultDriverRegistry(): DriverRegistry {
  const registry = new DriverRegistry()
  registry.register(new OpenRouterTextDriver("claude-code"))
  registry.register(new OpenCodeDriver())
  registry.register(new AiderDriver())
  registry.register(new CodexDriver())
  return registry
}

export type DriverStatusLabel = "disponivel" | "indisponivel" | "erro"

export interface DriverStatusEntry {
  id: string
  name: string
  status: DriverStatusLabel
  available: boolean
  version: string | null
  capabilities: DriverCapability[]
  message: string | null
  /** Este e o driver configurado/preferido para este id (sempre true hoje —
   * os 4 ids conhecidos sempre tem um driver "padrao" registrado). */
  isDefault: boolean
  /** Se este driver especifico e o que de fato roda agora. Quando false, o
   * StubDriver (fallback) e quem executa de verdade (ver DriverManager). */
  active: boolean
}

export interface DriverFallbackInfo {
  id: string
  name: string
  version: string | null
  capabilities: DriverCapability[]
}

export interface DriverControlCenterStatus {
  drivers: DriverStatusEntry[]
  fallback: DriverFallbackInfo
}

async function describeDriver(registry: DriverRegistry, id: string): Promise<DriverStatusEntry> {
  const driver = registry.get(id)
  if (!driver) {
    return {
      id,
      name: "(nenhum driver registrado)",
      status: "indisponivel",
      available: false,
      version: null,
      capabilities: [],
      message: "Nenhum driver registrado para este id.",
      isDefault: false,
      active: false,
    }
  }

  try {
    const health = await driver.health()
    return {
      id,
      name: driver.constructor.name,
      status: health.available ? "disponivel" : "indisponivel",
      available: health.available,
      version: health.version,
      capabilities: health.capabilities,
      message: health.message ?? null,
      isDefault: true,
      active: health.available,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      id,
      name: driver.constructor.name,
      status: "erro",
      available: false,
      version: null,
      capabilities: [],
      message,
      isDefault: true,
      active: false,
    }
  }
}

/** Le o estado real (ao vivo) de todos os drivers conhecidos + o fallback
 * universal (StubDriver). Nunca lanca: qualquer falha de health() vira
 * status "erro" na entrada correspondente. */
export async function getDriverControlCenterStatus(registry: DriverRegistry): Promise<DriverControlCenterStatus> {
  const drivers = await Promise.all(KNOWN_DRIVER_IDS.map((id) => describeDriver(registry, id)))
  const stub = new StubDriver("stub")
  const stubHealth = await stub.health()
  return {
    drivers,
    fallback: { id: stub.id, name: "StubDriver", version: stubHealth.version, capabilities: stubHealth.capabilities },
  }
}
