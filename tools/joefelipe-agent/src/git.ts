// Leitura do estado do Git — SOMENTE comandos read-only.
// Nunca commit, push, merge, checkout, reset ou qualquer mutação.

import { execFileSync } from "node:child_process";
import { isSensitivePath } from "./readers.ts";
import type { GitInfo, ChangedFile } from "./types.ts";

function git(root: string, args: string[]): string | null {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 8000,
    }).trim();
  } catch {
    return null;
  }
}

export function getGitInfo(root: string): GitInfo {
  const branch = git(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch === null) {
    return {
      available: false,
      branch: null,
      ahead: null,
      behind: null,
      changed: [],
      recentCommits: [],
    };
  }

  const porcelain = git(root, ["status", "--porcelain=v1"]) ?? "";
  const changed: ChangedFile[] = porcelain
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const status = line.slice(0, 2).trim();
      // Lida com renomeações ("R  old -> new"): fica com o destino.
      const rest = line.slice(3).trim();
      const path = rest.includes(" -> ") ? rest.split(" -> ")[1].trim() : rest;
      return { path, status, sensitive: isSensitivePath(path) };
    });

  let ahead: number | null = null;
  let behind: number | null = null;
  const counts = git(root, [
    "rev-list",
    "--left-right",
    "--count",
    "@{upstream}...HEAD",
  ]);
  if (counts) {
    const parts = counts.split(/\s+/);
    if (parts.length === 2) {
      behind = Number(parts[0]);
      ahead = Number(parts[1]);
    }
  }

  const log = git(root, ["log", "-5", "--pretty=format:%h %s"]) ?? "";
  const recentCommits = log.split(/\r?\n/).filter(Boolean);

  return { available: true, branch, ahead, behind, changed, recentCommits };
}
