## Fase 11-B.1 — E2E Foundation

### Objetivo
Criar um endpoint não-destrutivo para testar a LLM real, endurecer o parser de JSON do planejador para engolir respostas imperfeitas de LLMs reais, e validar o pipeline completo chat→missão com provider simulado realista.

### Contexto arquitetural
- `server.ts` — servidor HTTP contém as rotas, o painel e a construção do LlmEngine (linha 93)
- `src/planner/LLMPlanningStrategy.ts` — estratégia de planejamento que chama a LLM e tenta parsear JSON. `tryParse()` atual (linha 68-86) só limpa code fences básicos e faz `JSON.parse()` puro — quebra com texto extra, trailing commas, comentários.
- `src/llm/LlmEngine.ts` — método `getHealth()` ainda não existe; `complete()` já emite `llm:cost` e tem fallback mock.
- `src/server.test.ts` — testes existentes do servidor (~400+). Todos os testes de provider usam `globalThis.fetch` mockado.
- Regras de segurança: missões NUNCA se auto-aprovam, planos NUNCA se auto-executam, nenhuma rota ignora kernel mode.

### O que implementar

**Task 1: `/api/llm/test` — endpoint não-destrutivo**

Criar rota `GET /api/llm/test` em `server.ts` que:
- Envia `"ping"` ao provider ativo (via `llm.complete()`)
- Retorna `{ success: true, provider, model, latencyMs }` em caso de sucesso
- Retorna `{ success: false, error, provider }` em caso de falha
- NÃO cria sessão, NÃO persiste mensagem, NÃO emite evento de custo
- Funciona mesmo com kernel em LOCKED (é leitura, não ação)
- No dashboard: alterar botão "Testar LLM" para chamar esta rota em vez de `POST /api/chat/message`
- O resultado do teste deve aparecer no mesmo lugar (elemento `llmTestResult`)

No `LlmEngine.ts`:
- Adicionar método `async test(): Promise<{ success: boolean; provider: LlmProviderName; model: string; latencyMs: number; error?: string }>`
- Este método NÃO deve passar pelos wrappers Budget/RateLimit/CircuitBreaker (testar a conexão bruta)
- Deve medir `latencyMs` com `Date.now()` antes e depois da chamada
- Deve chamar o provider diretamente (via `Manager.selectProvider()`), não via `complete()`, para evitar side effects
- Se o provider for mock, retornar `{ success: true, provider: "mock", model: "mock-safe-v1", latencyMs: 0 }` sem chamar nada

No `server.ts` (rota):
```ts
if (req.method === "GET" && req.url === "/api/llm/test") {
  if (!llm) { sendJson({ success: false, error: "LLM engine nao inicializado" }); return; }
  const result = await llm.test();
  sendJson(result);
  return;
}
```

No dashboard JS, substituir `testarLlm()`:
```js
function testarLlm() {
  var el = document.getElementById('llmTestResult');
  if (el) el.textContent = 'Testando LLM...';
  var started = Date.now();
  api('/api/llm/test').then(function(d) {
    var elapsed = Date.now() - started;
    if (el) {
      if (d.success) {
        el.innerHTML = 'OK (' + escapeHtmlClient(d.provider) + '/' + escapeHtmlClient(d.model) + ', ' + d.latencyMs + 'ms)';
        toast('LLM respondeu em ' + d.latencyMs + 'ms.', 'success');
      } else {
        el.innerHTML = 'Falhou: ' + escapeHtmlClient(d.error || 'erro desconhecido');
        toast('Erro ao testar LLM: ' + (d.error || 'erro desconhecido'), 'error');
      }
    }
  }).catch(function(e) {
    if (el) el.textContent = 'Falhou: ' + e.message;
    toast('Erro ao testar LLM: ' + e.message, 'error');
  });
}
```

**Testes (em server.test.ts):**
- `GET /api/llm/test` retorna 200 com `{ success: true, provider, model, latencyMs }` quando LLM engine existe
- `GET /api/llm/test` retorna 200 com `{ success: true, provider: "mock", latencyMs: 0 }` sem provider real
- `GET /api/llm/test` retorna `{ success: false, error }` quando provider real falha (mock fetch com 500)
- `GET /api/llm/test` NÃO incrementa sessão ativa (sessionStore.getActive() continua null se não havia)
- `GET /api/llm/test` NÃO persiste evento `llm:cost` no EventStore
- Dashboard contém `testarLlm()` que chama `/api/llm/test` (não `/api/chat/message`)

---

**Task 2: LLMPlanningStrategy — parser resiliente para LLM real**

Modificar `tryParse()` em `LLMPlanningStrategy.ts` para aceitar saída real de LLM.

Estratégia de parsing (em ordem):
1. Trim + strip code fences (já existe, mas melhorar)
2. Se `JSON.parse()` funcionar direto → retornar
3. Tentar extrair `{...}` via regex: localizar o primeiro `{` e o último `}`, extrair o substring entre eles
4. Tentar `JSON.parse()` no substring extraído
5. Remover trailing commas: `text.replace(/,\s*([}\]])/g, '$1')` + tentar parse
6. Remover comentários `//` (linhas que começam com `//` após trim)
7. Se tudo falhar → logar primeiros 200 chars do texto bruto e retornar null (fallback RuleBasedPlanningStrategy)

```ts
private tryParse(text: string): ParsedPlan | null {
  let cleaned = text.trim();

  // 1. Strip markdown code fences
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    const lastFence = cleaned.lastIndexOf("```");
    if (firstNewline !== -1 && lastFence !== -1 && lastFence > firstNewline) {
      cleaned = cleaned.slice(firstNewline + 1, lastFence).trim();
    }
  }

  // 2. Try direct parse
  const attempt = (s: string): ParsedPlan | null => {
    try {
      const parsed = JSON.parse(s);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.missions)) {
        return parsed as ParsedPlan;
      }
    } catch { /* next attempt */ }
    return null;
  };

  let result = attempt(cleaned);
  if (result) return result;

  // 3. Extract first JSON object via regex
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    result = attempt(jsonMatch[0]);
    if (result) return result;
  }

  // 4. Remove trailing commas
  const noTrailing = cleaned.replace(/,\s*([}\]])/g, '$1');
  result = attempt(noTrailing);
  if (result) return result;

  // 5. Remove // comments
  const noComments = noTrailing.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  result = attempt(noComments);
  if (result) return result;

  // 6. Log and give up
  console.warn("[LLMPlanningStrategy] Falha ao fazer parse do JSON. Primeiros 200 chars:", cleaned.slice(0, 200));
  return null;
}
```

Criar `src/planner/LLMPlanningStrategy.test.ts` com testes:
```ts
import { describe, test, before, after } from "node:test"
import assert from "node:assert/strict"

// Nota: LLMPlanningStrategy depende de LlmEngine. Vamos testar só o tryParse()
// expondo-o via um método público ou testando via plan() com LlmEngine mockado.

// Como LlmEngine é uma dependência externa, testaremos via plan() com um
// LlmEngine mockado que retorna respostas controladas.
```

Estratégia: criar um `MockLlmEngine` que retorna texto controlado, sem chamar provider nenhum:
```ts
class MockLlmEngine {
  private responses: string[]
  private index = 0
  constructor(responses: string[]) { this.responses = responses }
  async complete(_req: any) {
    const text = this.responses[this.index] ?? this.responses[0]
    this.index++
    return { provider: "mock", model: "mock", mode: "PLAN_ONLY", text, safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] } }
  }
}
```

Testes:
1. **JSON puro** → `plan()` retorna missões parseadas
   ```ts
   const llm = new MockLlmEngine([JSON.stringify({ missions: [{ title: "Teste", intent: "Fazer X", order: 1 }] })])
   const strategy = new LLMPlanningStrategy(llm as any)
   const missions = await strategy.plan({ id: "g1", title: "Teste", intent: "Fazer X", priority: "medium", tags: [] })
   assert.equal(missions.length, 1)
   assert.equal(missions[0].title, "Teste")
   ```

2. **JSON com ```json ... ```** → parse OK

3. **JSON com ``` ... ``` (sem language tag)** → parse OK

4. **JSON com trailing comma** → parse OK

5. **JSON com texto antes e depois** → parse OK
   ```ts
   const llm = new MockLlmEngine(["Aqui está o plano:\n\n" + JSON.stringify({ missions: [{ title: "X", intent: "Y", order: 1 }] }) + "\n\nPrecisa de ajuda?"])
   ```

6. **JSON com comentários //** → parse OK

7. **Resposta vazia** → fallback RuleBasedPlanningStrategy (retorna missões não vazias)

8. **Objeto sem missions** → fallback

9. **missions array vazio** → fallback

---

**Task 3: E2E tests com provider simulado realista**

Criar `src/e2e.test.ts` com testes que exercitam o pipeline completo do servidor HTTP com `globalThis.fetch` mockado para simular OpenRouter.

Setup comum:
```ts
import { describe, test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "http"
import { randomUUID } from "crypto"
import { mkdtempSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

function withTempRoot(fn: (root: string) => Promise<void>) {
  return async () => {
    const root = mkdtempSync(join(tmpdir(), "e2e-"))
    const originalEnv = process.env.JOEFELIPE_ROOT
    process.env.JOEFELIPE_ROOT = root
    try {
      await fn(root)
    } finally {
      process.env.JOEFELIPE_ROOT = originalEnv
      rmSync(root, { recursive: true, force: true })
    }
  }
}
```

**Teste 1: Chat com resposta realista**
```ts
test("E2E: chat com provider OpenRouter simulado retorna resposta", withTempRoot(async (root) => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async (url: any, opts?: any) => {
      const body = JSON.parse((opts?.body as string) ?? "{}")
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: "Resposta simulada do OpenRouter para: " + (body.messages?.[1]?.content ?? "") } }],
        }),
      } as Response
    }

    process.env.JOEFELIPE_LLM_PROVIDER = "openrouter"
    process.env.OPENROUTER_API_KEY = "sk-test-key"

    const { startServer, stopServer } = await import("./server.ts")
    const port = await startServer(root)
    const res = await fetch(`http://127.0.0.1:${port}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "teste" }),
    })
    const data = await res.json()
    assert.equal(res.status, 200)
    assert.ok(data.response)
    assert.ok(data.response.includes("Resposta simulada"))
    assert.equal(data.provider, "openrouter")
    await stopServer()
  } finally {
    globalThis.fetch = originalFetch
  }
}))
```

**Teste 2: Chat → missão**
```ts
test("E2E: chat seguido de criacao de missao", withTempRoot(async (root) => {
  // similar ao anterior, mas após chat faz POST /api/missions
  // verifica que missão foi criada como pending
  // verifica que a missão tem o texto do chat como referência
}))
```

**Teste 3: Provider offline → fallback mock**
```ts
test("E2E: provider offline retorna fallback mock, sistema nao quebra", withTempRoot(async (root) => {
  globalThis.fetch = async () => ({ ok: false, status: 503, statusText: "Service Unavailable" } as Response)
  process.env.JOEFELIPE_LLM_PROVIDER = "openrouter"
  process.env.OPENROUTER_API_KEY = "sk-test-key"

  const { startServer, stopServer } = await import("./server.ts")
  const port = await startServer(root)
  const res = await fetch(`http://127.0.0.1:${port}/api/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "teste" }),
  })
  const data = await res.json()
  assert.equal(res.status, 200)
  assert.ok(data.response)
  assert.ok(data.response.includes("[Bloqueado]") || data.response.includes("fallback"))
  await stopServer()
}))
```

**Teste 4: Budget excedido bloqueia chamada**
```ts
test("E2E: budget excedido bloqueia chamada com safety message", withTempRoot(async (root) => {
  process.env.JOEFELIPE_LLM_PROVIDER = "openrouter"
  process.env.OPENROUTER_API_KEY = "sk-test-key"
  process.env.JOEFELIPE_LLM_MAX_TOKENS_PER_SESSION = "0"

  const { startServer, stopServer } = await import("./server.ts")
  const port = await startServer(root)
  const res = await fetch(`http://127.0.0.1:${port}/api/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "teste" }),
  })
  const data = await res.json()
  assert.ok(data.safety?.blockedReasons?.length > 0 || data.response.includes("bloqueado"), "Budget zero deveria bloquear")
  await stopServer()
}))
```

**Teste 5: LLMPlanningStrategy com resposta realista da LLM**
```ts
test("E2E: planner com resposta realista da LLM (JSON com markdown) gera missoes", withTempRoot(async (root) => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{
        message: {
          content: "Aqui está o plano:\n\n```json\n{\n  \"missions\": [\n    {\n      \"title\": \"Analisar requisitos\",\n      \"intent\": \"Levantar todos os requisitos do sistema\",\n      \"type\": \"analysis\",\n      \"order\": 1\n    },\n    {\n      \"title\": \"Implementar feature\",\n      \"intent\": \"Codificar a feature solicitada\",\n      \"type\": \"feat\",\n      \"dependsOn\": [\"Analisar requisitos\"],\n      \"order\": 2\n    }\n  ],\n  \"warnings\": [\"Requer acesso ao repositorio\"]\n}\n```\n\nPosso ajudar com mais alguma coisa?",
        },
      }],
    }),
  } as Response)

  process.env.JOEFELIPE_LLM_PROVIDER = "openrouter"
  process.env.OPENROUTER_API_KEY = "sk-test-key"

  const { startServer, stopServer } = await import("./server.ts")
  const port = await startServer(root)

  // Criar missão primeiro
  const missionRes = await fetch(`http://127.0.0.1:${port}/api/missions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Implementar login", source: "chat" }),
  })
  const mission = await missionRes.json()
  assert.ok(mission.missionId)

  // Chamar planner
  const planRes = await fetch(`http://127.0.0.1:${port}/api/planner/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goalId: mission.missionId }),
  })
  const plan = await planRes.json()
  assert.ok(plan.missions)
  assert.ok(plan.missions.length >= 2)
  await stopServer()
}))
```

Importante: `server.ts` precisa exportar `startServer()` e `stopServer()`. Atualmente o servidor é inicializado no module scope. Verificar se é necessário refatorar para exportar funções, ou se os testes podem importar e iniciar manualmente.

---

**Task 4: Exportar startServer/stopServer (se necessário)**

Se `server.ts` atualmente inicia o servidor inline (no module scope), refatorar para exportar:
```ts
// No final do server.ts
export async function startServer(root?: string): Promise<number> {
  // ... lógica atual de init
  return port
}

export async function stopServer(): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()))
}
```

Se já houver estrutura de init/close, apenas verificar se está exportada.

---

### Critérios de sucesso

1. `npm run build` — 0 erros
2. `npm test` — todos os testes existentes continuam passando
3. `npm test -- --test-name-pattern="LLMPlanningStrategy"` — novos testes de parser passam
4. `npm test -- --test-name-pattern="E2E"` — novos testes E2E passam
5. Dashboard: botão "Testar LLM" chama `/api/llm/test`, mostra resultado sem criar sessão
6. Com LLM real configurada, `/api/llm/test` retorna `{ success: true, provider, model, latencyMs }`
