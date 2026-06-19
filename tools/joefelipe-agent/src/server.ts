import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildState, writeRuntimeState, AGENT_META } from "./state.ts";
import { findRepoRoot } from "./readers.ts";

const ROOT = findRepoRoot();

export function startServer(root: string = ROOT, port = 3333): Server {
  const server = createServer((req, res) => {
    const state = buildState(root);
    writeRuntimeState(root, state);

    if (req.url === "/api/state") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(state, null, 2));
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderHTML(state));
  });

  server.listen(port, () => {});
  return server;
}

function renderHTML(s: any): string {
  const p1 = s.risks.items.filter((r: any) => r.severity === "P1");
  const p2 = s.risks.items.filter((r: any) => r.severity === "P2");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Agente JoeFelipe — Painel Vivo</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; line-height: 1.6; }
  h1 { color: #58a6ff; margin-bottom: .25rem; font-size: 1.5rem; }
  h2 { color: #f0f6fc; margin: 1.5rem 0 .75rem; font-size: 1.1rem; border-bottom: 1px solid #30363d; padding-bottom: .3rem; }
  .meta { color: #8b949e; font-size: .85rem; margin-bottom: 1.5rem; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; }
  .card p { margin: .25rem 0; }
  .label { color: #8b949e; display: inline-block; min-width: 10rem; }
  .value { color: #f0f6fc; }
  .badge { display: inline-block; padding: .1rem .5rem; border-radius: 12px; font-size: .75rem; font-weight: 600; }
  .badge-ok { background: #1b4a1f; color: #3fb950; }
  .badge-warn { background: #4d2d00; color: #d29922; }
  .badge-err { background: #4e1a1a; color: #f85149; }
  .badge-idle { background: #1b2d4a; color: #58a6ff; }
  ul { list-style: none; }
  li { padding: .2rem 0; }
  .risk-p1 { color: #f85149; }
  .risk-p2 { color: #d29922; }
  .code { font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: .85rem; background: #0d1117; padding: .75rem; border-radius: 4px; border: 1px solid #30363d; white-space: pre-wrap; word-break: break-word; }
  .warning { color: #d29922; }
  .error { color: #f85149; }
  a { color: #58a6ff; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .footer { margin-top: 2rem; color: #484f58; font-size: .8rem; text-align: center; }
</style>
</head>
<body>
<h1>🧭 Agente JoeFelipe</h1>
<p class="meta">${s.agent.name} · ${s.agent.version} · modo ${s.agent.mode} · atualizado ${s.generatedAt}</p>

<h2>Estado do Projeto</h2>
<div class="card">
  <p><span class="label">Missão atual:</span><span class="value badge badge-idle">${s.mission.current ?? "idle"}</span> <span class="value">${s.mission.currentStatus ?? ""}</span></p>
  <p><span class="label">Próxima missão:</span><span class="value">${s.mission.next ?? "—"}</span> <span class="badge ${s.mission.nextStatus === 'pending' ? 'badge-warn' : 'badge-ok'}">${s.mission.nextStatus ?? ""}</span>${s.mission.nextMode ? ` <span class="value">[${s.mission.nextMode}]</span>` : ""}</p>
  <p><span class="label">Sources found:</span><span class="value">${s.sources.found.length}</span> <span class="label">missing:</span><span class="value">${s.sources.missing.length}</span></p>
</div>

<h2>Próxima Melhor Ação</h2>
<div class="card">
  ${s.nextBestAction.mission ? `<p><span class="value">${s.nextBestAction.mission}</span></p>${s.nextBestAction.rationale ? `<p class="meta">${s.nextBestAction.rationale}</p>` : ""}` : `<p class="meta">Nenhuma ação detectada</p>`}
</div>

<h2>Riscos Ativos</h2>
<div class="card">
  ${s.risks.total !== null ? `<p><span class="label">Total:</span><span class="value">${s.risks.total}</span></p>` : ""}
  ${p1.length ? `<p class="risk-p1"><strong>P1 (${p1.length}):</strong></p><ul>${p1.map((r: any) => `<li class="risk-p1">${r.id ?? ""} ${r.title}</li>`).join("")}</ul>` : `<p>Nenhum P1 detectado</p>`}
  ${p2.length ? `<p class="risk-p2"><strong>P2 (${p2.length}):</strong></p><ul>${p2.map((r: any) => `<li class="risk-p2">${r.id ?? ""} ${r.title}</li>`).join("")}</ul>` : ""}
</div>

<h2>Decisões Pendentes</h2>
<div class="card">
  ${s.decisions.pending.length ? `<ul>${s.decisions.pending.map((d: any) => `<li>${d.id} — ${d.title}</li>`).join("")}</ul>` : `<p class="meta">Nenhuma decisão pendente</p>`}
</div>

<h2>Git</h2>
<div class="card">
  <p><span class="label">Branch:</span><span class="value">${s.git.branch ?? "?"}</span>${s.git.ahead !== null ? ` <span class="label">ahead:</span><span class="value">${s.git.ahead}</span> <span class="label">behind:</span><span class="value">${s.git.behind}</span>` : ""}</p>
  <p><span class="label">Arquivos alterados:</span><span class="value">${s.git.changed.length}</span></p>
  ${s.git.changed.length ? `<ul>${s.git.changed.map((c: any) => `<li class="${c.sensitive ? 'warning' : ''}">${c.sensitive ? "🔒" : "📄"} ${c.path} [${c.status}]${c.sensitive ? " (ignorado)" : ""}</li>`).join("")}</ul>` : ""}
  ${s.git.recentCommits.length ? `<p class="label" style="margin-top:.5rem">Últimos commits:</p><ul>${s.git.recentCommits.map((c: string) => `<li class="code" style="padding:.15rem .5rem;margin:.1rem 0">${c}</li>`).join("")}</ul>` : ""}
</div>

<h2>Ações Humanas Pendentes</h2>
<div class="card">
  ${s.humanActions.length ? `<ul>${s.humanActions.map((a: string) => `<li>→ ${a}</li>`).join("")}</ul>` : `<p class="meta">Nenhuma ação humana pendente</p>`}
</div>

<h2>Prompt Recomendado</h2>
<div class="card">
  <div class="code">${escapeHtml(s.recommendedPrompt)}</div>
</div>

${s.warnings.length ? `<h2>Avisos</h2><div class="card warning"><ul>${s.warnings.map((w: string) => `<li>⚠ ${w}</li>`).join("")}</ul></div>` : ""}

<div class="footer">
  Agente JoeFelipe V1 · READ-ONLY · ${s.agent.technicalName}<br>
  <a href="/api/state">GET /api/state (JSON)</a>
</div>

<script>
setTimeout(() => location.reload(), 30000);
</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
