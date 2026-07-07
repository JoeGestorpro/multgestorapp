---
tipo: instrucao-humana
status: draft
requires_human_action: false
estado_da_intervencao: concluida
uso_do_documento: referencia_recriacao_troubleshooting
pode_conter_segredo: false
pode_executar_comando: false
contem_comandos_para_humano: true
execucao_automatica_pelo_agente: false
---

# Instrução Humana — Registrar Agendamento Diário do Backup (Windows Task Scheduler)

> **Missão:** `ops/register-daily-backup-scheduler`
> **Prioridade:** P0
> **Status:** ✅ CONCLUÍDA (2026-06-18)
> **Propósito deste documento:** Referência para recriação futura ou troubleshooting.

### Sobre este documento

| Campo | O que significa |
|---|---|
| `pode_executar_comando: false` | O agente **não** pode executar comandos PowerShell. Ele só lê e escreve documentação. |
| `contem_comandos_para_humano: true` | Este documento tem comandos **para você copiar e colar no PowerShell**. |
| `execucao_automatica_pelo_agente: false` | O agente **não** executa nada automaticamente. Tudo aqui é manual. |

> **Resumo:** O agente não executa comandos. Este documento apenas ensina o humano a executar, caso seja necessário recriar a tarefa no futuro.

---

## 1. Objetivo

Fazer o backup do banco de dados rodar automaticamente todo dia às 02:00 da manhã, sem precisar lembrar de executar manualmente.

## 2. Explicação para iniciante

O Windows tem um "despertador" para programas: o **Agendador de Tarefas** (Task Scheduler). Você programa: "todo dia às 02:00, execute este script". O Windows acorda (se estiver ligado) e roda o script.

O script que vai rodar é `run-backup.ps1`. Ele faz:
1. Conexão com o banco de dados
2. Cópia dos dados (dump)
3. Salva em `C:\Users\Joefe\backups\`
4. Remove os arquivos mais velhos (guarda só os 7 mais recentes)
5. Registra o resultado em `last-status.json`

## 3. Pré-requisitos

- [ ] PowerShell como **Administrador** (o Task Scheduler precisa de admin para criar tarefas)
- [ ] O script `run-backup.ps1` existe e está funcionando
- [ ] O arquivo de configuração `brchk.env` existe (fora do repositório, em `%USERPROFILE%\.mg-backup\`)

## 4. Passo a passo detalhado

### Passo 1 — Abrir PowerShell como Administrador

1. Clique em **Iniciar**
2. Digite **PowerShell**
3. Clique com botão direito em **Windows PowerShell**
4. Clique em **"Executar como administrador"**
5. Confirme o aviso do controle de conta de usuário (UAC)

### Passo 2 — Verificar se a tarefa já existe

No PowerShell que abriu, cole este comando:

```powershell
Get-ScheduledTask -TaskName 'MultGestor-Backup-Daily' -ErrorAction SilentlyContinue
```

**Se retornar vazio:** a tarefa não existe — vá para o Passo 3.
**Se retornar algo como `State=Ready`:** a tarefa já existe — vá para o Passo 4 (validação).

### Passo 3 — Registrar a tarefa

Cole o comando abaixo. **Não precisa alterar nada** — está pronto para executar.

> ⚠️ **Se o projeto estiver em outra pasta**, altere `$scriptPath` e `$workingDir` antes de registrar a tarefa. Esses caminhos precisam apontar para o local real do projeto neste computador.

```powershell
$taskName = 'MultGestor-Backup-Daily'
$scriptPath = 'C:\MultGestor.v2\ops\backup\run-backup.ps1'
$workingDir = 'C:\MultGestor.v2\ops\backup'

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" `
    -WorkingDirectory $workingDir

$trigger = New-ScheduledTaskTrigger -Daily -At 02:00

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

Register-ScheduledTask -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -RunLevel Highest `
    -Force
```

**Explicação do que esse comando faz:**

| Parte | Significado |
|---|---|
| `$taskName` | Nome da tarefa no Windows |
| `$scriptPath` | Caminho completo do script de backup |
| `$workingDir` | Pasta onde o script vai "achar que está" |
| `-Daily -At 02:00` | Roda todo dia às 02:00 |
| `-StartWhenAvailable` | Se o PC estiver desligado na hora, roda assim que ligar |
| `-AllowStartIfOnBatteries` | Roda mesmo se o notebook não estiver na tomada |
| `-DontStopIfGoingOnBatteries` | Não para se tirar da tomada durante a execução |
| `-ExecutionTimeLimit 1 hora` | Se demorar mais de 1 hora, o Windows cancela (normalmente leva segundos) |

### Passo 4 — Validar que a tarefa foi registrada

Cole este comando:

```powershell
Get-ScheduledTask -TaskName 'MultGestor-Backup-Daily' | Format-List *
```

**O que verificar:**

| Campo | Esperado | Se for diferente |
|---|---|---|
| `State` | `Ready` | Tarefa pode estar desabilitada ou com erro |
| `TaskName` | `MultGestor-Backup-Daily` | Nome correto |
| `Actions.Execute` | `powershell.exe` | O programa certo |
| `Triggers` | `Daily - At 02:00` | O horário certo |
| `Principal.RunLevel` | `Highest` | Roda como administrador |

Você também pode abrir o **Agendador de Tarefas** visualmente:
1. Pesquise por **"Task Scheduler"** no Iniciar
2. Navegue: **Task Scheduler Library**
3. Procure por `MultGestor-Backup-Daily` na lista
4. Clique duas vezes para ver detalhes

## 5. Variáveis

| Nome amigável | Nome técnico | Valor usado |
|---|---|---|
| Nome da tarefa | `$taskName` | `MultGestor-Backup-Daily` |
| Script a executar | `$scriptPath` | `C:\MultGestor.v2\ops\backup\run-backup.ps1` |
| Pasta de trabalho | `$workingDir` | `C:\MultGestor.v2\ops\backup` |
| Horário | `$trigger` | todos os dias às 02:00 |
| Nível de execução | `-RunLevel` | `Highest` (Administrador) |

## 6. Como validar se deu certo

### Método 1 — PowerShell

```powershell
Get-ScheduledTask -TaskName 'MultGestor-Backup-Daily' | Select-Object TaskName, State, NextRunTime
```

Saída esperada:
```
TaskName                  State   NextRunTime
---------                 -----   -----------
MultGestor-Backup-Daily   Ready   19/06/2026 02:00:00
```

### Método 2 — Visual (Task Scheduler)

Abra o Task Scheduler → Task Scheduler Library → encontre `MultGestor-Backup-Daily`.

O **Next Run Time** deve mostrar a próxima 02:00.
O **Last Run Result** mostra o resultado da última execução (inicialmente `267011` = "ainda não rodou").

### Método 3 — Informações detalhadas da tarefa

```powershell
Get-ScheduledTaskInfo -TaskName 'MultGestor-Backup-Daily'
```

Esse comando mostra:
- **LastRunTime** — quando foi a última execução
- **LastTaskResult** — código de resultado da última execução (0 = sucesso)
- **NextRunTime** — quando será a próxima execução

**Diferença entre os dois comandos:**

| Comando | Mostra |
|---|---|
| `Get-ScheduledTask` | Se a tarefa existe, se está `Ready`, o que ela executa |
| `Get-ScheduledTaskInfo` | Quando rodou pela última vez, qual foi o resultado, quando vai rodar de novo |

### Método 4 — Esperar a execução

No dia seguinte, depois das 02:00, verifique:

1. Se existe um arquivo novo em `C:\Users\Joefe\backups\` (nome com a data do dia)
2. Abra `C:\Users\Joefe\backups\last-status.json` — deve ter `"status": "OK"`

## 7. Checklist final

- [ ] PowerShell aberto como **Administrador**
- [ ] Verificado que tarefa não existia antes (Passo 2)
- [ ] Tarefa registrada com sucesso (Passo 3)
- [ ] `Get-ScheduledTask` mostra `State=Ready`
- [ ] `NextRunTime` mostra a próxima 02:00
- [ ] (Opcional) Verificado visualmente no Task Scheduler

## 8. O que nunca colar no chat

Pode mencionar que o arquivo existe em `%USERPROFILE%\.mg-backup\brchk.env`.
O que **não** pode ser colado no chat é o **conteúdo** desse arquivo, porque ele pode conter connection string, senha do banco ou tokens.

Também não cole:
- Valores reais de variáveis de ambiente
- A senha do banco de dados
- Qualquer token, application key ou secret

## 9. Prompt seguro para colar no chat depois

Se precisar recriar a tarefa em outro computador:

```
Preciso registrar a tarefa agendada MultGestor-Backup-Daily no Windows Task Scheduler.
O script está em C:\MultGestor.v2\ops\backup\run-backup.ps1.
A pasta de trabalho é C:\MultGestor.v2\ops\backup.
Quero rodar todo dia às 02:00 com nível Highest.
```

## 10. Critérios de bloqueio

- ❌ Não executar se o PowerShell não estiver como **Administrador**
- ❌ Não executar se `run-backup.ps1` não existir
- ❌ Não executar se `brchk.env` não existir (fora do repositório)
- ❌ Não criar tarefa com `-RunLevel Limited` (não vai funcionar)

## 11. Critérios de aprovação humana

A missão é **CONCLUÍDA** quando:

- [ ] `State = Ready` confirmado
- [ ] `NextRunTime` mostra horário correto
- [ ] Backup executou automaticamente pelo menos uma vez
- [ ] `last-status.json` mostra `exit_code = 0`
- [ ] Arquivo de dump existe no diretório de backups

## 12. Quando NÃO usar este documento

Não use este documento para:

- alterar o script de backup;
- mudar credenciais do banco;
- testar restore;
- configurar cópia externa na nuvem;
- mexer em Backblaze B2;
- alterar secrets reais.

Este documento serve apenas para registrar, recriar ou conferir a tarefa agendada do Windows.
