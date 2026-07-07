# Storage — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[technical/README]] · [[technical/infra]] · [[runbooks/backup-restore-plan]]

---

## Armazenamento Atual

| Tipo | Local | Status |
|---|---|---|
| Backup de banco | Local (dump diário) | 🟢 Ativo |
| Backup externo | Backblaze B2 | 🟢 Validado |
| Assets estáticos | Vercel CDN | 🟢 Ativo |
| Uploads de usuário | — | ⚪ Não implementado |

## Backup

- **Frequência:** Diário (02:00)
- **Tipo:** pg_dump custom
- **Retenção:** 7 dias
- **Externo:** Backblaze B2 (verified=true)
- **Restore:** Testado (restore-check 2026-06-17)

## Pendências

- [ ] Upload de imagens (avatar, fotos de serviços)
- [ ] Storage de documentos
- [ ] CDN para assets
- [ ] Alerta de falha de backup (A-018)

## Referências

- [[runbooks/backup-restore-plan]] — Backup e restore
- [[painel-executivo#Backup]] — Status do backup
- [[technical/infra]] — Infraestrutura
