export interface ValidationResult {
  allowed: boolean
  reason?: string
}

const RE_COMMAND: RegExp[] = [
  /^git status( --porcelain)?$/i,
  /^git log( --oneline)?(\s+-(\d+))?$/i,
  /^git diff --stat(\s+[-\w./]+)?$/i,
  /^Get-ChildItem(\s+(-Path\s+)?[-\w./\\:]+)?(\s+-Recurse)?(\s+-Filter\s+\"[^\"]+\")?$/i,
  /^Get-Content(\s+(-Path\s+)?[-\w./\\:]+)?(\s+-TotalCount\s+\d+)?$/i,
  /^Select-String\s+-Pattern\s+\"[^\"]+\"(\s+(-Path\s+)?[-\w./\\:]+)?$/i,
  /^Test-Path(\s+(-Path\s+)?[-\w./\\:]+)?$/i,
  /^Get-Location$/i,
  /^pwd$/i,
  /^whoami$/i,
]

const BLOCKED_PATTERNS: RegExp[] = [
  /[\n\r]/,
  /[;&|]/,
  /[<>]/,
  /\$\s*\(/,
  /\$\{/,
]

export class CommandValidator {
  validate(cmdLine: string): ValidationResult {
    const trimmed = cmdLine.trim()
    if (!trimmed) {
      return { allowed: false, reason: "Comando vazio" }
    }

    for (const bp of BLOCKED_PATTERNS) {
      if (bp.test(trimmed)) {
        return { allowed: false, reason: "Comando contem operador ou caractere nao permitido" }
      }
    }

    for (const re of RE_COMMAND) {
      if (re.test(trimmed)) {
        return { allowed: true }
      }
    }

    return { allowed: false, reason: "Comando nao permitido pela whitelist" }
  }
}