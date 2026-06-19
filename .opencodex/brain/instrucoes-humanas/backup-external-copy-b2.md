---
tipo: instrucao-humana
status: draft
requires_human_action: true
pode_conter_segredo: true
pode_executar_comando: false
---

# Instrução Humana — Cópia Externa do Backup (Backblaze B2)

> **Missão:** `ops/backup-external-copy` (próxima na fila)
> **Prioridade:** P1
> **Modo:** PLAN_ONLY — este documento é apenas o plano. Nada será executado até sua autorização.

---

## 1. Objetivo

Fazer uma cópia de segurança do backup do banco de dados para a nuvem (fora do seu computador).

Hoje o backup é salvo apenas no seu HD. Se o HD queimar, o computador for roubado ou o Windows der problema, todos os backups desaparecem junto. A cópia externa resolve isso.

## 2. Explicação para iniciante

O Backup MultGestor roda todo dia às 02:00 da manhã e salva um arquivo no seu computador. Esse arquivo é pequeno (~635 KB — menor que uma foto).

O que vamos fazer é:

1. Criar uma conta grátis no **Backblaze B2** (um serviço de armazenamento na nuvem)
2. Criar um "balde" (bucket) lá para guardar os backups
3. Criar uma "chave de aplicativo" (application key) — é como uma senha que o script do backup vai usar para enviar o arquivo para a nuvem
4. Configurar o script do backup para enviar o arquivo para lá

**Resultado final:** toda vez que o backup rodar, ele vai salvar uma cópia no seu computador E outra cópia na nuvem. Se um falhar, o outro ainda existe.

## 3. Pré-requisitos

- [ ] Acesso à internet
- [ ] Um e-mail que você usa (para criar a conta Backblaze)
- [ ] O backup diário já está funcionando (verificar: existe o arquivo em `%USERPROFILE%\backups\`)
- [ ] O agendador está ativo (verificar: `Get-ScheduledTask -TaskName 'MultGestor-Backup-Daily'` retorna `State=Ready`)
- [ ] Cerca de 20 minutos disponíveis

## 4. Passo a passo detalhado

### Passo 1 — Criar conta no Backblaze B2

1. Abra o navegador e vá até: **https://www.backblaze.com/cloud-storage**
2. Clique em **"Sign Up"** ou **"Get Started for Free"** (cadastro grátis)
3. Preencha:
   - **E-mail:** seu e-mail
   - **Senha:** uma senha segura (não é a mesma do GitHub)
   - **Nome:** seu nome
4. Confirme o e-mail (eles enviam um link)
5. Faça login

**O plano grátis do B2 dá 10 GB.** Nosso backup tem ~635 KB. Mesmo guardando 30 dias, não chega a 20 MB. Você nunca vai pagar nada.

---

### Passo 2 — Criar o bucket (balde) na nuvem

1. Dentro do Backblaze, clique em **"B2 Cloud Storage"** no menu do lado esquerdo
2. Clique em **"Buckets"**
3. Clique no botão azul **"Create a Bucket"**

Preencha:

| Campo | O que preencher | Exemplo |
|---|---|---|
| **Bucket Unique Name** | Um nome único no mundo (ninguém pode ter igual). Use letras minúsculas, números e hífen. | `multgestor-v2-db-backups` |
| **Files in Bucket** | Selecione **`Private`** | (`Private`) |
| **Default Encryption** | Marque **`Enable`** | habilitado |
| **Object Lock** | Deixe **`Disable`** | desabilitado |

> ⚠️ **Bucket deve ser Private.** O backup contém dados dos clientes (nomes, telefones). Se for Public, qualquer pessoa na internet pode baixar.

4. Clique em **"Create a Bucket"**
5. Após criar, o Backblaze vai mostrar os detalhes do bucket. **Anote o Bucket ID** (um número tipo `0123456789abcdef01234567`) — você vai precisar depois.

---

### Passo 3 — Criar a Application Key (chave de aplicativo)

A Application Key é como uma senha que o script do backup vai usar para enviar arquivos para o bucket.

1. No menu lateral, clique em **"App Keys"**
2. Clique em **"Add a New Application Key"**

Preencha:

| Campo | O que preencher | Exemplo |
|---|---|---|
| **Name of Key** | Um nome para você lembrar | `mg-v2-backup-writer` |
| **Allow access to Bucket(s)** | Selecione **o bucket que você criou** | `multgestor-v2-db-backups` |
| **Type of Access** | Selecione **`Read and Write`** | Read + Write |

3. Clique em **"Create"**

> ⚠️ **ATENÇÃO — A TELA SEGUINTE MOSTRA A CHAVE UMA ÚNICA VEZ.**
>
> Anote em um lugar seguro (bloco de notas, gerenciador de senhas):
> - **keyID** — tipo `0012345678901234567890abc`
> - **applicationKey** — tipo `K001abcdef1234567890abcdef1234567890abcde`
> - **bucketId** — já anotado no passo anterior
>
> Se fechar essa tela sem anotar, precisa criar outra chave.

---

### Passo 4 — Editar o arquivo de configuração do backup

O script do backup lê as configurações de um arquivo que fica em:
```
%USERPROFILE%\.mg-backup\brchk.env
```

> `%USERPROFILE%` normalmente é `C:\Users\Joefe`

**Passo 4.1 — Abrir o arquivo**

Abra o Explorador de Arquivos e vá até `C:\Users\Joefe\.mg-backup\`
Clique com botão direito em `brchk.env` → "Abrir com" → Bloco de Notas

**Passo 4.2 — Adicionar as variáveis da nuvem**

No final do arquivo, adicione estas 5 linhas:

```env
# --- Cópia externa (Backblaze B2) ---
BRCHK_EXTERNAL_ENABLED=0
BRCHK_B2_KEY_ID=<cole o keyID aqui>
BRCHK_B2_APP_KEY=<cole o applicationKey aqui>
BRCHK_B2_BUCKET=nome-do-seu-bucket
BRCHK_B2_BUCKET_ID=<cole o bucketId aqui>
```

> **Importante:** onde está `<cole o ... aqui>`, substitua pelos valores que você anotou.
>
> A primeira linha `BRCHK_EXTERNAL_ENABLED=0` significa "cópia externa DESLIGADA". Só vamos ligar depois que tudo estiver testado.

**Variáveis explicadas:**

| Nome amigável (português) | Nome técnico (variável) | O que é |
|---|---|---|
| Cópia externa ligada? | `BRCHK_EXTERNAL_ENABLED` | `0` = desligado, `1` = ligado |
| ID da chave de aplicativo | `BRCHK_B2_KEY_ID` | Identificador da chave (começa com `00`) |
| Chave de aplicativo | `BRCHK_B2_APP_KEY` | "Senha" para o script acessar o bucket |
| Nome do bucket | `BRCHK_B2_BUCKET` | O nome único que você escolheu |
| ID do bucket | `BRCHK_B2_BUCKET_ID` | O identificador do bucket |

**Passo 4.3 — Salvar e fechar**

Salve o arquivo (Ctrl+S) e feche o Bloco de Notas.

---

### Passo 5 — Testar se as configurações estão certas

Você NÃO precisa mais usar o Prompt de Comando para isso. O script de validação será criado depois.

A **validação manual** que você pode fazer agora:

1. Confira se o arquivo `brchk.env` está salvo com as 5 linhas novas
2. Confira se os valores de `keyID`, `applicationKey` e `bucketId` estão nos lugares certos
3. Confira se o nome do bucket está igual ao que você criou (maiúsculas/minúsculas importam)

---

### Passo 6 — Autorizar a criação dos scripts de upload

Depois que o bucket e a chave estiverem prontos, você precisa autorizar a criação de:

1. **`upload-external.ps1`** — Script que faz o upload do backup para o B2
2. **Alteração no `run-backup.ps1`** — Para chamar o upload depois do dump

O Claude Code vai perguntar: *"Autoriza a escrever os scripts de upload?"*

Você responde: **"Sim, autorizo."**

---

### Passo 7 — Autorizar teste de upload real

Depois dos scripts prontos, o Claude Code vai pedir para testar:

1. Executar o upload manual de um backup existente
2. Verificar no site do Backblaze se o arquivo chegou
3. Comparar o checksum (impressão digital do arquivo)

Você pode verificar visualmente no console do B2:
- Entre em **Backblaze → B2 Cloud Storage → Buckets → clique no seu bucket**
- Deve aparecer um arquivo com nome tipo `multgestor-v2-db-backup-2026-06-19.dump`
- Clique no arquivo → o B2 mostra detalhes

---

### Passo 8 — Ligar a cópia externa

Depois que o teste passar, você precisa:

1. Abrir `brchk.env` de novo
2. Mudar `BRCHK_EXTERNAL_ENABLED=0` para `BRCHK_EXTERNAL_ENABLED=1`
3. Salvar

Agora toda vez que o agendador rodar o backup (02:00), ele também vai enviar para a nuvem.

---

## 5. O que nunca colar no chat

> NÃO COLE APPLICATION KEY, SECRET, TOKEN, SENHA OU CONNECTION STRING NO CHAT.

**Itens que você NUNCA deve digitar na conversa com o Claude:**

- `BRCHK_B2_APP_KEY=...` — o valor do applicationKey
- `BRCHK_B2_KEY_ID=...` — o valor do keyID
- Sua senha do Backblaze
- O conteúdo do arquivo `brchk.env` inteiro

**O que pode colar no chat:**
- O nome do bucket (ex.: `multgestor-v2-db-backups`) — isso é público
- A mensagem "Sim, autorizo a criar os scripts"
- A mensagem "Sim, autorizo o teste de upload"
- Prints de tela do Backblaze mostrando que o arquivo chegou (desde que não mostre a chave)

## 6. Como validar se deu certo

### Validação visual (console B2)

1. Entre em **backblaze.com → B2 Cloud Storage → Buckets → clique no seu bucket**
2. Você deve ver um ou mais arquivos com nome tipo `multgestor-v2-db-backup-2026-06-19.dump`
3. Clique no arquivo → veja o **SHA1** (é a impressão digital do arquivo)

### Validação do log local

Abra o arquivo `%USERPROFILE%\backups\last-status.json` (ou no diretório do projeto `ops\backup\last-status.json`).

Você deve ver algo como:

```json
"external_upload": {
    "enabled": true,
    "provider": "backblaze-b2",
    "bucket": "multgestor-v2-db-backups",
    "file": "multgestor-v2-db-backup-2026-06-19.dump",
    "sha1_local": "abc123...",
    "sha1_remote": "abc123...",
    "verified": true,
    "uploaded_at": "2026-06-19T02:05:00",
    "status": "OK"
}
```

> ⚠️ `sha1_local` e `sha1_remote` precisam ser **iguais**. Se forem diferentes, o arquivo corrompeu no upload.

## 7. Checklist final

- [ ] Conta Backblaze B2 criada (plano grátis, 10 GB)
- [ ] Bucket criado com nome único e acesso **Private**
- [ ] Application Key criada com acesso **Read and Write** apenas para esse bucket
- [ ] keyID, applicationKey e bucketId anotados em lugar seguro
- [ ] `brchk.env` editado com as 5 variáveis (e `BRCHK_EXTERNAL_ENABLED=0` por enquanto)
- [ ] Claude Code autorizado a criar `upload-external.ps1`
- [ ] Upload real testado e verificado no console B2
- [ ] Checksum local == checksum remoto
- [ ] `BRCHK_EXTERNAL_ENABLED` virado para `1`
- [ ] Backup agendado rodou e fez upload automático

## 8. Prompt seguro para colar no chat (depois de executar os passos 1 a 3)

Depois que você já criou a conta, o bucket e a application key, cole este prompt no chat:

```
Autorizo a escrever os scripts de upload externo (upload-external.ps1 e alteração no run-backup.ps1) e executar um teste de upload real com um backup existente.
keyID: <COLE_SOMENTE_O_ID_AQUI>
bucket: <COLE_O_NOME_DO_BUCKET>
```

> ⚠️ **Importante:** Cole apenas o **keyID** (não o applicationKey). O keyID não é secreto — é como um "nome de usuário". O applicationKey (a senha) **NÃO** vai no chat — o script vai ler direto do `brchk.env`.

## 9. Critérios de bloqueio

Esta instrução **NÃO PODE** ser executada se:

- [ ] O bucket não foi criado (não tem onde subir)
- [ ] A application key não foi anotada (não tem como autenticar)
- [ ] O `brchk.env` não foi editado (as variáveis não existem)
- [ ] O último backup local falhou (não tem arquivo para testar)
- [ ] O agendador não está rodando (não faz sentido copiar para nuvem se o backup local não está automático)
- [ ] Você não tem 20 minutos à frente

## 10. Critérios de aprovação humana

A missão é considerada **CONCLUÍDA** quando:

- [ ] Upload real executado com sucesso
- [ ] Arquivo visível no console B2
- [ ] Checksum local == checksum remoto (SHA1 bate)
- [ ] `last-status.json` mostra `external_upload.status = "OK"`
- [ ] `BRCHK_EXTERNAL_ENABLED=1` ativo
- [ ] Backup agendado rodou e fez upload automático pelo menos uma vez
- [ ] Nenhum secret exposto em logs ou no repositório
