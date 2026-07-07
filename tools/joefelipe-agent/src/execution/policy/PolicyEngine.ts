import type { ExecutionCommand } from "../types.ts"
import type { ExecutionPolicy, PolicyContext, PolicyVerdict } from "./types.ts"
import { ExecutionPolicyChain } from "./ExecutionPolicyChain.ts"
import { ModePolicy, StepTypePolicy, SafetyPolicy, ExternalCallPolicy, ScopePolicy, ShellPolicy, GitPolicy, DeployPolicy, SecretsPolicy } from "./ExecutionPolicyChain.ts"

const DEFAULT_POLICIES: ExecutionPolicy[] = [
  new SecretsPolicy(),
  new ModePolicy(),
  new StepTypePolicy(),
  new SafetyPolicy(),
  new ExternalCallPolicy(),
  new GitPolicy(),
  new DeployPolicy(),
  new ScopePolicy(),
  new ShellPolicy(),
]

export class PolicyEngine {
  private chain: ExecutionPolicyChain

  constructor(policies?: ExecutionPolicy[]) {
    this.chain = new ExecutionPolicyChain(policies ?? DEFAULT_POLICIES)
  }

  evaluate(cmd: ExecutionCommand, ctx: PolicyContext): PolicyVerdict {
    return this.chain.evaluate(cmd, ctx)
  }
}