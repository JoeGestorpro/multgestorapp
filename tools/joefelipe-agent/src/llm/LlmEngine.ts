import type { LlmRequest, LlmResponse, LlmProviderName, LlmProvider, ProviderConfig, ProviderStatus } from "./types.ts";
import { loadLlmConfig, loadSafetyConfig, type LlmConfig } from "./llm-config.ts";
import { MockProvider } from "./providers/MockProvider.ts";
import { OpenRouterProvider } from "./providers/OpenRouterProvider.ts";
import { NvidiaProvider } from "./providers/NvidiaProvider.ts";
import { BudgetProvider, type BudgetConfig } from "./providers/BudgetProvider.ts";
import { RateLimitProvider, type RateLimitConfig } from "./providers/RateLimitProvider.ts";
import { CircuitBreakerProvider, type CircuitBreakerConfig } from "./providers/CircuitBreakerProvider.ts";
import { DriverRegistry } from "./DriverRegistry.ts";
import { DriverManager } from "./DriverManager.ts";
import type { Kernel } from "../kernel/Kernel.ts";

// Defesa em profundidade (Fase 9.6): os providers ja evitam incluir a chave
// nas mensagens de erro (ver OpenRouterProvider), mas qualquer texto vindo de
// um provider externo passa por aqui antes de chegar ao usuario/log — mascara
// padroes tipicos de chave de API caso algum dia vazem por engano.
// Fase 9.19 (NVIDIA): "nvapi-..." e o prefixo real das chaves NVIDIA NIM,
// formato diferente do "sk-..." usado por OpenAI/OpenRouter — sem esta
// alternativa, uma chave NVIDIA vazada fora do padrao "Bearer <token>"
// passaria pela sanitizacao sem ser mascarada.
const API_KEY_PATTERN = /\b(sk-[A-Za-z0-9_-]{6,}|nvapi-[A-Za-z0-9_-]{6,}|Bearer\s+[A-Za-z0-9._-]{10,})\b/g;

function sanitizeErrorMessage(msg: string): string {
  return msg.replace(API_KEY_PATTERN, "[REDACTED]");
}

// Fase 10 (LLM Cost Safety): tamanho maximo do resumo da tarefa registrado no
// evento de custo — o objetivo e correlacionar custo com o tipo de tarefa,
// nao guardar o prompt inteiro (pode conter dado sensivel do usuario).
const TASK_SUMMARY_MAX_CHARS = 80;

export interface LlmSafetyConfig {
  /** Identifica esta instancia do agente para fins de orcamento (BudgetProvider).
   * Nao e por conversa/chat — e por processo/execucao do agente. Default: "default". */
  sessionId?: string;
  budget?: BudgetConfig;
  rateLimit?: RateLimitConfig;
  circuitBreaker?: CircuitBreakerConfig;
}

function truncateSummary(task: string): string {
  if (task.length <= TASK_SUMMARY_MAX_CHARS) return task;
  return task.slice(0, TASK_SUMMARY_MAX_CHARS) + "...";
}

export class LlmEngine {
  readonly registry: DriverRegistry;
  readonly manager: DriverManager;
  private config: LlmConfig;
  private kernel: Kernel | null;
  private safety?: LlmSafetyConfig;
  private budgetProvider?: BudgetProvider;
  private rateLimitProvider?: RateLimitProvider;
  private circuitBreakerProvider?: CircuitBreakerProvider;
  // Fase 11-B.1: referencia ao provider real SEM nenhum wrapper — usada por
  // test() para checar a conexao bruta (o objetivo e diagnosticar a API em
  // si, nao o comportamento dos wrappers de custo).
  private rawProvider?: LlmProvider;

  constructor(kernel?: Kernel, config?: LlmConfig, safety?: LlmSafetyConfig) {
    this.kernel = kernel ?? null;
    this.config = config ?? loadLlmConfig();
    // Sem safety explicito, cai para o que estiver nas envs (Fase 10) — sem
    // nenhuma env configurada, loadSafetyConfig() retorna todos os campos
    // undefined e wrapWithSafety() nao aplica nenhum wrapper (backward
    // compat identico ao comportamento anterior a esta fase).
    this.safety = safety ?? loadSafetyConfig();
    this.registry = new DriverRegistry(this.kernel);
    this.manager = new DriverManager(this.registry, this.config.provider);

    const mock = new MockProvider();
    this.registry.register(mock);

    if (this.config.provider === "openrouter" && this.config.openRouterApiKey) {
      const orp = new OpenRouterProvider(
        this.config.openRouterApiKey,
        this.config.openRouterModel ?? this.config.model,
      );
      this.rawProvider = orp;
      this.registry.register(this.wrapWithSafety(orp));
    }

    if (this.config.provider === "nvidia" && this.config.nvidiaApiKey) {
      const nvp = new NvidiaProvider(
        this.config.nvidiaApiKey,
        this.config.nvidiaModel ?? this.config.model,
      );
      this.rawProvider = nvp;
      this.registry.register(this.wrapWithSafety(nvp));
    }

    if (this.kernel) {
      const now = new Date().toISOString();
      const providerList = this.registry.list().map((p) => p.id);
      this.kernel.registry.register({
        id: "llm-engine",
        type: "provider",
        name: "LLM Engine",
        version: "1.0.0",
        status: "active",
        tags: ["llm", "core"],
        metadata: { providers: providerList, activeProvider: this.config.provider },
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  /**
   * Envelopa o provider real com os wrappers de seguranca configurados, na
   * ordem Budget -> RateLimit -> CircuitBreaker -> provider real (o Budget
   * checa primeiro, por ser o mais barato; o CircuitBreaker fica mais perto
   * do provider real, ja que e sobre a saude dele). So aplica o wrapper cuja
   * config foi explicitamente fornecida — sem config, comportamento identico
   * ao anterior a Fase 10 (backward compat).
   */
  wrapWithSafety(provider: LlmProvider): LlmProvider {
    let wrapped = provider;

    if (this.safety?.circuitBreaker) {
      this.circuitBreakerProvider = new CircuitBreakerProvider(wrapped, this.safety.circuitBreaker);
      wrapped = this.circuitBreakerProvider;
    }
    if (this.safety?.rateLimit) {
      this.rateLimitProvider = new RateLimitProvider(wrapped, this.safety.rateLimit);
      wrapped = this.rateLimitProvider;
    }
    if (this.safety?.budget) {
      this.budgetProvider = new BudgetProvider(wrapped, this.safety.sessionId ?? "default", this.safety.budget);
      wrapped = this.budgetProvider;
    }

    return wrapped;
  }

  getProviderInfo(): { provider: LlmProviderName; model: string; externalCallsEnabled: boolean } {
    return {
      provider: this.config.provider,
      model: this.config.model,
      externalCallsEnabled: this.config.externalCallsEnabled,
    };
  }

  getProviders(): ProviderConfig[] {
    return this.registry.list();
  }

  getStatus() {
    return {
      providers: this.registry.total,
      list: this.registry.getStatus(),
      active: this.config.provider,
      mode: this.config.model,
    };
  }

  /**
   * Fase 10: estado dos wrappers de custo/seguranca para o dashboard e
   * `/api/llm/status`. Sem BudgetProvider ativo, colapsa para
   * `{ budgetActive: false }` (nao ha "orcamento parcial" a mostrar).
   */
  getSafetyStatus(sessionId?: string): Record<string, unknown> {
    if (!this.budgetProvider) return { budgetActive: false };

    const budget = this.budgetProvider.getStatus();
    const rateLimit = this.rateLimitProvider?.getStatus(sessionId);

    return {
      budgetActive: true,
      tokensUsed: budget.tokensUsed,
      tokensLimit: budget.tokensLimit,
      budgetUsed: budget.budgetUsed,
      budgetLimit: budget.budgetLimit,
      rateLimitRemaining: rateLimit?.remaining ?? null,
      rateLimitWindow: rateLimit?.windowMs ?? null,
      circuitState: this.circuitBreakerProvider?.getState() ?? null,
    };
  }

  /**
   * Fase 11-B.1: teste de conexao bruta com o provider ativo — diagnostico,
   * nao acao. Diferenças deliberadas em relacao a complete():
   *  - Chama o provider REAL diretamente (rawProvider), nunca a cadeia
   *    Budget/RateLimit/CircuitBreaker: o objetivo e saber se a API responde,
   *    nao se os limites de custo estao configurados.
   *  - Ignora o gate de kernel mode/externalCallsEnabled: e leitura pura
   *    (nao propoe nem executa nenhuma acao), por isso funciona mesmo com o
   *    kernel em LOCKED.
   *  - Nao emite "llm:cost" nem toca em sessionStore — sem efeito colateral
   *    persistido, só o custo real (minimo) da chamada "ping" em si.
   */
  async test(): Promise<{ success: boolean; provider: LlmProviderName; model: string; latencyMs: number; error?: string }> {
    const active = this.manager.selectProvider();

    if (active.name === "mock") {
      return { success: true, provider: "mock", model: active.model, latencyMs: 0 };
    }

    const provider = this.rawProvider ?? active;
    const started = Date.now();
    try {
      await provider.complete({ mode: "READ_ONLY", task: "ping" });
      return { success: true, provider: provider.name, model: provider.model, latencyMs: Date.now() - started };
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        provider: provider.name,
        model: provider.model,
        latencyMs: Date.now() - started,
        error: sanitizeErrorMessage(rawMsg),
      };
    }
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    try {
      const provider = this.manager.selectProvider();

      // Fase 9.19 (fecha B-003): antes desta checagem, complete() chamava
      // qualquer provider selecionado (inclusive um real, pago) sem NUNCA
      // consultar o modo do kernel nem externalCallsEnabled — o modo exibido
      // no painel nao tinha efeito real. So se aplica quando o provider
      // selecionado NAO e o mock (o caminho mock, usado pela grande maioria
      // dos fluxos/testes, continua identico a antes — nunca precisou desse
      // gate, ja que nunca sai para fora).
      if (provider.name !== "mock") {
        const permission = this.kernel?.permissions.check("execute", "llm");
        const blockedByKernel = !!this.kernel && !!permission && !permission.granted;
        const blockedByConfig = !this.config.externalCallsEnabled;

        if (blockedByKernel || blockedByConfig) {
          const reason = blockedByKernel
            ? (permission?.reason ?? "Modo do kernel nao permite chamada de LLM.")
            : "Chamadas externas de LLM desabilitadas (externalCallsEnabled=false).";
          const mock = this.registry.get("mock");
          const mockResponse = mock ? await mock.complete(request) : null;
          return {
            provider: "mock",
            model: mockResponse?.model ?? "mock-safe-v1",
            mode: request.mode,
            text: "[Bloqueado] " + reason + " Nenhuma chamada externa foi feita. Resposta de fallback seguro (mock) abaixo.\n\n" + (mockResponse?.text ?? ""),
            safety: { canExecute: false, requiresHumanApproval: true, blockedReasons: [reason] },
            metadata: { blockedByKernel, blockedByConfig },
          };
        }
      }

      const response = await provider.complete(request);
      this.logCost(request, response);
      return response;
    } catch (err) {
      // Fase 9.6 (canary): qualquer falha do provider real (timeout, 429,
      // 5xx, chave invalida, rede indisponivel, etc.) cai aqui. O agente
      // NUNCA propaga a excecao para o chamador (server HTTP/CLI) — sempre
      // devolve uma resposta segura e legivel, com o modo mantido.
      const rawMsg = err instanceof Error ? err.message : String(err);
      const msg = sanitizeErrorMessage(rawMsg);
      return {
        provider: "mock",
        model: "mock-safe-v1",
        mode: request.mode,
        text: "Nao foi possivel obter resposta da LLM real agora (" + msg + "). Nenhuma acao foi executada; resposta de fallback seguro (mock) exibida abaixo.",
        safety: {
          canExecute: false,
          requiresHumanApproval: true,
          blockedReasons: ["Erro no provider real: " + msg],
        },
        metadata: { fallback: true, error: msg },
      };
    }
  }

  /**
   * Fase 10 (item 8): registra o custo de uma chamada bem-sucedida no
   * EventBus do kernel. So loga chamadas reais — nem mock (sem custo) nem
   * respostas bloqueadas por outro wrapper (rate limit/circuit breaker, que
   * nunca chegaram a consumir tokens de verdade).
   */
  private logCost(request: LlmRequest, response: LlmResponse): void {
    if (!this.kernel) return;
    if (response.provider === "mock") return;
    if (response.metadata?.blocked) return;

    const tokens = typeof response.metadata?.tokensUsed === "number" ? response.metadata.tokensUsed : 0;
    const ratePerToken = this.safety?.budget?.ratePerToken ?? 0.000002;

    this.kernel.events.emit("llm:cost", {
      provider: response.provider,
      model: response.model,
      sessionId: request.sessionId ?? this.safety?.sessionId ?? "default",
      tokens,
      estimatedCost: tokens * ratePerToken,
      mode: response.mode,
      taskSummary: truncateSummary(request.task),
    });
  }
}
