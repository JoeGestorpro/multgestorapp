import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { findRepoRoot } from "../readers.ts"
import type { Plan } from "./types.ts"

function runtimeDir(root: string): string {
  const dir = join(root, "tools", "joefelipe-agent", "runtime")
  mkdirSync(dir, { recursive: true })
  return dir
}

export class PlanStore {
  private root: string

  constructor(root: string = findRepoRoot()) {
    this.root = root
  }

  load(): Plan | null {
    try {
      const path = join(runtimeDir(this.root), "queue.json")
      if (!existsSync(path)) return null
      const raw = readFileSync(path, "utf-8")
      const parsed = JSON.parse(raw) as Plan
      if (!parsed.id || !parsed.goal || !Array.isArray(parsed.missions)) {
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  save(plan: Plan): void {
    try {
      const path = join(runtimeDir(this.root), "queue.json")
      writeFileSync(path, JSON.stringify(plan, null, 2), "utf-8")
    } catch {
      /* runtime é best-effort; nunca derruba o agente */
    }
  }

  clear(): void {
    try {
      const path = join(runtimeDir(this.root), "queue.json")
      if (existsSync(path)) {
        writeFileSync(path, "", "utf-8")
      }
    } catch {
      /* best-effort */
    }
  }
}
