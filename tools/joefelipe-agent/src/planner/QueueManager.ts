import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { findRepoRoot, parseFrontmatter } from "../readers.ts"
import type { PlannedMission, QueueStatus } from "./types.ts"

function queueDir(root: string): string {
  return join(root, ".opencodex", "queue")
}

function readQueueFile(root: string, filename: string): { taskId: string | null; status: string | null; mode: string | null } {
  try {
    const path = join(queueDir(root), filename)
    if (!existsSync(path)) return { taskId: null, status: null, mode: null }
    const content = readFileSync(path, "utf-8")
    const fm = parseFrontmatter(content)
    return {
      taskId: fm.task_id ?? null,
      status: fm.status ?? null,
      mode: fm.mode ?? null,
    }
  } catch {
    return { taskId: null, status: null, mode: null }
  }
}

function writeQueueFile(root: string, filename: string, mission: PlannedMission): void {
  const lines = [
    "---",
    `task_id: ${mission.id}`,
    `status: ${mission.status}`,
    "mode: pending",
    `title: "${mission.title.replace(/"/g, '\\"')}"`,
    `executor: ${mission.executorId}`,
    mission.type ? `type: ${mission.type}` : "",
    "---",
    "",
    mission.intent,
    "",
  ].filter(Boolean)

  const path = join(queueDir(root), filename)
  writeFileSync(path, lines.join("\n"), "utf-8")
}

export class QueueManager {
  private root: string

  constructor(root: string = findRepoRoot()) {
    this.root = root
  }

  readCurrent(): QueueStatus["current"] {
    return readQueueFile(this.root, "current-task.md")
  }

  readNext(): QueueStatus["next"] {
    return readQueueFile(this.root, "next-task.md")
  }

  getStatus(): QueueStatus {
    return {
      current: this.readCurrent(),
      next: this.readNext(),
    }
  }

  promoteToCurrent(mission: PlannedMission, canWrite: boolean): { success: boolean; error?: string } {
    if (!canWrite) {
      return { success: false, error: "Modo EXECUTE_APPROVED necess\u00E1rio para alterar current-task.md" }
    }
    try {
      writeQueueFile(this.root, "current-task.md", { ...mission, status: "active" })
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  promoteToNext(mission: PlannedMission, canWrite: boolean): { success: boolean; error?: string } {
    if (!canWrite) {
      return { success: false, error: "Modo EXECUTE_APPROVED necess\u00E1rio para alterar next-task.md" }
    }
    try {
      writeQueueFile(this.root, "next-task.md", { ...mission, status: "planned" })
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }
}
