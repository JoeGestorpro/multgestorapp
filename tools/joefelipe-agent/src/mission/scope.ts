// Escopo permitido/proibido de uma missão.
// Reusa isSensitivePath (readers) e aplica a blocklist de governança.
// `.obsidian/` e `.opencodex/archive/` aparecem SEMPRE como proibidos.

import { isSensitivePath } from "../readers.ts";
import type { MissionScope } from "./mission-types.ts";

/** Áreas SEMPRE proibidas para qualquer missão gerada pela V3. */
export const ALWAYS_FORBIDDEN: readonly string[] = [
  ".obsidian/ (cofre Obsidian — nunca versionar via agente)",
  ".opencodex/archive/ (arquivo morto — não revisado)",
  ".opencodex/queue/ (a fila é editada por humano, não pelo executor da missão)",
  "secrets / .env / tokens / chaves / credenciais (nunca ler nem imprimir)",
  "Ações destrutivas/infra sem aprovação humana explícita: banco, migrations, RLS, Redis, WhatsApp real, B2/upload externo, produção, deploy, push, merge",
  "Qualquer arquivo fora do escopo permitido",
];

const FORBIDDEN_PATH_PATTERNS: readonly RegExp[] = [
  /(^|[\\/])\.obsidian([\\/]|$)/i,
  /\.opencodex[\\/]archive([\\/]|$)/i,
  /\.opencodex[\\/]queue([\\/]|$)/i,
];

export function isAlwaysForbidden(p: string): boolean {
  const norm = p.replace(/\\/g, "/");
  return FORBIDDEN_PATH_PATTERNS.some((re) => re.test(norm));
}

export interface ScopeResult {
  scope: MissionScope;
  warnings: string[];
}

/** Monta o escopo: sanitiza o hint (remove sensíveis/proibidos), fixa o forbidden. */
export function buildScope(allowedHint: string[] = []): ScopeResult {
  const warnings: string[] = [];
  const allowed: string[] = [];
  for (const raw of allowedHint) {
    const p = (raw ?? "").trim();
    if (!p) continue;
    if (isSensitivePath(p)) {
      warnings.push(`Arquivo sensível removido do escopo permitido: ${p}`);
      continue;
    }
    if (isAlwaysForbidden(p)) {
      warnings.push(`Caminho proibido removido do escopo permitido: ${p}`);
      continue;
    }
    allowed.push(p);
  }
  return { scope: { allowed, forbidden: [...ALWAYS_FORBIDDEN] }, warnings };
}
