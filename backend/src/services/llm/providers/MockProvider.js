// MockProvider — LLM simulada para o LlmService do MultGestor.
// Não chama API externa. Não lê secrets. Não executa ações.
// Default do sistema — funciona sem nenhuma API key configurada.
// Portado de tools/joefelipe-agent/src/llm/providers/MockProvider.ts.

const { detectSensitive } = require('../sensitive')

function buildSafety(task) {
  const sensitive = detectSensitive(task)
  const blocked = sensitive.map((word) => `Ação sensível detectada: "${word}" requer aprovação humana`)

  return {
    canExecute: false,
    requiresHumanApproval: sensitive.length > 0,
    blockedReasons: blocked
  }
}

function buildMockResponse(mode, task, safety) {
  if (safety.blockedReasons.length > 0) {
    return `MockProvider: AÇÃO BLOQUEADA — ${safety.blockedReasons.join('; ')}. Nenhuma ação foi executada.`
  }

  switch (mode) {
    case 'PLAN_ONLY':
      return `MockProvider: plano gerado em modo PLAN_ONLY. Nenhuma ação foi executada.\n\nPlano simulado para: ${task}\n1. Analisar estado atual\n2. Identificar dados relevantes\n3. Propor próxima ação segura`
    case 'READ_ONLY':
      return `MockProvider: análise concluída em modo READ_ONLY.\n\nContexto: ${task}\nNenhuma ação foi tomada.`
    case 'SAFE_WRITE':
      return `MockProvider: simulação de escrita segura concluída. Modo SAFE_WRITE ativo.\n\nPara: ${task}\nNenhuma alteração real foi feita.`
    case 'HUMAN_APPROVAL_REQUIRED':
      return `MockProvider: tarefa requer aprovação humana.\n\nTarefa: ${task}\nAguardando autorização antes de qualquer execução.`
    case 'EXECUTE_APPROVED':
      return `MockProvider: modo EXECUTE_APPROVED simulado.\n\nTarefa: ${task}\nNenhuma execução real — aguardando provedor real.`
    case 'LOCKED':
      return 'MockProvider: serviço em modo LOCKED. Nenhuma operação disponível.'
    default:
      return 'MockProvider: resposta padrão em modo seguro. Nenhuma ação foi executada.'
  }
}

class MockProvider {
  constructor() {
    this.name = 'mock'
    this.model = 'mock-safe-v1'
  }

  async complete(request) {
    const safety = buildSafety(request.task)
    const text = buildMockResponse(request.mode, request.task, safety)

    return {
      provider: 'mock',
      model: this.model,
      mode: request.mode,
      text,
      safety,
      metadata: {
        simulated: true,
        timestamp: new Date().toISOString()
      }
    }
  }
}

module.exports = { MockProvider }
