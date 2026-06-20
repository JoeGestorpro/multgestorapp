// Leitores read-only do Segundo Cérebro / Living OS / fila.
// Nunca lê secrets. Nunca escreve no Segundo Cérebro.

import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import type {
  SourceStatus,
  RiskItem,
  RiskSeverity,
  DecisionItem,
} from "./types.ts";

/** Padrões de caminho que NUNCA devem ser lidos/impressos. */
const SENSITIVE_PATTERNS: RegExp[] = [
  /(^|[\\/])\.env($|\.)/i,
  /secret/i,
  /credential/i,
  /\.key$/i,
  /\.pem$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /brchk\.env/i,
  /body-login\.json/i,
  /opencode\.json/i,
  /id_rsa/i,
];

export function isSensitivePath(p: string): boolean {
  const norm = p.replace(/\\/g, "/");
  return SENSITIVE_PATTERNS.some((re) => re.test(norm));
}

/** Descobre a raiz do repositório subindo a partir do diretório deste módulo. */
export function findRepoRoot(): string {
  const override = process.env.JOEFELIPE_REPO_ROOT;
  if (override && existsSync(override)) return resolve(override);

  let dir = import.meta.dirname; // .../tools/joefelipe-agent/src (ou /dist)
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, ".opencodex")) || existsSync(join(dir, ".git"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: três níveis acima de src/ (tools/joefelipe-agent/src -> raiz).
  return resolve(import.meta.dirname, "..", "..", "..");
}

const MAX_READ_BYTES = 512 * 1024;

/** Lê um arquivo de texto com segurança. Recusa arquivos sensíveis. */
export function safeReadFile(absPath: string): string | null {
  if (isSensitivePath(absPath)) return null;
  try {
    if (!existsSync(absPath)) return null;
    const st = statSync(absPath);
    if (!st.isFile()) return null;
    const raw = readFileSync(absPath, "utf8");
    return raw.length > MAX_READ_BYTES ? raw.slice(0, MAX_READ_BYTES) : raw;
  } catch {
    return null;
  }
}

/** Lê o primeiro caminho existente da lista (relativo à raiz). */
export function readFirst(
  root: string,
  paths: string[],
): { path: string; content: string } | null {
  for (const p of paths) {
    const content = safeReadFile(join(root, p));
    if (content !== null) return { path: p, content };
  }
  return null;
}

interface SourceDef {
  role: string;
  path: string;
  alts?: string[];
}

/**
 * Fontes canônicas reais deste repositório.
 * O Segundo Cérebro vive em `.opencodex/brain/`; `living-os`, `strategy` e
 * `agents` são subpastas de `brain`. Mantemos `alts` na raiz por resiliência.
 */
export const CANONICAL_SOURCES: SourceDef[] = [
  { role: "Índice do Segundo Cérebro", path: ".opencodex/brain/INDEX.md" },
  { role: "Estado do projeto", path: ".opencodex/brain/project-state.md" },
  { role: "Missão atual (fila)", path: ".opencodex/queue/current-task.md" },
  { role: "Próxima missão (fila)", path: ".opencodex/queue/next-task.md" },
  { role: "Backlog (fila)", path: ".opencodex/queue/backlog.md" },
  {
    role: "Living OS — README",
    path: ".opencodex/brain/living-os/README.md",
    alts: ["living-os/README.md"],
  },
  {
    role: "Living OS — Sistema",
    path: ".opencodex/brain/living-os/00-multgestor-living-operating-system.md",
    alts: ["living-os/00-multgestor-living-operating-system.md"],
  },
  {
    role: "Living OS — Painel Executivo",
    path: ".opencodex/brain/living-os/02-painel-executivo.md",
    alts: ["living-os/02-painel-executivo.md"],
  },
  {
    role: "Living OS — Próxima Melhor Ação",
    path: ".opencodex/brain/living-os/05-proxima-melhor-acao.md",
    alts: ["living-os/05-proxima-melhor-acao.md"],
  },
  {
    role: "Living OS — Riscos Ativos",
    path: ".opencodex/brain/living-os/riscos/riscos-ativos.md",
    alts: ["living-os/riscos/riscos-ativos.md"],
  },
  {
    role: "Living OS — Decisões Executivas",
    path: ".opencodex/brain/living-os/decisoes/decisoes-executivas.md",
    alts: ["living-os/decisoes/decisoes-executivas.md"],
  },
  {
    role: "Roadmap Mestre",
    path: ".opencodex/brain/roadmaps/ROADMAP-MESTRE-MULTGESTOR-2026.md",
  },
];

function resolveSourcePath(root: string, def: SourceDef): string | null {
  for (const c of [def.path, ...(def.alts ?? [])]) {
    if (existsSync(join(root, c))) return c;
  }
  return null;
}

export function collectSources(root: string): {
  found: SourceStatus[];
  missing: SourceStatus[];
} {
  const found: SourceStatus[] = [];
  const missing: SourceStatus[] = [];
  for (const def of CANONICAL_SOURCES) {
    const rel = resolveSourcePath(root, def);
    if (rel) {
      const content = safeReadFile(join(root, rel)) ?? "";
      found.push({
        role: def.role,
        path: rel,
        found: true,
        updatedAt: extractUpdatedAt(content, parseFrontmatter(content)),
      });
    } else {
      missing.push({ role: def.role, path: def.path, found: false, updatedAt: null });
    }
  }
  return { found, missing };
}

/** Parser mínimo de frontmatter YAML-lite (escalares + blocos dobrados `>-`). */
export function parseFrontmatter(content: string): Record<string, string> {
  const lines = content.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    if (lines[i].trim() === "---") {
      start = i;
      break;
    }
  }
  if (start === -1) return {};
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) return {};

  const out: Record<string, string> = {};
  let foldingKey: string | null = null;
  for (let i = start + 1; i < end; i++) {
    const line = lines[i];
    const m = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (m) {
      const key = m[1];
      const val = m[2].trim();
      if (val === ">-" || val === ">" || val === "|" || val === "|-") {
        out[key] = "";
        foldingKey = key;
      } else {
        out[key] = val.replace(/^["']|["']$/g, "");
        foldingKey = null;
      }
    } else if (foldingKey && /^\s+\S/.test(line)) {
      out[foldingKey] = (out[foldingKey] ? out[foldingKey] + " " : "") + line.trim();
    } else if (line.trim() === "") {
      // mantém o bloco dobrado vivo através de linhas em branco
    } else {
      foldingKey = null;
    }
  }
  return out;
}

export function extractUpdatedAt(
  content: string,
  fm: Record<string, string>,
): string | null {
  if (fm.updated_at) return fm.updated_at;
  if (fm.atualizado) return fm.atualizado;
  const m =
    content.match(/\*\*Atualizado:\*\*\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i) ??
    content.match(/Atualizado:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
  return m ? m[1] : null;
}

export function firstHeading(content: string): string | null {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].replace(/[#*`]/g, "").trim() : null;
}

export function extractRisks(content: string): {
  total: number | null;
  summary: string | null;
  items: RiskItem[];
} {
  const items: RiskItem[] = [];
  let severity: RiskSeverity = "outro";
  for (const line of content.split(/\r?\n/)) {
    const sec = line.match(/^##\s+(.+)$/);
    if (sec) {
      const t = sec[1].toUpperCase();
      severity = t.includes("P1") ? "P1" : t.includes("P2") ? "P2" : "outro";
      continue;
    }
    const h = line.match(/^###\s+(R-\d+)\s*\|\s*(.+)$/);
    if (h) items.push({ id: h[1], title: h[2].trim(), severity });
  }
  const totalM = content.match(/Total:\s*\**\s*(\d+)\s*riscos? ativos/i);
  const summaryM = content.match(/Total:[^\n]*/i);
  return {
    total: totalM ? Number(totalM[1]) : null,
    summary: summaryM ? summaryM[0].replace(/[*>]/g, "").trim() : null,
    items,
  };
}

export function extractPendingDecisions(content: string): DecisionItem[] {
  const items: DecisionItem[] = [];
  let inPendentes = false;
  for (const line of content.split(/\r?\n/)) {
    const sec = line.match(/^##\s+(.+)$/);
    if (sec) {
      inPendentes = /pendente/i.test(sec[1]);
      continue;
    }
    if (!inPendentes) continue;
    const h = line.match(/^###\s+(D-\d+)\s*\|\s*(.+)$/);
    if (h) items.push({ id: h[1], title: h[2].trim() });
  }
  return items;
}

export function extractNextBestAction(content: string): {
  mission: string | null;
  rationale: string | null;
} {
  const mm = content.match(/Próxima missão:\s*`([^`]+)`/i);
  let rationale: string | null = null;
  const idx = content.search(/###\s+Por que esta/i);
  if (idx >= 0) {
    const after = content.slice(idx);
    const bold = after.match(/\n\s*\d+\.\s+\*\*([^*]+)\*\*\s*[—-]?\s*([^\n]*)/);
    if (bold) {
      rationale = (bold[1].trim() + (bold[2] ? " — " + bold[2].trim() : "")).trim();
    } else {
      const plain = after.match(/\n\s*\d+\.\s+(.+)/);
      if (plain) rationale = plain[1].replace(/\*\*/g, "").trim();
    }
  }
  return { mission: mm ? mm[1] : null, rationale };
}
