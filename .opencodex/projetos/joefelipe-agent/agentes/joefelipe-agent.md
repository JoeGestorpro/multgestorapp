# ?? JoeFelipe Agent — Agente Pessoal

> **Status:** OFICIAL • VIVO
> **Versão:** V1 (READ_ONLY)
> **Propósito:** Agente pessoal de IA para operar no repositório MultGestor em modo exclusivamente leitura.
> **Atualizado:** 2026-07-04

## Especificação

- **Tipo:** Agente local TypeScript/Node.js
- **Modo:** READ_ONLY — nunca modifica arquivos
- **Console:** Local, read-only
- **Painel:** http://localhost:3333 (HTML panel)
- **Testes:** 23/23 verdes (safety tests)
- **Código:** 	ools/joefelipe-agent/

## Regras de Escopo

1. **Nunca versionar .obsidian/** — cofre Obsidian é gitignored por decisão arquitetural
2. **Nunca alterar arquivos fora de 	ools/joefelipe-agent/** — modo READ_ONLY
3. **Console local apenas** — sem deploy, sem push, sem merge

## Limitações

- Não tem acesso a produção, banco real ou secrets
- Não executa comandos que modifiquem estado
- Leitura de código e documentação apenas

## Referências

- [[../brain/agents/joefelipe-agent]] — Definição completa no Knowledge OS
- [[../brain/agents/joefelipe-personal-operating-agent]] — Versão histórica
