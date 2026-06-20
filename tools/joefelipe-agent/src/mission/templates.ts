// Blocos de texto fixos do Mission Builder (mantém render.ts enxuto).

export const GOVERNANCE_RULES: readonly string[] = [
  "O Living OS é a AUTORIDADE EXECUTIVA; o Segundo Cérebro (.opencodex/brain) é a MEMÓRIA OFICIAL.",
  "NÃO iniciar execução de missão PLAN_ONLY / HUMAN_GATED / DANGEROUS sem autorização humana explícita.",
  "NÃO colar secrets/tokens no chat. NÃO push / merge / deploy sem autorização.",
  "Respeitar ESTRITAMENTE o escopo permitido; nunca tocar o escopo proibido.",
  "Staging explícito (sem `git add .`); commitar apenas os arquivos da missão.",
];

export const COMMIT_FOOTER = "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>";

export const BASE_CHECKLIST: readonly string[] = [
  "Confirmar a branch correta antes de iniciar",
  "Build/type-check do módulo afetado passa",
  "Revisar diff: nenhum arquivo fora do escopo permitido",
  "Nenhum secret/token/credencial no diff",
  "git status --short antes de commitar",
];

/** Verbo de Conventional Commit por tipo de missão. */
export const VERB_BY_TYPE: Record<string, string> = {
  security: "feat",
  "ops-infra": "feat",
  ops: "feat",
  feat: "feat",
  fix: "fix",
  docs: "docs",
  chore: "chore",
  refactor: "refactor",
};
