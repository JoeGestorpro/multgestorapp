<#
.SYNOPSIS
  Wrapper do backup DIÁRIO (Fase 1) do MultGestor — roda `backup-restore-check --dump-only`.

.DESCRIPTION
  Carrega as variáveis de ambiente de um arquivo FORA do repo, roda o dump-only (sem destino,
  sem restore), aplica retenção (7 dumps) e grava last-status.json. Nunca ecoa secret.

  Guards (aborta com exit 2 se falhar):
    - env file ausente
    - env file com permissões inseguras (acessível a Everyone/Users/Authenticated Users)
    - env file incompleto (faltam variáveis obrigatórias)
  Além disso, BRCHK_TARGET_DB_URL é REMOVIDO do ambiente — a task diária nunca restaura.

.NOTES
  Não recebe argumentos sensíveis. Connection strings só vêm do env file off-repo.
#>
#Requires -Version 5.1
[CmdletBinding()]
param(
  [string]$EnvFile = (Join-Path $env:USERPROFILE '.mg-backup\brchk.env')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Abort([string]$msg) {
  Write-Error "[backup-daily] $msg"
  exit 2
}

# ── Guard 1: env file existe ────────────────────────────────────────────────
if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) {
  Abort "Env file ausente: '$EnvFile'. Crie-o (fora do repo) com BRCHK_SOURCE_DB_URL, BRCHK_BACKUP_DIR, BRCHK_LOG_DIR."
}

# ── Guard 2: permissões seguras (sem acesso a grupos amplos) ─────────────────
$broad = @('Everyone', 'BUILTIN\Users', 'NT AUTHORITY\Authenticated Users')
$acl = Get-Acl -LiteralPath $EnvFile
foreach ($ace in $acl.Access) {
  if (($broad -contains $ace.IdentityReference.Value) -and
      ($ace.AccessControlType -eq 'Allow') -and
      ($ace.FileSystemRights.ToString() -match 'Read|Write|Modify|FullControl')) {
    Abort "Permissões inseguras em '$EnvFile': '$($ace.IdentityReference.Value)' tem acesso. Restrinja ao seu usuário (remova Users/Everyone/Authenticated Users)."
  }
}

# ── Carrega o env file (KEY=VALUE), sem imprimir valores ─────────────────────
foreach ($raw in (Get-Content -LiteralPath $EnvFile)) {
  $line = $raw.Trim()
  if (-not $line -or $line.StartsWith('#')) { continue }
  $idx = $line.IndexOf('=')
  if ($idx -lt 1) { continue }
  $key = $line.Substring(0, $idx).Trim()
  $val = $line.Substring($idx + 1).Trim()
  if ($val.Length -ge 2 -and
      ((($val[0] -eq '"') -and ($val[-1] -eq '"')) -or (($val[0] -eq "'") -and ($val[-1] -eq "'")))) {
    $val = $val.Substring(1, $val.Length - 2)
  }
  Set-Item -Path "env:$key" -Value $val
}

# ── Guard 3: variáveis obrigatórias presentes ────────────────────────────────
$required = @('BRCHK_SOURCE_DB_URL', 'BRCHK_BACKUP_DIR', 'BRCHK_LOG_DIR')
$missing = $required | Where-Object { -not (Test-Path "env:$_") -or -not (Get-Item "env:$_").Value }
if ($missing) {
  Abort "Env file incompleto: faltam $($missing -join ', ')."
}

# ── Guard dump-only: a task diária NUNCA restaura — remove qualquer destino ───
if (Test-Path env:BRCHK_TARGET_DB_URL) {
  Remove-Item env:BRCHK_TARGET_DB_URL
  Write-Host '[backup-daily] BRCHK_TARGET_DB_URL ignorado (modo dump-only, sem restore).'
}

$backupDir = $env:BRCHK_BACKUP_DIR
$logDir    = $env:BRCHK_LOG_DIR
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
New-Item -ItemType Directory -Force -Path $logDir    | Out-Null

# ── Executa o dump-only (connection string via env, NUNCA em argv) ───────────
$repoRoot   = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$backendDir = Join-Path $repoRoot 'backend'
Push-Location $backendDir
try {
  & npm @('run', 'backup-restore-check', '--', '--dump-only')
  $code = $LASTEXITCODE
} finally {
  Pop-Location
}

# ── Retenção: 7 dumps mais recentes; logs JSON > 30 dias ─────────────────────
Get-ChildItem -LiteralPath $backupDir -Filter '*.dump' -File -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -Skip 7 |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue }

$cutoff = (Get-Date).AddDays(-30)
Get-ChildItem -LiteralPath $logDir -Filter '*.json' -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -ne 'last-status.json' -and $_.LastWriteTime -lt $cutoff } |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue }

# ── last-status.json (sem secrets) ───────────────────────────────────────────
$status = [ordered]@{
  tool        = 'backup-restore-check'
  mode        = 'dump-only'
  finished_at = (Get-Date).ToString('o')
  exit_code   = $code
  status      = if ($code -eq 0) { 'OK' } else { 'FAIL' }
}
$status | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $logDir 'last-status.json') -Encoding utf8

if ($code -eq 0) { Write-Host '[backup-daily] OK.' } else { Write-Warning "[backup-daily] FALHOU (exit $code)." }
exit $code
