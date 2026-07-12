import { readFileSync, appendFileSync, writeFileSync, renameSync, existsSync, mkdirSync, statSync, readdirSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import type { OperationalEvent, EventStatus, EventStoreStats } from "./types.ts"

const MAX_LOAD_SIZE = 50 * 1024 * 1024
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ROTATED_FILES = 20

function generateId(): string {
  return "evt-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6)
}

export class EventStore {
  private file: string
  private dir: string
  private index = new Map<string, OperationalEvent>()

  constructor(root: string) {
    this.dir = join(root, "tools", "joefelipe-agent", "runtime")
    mkdirSync(this.dir, { recursive: true })
    this.file = join(this.dir, "events.jsonl")
    this.loadIndex()
  }

  private loadIndex(): void {
    if (!existsSync(this.file)) return
    try {
      const stat = statSync(this.file)
      if (stat.size > MAX_LOAD_SIZE) {
        console.warn("[EventStore] arquivo muito grande (" + stat.size + " bytes), ignorando load")
        return
      }
      const raw = readFileSync(this.file, "utf8")
      for (const line of raw.split("\n").filter(Boolean)) {
        try {
          const evt = JSON.parse(line) as OperationalEvent
          this.index.set(evt.id, evt)
        } catch {
          // skip malformed lines
        }
      }
    } catch {
      // best-effort
    }
  }

  private pruneRotated(): void {
    try {
      const files = readdirSync(this.dir)
        .filter((f) => f.startsWith("events.") && f.endsWith(".jsonl") && f !== "events.jsonl")
        .sort()
      if (files.length <= MAX_ROTATED_FILES) return
      const toDelete = files.slice(0, files.length - MAX_ROTATED_FILES)
      for (const f of toDelete) {
        unlinkSync(join(this.dir, f))
      }
    } catch {
      // best-effort
    }
  }

  private rotateIfNeeded(): void {
    try {
      if (!existsSync(this.file)) return
      const stat = statSync(this.file)
      if (stat.size <= MAX_FILE_SIZE) return
      const ts = new Date().toISOString().replace(/[:.]/g, "-")
      const rotated = this.file.replace(".jsonl", `.${ts}.jsonl`)
      renameSync(this.file, rotated)
      this.pruneRotated()
    } catch {
      // best-effort
    }
  }

  save(event: OperationalEvent): void {
    this.index.set(event.id, event)
    try {
      this.rotateIfNeeded()
      appendFileSync(this.file, JSON.stringify(event) + "\n", "utf8")
    } catch {
      // best-effort
    }
  }

  get(id: string): OperationalEvent | undefined {
    return this.index.get(id)
  }

  list(limit = 20, filter?: { status?: EventStatus; source?: string }): OperationalEvent[] {
    let events = Array.from(this.index.values())
    if (filter?.status) events = events.filter((e) => e.status === filter.status)
    if (filter?.source) events = events.filter((e) => e.source === filter.source)
    events.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return events.slice(0, limit)
  }

  pending(): OperationalEvent[] {
    return Array.from(this.index.values())
      .filter((e) => e.status === "received" || e.status === "classifying")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  acknowledge(id: string): boolean {
    const evt = this.index.get(id)
    if (!evt) return false
    evt.status = "acknowledged"
    evt.updatedAt = new Date().toISOString()
    this.save(evt)
    return true
  }

  stats(): EventStoreStats {
    const events = Array.from(this.index.values())
    const bySeverity: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    const bySource: Record<string, number> = {}

    for (const e of events) {
      bySeverity[e.severity] = (bySeverity[e.severity] ?? 0) + 1
      byStatus[e.status] = (byStatus[e.status] ?? 0) + 1
      bySource[e.source] = (bySource[e.source] ?? 0) + 1
    }

    return { total: events.length, bySeverity, byStatus, bySource }
  }

  create(
    type: string,
    source: OperationalEvent["source"],
    severity: OperationalEvent["severity"],
    summary: string,
    payload: Record<string, unknown> = {},
  ): OperationalEvent {
    const now = new Date().toISOString()
    const event: OperationalEvent = {
      id: generateId(),
      type,
      source,
      severity,
      summary,
      payload,
      status: "received",
      createdAt: now,
      updatedAt: now,
    }
    this.save(event)
    return event
  }
}