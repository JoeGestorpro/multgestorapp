# Glossário — Knowledge OS em português

Se você leu um termo em inglês e não entendeu, procure aqui.

---

## A

**ADR** (Architecture Decision Record) → Decisão Arquitetural.
Documento que registra uma decisão importante de arquitetura, o contexto, a alternativa escolhida e por quê.

**app_runtime** → Papel do banco de dados que isola o acesso do tenant. Em vez de cada query depender só do RLS, a aplicação se conecta com esse papel e o RLS se torna uma segunda barreira (defesa em profundidade).

---

## B

**Backlog** → Lista de missões pendentes, priorizadas por ordem de importância.

**Backup B2** → Backup enviado para o Backblaze B2, armazenamento externo fora da nuvem principal.

---

## C

**Camada** → Divisão lógica do Knowledge OS. São 7: Conhecimento, Contexto, Inteligência, Produto, Engenharia, Operações, Memória.

**Capability** → Capacidade que o core oferece. Exemplo: "agendamento" é uma capability do BarberGestor.

**CI/CD** → Continuous Integration / Continuous Deployment. Pipeline automatizado que testa e publica o código.

**Constitution** → Constituição. Documento com princípios e regras invioláveis do projeto.

**Core** → Núcleo compartilhado multi-tenant. Código comum que todos os nichos usam (nunca duplicado).

**CSP** (Content Security Policy) → Política de Segurança de Conteúdo. Controla quais fontes de conteúdo o navegador pode carregar, prevenindo ataques XSS.

---

## D

**Digital Twin** → Gêmeo Digital. Representação viva de um módulo, que mostra sua estrutura, estado e relacionamentos.

**Due Diligence** → Auditoria aprofundada de maturidade do projeto para avaliar readiness enterprise.

---

## E

**Event Contract** → Contrato de Evento. Define a estrutura que um evento deve ter, validada antes de ser emitida.

**Event-Driven** → Arquitetura orientada a eventos. Ações relevantes emitem eventos; outros sistemas reagem.

---

## F

**Feature Genome** → Genoma da Funcionalidade. DNA que descreve uma funcionalidade: seus blocos, dependências e impacto.

**Fluxo** → Caminho de navegação recomendado para uma situação específica (corrigir bug, criar funcionalidade, etc.).

---

## G

**Gate** → Portão de liberação. Condição que precisa ser atingida para avançar. Existem gates de Produção, Segurança e Vendável.

**Graph View** → Visão em grafo do Obsidian. Mostra os documentos como bolinhas e as conexões entre eles como linhas.

---

## H

**Handoff** → Passagem de contexto entre fases ou agentes. Garante que uma IA possa continuar de onde outra parou.

---

## I

**Impact Graph** → Grafo de Impacto. Mapa que mostra o que é afetado quando algo muda.

**Incident** → Incidente. Ocorrência não esperada em produção, documentada com causa, impacto e lições.

---

## K

**Knowledge OS** → Sistema Operacional de Conhecimento. A estrutura que organiza todo o conhecimento do projeto em 7 camadas.

**Knowledge Health** → Saúde do Conhecimento. Score que mede a qualidade e completude da documentação (atual: 72/100).

---

## L

**Lessons Learned** → Lições Aprendidas. Registro do que deu certo, errado e o que fazer diferente.

**Living OS** → Sistema Operacional Vivo. Camada estratégica que conecta produto, engenharia e operações em tempo real.

---

## M

**Maturity Index** → Índice de Maturidade. Nota que mede o quão enterprise-ready o projeto está (atual: 57/100).

**MCP** (Model Context Protocol) → Protocolo que permite que IAs se conectem a ferramentas e fontes de dados externas.

**Missão** → Tarefa atômica no [[queue/]]. Unidade mínima de trabalho. Cada missão tem um tipo (core/p0-sync), um estado e um resultado.

**Mirror** → Prefixo de nomenclatura dos commits e missões. Exemplo: core/, queue/, security/.

**Multi-tenant** → Uma única instância do sistema atende múltiplos clientes (tenants), com isolamento entre eles.

---

## N

**Nicho** → Vertical de negócio. Exemplo: BarberGestor (barbearias), PetGestor (pets), AutoGestor (automotivo).

---

## O

**Outbox** → Padrão de eventos transacionais. Garante que eventos sejam emitidos de forma confiável junto com a transação do banco.

---

## P

**PRD** (Product Requirements Document) → Documento de Requisitos de Produto. Define o que uma funcionalidade deve fazer, para quem e por quê.

**Playbook** → Manual de procedimento operacional. Passo a passo para executar uma operação (deploy, backup, etc.).

---

## R

**RLS** (Row Level Security) → Segurança por Linha. Recurso do PostgreSQL que restringe quais linhas uma query pode ver com base no usuário/papel.

**Roadmap** → Mapa do produto. O que será construído, em que ordem e quando.

**Runbook** → Manual de procedimento repetível. Similar a playbook, mas focado em operações de infraestrutura.

---

## S

**Second Brain** → Segundo Cérebro. Conceito de um sistema externo que armazena e organiza conhecimento para complementar a memória humana. No MultGestor, é o Knowledge OS.

**Simulation Center** → Centro de Simulação. Ambiente para simular o impacto de mudanças antes de executá-las.

---

## T

**Tenant** → Cliente/empresa que usa o sistema. Os dados de um tenant nunca vazam para outro (isolamento por company_id).

---

## W

**Wikilink** → Link do Obsidian no formato [[arquivo]] ou [[pasta/arquivo]]. Cria conexões entre documentos e alimenta o Graph View.

---

> Dúvidas? Consulte [[projetos/multgestor/knowledge-os]] para perguntas e respostas rápidas.
