<#
.SYNOPSIS
  Wrapper do backup DIÁRIO (Fase 1) do MultGestor — roda `backup-restore-check --dump-only`.

.DESCRIPTION
  Carrega as variáveis de ambiente de um arquivo FORA do repo, roda o dump-only (sem destino,
  sem restore), aplica retenção (7 dumps) e grava last-status.json. Nunca ecoa secret.

  Guards (aborta com exit 2 se falhar):
    - env file ausente
    - env file com permissões inseguras (SID-based: S-1-1-0/S-1-5-11/S-1-5-32-545, idioma-independente)
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

# Diretório de log resolvido (preenchido assim que BRCHK_LOG_DIR é conhecido).
# Antes disso, usa um fallback — para que falhas precoces ainda gravem o status.
$script:ResolvedLogDir = $null
$FallbackLogDir = Join-Path $env:USERPROFILE 'backups\logs'
$script:StatusWritten = $false

# Garante que last-status.json SEMPRE reflita a última tentativa — inclusive
# guard-aborts e erros terminantes — para nunca mascarar uma falha com um status
# OK antigo. Best-effort: nunca lança (um erro aqui não pode derrubar o tratamento).
function Write-FailStatus([string]$reason, [int]$exitCode = 2) {
  if ($script:StatusWritten) { return }
  try {
    $dir = if ($script:ResolvedLogDir) { $script:ResolvedLogDir } else { $FallbackLogDir }
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $fail = [ordered]@{
      tool            = 'backup-restore-check'
      mode            = 'dump-only'
      finished_at     = (Get-Date).ToString('o')
      exit_code       = $exitCode
      status          = 'FAIL'
      error           = $reason
      external_upload = [ordered]@{ enabled = ($env:BRCHK_EXTERNAL_ENABLED -eq '1'); status = 'SKIPPED' }
    }
    $fail | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $dir 'last-status.json') -Encoding utf8
    $script:StatusWritten = $true
  } catch {
    Write-Warning "[backup-daily] nao foi possivel gravar last-status.json de falha: $($_.Exception.Message)"
  }
}

# Captura QUALQUER erro terminante inesperado e registra FAIL antes de sair.
trap {
  Write-FailStatus "erro terminante: $($_.Exception.Message)" 1
  exit 1
}

function Abort([string]$msg) {
  Write-Warning "[backup-daily] $msg"
  Write-FailStatus $msg 2
  exit 2
}

# ── Guard 1: env file existe ────────────────────────────────────────────────
if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) {
  Abort "Env file ausente: '$EnvFile'. Crie-o (fora do repo) com BRCHK_SOURCE_DB_URL, BRCHK_BACKUP_DIR, BRCHK_LOG_DIR."
}

# ── Guard 2: permissões seguras (por SID, idioma-independente) ───────────────
# Comparação por SID evita falha silenciosa em Windows pt-BR onde os nomes dos
# grupos diferem do en-US (ex: BUILTIN\Users → BUILTIN\Usuários).
# S-1-1-0      = Everyone
# S-1-5-11     = Authenticated Users (NT AUTHORITY\Authenticated Users)
# S-1-5-32-545 = Builtin\Users (BUILTIN\Users / BUILTIN\Usuários)
$blockedSids = @(
  [System.Security.Principal.SecurityIdentifier]'S-1-1-0',
  [System.Security.Principal.SecurityIdentifier]'S-1-5-11',
  [System.Security.Principal.SecurityIdentifier]'S-1-5-32-545'
)
$acl = Get-Acl -LiteralPath $EnvFile
foreach ($ace in $acl.Access) {
  if ($ace.AccessControlType -ne 'Allow') { continue }
  if ($ace.FileSystemRights.ToString() -notmatch 'Read|Write|Modify|FullControl') { continue }
  try {
    $aceSid = $ace.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier])
  } catch { continue }
  if ($blockedSids | Where-Object { $_.Value -eq $aceSid.Value }) {
    $aceLabel = try { $aceSid.Translate([System.Security.Principal.NTAccount]).Value } catch { $aceSid.Value }
    Abort "Permissões inseguras em '$EnvFile': '$aceLabel' (SID $($aceSid.Value)) tem acesso. Restrinja ao seu usuário."
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

# BRCHK_LOG_DIR já é conhecido — registra para que qualquer falha a partir daqui
# (Guard 3, dump, upload, etc.) grave last-status.json no diretório correto.
if ($env:BRCHK_LOG_DIR) { $script:ResolvedLogDir = $env:BRCHK_LOG_DIR }

# ── Guard 3: variáveis obrigatórias presentes ────────────────────────────────
$required = @('BRCHK_SOURCE_DB_URL', 'BRCHK_BACKUP_DIR', 'BRCHK_LOG_DIR')
# Cópia externa é opt-in: só exige as vars B2 quando a flag está LIGADA.
# Flag ausente ou '0' → lista de obrigatórias idêntica ao comportamento atual.
if ($env:BRCHK_EXTERNAL_ENABLED -eq '1') {
  $required += @('BRCHK_B2_KEY_ID', 'BRCHK_B2_APP_KEY', 'BRCHK_B2_BUCKET', 'BRCHK_B2_BUCKET_ID')
}
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

# ── Cópia externa (feature-flagged: BRCHK_EXTERNAL_ENABLED=1) ─────────────────
# Flag OFF/ausente → SKIPPED e comportamento idêntico ao atual (o dump local manda).
# Falha de upload NÃO apaga/invalida o dump local nem altera o exit code do dump.
$externalUpload = [ordered]@{
  enabled = ($env:BRCHK_EXTERNAL_ENABLED -eq '1')
  status  = 'SKIPPED'
}
if (($env:BRCHK_EXTERNAL_ENABLED -eq '1') -and ($code -eq 0)) {
  $newestDump = Get-ChildItem -LiteralPath $backupDir -Filter '*.dump' -File -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($newestDump) {
    try {
      $uploader = Join-Path $PSScriptRoot 'upload-external.ps1'
      $externalUpload = & $uploader -DumpPath $newestDump.FullName
    } catch {
      $externalUpload = [ordered]@{
        enabled = $true; provider = 'backblaze-b2'; status = 'FAIL'; error = $_.Exception.Message
      }
    }
  } else {
    $externalUpload = [ordered]@{
      enabled = $true; provider = 'backblaze-b2'; status = 'FAIL'; error = 'nenhum .dump encontrado para upload'
    }
  }
}

# ── last-status.json (sem secrets) ───────────────────────────────────────────
$status = [ordered]@{
  tool            = 'backup-restore-check'
  mode            = 'dump-only'
  finished_at     = (Get-Date).ToString('o')
  exit_code       = $code
  status          = if ($code -eq 0) { 'OK' } else { 'FAIL' }
  external_upload = $externalUpload
}
$status | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $logDir 'last-status.json') -Encoding utf8
$script:StatusWritten = $true

if ($code -eq 0) { Write-Host '[backup-daily] OK.' } else { Write-Warning "[backup-daily] FALHOU (exit $code)." }
exit $code
