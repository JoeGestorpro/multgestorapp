import { readFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, renameSync, statSync } from "node:fs"
import { join } from "node:path"
import type { Mission } from "./mission-types.ts"

// Fase 9.12 — persiste as Missions reais criadas via MissionBuilder (ex.:
// pelo chat), para que uma Session possa referenciar "missionId" e a UI
// conseguir recuperar status/classificacao depois — sem duplicar a missao
// em nenhum outro lugar (esta e a UNICA fonte de verdade do conteudo dela;
// Session guarda so o ponteiro). Mesmo idioma de persistencia ja usado por
// TaskOrchestrator/EventStore/SessionStore (log append-only, "ultima linha
// por id vence", com rotacao).
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ROTATED_FILES = 20
const MAX_LOAD_SIZE = 50 * 1024 * 1024

export class MissionStore {
  private dir: string
  private file: string
  private missions = new Map<string, Mission>()

  constructor(root: string) {
    this.dir = join(root, "tools", "joefelipe-agent", "runtime")
    mkdirSync(this.dir, { recursive: true })
    this.file = join(this.dir, "missions.jsonl")
    this.loadIndex()
  }

  private loadIndex(): void {
    if (!existsSync(this.file)) return
    try {
      const stat = statSync(this.file)
      if (stat.size > MAX_LOAD_SIZE) {
        console.warn("[MissionStore] arquivo muito grande (" + stat.size + " bytes), ignorando load")
        return
      }
      const raw = readFileSync(this.file, "utf8")
      for (const line of raw.split("\n").filter(Boolean)) {
        try {
          const mission = JSON.parse(line) as Mission
          this.missions.set(mission.id, mission)
        } catch {
          /* skip malformed */
        }
      }
    } catch {
      /* best-effort */
    }
  }

  private pruneRotated(): void {
    try {
      const files = readdirSync(this.dir)
        .filter((f) => f.startsWith("missions.") && f.endsWith(".jsonl") && f !== "missions.jsonl")
        .sort()
      if (files.length <= MAX_ROTATED_FILES) return
      for (const f of files.slice(0, files.length - MAX_ROTATED_FILES)) {
        unlinkSync(join(this.dir, f))
      }
    } catch {
      /* best-effort */
    }
  }

  private rotateIfNeeded(): void {
    try {
      if (!existsSync(this.file)) return
      const st = statSync(this.file)
      if (st.size <= MAX_FILE_SIZE) return
      const ts = new Date().toISOString().replace(/[:.]/g, "-")
      renameSync(this.file, this.file.replace(".jsonl", "." + ts + ".jsonl"))
      this.pruneRotated()
    } catch {
      /* best-effort */
    }
  }

  save(mission: Mission): void {
    this.missions.set(mission.id, mission)
    try {
      this.rotateIfNeeded()
      appendFileSync(this.file, JSON.stringify(mission) + "\n", "utf8")
    } catch {
      /* best-effort: nunca derruba a criacao da missao por falha de disco */
    }
  }

  get(id: string): Mission | undefined {
    return this.missions.get(id)
  }

  list(limit = 20): Mission[] {
    return Array.from(this.missions.values())
      .sort((a, b) => (a.provenance.generatedAt < b.provenance.generatedAt ? 1 : -1))
      .slice(0, limit)
  }
}
