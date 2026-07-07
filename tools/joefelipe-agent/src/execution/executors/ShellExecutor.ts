import { exec, type ExecOptions } from "node:child_process"
import { promisify } from "node:util"
import type { ExecutionCommand, StepResult, Executor } from "../types.ts"
import { CommandValidator } from "./CommandValidator.ts"

const execAsync = promisify(exec)

type ExecFn = (cmd: string, opts: ExecOptions) => Promise<{ stdout: string; stderr: string }>

export class ShellExecutor implements Executor {
  readonly id = "local-shell"
  private validator: CommandValidator
  private execFn: ExecFn

  constructor(execFn?: ExecFn) {
    this.validator = new CommandValidator()
    this.execFn = execFn ?? execAsync
  }

  canHandle(command: ExecutionCommand): boolean {
    return command.executor === "local-shell" && command.mode === "READ_ONLY"
  }

  async execute(command: ExecutionCommand): Promise<StepResult> {
    const cmdLine = command.prompt.trim()

    const validation = this.validator.validate(cmdLine)
    if (!validation.allowed) {
      return {
        success: false,
        error: "ShellExecutor: " + (validation.reason ?? "comando rejeitado"),
        metadata: { executor: "local-shell", commandId: command.id, command: cmdLine },
      }
    }

    try {
      const { stdout, stderr } = await this.execFn(cmdLine, {
        cwd: command.workingDirectory,
        timeout: command.timeout || 30_000,
        env: { ...process.env, ...command.environment } as NodeJS.ProcessEnv,
      })

      return {
        success: true,
        result: stdout || undefined,
        error: stderr || undefined,
        metadata: { executor: "local-shell", commandId: command.id, command: cmdLine },
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.stderr || err.message || String(err),
        metadata: { executor: "local-shell", commandId: command.id, command: cmdLine },
      }
    }
  }
}