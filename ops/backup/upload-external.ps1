<#
.SYNOPSIS
  Cópia externa do dump diário para Backblaze B2 (feature-flagged).

.DESCRIPTION
  Faz upload de UM arquivo .dump para um bucket B2 via API nativa B2
  (b2_authorize_account → b2_get_upload_url → b2_upload_file), verificando a
  integridade pelo SHA1 (o B2 rejeita o upload se o X-Bz-Content-Sha1 não bater).

  NÃO é chamado diretamente pela task agendada — é invocado por run-backup.ps1
  SOMENTE quando BRCHK_EXTERNAL_ENABLED=1. Por si só, este script não altera o
  dump local nem o estado do backup; em qualquer falha, retorna status FAIL e o
  dump local permanece intacto.

  Segurança:
    - NUNCA ecoa BRCHK_B2_APP_KEY, BRCHK_B2_KEY_ID nem BRCHK_SOURCE_DB_URL.
    - As credenciais só são usadas em headers de Authorization, nunca impressas,
      nunca incluídas no objeto de retorno nem no last-status.json.

  Retorno: um [ordered] hashtable (sem secrets) com o resultado do upload, para
  o chamador dobrar em last-status.json.external_upload.

.PARAMETER DumpPath
  Caminho do arquivo .dump a enviar.

.NOTES
  Variáveis de ambiente esperadas (carregadas pelo chamador a partir do env file
  off-repo, NUNCA por argv): BRCHK_B2_KEY_ID, BRCHK_B2_APP_KEY, BRCHK_B2_BUCKET,
  BRCHK_B2_BUCKET_ID. Opcional: BRCHK_B2_PREFIX (default 'daily/').

  Este script NÃO deve ser executado em validação estática — chamá-lo dispara
  uma requisição real ao Backblaze B2.
#>
#Requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$DumpPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Resultado padrão (sem secrets). Sobrescrito conforme o progresso.
$result = [ordered]@{
  enabled     = $true
  provider    = 'backblaze-b2'
  bucket      = $env:BRCHK_B2_BUCKET
  file        = $null
  sha1_local  = $null
  sha1_remote = $null
  verified    = $false
  uploaded_at = $null
  status      = 'FAIL'
  error       = $null
}

try {
  # ── Pré-condições (sem expor valores) ──────────────────────────────────────
  if (-not (Test-Path -LiteralPath $DumpPath -PathType Leaf)) {
    throw "Dump não encontrado: '$DumpPath'."
  }
  $missing = @('BRCHK_B2_KEY_ID','BRCHK_B2_APP_KEY','BRCHK_B2_BUCKET','BRCHK_B2_BUCKET_ID') |
             Where-Object { -not (Test-Path "env:$_") -or -not (Get-Item "env:$_").Value }
  if ($missing) { throw "Credenciais B2 ausentes no ambiente: $($missing -join ', ')." }

  $keyId    = $env:BRCHK_B2_KEY_ID
  $appKey   = $env:BRCHK_B2_APP_KEY
  $bucketId = $env:BRCHK_B2_BUCKET_ID
  $prefix   = if ($env:BRCHK_B2_PREFIX) { $env:BRCHK_B2_PREFIX } else { 'daily/' }

  $dumpFile = Get-Item -LiteralPath $DumpPath
  $result.file = $dumpFile.Name

  # B2 exige TLS 1.2 (PS 5.1 pode default p/ TLS 1.0/1.1).
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

  # ── SHA1 local (verificação de integridade) ────────────────────────────────
  $sha1 = (Get-FileHash -Algorithm SHA1 -LiteralPath $DumpPath).Hash.ToLower()
  $result.sha1_local = $sha1

  # ── 1. Autorização (Basic keyId:appKey) — token NUNCA impresso ──────────────
  $basic = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("${keyId}:${appKey}"))
  Write-Host '[upload-external] Autorizando conta B2...'
  $authResp = Invoke-RestMethod -Method Get `
    -Uri 'https://api.backblazeb2.com/b2api/v3/b2_authorize_account' `
    -Headers @{ Authorization = $basic }

  # v3: apiInfo.storageApi.apiUrl ; fallback v2: apiUrl
  $apiUrl = $null
  if ($authResp.PSObject.Properties.Name -contains 'apiInfo') { $apiUrl = $authResp.apiInfo.storageApi.apiUrl }
  if (-not $apiUrl -and ($authResp.PSObject.Properties.Name -contains 'apiUrl')) { $apiUrl = $authResp.apiUrl }
  $authToken = $authResp.authorizationToken
  if (-not $apiUrl -or -not $authToken) { throw 'Resposta de autorização B2 sem apiUrl/token.' }

  # ── 2. Obter upload URL ─────────────────────────────────────────────────────
  Write-Host '[upload-external] Obtendo upload URL...'
  $uploadUrlResp = Invoke-RestMethod -Method Post `
    -Uri "$apiUrl/b2api/v3/b2_get_upload_url" `
    -Headers @{ Authorization = $authToken } `
    -Body (@{ bucketId = $bucketId } | ConvertTo-Json) `
    -ContentType 'application/json'
  $uploadUrl   = $uploadUrlResp.uploadUrl
  $uploadToken = $uploadUrlResp.authorizationToken
  if (-not $uploadUrl -or -not $uploadToken) { throw 'Resposta de b2_get_upload_url incompleta.' }

  # ── 3. Upload (B2 valida o SHA1 server-side via header) ─────────────────────
  # Nome remoto = prefixo + nome do arquivo; cada segment percent-encoded, '/' preservado.
  $remoteName  = ($prefix.TrimEnd('/') + '/' + $dumpFile.Name)
  $encodedName = ($remoteName -split '/' | ForEach-Object { [System.Uri]::EscapeDataString($_) }) -join '/'
  Write-Host ("[upload-external] Enviando '{0}' ({1} bytes)..." -f $dumpFile.Name, $dumpFile.Length)
  $uploadResp = Invoke-RestMethod -Method Post -Uri $uploadUrl `
    -Headers @{
      Authorization       = $uploadToken
      'X-Bz-File-Name'    = $encodedName
      'X-Bz-Content-Sha1' = $sha1
    } `
    -InFile $DumpPath `
    -ContentType 'application/octet-stream'

  # ── 4. Verificação de integridade ───────────────────────────────────────────
  $result.sha1_remote = ("$($uploadResp.contentSha1)").ToLower()
  $result.verified    = ($result.sha1_remote -eq $sha1)
  $result.uploaded_at = (Get-Date).ToString('o')
  if (-not $result.verified) { throw "SHA1 divergente (local=$sha1 remote=$($result.sha1_remote))." }

  $result.status = 'OK'
  $result.error  = $null
  Write-Host '[upload-external] OK — upload verificado.'
}
catch {
  # Mensagem sanitizada (sem secrets — keyId/appKey vivem só em headers, não na URL/mensagem).
  $result.status = 'FAIL'
  $result.error  = $_.Exception.Message
  Write-Warning "[upload-external] FALHOU: $($result.error)"
}

# Único objeto no pipeline = o resultado (sem secrets). O dump local nunca é tocado.
$result
