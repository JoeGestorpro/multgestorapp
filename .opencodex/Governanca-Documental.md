# Governanca Documental

> Este documento define as regras de governanca documental do vault: quais sao os
> documentos canonicos, qual pergunta cada um responde, e o que fazer antes de
> criar um documento novo.
>
> Posicao na hierarquia de autoridade: 3 nivel, abaixo da [[rules/constitution-knowledge-os|Constituicao]]
> e das [[rules/|regras canonicas]], acima do [[ATLAS.md|Atlas]] em assuntos de governanca documental.
> Para visao, filosofia e navegacao de alto nivel, o Atlas prevalece.

## 1. Os 8 documentos canonicos

Cada documento canonico responde **uma unica pergunta**. Nunca duas.

| # | Documento | Pergunta que responde |
|---|---|---|
| 1 | Inicio | Onde entro? |
| 2 | Indice Geral | Onde esta cada coisa? |
| 3 | Base de Conhecimento | Como funciona? |
| 4 | Segundo Cerebro | O que pensei/planejei? |
| 5 | Diario do Projeto | O que aconteceu? |
| 6 | Decisoes | Por que foi feito assim? |
| 7 | Arquitetura | Como o sistema funciona? |
| 8 | Mapa do Projeto | Onde cada coisa fica? |

## 2. Regra fundamental: um documento, uma responsabilidade

Se voce esta editando um documento canonico e percebe que o conteudo que vai
adicionar responde a uma pergunta **diferente** da pergunta desse documento,
**nao adicione ali**. Vá para o documento canonico correto (ou crie uma missao
para consolidar, se o conteudo certo ainda nao existir).

Sintomas de que um documento canonico esta sendo violado:
- Ele comeca a responder "onde esta" e "por que foi feito" ao mesmo tempo.
- Ele mistura estado atual (muda toda semana) com decisao historica (nunca muda).
- Duas pessoas descrevem o mesmo documento de formas completamente diferentes.

## 3. Mapa de correspondencia (papel canonico -> arquivo real)

Nem todo documento canonico precisa de um arquivo novo — a maioria ja existe,
so precisava ser reconhecida como a fonte unica daquele papel.

| Documento canonico | Arquivo que cumpre esse papel hoje | Observacao |
|---|---|---|
| Inicio | [[00-HOME]] | Painel central, ja existia |
| Indice Geral | [[01-MAPA-GERAL]] | Ja e o mapa de "onde esta cada pasta"; recebe o alias de exibicao "Indice Geral" no [[00-HOME|Inicio]] |
| Base de Conhecimento | [[Base de Conhecimento]] | Novo (Entrega 3 desta missao) |
| Segundo Cerebro | [[Segundo Cerebro]] | Novo (Entrega 4 desta missao) |
| Diario do Projeto | [[Diario do Projeto]] | Novo (Entrega 5 desta missao) |
| Decisoes | [[decisoes/visao-geral|Decisoes — Indice]] | Ja existia como hub de ADRs |
| Arquitetura | [[projetos/multgestor/arquitetura|Arquitetura]] | Documento tecnico de arquitetura ja existente (ex-rain/technical/arquitetura.md) |
| Mapa do Projeto | MAPA-DAS-PASTAS.md (arquivo protegido, na raiz) | **Nao editado** — e o documento que ja responde "onde cada coisa fica" na estrutura de pastas, mas esta na lista de arquivos protegidos desta e de missoes anteriores. Linkado no [[00-HOME|Inicio]] so como referencia de leitura, sem alterar o arquivo |

**Nota sobre "Indice Geral" vs "Mapa do Projeto":** as duas perguntas
("onde esta cada coisa" e "onde cada coisa fica") sao quase identicas em
portugues. Resolvi a ambiguidade assim: **Indice Geral** ([[01-MAPA-GERAL]])
e a navegacao pelo vault inteiro (pastas de topo: projetos/, reas/,
uditorias/, etc.); **Mapa do Projeto** (MAPA-DAS-PASTAS.md) e
especificamente sobre a estrutura de pastas do .opencodex/ em si, papel que
ja cumpria antes desta missao. Se essa distincao nao fizer sentido na
pratica, e uma decisao facil de revisar — esta documentada aqui de proposito.

## 4. Antes de criar um documento novo

1. **Identifique a pergunta**: o conteudo que voce quer escrever responde a
   qual das 8 perguntas da secao 1?
2. **Veja se ja existe**: confira o mapa da secao 3 — o documento canonico
   para essa pergunta provavelmente ja existe.
3. **So crie um documento novo se**:
   - Nenhum dos 8 canonicos responde essa pergunta, **e**
   - o conteudo nao cabe como uma secao dentro de um canonico existente.
4. **Nunca duplique um hub**: se voce for tentado a criar "outro indice" ou
   "outro painel", pare — isso e exatamente o problema que esta missao
   resolveu. Adicione uma secao ao canonico certo em vez disso.