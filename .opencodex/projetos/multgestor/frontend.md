# Frontend — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Stack:** React 19 + Vite
> **Deploy:** Vercel
> **Relacionamentos:** [[technical/README]] · [[architecture-decisions]] · [[maps/multgestor-core/core/frontend]]

---

## Stack

| Tecnologia | Versão | Função |
|---|---|---|
| React | 19 | UI Library |
| Vite | — | Build tool |
| React Router | — | Roteamento |
| Axios | — | HTTP client |
| Context API | — | Estado global |

## Status

| Indicador | Status |
|---|---|
| **Páginas** | 33 |
| **Fluxo completo** | Booking, cadastro, dashboard |
| **Testes** | ✅ Existem |
| **E2E** | ❌ Não automatizado |
| **Performance** | 🟡 Sem métricas |

## Estrutura

```
frontend/src/
├── components/    → Componentes reutilizáveis
├── pages/         → Páginas da aplicação
├── services/      → API calls
├── contexts/      → Contextos React
├── hooks/         → Custom hooks
└── utils/         → Utilitários
```

## Dependências

- Backend API (Express 5) — todas as chamadas
- Auth via JWT (HttpOnly cookie)

## Próximos Passos

- [ ] E2E booking automatizado
- [ ] Performance monitoring
- [ ] Testes de integração frontend
- [ ] Acessibilidade

## Referências

- [[maps/multgestor-core/core/frontend]] — Detalhamento no mapa vivo
- [[technical/DEPENDENCY-MAP]] — Mapa de dependências
- [[maps/multgestor-core/STATUS-GERAL]] — Status geral
