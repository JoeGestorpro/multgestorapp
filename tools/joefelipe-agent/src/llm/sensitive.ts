// Fonte única de verdade de termos/ações sensíveis do Agente JoeFelipe.
// Usado pelo LLM Core (MockProvider) e pelo Mission Builder (classify/scope).
// Não executa nada; apenas reconhece padrões para classificar risco.

export type SensitiveSeverity = "dangerous" | "gated";

export interface SensitiveRule {
  readonly label: string;
  readonly pattern: RegExp;
  readonly severity: SensitiveSeverity;
}

// Ordem preservada da V2 (MockProvider) — não reordenar sem revalidar.
// "dangerous" = infra/destrutivo/produção (o agente nunca executa).
// "gated"     = fluxo normal de git que exige aprovação humana.
export const SENSITIVE_RULES: readonly SensitiveRule[] = [
  { label: "push", pattern: /\bpush\b/i, severity: "gated" },
  { label: "deploy", pattern: /\bdeploy\b/i, severity: "dangerous" },
  { label: "secret", pattern: /\bsecret\b/i, severity: "dangerous" },
  { label: "banco", pattern: /\bbanco\b/i, severity: "dangerous" },
  { label: "migration", pattern: /\bmigrations?\b/i, severity: "dangerous" },
  { label: "RLS", pattern: /\bRLS\b/i, severity: "dangerous" },
  { label: "Redis", pattern: /\bRedis\b/i, severity: "dangerous" },
  { label: "WhatsApp real", pattern: /\bWhatsApp real\b/i, severity: "dangerous" },
  { label: "B2 upload", pattern: /\bB2 upload\b/i, severity: "dangerous" },
  { label: "produção", pattern: /\bprodução\b/i, severity: "dangerous" },
  { label: "delete", pattern: /\bdelete\b/i, severity: "dangerous" },
  { label: "rm", pattern: /\brm\b/i, severity: "dangerous" },
  { label: "drop", pattern: /\bdrop\b/i, severity: "dangerous" },
  { label: "truncate", pattern: /\btruncate\b/i, severity: "dangerous" },
  { label: "merge", pattern: /\bmerge\b/i, severity: "gated" },
  { label: "commit", pattern: /\bcommit\b/i, severity: "gated" },
];

/** Lista plana de padrões — preserva o contrato da V2 (`SENSITIVE_PATTERNS`). */
export const SENSITIVE_PATTERNS: readonly RegExp[] = SENSITIVE_RULES.map((r) => r.pattern);

export interface SensitiveHit {
  readonly label: string;
  readonly match: string;
  readonly severity: SensitiveSeverity;
}

/**
 * Detecta termos sensíveis e retorna a string casada em minúsculas.
 * Mantém EXATAMENTE o comportamento esperado pela V2 (MockProvider).
 */
export function detectSensitive(task: string): string[] {
  const found: string[] = [];
  for (const re of SENSITIVE_PATTERNS) {
    const m = task.match(re);
    if (m) found.push(m[0].toLowerCase());
  }
  return found;
}

/** Versão rica para classificação de risco: inclui a severidade de cada termo. */
export function detectSensitiveHits(task: string): SensitiveHit[] {
  const hits: SensitiveHit[] = [];
  for (const rule of SENSITIVE_RULES) {
    const m = task.match(rule.pattern);
    if (m) hits.push({ label: rule.label, match: m[0].toLowerCase(), severity: rule.severity });
  }
  return hits;
}
