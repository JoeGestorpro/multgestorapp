#!/usr/bin/env node
'use strict';

/**
 * generate-context-pack.js
 *
 * Regenera os metadados mecânicos do Context Pack (.opencodex/handoff/context-pack/)
 * e detecta deriva entre o pack e as fontes canônicas do Segundo Cérebro.
 *
 * DESENHO HONESTO (leia antes de estender este script):
 * Extrair automaticamente "as seções certas" de um markdown vivo exige julgamento editorial —
 * por exemplo, o PACK-02-ESTADO.md deliberadamente ignora a metade antiga/stale de
 * 01-CURRENT-STATE.md e resume 3 documentos em 60 linhas de prosa. Um script determinístico
 * não reproduz isso com segurança sem virar uma abstração falsa que finge sumarizar e na
 * prática erra silenciosamente. Por isso este script NÃO reescreve a prosa dos PACK-0X.md.
 *
 * O que ele FAZ, de forma mecânica e reproduzível:
 *   1. Atualiza data de geração + state_version + commit de referência no cabeçalho de cada
 *      arquivo do pack (regex sobre as linhas de metadado já existentes).
 *   2. Roda a checagem de conteúdo sensível em TODOS os arquivos do pack — falha com erro
 *      (exit 1) se encontrar qualquer padrão de secret/token/connection string.
 *   3. Compara hash das fontes canônicas com o manifesto da última geração e informa quais
 *      fontes mudaram — ou seja, quais PACK-0X.md precisam de revisão de prosa (por uma IA
 *      com contexto, não por este script) antes do próximo handoff.
 *
 * Uso: node scripts/generate-context-pack.js
 * Exit code 0 = pack íntegro (sensíveis ok); metadados atualizados; relatório de deriva impresso.
 * Exit code 1 = conteúdo sensível encontrado — pack NÃO deve ser enviado ao Claude Project.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PACK_DIR = path.join(ROOT, '.opencodex', 'handoff', 'context-pack');
const MANIFEST_PATH = path.join(PACK_DIR, '.manifest.json');

const CANONICAL_SOURCES = [
  '.opencodex/brain/01-CURRENT-STATE.md',
  '.opencodex/brain/EXECUTION-PLAYBOOK-PRODUCAO.md',
  '.opencodex/brain/MULTGESTOR-PLATFORM-SPECIFICATION.md',
  '.opencodex/brain/decisions/DECISION-GRAPH.md',
  'BRIEFING-CLAUDE-CODE.md',
];

const PACK_FILES = [
  'PACK-00-LEIA-PRIMEIRO.md',
  'PACK-01-BRIEFING.md',
  'PACK-02-ESTADO.md',
  'PACK-03-ROADMAP.md',
  'PACK-04-PLATAFORMA.md',
  'PACK-05-DECISOES.md',
];

// Padrões de conteúdo sensível — falha alto se encontrar qualquer um.
// Propositalmente amplo (falso positivo é aceitável; falso negativo não é).
const SENSITIVE_PATTERNS = [
  /postgresql:\/\/[^\s'"]+:[^\s'"]+@/i, // connection string com credencial
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/,
  /\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{10,}/, // chaves estilo Stripe/Resend
  /\bsb_(secret|publishable)_[A-Za-z0-9_-]{10,}/i, // chaves Supabase
  /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/, // JWT-like
  /BRCHK_[A-Z_]*(KEY|SECRET|PASS)\s*=\s*\S+/,
  /(api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*['"]?[A-Za-z0-9_-]{12,}/i,
  /@gmail\.com|@hotmail\.com|@outlook\.com/i, // e-mail pessoal solto (proxy de PII)
];

function hashFile(absPath) {
  const crypto = require('crypto');
  const content = fs.readFileSync(absPath);
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function getGitRef() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  } catch {
    return '(sem git)';
  }
}

function getStateVersion() {
  const currentStatePath = path.join(ROOT, '.opencodex', 'brain', '01-CURRENT-STATE.md');
  const content = fs.readFileSync(currentStatePath, 'utf8');
  const match = content.match(/\*\*state_version:\*\*\s*(\d+)/);
  return match ? match[1] : '(desconhecido)';
}

function scanSensitive() {
  const hits = [];
  for (const file of PACK_FILES) {
    const abs = path.join(PACK_DIR, file);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, 'utf8');
    for (const pattern of SENSITIVE_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        hits.push({ file, pattern: pattern.toString(), sample: match[0].slice(0, 30) + '…' });
      }
    }
  }
  return hits;
}

function updateHeaderMetadata(generatedAt, stateVersion, gitRef) {
  for (const file of PACK_FILES) {
    const abs = path.join(PACK_DIR, file);
    if (!fs.existsSync(abs)) continue;
    let content = fs.readFileSync(abs, 'utf8');

    content = content.replace(/\*\*Gerado em:\*\*\s*[^\s·]+/, `**Gerado em:** ${generatedAt}`);
    content = content.replace(
      /\*\*state_version de origem:\*\*\s*\d+/,
      `**state_version de origem:** ${stateVersion}`
    );
    content = content.replace(
      /- \*\*Gerado em:\*\*\s*[^\n]+/,
      `- **Gerado em:** ${generatedAt}`
    );
    content = content.replace(
      /- \*\*Commit local de referência:\*\*\s*`[^`]*`/,
      `- **Commit local de referência:** \`${gitRef}\``
    );

    fs.writeFileSync(abs, content, 'utf8');
  }
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

function main() {
  console.log('[context-pack] Verificando conteúdo sensível...');
  const hits = scanSensitive();
  if (hits.length > 0) {
    console.error('[context-pack] ❌ CONTEÚDO SENSÍVEL ENCONTRADO — pack bloqueado:');
    for (const hit of hits) {
      console.error(`  - ${hit.file}: padrão ${hit.pattern} (amostra: ${hit.sample})`);
    }
    console.error('\nCorrija o(s) arquivo(s) do pack antes de enviar ao Claude Project.');
    process.exit(1);
  }
  console.log('[context-pack] ✅ Nenhum conteúdo sensível encontrado.');

  const generatedAt = new Date().toISOString().slice(0, 10);
  const stateVersion = getStateVersion();
  const gitRef = getGitRef();

  console.log(`[context-pack] Atualizando metadados: data=${generatedAt} state_version=${stateVersion} commit=${gitRef}`);
  updateHeaderMetadata(generatedAt, stateVersion, gitRef);

  console.log('[context-pack] Verificando deriva das fontes canônicas...');
  const oldManifest = loadManifest();
  const newManifest = { generatedAt, stateVersion, gitRef, sources: {} };
  const drifted = [];

  for (const rel of CANONICAL_SOURCES) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      console.warn(`[context-pack] ⚠️  Fonte não encontrada (ignorada): ${rel}`);
      continue;
    }
    const hash = hashFile(abs);
    newManifest.sources[rel] = hash;
    if (oldManifest.sources && oldManifest.sources[rel] && oldManifest.sources[rel] !== hash) {
      drifted.push(rel);
    }
  }

  saveManifest(newManifest);

  if (drifted.length > 0) {
    console.log('\n[context-pack] 🟡 Fontes que mudaram desde a última geração — revisar a PROSA dos packs correspondentes com uma IA (este script só atualiza metadados):');
    for (const rel of drifted) {
      console.log(`  - ${rel}`);
    }
  } else if (Object.keys(oldManifest.sources || {}).length > 0) {
    console.log('\n[context-pack] Nenhuma fonte canônica mudou desde a última geração — prosa dos packs provavelmente ainda válida.');
  } else {
    console.log('\n[context-pack] Primeira geração do manifesto — sem baseline de comparação ainda.');
  }

  console.log('\n[context-pack] Concluído. Lembrar o Joe: "Pack atualizado — substituir os arquivos no Claude Project."');
}

main();
