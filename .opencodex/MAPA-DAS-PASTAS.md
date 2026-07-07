# Mapa das Pastas — Inventário do OpenCodex

> Consulte [[ATLAS.md]] para a visão completa do **Atlas Engineering OS** e as 5 capacidades.

Cada pasta responde **uma pergunta**. Se sua resposta não está ali, você está na pasta errada.

---

## Matriz de responsabilidades

| Pasta | Uma pergunta que responde | Capacidade | O que guarda | Quem usa | Pode crescer? | Status |
|---|---|---|---|---|---|---|
| [[brain/]] | Como o sistema funciona? | Conhecimento | Conhecimento em 7 camadas (arquitetura, produto, engenharia, memória...) | Arquitetos, IA, documentação técnica | Sim — é o core | ✅ Único |
| [[queue/]] | O que vamos fazer agora? | Execução | Missão atual, próxima, backlog, concluídas | IA, Product Manager | Pouco | ✅ Único |
| [[rules/]] | O que nunca pode ser quebrado? | Governança | Regras vinculantes (proteção de rota, eventos, auditoria) | Todos | Pouco | ✅ Único |
| [[prompts/]] | Como conversar com a IA? | Execução | Comandos prontos para agentes de IA | IA | Sim | 🟡 Parcial (há prompts em brain/) |
| [[templates/]] | Como criar documentos novos? | Execução | Modelos (preflight check, etc.) | Todos | Pouco | ✅ Único |
| [[audits/]] | O que já foi conferido? | Governança | Relatórios de auditoria e verificação | QA, IA, Humanos | Sim | ✅ Único |
| [[ops/]] | Como opera e produz? | Operação | Playbooks, procedimentos de deploy e produção | Ops, IA | Médio | ✅ Único |
| [[automation/]] | O que acontece automaticamente? | Operação | Políticas de automação, allowlists | IA, Ops | Médio | ✅ Único |
| [[chatJoe/]] | Como planejar a próxima missão? | Execução | Conversa, contexto, skills, agentes, prompts, compactação | IA, Product Manager | Sim | ✅ Único |
| [[handoff/]] | Como outra IA continua daqui? | Memória | Contexto de passagem entre fases/agentes | IA | Pouco | ✅ Único |
| [[archive/]] | O que pertence ao passado? | Memória | Dados congelados, histórico antigo | Consulta | Não | ✅ Único |
| [[agents/]] | Quem são os agentes? | Execução | Definições de agentes especializados | IA | Médio | 🟡 Parcial (há agentes em brain/) |
| [[state/]] | Qual é o estado do projeto? (legado) | Memória | Fotografia antiga do estado | Consulta (prefira brain/) | Não | 🟠 Obsoleto — usar [[brain/01-CURRENT-STATE.md]] |
| [[segundo cerebro/]] | Onde é o Obsidian? (legado) | Conhecimento | Entrada humana, boas-vindas | Humanos | Não | 🟠 Obsoleto — usar [[HOME.md]] |
| [[.obsidian/]] | Como o Obsidian aparece? | — | Configuração visual, workspace, plugins | Obsidian | Não | ✅ Único |

---

## Convenção brain/ vs raiz

Pastas que existem **tanto em [[brain/]] quanto na raiz**:

| Pasta | brain/ (organizado por camada) | Raiz (arquivos diretos) |
|---|---|---|
| [[agents/]] | Índice + definições completas | Definição do joefelipe-agent |
| [[audits/]] | Índice de auditorias | Relatórios completos |
| [[ops/]] | Memória operacional | Playbooks avulsos |
| [[prompts/]] | Biblioteca organizada por categoria | Prompts avulsos |
| [[rules/]] | Regras no contexto do Knowledge OS | Regras canônicas vinculantes |

**Regra:** O conteúdo em [[brain/]] é a fonte organizada. O conteúdo na raiz são arquivos diretos. Quando um arquivo existe em ambos, o brain/ referência o da raiz via `[[../caminho/arquivo]]`.

---

## Legenda de status

| Símbolo | Significado |
|---|---|
| ✅ Único | Responsabilidade clara, sem duplicação |
| 🟡 Parcial | Conteúdo sobreposto com outra pasta — definir fonte oficial |
| 🟠 Obsoleto | Substituído por outra fonte — manter só como histórico |

