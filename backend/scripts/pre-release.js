'use strict'

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..', '..')
const BACKEND = path.join(ROOT, 'backend')
const FRONTEND = path.join(ROOT, 'frontend')
const WORKFLOWS = path.join(ROOT, '.github', 'workflows')

let passed = 0
let failed = 0
const failures = []

function info(msg)  { console.log(`  ${msg}`) }
function ok(msg)    { console.log(`  \x1b[32m\u2713\x1b[0m ${msg}`) }
function fail(msg)  { console.log(`  \x1b[31m\u2717\x1b[0m ${msg}`) }

function heading(title) {
  console.log(`\n\x1b[1m-- ${title} --\x1b[0m\n`)
}

function runCheck(name, fn) {
  try {
    fn()
    ok(name)
    passed++
  } catch (err) {
    fail(name)
    failures.push({ name, reason: err.message })
    failed++
  }
}

function run(cmd, opts = {}) {
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: 'pipe',
    cwd: BACKEND,
    timeout: 180000,
    ...opts,
  }).toString().trim()
}

// -- Helpers ----------------------------------------------------------------

function getBranch() {
  return execSync('git branch --show-current', { encoding: 'utf8', cwd: ROOT }).trim()
}

function getStatus() {
  return execSync('git status --short', { encoding: 'utf8', cwd: ROOT }).trim()
}

function isSupabaseOrProduction(url) {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.includes('supabase') ||
         lower.includes('production') ||
         lower.includes('render.com') ||
         lower.includes('vercel')
}

function isPlaceholder(value) {
  const cleaned = value.replace(/['"]/g, '')
  const indicators = ['...', 'xxx', 'your-', 'your_', 'example', '<placeholder>']
  return indicators.some(ind => cleaned.toLowerCase().includes(ind.toLowerCase()))
}

// -- Main -------------------------------------------------------------------

function main() {
  const hr = '\u2501'.repeat(56)

  console.log(`\n${hr}`)
  console.log(`  RELEASE SAFETY GATE  v1`)
  console.log(`  ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`)
  console.log(`${hr}\n`)

  // 1. Git checks -----------------------------------------------------------

  heading('1. Git')

  runCheck('Working tree deve estar limpo', () => {
    const status = getStatus()
    const lines = status.split('\n').filter(l => l && !l.includes('docs/private/'))
    if (lines.length > 0) {
      throw new Error(
        `Arquivos modificados ou não versionados encontrados:\n` +
        lines.map(l => `       ${l}`).join('\n') + `\n\n` +
        `      Proximo passo: git add + git commit antes de rodar o pre-release.`
      )
    }
  })

  runCheck('Branch deve ser main ou release/*', () => {
    const branch = getBranch()
    const allowed = branch === 'main' || branch.startsWith('release/')
    if (!allowed) {
      throw new Error(
        `Branch atual: ${branch}\n` +
        `      Branchs permitidas: main, release/*\n` +
        `      Proximo passo: git checkout main e mesclar as alteracoes.`
      )
    }
    info(`Branch: ${branch}`)
  })

  // 2. YAML workflow validation ---------------------------------------------

  heading('2. Workflows YAML')

  runCheck('Workflows .github/workflows/*.yml devem ser YAML validos', () => {
    let yaml
    try {
      yaml = require('js-yaml')
    } catch {
      throw new Error('Dependencia js-yaml nao disponivel. Execute npm install.')
    }
    const files = fs.readdirSync(WORKFLOWS).filter(f => /\.ya?ml$/i.test(f))
    if (files.length === 0) {
      throw new Error('Nenhum arquivo YAML encontrado em .github/workflows/')
    }
    for (const file of files) {
      const content = fs.readFileSync(path.join(WORKFLOWS, file), 'utf8')
      try {
        yaml.load(content)
        info(`${file}: OK`)
      } catch (err) {
        throw new Error(`${file}: YAML invalido — ${err.message}`)
      }
    }
  })

  // 3. Secret scan ----------------------------------------------------------

  heading('3. Secret Scan')

  const SECRET_PATTERNS = [
    { pattern: /-----BEGIN\s+(RSA |EC |DSA |PGP |OPENSSH )?PRIVATE KEY-----/i, name: 'chave privada' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub PAT (ghp_)' },
    { pattern: /gho_[a-zA-Z0-9]{36}/g, name: 'GitHub OAuth (gho_)' },
    { pattern: /github_pat_[a-zA-Z0-9]{22,}/g, name: 'GitHub fine-grained PAT' },
    { pattern: /sbp_[a-zA-Z0-9]{40,}/g, name: 'Supabase access token (sbp_)' },
    { pattern: /sk_live_[a-zA-Z0-9]+/g, name: 'Stripe live secret (sk_live)' },
    { pattern: /rk_live_[a-zA-Z0-9]+/g, name: 'Stripe live secret (rk_live)' },
    { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key (AKIA)' },
    { pattern: /xox[bpsar]-[a-zA-Z0-9-]{24,}/g, name: 'Slack token' },
    { pattern: /(?:resend|sendgrid)_key[a-zA-Z0-9_-]*=[^'"\s]{20,}/gi, name: 'Email API key' },
    { pattern: /(?:SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_URL)=[^'"\s]{10,}/g, name: 'Supabase env var' },
  ]

  const IGNORE_PATH = [
    'backend/src/config/database.js',
    'backend/src/config/supabase.js',
    'backend/.env.production',
    'backend/.env',
    'backend/.env.test',
  ]

  function scanFile(filePath) {
    if (/node_modules|\.git|coverage|\.(env|log|sum|jpe?g|png|ico|woff2?|ttf|eot)$/i.test(filePath)) {
      return []
    }
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const findings = []
      for (const { pattern, name } of SECRET_PATTERNS) {
        const matches = content.match(pattern)
        if (matches) {
          findings.push({ file: path.relative(ROOT, filePath), name, count: matches.length, raw: matches[0] })
        }
      }
      return findings
    } catch {
      return []
    }
  }

  runCheck('Nenhum segredo exposto em arquivos versionados', () => {
    const tracked = execSync('git ls-files', { encoding: 'utf8', cwd: ROOT }).trim()
      .split('\n').filter(Boolean).map(f => path.join(ROOT, f))

    const all = []
    for (const fp of tracked) all.push(...scanFile(fp))

    const real = all.filter(f => {
      if (IGNORE_PATH.some(ip => f.file.startsWith(ip) || f.file === ip)) return false
      if (f.file.endsWith('.md') && f.name === 'Supabase env var') return false
      if (isPlaceholder(f.raw)) return false
      return true
    })

    if (real.length > 0) {
      const details = real.map(f =>
        `       ${f.file}: ${f.name}`
      ).join('\n')
      throw new Error(
        `Possiveis segredos encontrados:\n${details}\n\n` +
        `      Proximo passo: remover os segredos ou adicionar ao .gitignore.`
      )
    }

    info(`${tracked.length} arquivos varridos, nenhum segudo encontrado`)
  })

  // 4. DATABASE_URL guard ---------------------------------------------------

  heading('4. Database Guard')

  runCheck('DATABASE_URL nao pode apontar para producao / Supabase', () => {
    const dbUrl = process.env.DATABASE_URL || ''
    if (isSupabaseOrProduction(dbUrl)) {
      throw new Error(
        `DATABASE_URL=${dbUrl}\n` +
        `      Esta string aponta para ambiente de producao ou Supabase.\n` +
        `      O pre-release deve rodar contra banco local ou de teste.\n` +
        `      Proximo passo: alterar DATABASE_URL para um banco local ou de staging.`
      )
    }
    info('DATABASE_URL segura')
  })

  // 5. Backend unit tests ---------------------------------------------------

  heading('5. Backend — Unit Tests')

  runCheck('npm run test:unit deve passar (--runInBand)', () => {
    const out = run('npx jest tests/unit/ --no-coverage --silent --runInBand')
    const match = out.match(/Tests:\s+(\d+)\s+passed/i)
    if (match) info(`${match[1]} testes passaram`)
    if (out.includes('FAIL')) {
      const failedTests = out.match(/FAIL\s+(.+)$/gm) || []
      const details = failedTests.slice(0, 5).join('\n')
      throw new Error(
        `Testes unitarios falharam:\n       ${details || 'consultar output completo'}\n\n` +
        `      Proximo passo: corrigir os testes antes de tentar novamente.`
      )
    }
  })

  // 6. Frontend lint + build ------------------------------------------------

  heading('6. Frontend')

  runCheck('npm run lint deve passar (0 erros)', () => {
    const out = execSync('npx eslint .', { encoding: 'utf8', cwd: FRONTEND, timeout: 60000 }).toString().trim()
    const errorMatch = out.match(/(\d+)\s+errors?/i)
    const errors = errorMatch ? parseInt(errorMatch[1], 10) : 0
    if (errors > 0) {
      throw new Error(
        `ESLint reportou ${errors} erro(s).\n` +
        `      Proximo passo: corrigir os erros de lint no frontend.`
      )
    }
    const warnMatch = out.match(/(\d+)\s+warnings?/i)
    if (warnMatch) info(`${warnMatch[1]} warnings (nao bloqueante)`)
    else info('Nenhum warning')
  })

  runCheck('npm run build deve compilar', () => {
    const out = execSync('npx vite build', { encoding: 'utf8', cwd: FRONTEND, timeout: 120000 }).toString().trim()
    const timeMatch = out.match(/built in ([\d.]+s)/)
    if (timeMatch) info(`Build concluido em ${timeMatch[1]}`)
    if (out.includes('ERROR')) {
      throw new Error(
        `Build do frontend falhou.\n` +
        `      Proximo passo: corrigir os erros de compilacao no frontend.`
      )
    }
  })

  // -- Report ---------------------------------------------------------------

  const total = passed + failed

  console.log(`\n${hr}`)

  if (failures.length > 0) {
    console.log(`  \x1b[31m  BLOQUEADO\x1b[0m`)
    console.log(`  ${failed} falha(s) de ${total} verificacao(oes)`)
    console.log(``)
    for (const f of failures) {
      console.log(`  \x1b[31m\u2717\x1b[0m ${f.name}`)
      console.log(`    Motivo: ${f.reason}`)
      console.log(``)
    }
    process.exitCode = 1
  } else {
    console.log(`  \x1b[32m  APROVADO\x1b[0m`)
    console.log(`  ${passed} verificacao(oes) passaram`)
    console.log(`  \x1b[32m  Commit e push liberados.\x1b[0m`)
    process.exitCode = 0
  }

  console.log(`${hr}\n`)
}

main()
