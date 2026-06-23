---
tipo: ambiente
area: infra
status: pronto
progresso: 80
criticidade: media
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Ambientes

## O que é
Mapa dos ambientes de execução do MultGestor.

## Estado atual
Todos operacionais.

## O que já existe
| Ambiente | Onde | Estado |
|---|---|---|
| Backend | [[render-backend]] | healthy |
| Frontend | [[vercel-frontend]] | deploy OK |
| Banco prod | [[supabase]] sa-east-1 | ACTIVE_HEALTHY |
| Banco restore-test | Supabase us-east-2 | ACTIVE_HEALTHY |
| Local | Windows `C:\MultGestor.v2` | operacional |
| Backup externo | [[backblaze-b2]] | em validação |

## O que falta
Documentar variáveis por ambiente; ambiente de staging dedicado (futuro, p/ RLS Fase 2).

## Riscos
Sem staging real, mudanças de risco testadas direto. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[supabase]] · [[render-backend]] · [[vercel-frontend]]
### Bloqueia
—
### Usa
—
### É usado por
[[PRODUCAO]]

## Próximas ações
Considerar staging para missões de alto blast radius (ex.: RLS runtime).

## Links
- [[PRODUCAO]] · [[MAPA-MULTGESTOR-CORE]]
