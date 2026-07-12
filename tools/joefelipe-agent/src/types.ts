import type { KernelStatus } from './kernel/types.ts'
import type { ApprovalRequest } from './approval/types.ts'

export interface SourceStatus {
  role: string;
  path: string;
  found: boolean;
  updatedAt: string | null;
}

export type RiskSeverity = "P1" | "P2" | "outro";

export interface RiskItem {
  id: string | null;
  title: string;
  severity: RiskSeverity;
}

export interface DecisionItem {
  id: string | null;
  title: string;
}

export interface ChangedFile {
  path: string;
  status: string;
  sensitive: boolean;
}

export interface GitInfo {
  available: boolean;
  branch: string | null;
  ahead: number | null;
  behind: number | null;
  changed: ChangedFile[];
  recentCommits: string[];
}

export interface AgentMeta {
  name: string;
  technicalName: string;
  version: string;
  mode: string;
}

export interface LlmInfo {
  provider: string;
  model: string;
  externalCallsEnabled: boolean;
}

export interface AgentState {
  agent: AgentMeta;
  generatedAt: string;
  repoRoot: string;
  sources: {
    found: SourceStatus[];
    missing: SourceStatus[];
  };
  mission: {
    current: string | null;
    currentStatus: string | null;
    next: string | null;
    nextStatus: string | null;
    nextMode: string | null;
    source: string | null;
  };
  nextBestAction: {
    mission: string | null;
    rationale: string | null;
    source: string | null;
  };
  risks: {
    total: number | null;
    summary: string | null;
    items: RiskItem[];
    source: string | null;
  };
  decisions: {
    pending: DecisionItem[];
    source: string | null;
  };
  humanActions: string[];
  git: GitInfo;
  recommendedPrompt: string;
  warnings: string[];
  llm: LlmInfo;
  kernel?: KernelStatus;
  events?: { total: number; pending: number };
  pendingApprovals?: ApprovalRequest[]
  orchestrator?: { steps: number; completed: number; failed: number; status: string }
  execution?: { running: boolean; abortRequested: boolean; currentStepId: string | null; lastResult: { success: boolean } | null; executors: string[] }
}

export interface WatchEvent {
  ts: string;
  path: string;
  kind: string;
  sensitive: boolean;
}