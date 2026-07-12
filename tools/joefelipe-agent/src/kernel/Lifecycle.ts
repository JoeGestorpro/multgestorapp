import type { LifecycleStatus } from './types.ts'

export interface LifecycleHook {
  name: string
  fn: () => Promise<void>
}

export class LifecycleManager {
  private _status: LifecycleStatus = 'starting'
  private _beforeStartHooks: LifecycleHook[] = []
  private _startHooks: LifecycleHook[] = []
  private _readyHooks: LifecycleHook[] = []
  private _pauseHooks: LifecycleHook[] = []
  private _resumeHooks: LifecycleHook[] = []
  private _shutdownHooks: LifecycleHook[] = []
  private _error: string | null = null

  get status(): LifecycleStatus { return this._status }
  get error(): string | null { return this._error }

  onBeforeStart(hook: LifecycleHook): void { this._beforeStartHooks.push(hook) }
  onStart(hook: LifecycleHook): void { this._startHooks.push(hook) }
  onReady(hook: LifecycleHook): void { this._readyHooks.push(hook) }
  onPause(hook: LifecycleHook): void { this._pauseHooks.push(hook) }
  onResume(hook: LifecycleHook): void { this._resumeHooks.push(hook) }
  onShutdown(hook: LifecycleHook): void { this._shutdownHooks.push(hook) }

  private setError(prefix: string, hookName: string, err: unknown): void {
    this._error = prefix + ':' + hookName + ':' + String(err)
  }

  async runBeforeStart(): Promise<void> {
    for (const hook of this._beforeStartHooks) {
      try { await hook.fn() } catch (e) { this.setError('beforeStart', hook.name, e) }
    }
  }

  async runStart(): Promise<void> {
    for (const hook of this._startHooks) {
      try { await hook.fn() } catch (e) { this.setError('start', hook.name, e) }
    }
  }

  async runReady(): Promise<void> {
    this._status = 'ready'
    for (const hook of this._readyHooks) {
      try { await hook.fn() } catch (e) { this.setError('ready', hook.name, e) }
    }
  }

  async pause(): Promise<void> {
    this._status = 'paused'
    for (const hook of this._pauseHooks) {
      try { await hook.fn() } catch (e) { this.setError('pause', hook.name, e) }
    }
  }

  async resume(): Promise<void> {
    this._status = 'resuming'
    for (const hook of this._resumeHooks) {
      try { await hook.fn() } catch (e) { this.setError('resume', hook.name, e) }
    }
    this._status = 'ready'
  }

  async shutdown(): Promise<void> {
    this._status = 'shuttingDown'
    for (const hook of this._shutdownHooks) {
      try { await hook.fn() } catch (e) { this.setError('shutdown', hook.name, e) }
    }
  }
}

export function createLifecycle(): LifecycleManager {
  return new LifecycleManager()
}
