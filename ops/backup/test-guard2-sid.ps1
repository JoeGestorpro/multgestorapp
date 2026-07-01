<#
.SYNOPSIS
  Valida que o Guard 2 (SID-based) de run-backup.ps1 detecta permissões
  inseguras de forma idioma-independente.

.DESCRIPTION
  Sem dependência de Pester. Replica a lógica exata do Guard 2 como função
  testável e cobre:
    1. Os três SIDs bloqueados são resolvíveis nesta máquina.
    2. ACE explícita Everyone (S-1-1-0) Read → detectado inseguro.
    3. ACE explícita Authenticated Users (S-1-5-11) Read → detectado inseguro.
    4. ACE explícita BUILTIN\Users (S-1-5-32-545) Read → detectado inseguro.
    5. Arquivo com só o owner (herança desativada) → passa Guard 2.

  Uso:
    powershell -ExecutionPolicy Bypass -File .\ops\backup\test-guard2-sid.ps1

  Saída: [PASS]/[FAIL] por teste. Exit 0 se tudo passou, exit 1 se algum falhou.
#>
#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$pass = 0; $fail = 0

function Assert([bool]$cond, [string]$name) {
  if ($cond) { Write-Host "  [PASS] $name"; $script:pass++ }
  else        { Write-Host "  [FAIL] $name"; $script:fail++ }
}

# Lógica exata do Guard 2 de run-backup.ps1 — replicada aqui para teste direto.
function Test-AclHasBroadSid([string]$path) {
  $blockedSids = @(
    [System.Security.Principal.SecurityIdentifier]'S-1-1-0',
    [System.Security.Principal.SecurityIdentifier]'S-1-5-11',
    [System.Security.Principal.SecurityIdentifier]'S-1-5-32-545'
  )
  $acl = Get-Acl -LiteralPath $path
  foreach ($ace in $acl.Access) {
    if ($ace.AccessControlType -ne 'Allow') { continue }
    if ($ace.FileSystemRights.ToString() -notmatch 'Read|Write|Modify|FullControl') { continue }
    try {
      $aceSid = $ace.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier])
    } catch { continue }
    if ($blockedSids | Where-Object { $_.Value -eq $aceSid.Value }) { return $true }
  }
  return $false
}

# ── [1] SIDs bloqueados são resolvíveis (idioma-independente) ─────────────────
Write-Host "`n[1] SIDs blocked são resolvíveis nesta máquina"
@(
  @{ sid = 'S-1-1-0';      label = 'Everyone' },
  @{ sid = 'S-1-5-11';     label = 'Authenticated Users' },
  @{ sid = 'S-1-5-32-545'; label = 'Builtin\Users' }
) | ForEach-Object {
  try {
    $sid  = [System.Security.Principal.SecurityIdentifier]$_.sid
    $name = $sid.Translate([System.Security.Principal.NTAccount]).Value
    Assert ($name -ne '') "SID $($_.sid) ($($_.label)) → '$name'"
  } catch {
    Assert $false "SID $($_.sid) ($($_.label)) falhou na resolução: $_"
  }
}

# ── [2] ACE Everyone (S-1-1-0) Read → inseguro ───────────────────────────────
Write-Host "`n[2] ACE explícita Everyone (S-1-1-0) Read → inseguro"
$f2 = [System.IO.Path]::GetTempFileName()
try {
  $acl2 = Get-Acl -LiteralPath $f2
  $acl2.AddAccessRule(
    (New-Object System.Security.AccessControl.FileSystemAccessRule(
      ([System.Security.Principal.SecurityIdentifier]'S-1-1-0'), 'Read', 'Allow'
    ))
  )
  Set-Acl -LiteralPath $f2 -AclObject $acl2
  Assert (Test-AclHasBroadSid $f2) "Everyone Read → detectado inseguro"
} finally {
  if (Test-Path $f2) { Remove-Item $f2 -Force }
}

# ── [3] ACE Authenticated Users (S-1-5-11) Read → inseguro ───────────────────
Write-Host "`n[3] ACE explícita Authenticated Users (S-1-5-11) Read → inseguro"
$f3 = [System.IO.Path]::GetTempFileName()
try {
  $acl3 = Get-Acl -LiteralPath $f3
  $acl3.AddAccessRule(
    (New-Object System.Security.AccessControl.FileSystemAccessRule(
      ([System.Security.Principal.SecurityIdentifier]'S-1-5-11'), 'Read', 'Allow'
    ))
  )
  Set-Acl -LiteralPath $f3 -AclObject $acl3
  Assert (Test-AclHasBroadSid $f3) "Authenticated Users Read → detectado inseguro"
} finally {
  if (Test-Path $f3) { Remove-Item $f3 -Force }
}

# ── [4] ACE BUILTIN\Users (S-1-5-32-545) Read → inseguro ─────────────────────
Write-Host "`n[4] ACE explícita BUILTIN\Users (S-1-5-32-545) Read → inseguro"
$f4 = [System.IO.Path]::GetTempFileName()
try {
  $acl4 = Get-Acl -LiteralPath $f4
  $acl4.AddAccessRule(
    (New-Object System.Security.AccessControl.FileSystemAccessRule(
      ([System.Security.Principal.SecurityIdentifier]'S-1-5-32-545'), 'Read', 'Allow'
    ))
  )
  Set-Acl -LiteralPath $f4 -AclObject $acl4
  Assert (Test-AclHasBroadSid $f4) "BUILTIN\Users Read → detectado inseguro"
} finally {
  if (Test-Path $f4) { Remove-Item $f4 -Force }
}

# ── [5] Arquivo com só o owner (herança desativada) → passa ──────────────────
Write-Host "`n[5] Arquivo com só o owner (herança desativada) → passa Guard 2"
$f5 = [System.IO.Path]::GetTempFileName()
try {
  $acl5 = Get-Acl -LiteralPath $f5
  $acl5.SetAccessRuleProtection($true, $false)  # desativa herança, não copia regras herdadas
  $acl5.AddAccessRule(
    (New-Object System.Security.AccessControl.FileSystemAccessRule(
      [System.Security.Principal.WindowsIdentity]::GetCurrent().User,
      'FullControl', 'Allow'
    ))
  )
  Set-Acl -LiteralPath $f5 -AclObject $acl5
  Assert (-not (Test-AclHasBroadSid $f5)) "Owner-only (herança desativada) → passa Guard 2"
} finally {
  if (Test-Path $f5) { Remove-Item $f5 -Force }
}

# ── Resultado ─────────────────────────────────────────────────────────────────
Write-Host "`n── $pass/$($pass + $fail) testes passaram ──"
if ($fail -gt 0) { exit 1 }
exit 0
