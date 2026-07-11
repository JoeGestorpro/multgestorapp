# Governança Documental

> Este documento define as regras de governança documental do vault: quais são os
> documentos canônicos, qual pergunta cada um responde, e o que fazer antes de
> criar um documento novo.

## 1. Os 8 documentos canônicos

Cada documento canônico responde **uma única pergunta**. Nunca duas.

| # | Documento | Pergunta que responde |
|---|---|---|
| 1 | Início | Onde entro? |
| 2 | Índice Geral | Onde está cada coisa? |
| 3 | Base de Conhecimento | Como funciona? |
| 4 | Segundo Cérebro | O que pensei/planejei? |
| 5 | Diário do Projeto | O que aconteceu? |
| 6 | Decisões | Por que foi feito assim? |
| 7 | Arquitetura | Como o sistema funciona? |
| 8 | Mapa do Projeto | Onde cada coisa fica? |

## 2. Regra fundamental: um documento, uma responsabilidade

Se você está editando um documento canônico e percebe que o conteúdo que vai
adicionar responde a uma pergunta **diferente** da pergunta desse documento,
**não adicione ali**. Vá para o documento canônico correto (ou crie uma missão
para consolidar, se o conteúdo certo ainda não existir).

Sintomas de que um documento canônico está sendo violado:
- Ele começa a responder "onde está" e "por que foi feito" ao mesmo tempo.
- Ele mistura estado atual (muda toda semana) com decisão histórica (nunca muda).
- Duas pessoas descrevem o mesmo documento de formas completamente diferentes.

## 3. Mapa de correspondência (papel canônico → arquivo real)

Nem todo documento canônico precisa de um arquivo novo — a maioria já existe,
só precisava ser reconhecida como a fonte única daquele papel.

| Documento canônico | Arquivo que cumpre esse papel hoje | Observação |
|---|---|---|
| Início | [[00-HOME]] | Painel central, já existia |
| Índice Geral | [[01-MAPA-GERAL]] | Já é o mapa de "onde está cada pasta"; recebe o alias de exibição "Índice Geral" no [[00-HOME\|Início]] |
| Base de Conhecimento | [[Base de Conhecimento]] | Novo (Entrega 3 desta missão) |
| Segundo Cérebro | [[Segundo Cérebro]] | Novo (Entrega 4 desta missão) |
| Diário do Projeto | [[Diário do Projeto]] | Novo (Entrega 5 desta missão) |
| Decisões | [[decisoes/visao-geral\|Decisões — Índice]] | Já existia como hub de ADRs |
| Arquitetura | [[projetos/multgestor/arquitetura\|Arquitetura]] | Documento técnico de arquitetura já existente (ex-`brain/technical/arquitetura.md`) |
| Mapa do Projeto | `MAPA-DAS-PASTAS.md` (arquivo protegido, na raiz) | **Não editado** — é o documento que já responde "onde cada coisa fica" na estrutura de pastas, mas está na lista de arquivos protegidos desta e de missões anteriores. Linkado no [[00-HOME\|Início]] só como referência de leitura, sem alterar o arquivo |

**Nota sobre "Índice Geral" vs "Mapa do Projeto":** as duas perguntas
("onde está cada coisa" e "onde cada coisa fica") são quase idênticas em
português. Resolvi a ambiguidade assim: **Índice Geral** ([[01-MAPA-GERAL]])
é a navegação pelo vault inteiro (pastas de topo: `projetos/`, `areas/`,
`auditorias/`, etc.); **Mapa do Projeto** (`MAPA-DAS-PASTAS.md`) é
especificamente sobre a estrutura de pastas do `.opencodex/` em si, papel que
já cumpria antes desta missão. Se essa distinção não fizer sentido na
prática, é uma decisão fácil de revisar — está documentada aqui de propósito.

## 4. Antes de criar um documento novo

1. **Identifique a pergunta**: o conteúdo que você quer escrever responde a
   qual das 8 perguntas da seção 1?
2. **Veja se já existe**: confira o mapa da seção 3 — o documento canônico
   para essa pergunta provavelmente já existe.
3. **Só crie um documento novo se**:
   - Nenhum dos 8 canônicos responde essa pergunta, **e**
   - o conteúdo não cabe como uma seção dentro de um canônico existente.
4. **Nunca duplique um hub**: se você for tentado a criar "outro índice" ou
   "outro painel", pare — isso é exatamente o problema que esta missão
   resolveu. Adicione uma seção ao canônico certo em vez disso.
