# GATE 3 — DUPLICIDADES E SOBREPOSIÇÕES

**Data:** 2026-07-20
**Missão:** MISSÃO 0 — GOVERNANÇA DO OPENCODEX
**Dependência:** Gates 0-2 concluídos
**Nenhuma alteração em `.opencodex/` foi executada.**

---

## 1. Metodologia

Análise de 23 grupos de arquivos com mesmo nome, com verificação de conteúdo
para determinar o tipo de duplicidade. Classificação em 10 tipos.

---

## 2. Resumo

| Tipo de duplicidade | Ocorrências | Exemplos |
|---------------------|-------------|----------|
| 🔴 Cópia vazia | 6 | MAPA-MULTGESTOR-CORE, ROADMAP-MESTRE, capacidades, joefelipe-agent, riscos-ativos |
| 🟡 Mesmo nome, função diferente | 4 | FLUXOS.md, rotacao-segredos.md, nichos (digital-twin vs mapas) |
| 🟡 Índices vs docs técnicos | 6+ | backend.md, frontend.md, ci-cd.md, seguranca.md |
| 🟢 Template replicado intencionalmente | 10+ | chatJoe/projetos (ideias, instrutor, organizacao, _template) |
| 🟢 Config de ferramenta replicada | 3 | .obsidian/ (3 vaults) |
| 🔴 Navegação duplicada | 1 | HOME.md vs 00-HOME.md |
| 🟡 Padrão visao-geral.md | 37 | Uma por diretório |
| 🟡 Padrão README.md | 14 | 3 intencionais, 11 placeholders de template |

---

## 3. Caso a caso

### 3.1 HOME.md vs 00-HOME.md

| Aspecto | HOME.md | 00-HOME.md |
|---------|---------|------------|
| Caminho | `HOME.md` | `00-HOME.md` |
| Tamanho | 21 bytes | 1.434 bytes |
| Conteúdo | "C:\Users\Joefe" | Painel central completo (41 linhas) |
| Função real | Placeholder vazio | Porta de entrada principal |
| Referenciado por | ATLAS.md (como entrada), FLUXOS.md (todos os 7 fluxos) | Governanca-Documental.md |
| **Tipo** | **🔴 Cópia obsoleta + conflito de autoridade** |

**Decisão necessária:** HOME.md deve redirecionar para 00-HOME.md, ou ter seu
conteúdo preenchido. Atualmente gera contradição: ATLAS.md e FLUXOS.md mandam
o usuário para um placeholder.

---

### 3.2 MAPA-MULTGESTOR-CORE.md (2 ocorrências)

| Aspecto | maps/multgestor-core/ | projetos/multgestor/mapas/ |
|---------|----------------------|---------------------------|
| Tamanho | 0 bytes | 2.170 bytes |
| Conteúdo | Vazio | Mapa real do Core com frontmatter (status: em_validacao) |
| **Tipo** | **🔴 Cópia vazia** |

**Decisão:** Manter apenas em `projetos/multgestor/mapas/`. O diretório
`maps/multgestor-core/` perdeu função.

---

### 3.3 ROADMAP-MESTRE-MULTGESTOR-2026.md (2 ocorrências)

| Aspecto | roadmap/ | roadmap/roadmap/ |
|---------|----------|------------------|
| Tamanho | 44.359 bytes | 0 bytes |
| Conteúdo | Roadmap completo | Vazio |
| **Tipo** | **🔴 Cópia vazia** |

**Decisão:** Manter apenas em `roadmap/`. Remover subdiretório `roadmap/roadmap/`.

---

### 3.4 capacidades.md (2 ocorrências)

| Aspecto | projetos/multgestor/ | projetos/multgestor/roadmap/ |
|---------|---------------------|-----------------------------|
| Tamanho | 9.685 bytes | 0 bytes |
| Conteúdo | Capabilities Map (conceitual) | Vazio |
| **Tipo** | **🔴 Cópia vazia** |

---

### 3.5 joefelipe-agent.md (2 ocorrências)

| Aspecto | agents/ | projetos/joefelipe-agent/agentes/ |
|---------|---------|----------------------------------|
| Tamanho | 0 bytes | 1.110 bytes |
| Conteúdo | Vazio | Definição completa do agente |
| **Tipo** | **🔴 Cópia vazia** |

---

### 3.6 riscos-ativos.md (2 ocorrências)

| Aspecto | living-os/riscos/ | projetos/multgestor/living-os/riscos/ |
|---------|------------------|--------------------------------------|
| Tamanho | 0 bytes | 6.078 bytes |
| Conteúdo | Vazio | 8 riscos ativos (3 P1, 5 P2) |
| **Tipo** | **🔴 Cópia vazia** |

---

### 3.7 FLUXOS.md (2 ocorrências)

| Aspecto | Raiz | areas/produto-roadmap/ |
|---------|------|----------------------|
| Nome | `FLUXOS.md` | `fluxos.md` |
| Tamanho | 3.362 bytes | 1.771 bytes |
| Conteúdo | Navegação do OpenCodex (7 fluxos) | Fluxos de produto do MultGestor |
| **Tipo** | **🟡 Mesmo nome, função diferente** |

**Risco:** Nomes diferem apenas por capitalização (`FLUXOS` vs `fluxos`). No
Windows não há distinção, mas no Graph View do Obsidian podem aparecer como
arquivos diferentes. Conteúdos são completamente distintos.

---

### 3.8 Nichos — digital-twin vs mapas/nichos

| Arquivo | digital-twin/ | mapas/nichos/ | Diferença |
|---------|--------------|---------------|-----------|
| `barbergestor.md` | 5.206 bytes (Digital Twin completo) | 1.175 bytes (Mapa resumido) | Conteúdo diferente |
| `autogestor.md` | 1.104 bytes | 890 bytes | Conteúdo diferente |
| `climagestor.md` | 1.163 bytes | 1.513 bytes | Conteúdo diferente |
| `petgestor.md` | 1.105 bytes | 880 bytes | Conteúdo diferente |
| **Tipo** | **🟡 Mesmo nome, conteúdo complementar** | | |

**Decisão:** Verificar se a distinção digital-twin vs mapa faz sentido ou se
um pode referenciar o outro.

---

### 3.9 Segurança (2 ocorrências)

| Aspecto | areas/seguranca/ | mapas/seguranca/ |
|---------|-----------------|------------------|
| `rotacao-segredos.md` | 4.285 bytes (procedimento completo) | 1.073 bytes (resumo) |
| **Tipo** | **🟡 Complementar (um é O, outro é A)** | |

---

### 3.10 Documentos técnicos vs índices

| Nome | Versão índice (raiz) | Versão arquitetura (projetos/multgestor/) | Versão mapas |
|------|---------------------|----------------------------------------|-------------|
| `backend.md` | Backend - Indice.md (índice) | projetos/multgestor/backend.md (1.592 b) | mapas/core/backend.md (1.198 b) |
| `frontend.md` | Frontend - Indice.md (índice) | projetos/multgestor/frontend.md (1.511 b) | mapas/core/frontend.md (1.075 b) |
| `ci-cd.md` | — | projetos/multgestor/ci-cd.md (1.382 b) | mapas/infra/ci-cd.md (1.207 b) |
| `seguranca.md` | Seguranca - Indice.md (índice) | projetos/multgestor/seguranca.md (1.729 b) | — |
| **Tipo** | **🟡 Sobreposição legítima (índice + conteúdo + mapa)** | | |

**Observação:** Esta estrutura de 3 camadas (índice na raiz → doc técnico no
projeto → mapa) é consistente e pode ser intencional. Precisa de validação.

---

### 3.11 Padrão `visao-geral.md` (37 ocorrências)

| Categoria | Qtd | Exemplos |
|-----------|-----|----------|
| `areas/` | 10 | operacao/, produto-roadmap/, digital-twin/, feature-genome/, etc. |
| `projetos/multgestor/` | 11 | raiz, agentes, incidentes, living-os, nichos, nichos/* (6) |
| `prompts/` | 12 | raiz, arquitetura, auditoria, backend, banco, etc. |
| `auditorias/` | 1 | multgestor/ |
| `decisoes/` | 1 | visao-geral.md |
| **Tipo** | **🟡 Padrão consistente, mas polui a navegação** | |

**Análise:** É um padrão intencional do Knowledge OS (cada pasta tem um
`visao-geral.md` como porta de entrada). Funciona bem no Obsidian Graph View
mas dificulta busca por nome. **Decisão necessária:** manter como padrão ou
migrar para nomes específicos.

---

### 3.12 Template chatJoe replicado (4 projetos, 7+ arquivos cada)

| Projeto | Arquivos do template |
|---------|---------------------|
| `chatJoe/projetos/ideias/` | agentes.md, contexto.md, decisoes.md, objetivo.md, riscos.md, skills.md, roadmap.md |
| `chatJoe/projetos/instrutor-gerador-de-nichos/` | Idem (conteúdo diferente) |
| `chatJoe/projetos/organizacao-obsidian/` | Idem (conteúdo diferente) |
| `chatJoe/projetos/_template/` | Idem (modelo genérico) |
| **Tipo** | **🟢 Template intencional — correto** | |

---

### 3.13 Config .obsidian (3 vaults)

| Local | Status |
|-------|--------|
| `.opencodex/.obsidian/` | ✅ Vault principal |
| `projetos/multgestor/roadmap/.obsidian/` | ✅ Subvault do roadmap |
| `_inbox/antigos/segundo cerebro/.obsidian/` | 🔴 Legado congelado |
| **Tipo** | **🟢 Config de ferramenta — 1 legado** |

---

## 4. Matriz de duplicidades classificadas

| # | Grupo | Tipo | Docs envolvidos | Risco | Canônico candidato |
|---|-------|------|-----------------|-------|-------------------|
| 1 | HOME vs 00-HOME | cópia obsoleta | 2 | 🔴 Alto | 00-HOME.md |
| 2 | MAPA-MULTGESTOR-CORE | cópia vazia | 1 vazio + 1 real | 🔴 Alto | projetos/multgestor/mapas/ |
| 3 | ROADMAP-MESTRE | cópia vazia | 1 vazio + 1 real | 🔴 Alto | roadmap/ raiz |
| 4 | capacidades.md | cópia vazia | 1 vazio + 1 real | 🟡 Médio | projetos/multgestor/ |
| 5 | joefelipe-agent.md | cópia vazia | 1 vazio + 1 real | 🟡 Médio | projetos/agentes/ |
| 6 | riscos-ativos.md | cópia vazia | 1 vazio + 1 real | 🟡 Médio | projetos/living-os/ |
| 7 | FLUXOS.md | mesmo nome, função diferente | 2 | 🟡 Médio | Ambos válidos — renomear 1 |
| 8 | nichos (digital-twin vs mapas) | conteúdo complementar | 8 | 🟡 Médio | Validar se ambos necessários |
| 9 | rotacao-segredos.md | conteúdo complementar | 2 | 🟢 Baixo | areas/seguranca/ (completo) |
| 10 | backend/frontend/ci-cd/seguranca | índice + doc + mapa | 9 | 🟢 Baixo | Estrutura de 3 camadas |
| 11 | visao-geral.md (37x) | padrão consistente | 37 | 🟡 Médio | Manter — mas decidir |
| 12 | README.md (14x) | 3 reais + 11 placeholder | 14 | 🟢 Baixo | 11 são placeholders de template |
| 13 | template chatJoe (4x) | replicação intencional | 28 | 🟢 Baixo | Template válido |
| 14 | .obsidian (3x) | config de ferramenta | 15 | 🟢 Baixo | 1 legado |

---

## 5. Diretórios com função perdida

| Diretório | Função original | Função atual | Risco |
|-----------|----------------|--------------|-------|
| `maps/multgestor-core/` | Mapa do Core | 1 arquivo vazio | 🔴 Eliminar |
| `living-os/riscos/` | Riscos ativos | 1 arquivo vazio | 🔴 Eliminar |
| `agents/` (raiz) | Definições de agentes | 2 arquivos vazios | 🔴 Eliminar |
| `brain/` (fora plans/) | Conhecimento organizado | Só fila-de-implementacao.md | 🟡 Revisar |
| `_inbox/antigos/` | Material congelado | Válido como histórico | 🟢 Manter |
| `roadmap/roadmap/` | Subpasta | 1 arquivo vazio | 🔴 Eliminar |

---

```
GATE_3_STATUS: CONCLUIDO
DUPLICIDADES: DOCUMENTADAS
ALTERACOES_OPENCODEX: NAO_EXECUTADAS
```
