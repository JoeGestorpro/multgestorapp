# 02-COMO-USAR — Onde colocar (e onde procurar) um arquivo

## Regra rápida

1. **É sobre um projeto específico** (MultGestor ou JoeFelipe Agent)? → `projetos/<projeto>/`
2. **É conhecimento que vale para mais de um projeto** (banco, segurança, deploy, produto)? → `areas/<area>/`
3. **É o resultado de uma auditoria**? → `auditorias/<projeto>/`
4. **É uma decisão arquitetural (ADR)**? → `decisoes/`
5. **É um prompt pronto para IA**? → `prompts/`
6. **Não tem certeza?** → `_inbox/revisar/` e sinalize para revisão humana. Nunca invente uma categoria nova sem necessidade.

## Convenções

- Nomes de arquivo em `kebab-case`, minúsculo, em português quando o conteúdo for em português.
- Todo arquivo movido mantém seus wikilinks (`[[...]]`) atualizados — se você mover algo manualmente, confira se algum outro arquivo linkava para o caminho antigo.
- Não duplique conteúdo entre `projetos/` e `areas/`: se a informação é 100% específica de um projeto, ela pertence só a `projetos/`.

## O que fazer ao encontrar um link quebrado

1. Procrure o arquivo pelo nome (não pelo caminho antigo) em `projetos/`, `areas/`, `auditorias/`, `decisoes/` ou `_inbox/`.
2. Atualize o link para o novo caminho.
3. Se não encontrar o arquivo em lugar nenhum, verifique `_inbox/revisar/` e `_inbox/antigos/` antes de assumir que foi perdido — nada foi apagado na reorganização, só movido.
