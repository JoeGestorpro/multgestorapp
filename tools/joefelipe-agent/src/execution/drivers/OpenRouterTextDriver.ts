import type { ExecutionCommand, StepResult } from "../types.ts"
import type { ExecutorDriver, DriverHealth, DriverCapability } from "./types.ts"
import { OpenRouterProvider } from "../../llm/providers/OpenRouterProvider.ts"
import { loadLlmConfig } from "../../llm/llm-config.ts"

/**
 * Fase 9.19 — driver real minimo de texto: reaproveita o OpenRouterProvider
 * ja testado (llm/providers/OpenRouterProvider.ts) para produzir uma
 * resposta REAL de LLM, mas SOMENTE para steps que sao puro texto (analyze/
 * plan/report — os unicos ja forcados a ExecutionMode.READ_ONLY por
 * TaskOrchestrator.buildCommand()). Nunca escreve arquivo, nunca chama
 * shell, nunca spawna Claude Code/OpenCode CLI real — isso continua sendo
 * ClaudeDriver/OpenCodeDriver (Fase 9.8), intencionalmente nao conectados.
 *
 * Registrado sob o id "claude-code" (ver DriverStatusService.createDefault-
 * DriverRegistry) — substitui o ClaudeDriver placeholder no MESMO registry
 * usado pelo ExecutionEngine, exatamente o mecanismo que DriverRegistry.ts
 * ja documenta ("registrar um id ja existente substitui o driver anterior").
 */
const ACCEPTED_STEP_TYPES = new Set(["analyze", "plan", "report"])

export class OpenRouterTextDriver implements ExecutorDriver {
  readonly id: string

  constructor(id = "claude-code") {
    this.id = id
  }

  async initialize(): Promise<void> {
    /* sem estado para inicializar; config/chave sao lidas sob demanda */
  }

  async health(): Promise<DriverHealth> {
    const config = loadLlmConfig()
    const capabilities: DriverCapability[] = ["read"]

    if (!config.externalCallsEnabled || !config.openRouterApiKey) {
      return {
        available: false,
        version: null,
        capabilities,
        message: "OpenRouterTextDriver indisponivel: configure o provider OpenRouter (JOEFELIPE_LLM_PROVIDER=openrouter) e a chave de acesso correspondente para ativar (ver .env.example).",
      }
    }

    return {
      available: true,
      version: config.openRouterModel ?? config.model,
      capabilities,
      message: "OpenRouterTextDriver conectado (Fase 9.19) — so aceita steps de texto (analyze/plan/report), nunca escreve arquivo nem chama shell.",
    }
  }

  supports(command: ExecutionCommand): boolean {
    return command.executor === this.id
  }

  async execute(command: ExecutionCommand): Promise<StepResult> {
    const stepType = String(command.metadata?.type ?? "")

    if (!ACCEPTED_STEP_TYPES.has(stepType)) {
      return {
        success: false,
        error: "OpenRouterTextDriver so aceita steps de texto (analyze/plan/report). Step type recebido: '" + stepType + "'.",
        metadata: { driver: this.id, rejectedStepType: stepType },
      }
    }

    // Defesa em profundidade: mesmo que algo roteie um step fora de
    // READ_ONLY para ca por engano, nunca prossegue.
    if (command.mode !== "READ_ONLY") {
      return {
        success: false,
        error: "OpenRouterTextDriver so aceita comandos em modo READ_ONLY. Modo recebido: '" + command.mode + "'.",
        metadata: { driver: this.id, rejectedMode: command.mode },
      }
    }

    const config = loadLlmConfig()
    if (!config.externalCallsEnabled || !config.openRouterApiKey) {
      return {
        success: false,
        error: "OpenRouterTextDriver indisponivel (chave de acesso ausente ou provider nao configurado).",
        metadata: { driver: this.id },
      }
    }

    const provider = new OpenRouterProvider(config.openRouterApiKey, config.openRouterModel ?? config.model)
    const response = await provider.complete({ mode: "READ_ONLY", task: command.prompt })

    if (response.safety.blockedReasons.length > 0) {
      return {
        success: false,
        error: response.text,
        metadata: { driver: this.id, blocked: "true" },
      }
    }

    return {
      success: true,
      result: response.text,
      metadata: { driver: this.id, provider: response.provider, model: response.model },
    }
  }

  async cancel(_commandId: string): Promise<void> {
    /* chamada HTTP unica com timeout proprio (OpenRouterProvider) — nada de longa duracao para cancelar */
  }

  async dispose(): Promise<void> {
    /* sem recursos persistentes para liberar */
  }
}
