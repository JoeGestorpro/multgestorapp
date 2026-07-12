import { readFileSync, appendFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, renameSync, statSync } from "node:fs"
import { join } from "node:path"
import type { WorkSession, SessionMessage } from "./types.ts"

// Mesmo idioma de persistencia ja usado por TaskOrchestrator/EventStore:
// log append-only (sessions.jsonl), "ultima linha por id vence" no reload,
// com rotacao para nunca deixar o arquivo crescer sem limite.
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ROTATED_FILES = 20
const MAX_LOAD_SIZE = 50 * 1024 * 1024

function generateId(): string {
  return "sess-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6)
}

export interface CreateSessionInput {
  title?: string
  provider: string
  model: string
  kernelMode: string
}

export interface ActivateResult {
  success: boolean
  error?: string
}

export class SessionStore {
  private dir: string
  private file: string
  private activePointerFile: string
  private sessions = new Map<string, WorkSession>()
  private activeId: string | null = null

  constructor(root: string) {
    this.dir = join(root, "tools", "joefelipe-agent", "runtime")
    mkdirSync(this.dir, { recursive: true })
    this.file = join(this.dir, "sessions.jsonl")
    this.activePointerFile = join(this.dir, "active-session.json")
    this.loadIndex()
    this.loadActivePointer()
  }

  private loadIndex(): void {
    if (!existsSync(this.file)) return
    try {
      const stat = statSync(this.file)
      if (stat.size > MAX_LOAD_SIZE) {
        console.warn("[SessionStore] arquivo muito grande (" + stat.size + " bytes), ignorando load")
        return
      }
      const raw = readFileSync(this.file, "utf8")
      for (const line of raw.split("\n").filter(Boolean)) {
        try {
          const session = JSON.parse(line) as WorkSession
          this.sessions.set(session.id, session)
        } catch {
          /* skip malformed */
        }
      }
    } catch {
      /* best-effort */
    }
  }

  private loadActivePointer(): void {
    if (!existsSync(this.activePointerFile)) return
    try {
      const raw = JSON.parse(readFileSync(this.activePointerFile, "utf8")) as { sessionId: string | null }
      if (raw.sessionId && this.sessions.has(raw.sessionId)) this.activeId = raw.sessionId
    } catch {
      /* best-effort */
    }
  }

  private saveActivePointer(): void {
    try {
      writeFileSync(this.activePointerFile, JSON.stringify({ sessionId: this.activeId }), "utf8")
    } catch {
      /* best-effort */
    }
  }

  private pruneRotated(): void {
    try {
      const files = readdirSync(this.dir)
        .filter((f) => f.startsWith("sessions.") && f.endsWith(".jsonl") && f !== "sessions.jsonl")
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

  private persist(session: WorkSession): void {
    this.sessions.set(session.id, session)
    try {
      this.rotateIfNeeded()
      appendFileSync(this.file, JSON.stringify(session) + "\n", "utf8")
    } catch {
      /* best-effort: nunca derruba a conversa por falha de disco */
    }
  }

  create(input: CreateSessionInput): WorkSession {
    const now = new Date().toISOString()
    // So uma sessao "active" por vez — a anterior (se houver) vira "idle".
    if (this.activeId) {
      const prev = this.sessions.get(this.activeId)
      if (prev && prev.status === "active") {
        prev.status = "idle"
        prev.updatedAt = now
        this.persist(prev)
      }
    }
    const session: WorkSession = {
      id: generateId(),
      title: input.title?.trim() || "Nova Sessão",
      status: "active",
      provider: input.provider,
      model: input.model,
      kernelMode: input.kernelMode,
      createdAt: now,
      updatedAt: now,
      missionId: null,
      executionId: null,
      plannerGoalId: null,
      messages: [],
    }
    this.persist(session)
    this.activeId = session.id
    this.saveActivePointer()
    return session
  }

  list(limit = 20): WorkSession[] {
    return Array.from(this.sessions.values())
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, limit)
  }

  get(id: string): WorkSession | undefined {
    return this.sessions.get(id)
  }

  getActive(): WorkSession | null {
    if (!this.activeId) return null
    return this.sessions.get(this.activeId) ?? null
  }

  /** Retorna a sessao ativa; se nenhuma existir ainda, cria uma automaticamente
   * (garante que nenhuma mensagem/execucao fique sem sessao — criterio de aceite). */
  getOrCreateActive(defaults: CreateSessionInput): WorkSession {
    return this.getActive() ?? this.create(defaults)
  }

  activate(id: string): ActivateResult {
    const target = this.sessions.get(id)
    if (!target) return { success: false, error: "Sessão não encontrada: " + id }
    const now = new Date().toISOString()
    if (this.activeId && this.activeId !== id) {
      const prev = this.sessions.get(this.activeId)
      if (prev && prev.status === "active") {
        prev.status = "idle"
        prev.updatedAt = now
        this.persist(prev)
      }
    }
    target.status = "active"
    target.updatedAt = now
    this.persist(target)
    this.activeId = id
    this.saveActivePointer()
    return { success: true }
  }

  appendMessage(id: string, message: SessionMessage): WorkSession | undefined {
    const session = this.sessions.get(id)
    if (!session) return undefined
    session.messages.push(message)
    session.updatedAt = new Date().toISOString()
    this.persist(session)
    return session
  }

  clearMessages(id: string): WorkSession | undefined {
    const session = this.sessions.get(id)
    if (!session) return undefined
    session.messages = []
    session.updatedAt = new Date().toISOString()
    this.persist(session)
    return session
  }

  /** Vincula (ou atualiza) missao/execucao/plano conhecidos no momento —
   * apenas os ids (ponteiros), nunca uma copia do conteudo real. */
  linkContext(id: string, ctx: { missionId?: string | null; executionId?: string | null; plannerGoalId?: string | null; provider?: string; model?: string; kernelMode?: string }): WorkSession | undefined {
    const session = this.sessions.get(id)
    if (!session) return undefined
    if (ctx.missionId !== undefined) session.missionId = ctx.missionId
    if (ctx.executionId !== undefined) session.executionId = ctx.executionId
    if (ctx.plannerGoalId !== undefined) session.plannerGoalId = ctx.plannerGoalId
    if (ctx.provider !== undefined) session.provider = ctx.provider
    if (ctx.model !== undefined) session.model = ctx.model
    if (ctx.kernelMode !== undefined) session.kernelMode = ctx.kernelMode
    session.updatedAt = new Date().toISOString()
    this.persist(session)
    return session
  }
}
