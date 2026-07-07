import type { LlmProviderName, LlmMode, LlmRequest, LlmResponse, LlmSafety, LlmProvider } from "./LlmProvider.ts"

export type { LlmProviderName, LlmMode, LlmRequest, LlmResponse, LlmSafety, LlmProvider }

export interface ProviderConfig {
  id: LlmProviderName
  name: string
  model: string
  enabled: boolean
}

export interface DriverTask {
  type: string
  input: string
  context?: Record<string, unknown>
}

export interface DriverResult {
  output: string
  provider: LlmProviderName
  model: string
  safety: LlmSafety
  metadata?: Record<string, unknown>
}

export interface ProviderStatus {
  id: LlmProviderName
  name: string
  model: string
  status: 'registered' | 'active' | 'error'
}