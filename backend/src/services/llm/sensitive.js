// Fonte única de verdade de termos/ações sensíveis do LlmService.
// Usado pelo MockProvider e pelos providers reais para classificar risco antes
// de qualquer chamada externa. Não executa nada; apenas reconhece padrões.
// Portado de tools/joefelipe-agent/src/llm/sensitive.ts (Fase 1 — IA Operacional).

const SENSITIVE_RULES = [
  { label: 'push', pattern: /\bpush\b/i, severity: 'gated' },
  { label: 'deploy', pattern: /\bdeploy\b/i, severity: 'dangerous' },
  { label: 'secret', pattern: /\bsecret\b/i, severity: 'dangerous' },
  { label: 'banco', pattern: /\bbanco\b/i, severity: 'dangerous' },
  { label: 'migration', pattern: /\bmigrations?\b/i, severity: 'dangerous' },
  { label: 'RLS', pattern: /\bRLS\b/i, severity: 'dangerous' },
  { label: 'Redis', pattern: /\bRedis\b/i, severity: 'dangerous' },
  { label: 'WhatsApp real', pattern: /\bWhatsApp real\b/i, severity: 'dangerous' },
  { label: 'B2 upload', pattern: /\bB2 upload\b/i, severity: 'dangerous' },
  { label: 'produção', pattern: /\bprodução\b/i, severity: 'dangerous' },
  { label: 'delete', pattern: /\bdelete\b/i, severity: 'dangerous' },
  { label: 'rm', pattern: /\brm\b/i, severity: 'dangerous' },
  { label: 'drop', pattern: /\bdrop\b/i, severity: 'dangerous' },
  { label: 'truncate', pattern: /\btruncate\b/i, severity: 'dangerous' },
  { label: 'merge', pattern: /\bmerge\b/i, severity: 'gated' },
  { label: 'commit', pattern: /\bcommit\b/i, severity: 'gated' }
]

const SENSITIVE_PATTERNS = SENSITIVE_RULES.map((r) => r.pattern)

function detectSensitive(task) {
  const found = []
  for (const re of SENSITIVE_PATTERNS) {
    const m = task.match(re)
    if (m) found.push(m[0].toLowerCase())
  }
  return found
}

function detectSensitiveHits(task) {
  const hits = []
  for (const rule of SENSITIVE_RULES) {
    const m = task.match(rule.pattern)
    if (m) hits.push({ label: rule.label, match: m[0].toLowerCase(), severity: rule.severity })
  }
  return hits
}

module.exports = { SENSITIVE_RULES, SENSITIVE_PATTERNS, detectSensitive, detectSensitiveHits }
