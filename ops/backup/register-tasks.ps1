<#
.SYNOPSIS
  Registra a Scheduled Task DIÁRIA (Fase 1) do backup do MultGestor.

.DESCRIPTION
  Cria a task 'MultGestor-Backup-Daily' que roda `ops/backup/run-backup.ps1` todo dia no horário
  informado (default 02:00), em modo dump-only. Por padrão registra SOMENTE a task diária.

  A Fase 2 (full restore-check semanal no projeto descartável) NÃO é registrada aqui — depende de
  aprovação explícita e de proposta própria. O switch -IncludeWeekly aborta de propósito.

.PARAMETER Time
  Horário diário (HH:mm). Default 02:00.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\ops\backup\register-tasks.ps1
  powershell -ExecutionPolicy Bypass -File .\ops\backup\register-tasks.ps1 -Time 03:30

.NOTES
  Rodar como o seu usuário (a task roda com a sua identidade, LogonType Interactive).
  Remover: Unregister-ScheduledTask -TaskName 'MultGestor-Backup-Daily' -Confirm:$false
#>
#Requires -Version 5.1
[CmdletBinding()]
param(
  [string]$Time = '02:00',
  [switch]$IncludeWeekly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($IncludeWeekly) {
  throw "Fase 2 (full restore-check semanal) ainda NAO foi aprovada/implementada. Registre apenas a task diaria (sem -IncludeWeekly)."
}

$wrapper = Join-Path $PSScriptRoot 'run-backup.ps1'
if (-not (Test-Path -LiteralPath $wrapper -PathType Leaf)) {
  throw "Wrapper nao encontrado: '$wrapper'."
}

$taskName = 'MultGestor-Backup-Daily'

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$wrapper`""

$trigger = New-ScheduledTaskTrigger -Daily -At $Time

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Hours 1) -MultipleInstances IgnoreNew

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $taskName -Force `
  -Action $action -Trigger $trigger -Settings $settings -Principal $principal `
  -Description 'MultGestor Fase 1 — pg_dump diario (dump-only, off-repo). Sem restore, sem producao.' | Out-Null

Write-Host "Task '$taskName' registrada: diaria as $Time (dump-only)."
Write-Host "Remover com: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
