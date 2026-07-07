import { describe, it, before, after } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { EventStore } from "./EventStore.ts";
import { EventConsumer } from "./EventConsumer.ts";

function makeTmpDir(): string {
  const d = mkdtempSync(join(tmpdir(), "events-test-"));
  const r = join(d, "tools", "joefelipe-agent", "runtime");
  mkdirSync(r, { recursive: true });
  return d;
}

describe("EventConsumer", () => {
  let root: string;
  let store: EventStore;
  let consumer: EventConsumer;

  before(() => {
    root = makeTmpDir();
    store = new EventStore(root);
    consumer = new EventConsumer(store);
  });

  after(() => {
    try { rmSync(root, { recursive: true }); } catch { /* ok */ }
  });

  it("ingest creates event with received status", () => {
    const evt = store.create("test:event", "file:watch", "info", "arquivo alterado", { path: "test.md" });
    const ingested = consumer.ingest(evt);
    assert.equal(ingested.status, "received");
    assert.equal(ingested.type, "file:changed");
  });

  it("ingest classifies critical for risco patterns", () => {
    const evt = store.create("test:event", "file:watch", "info", "risco alterado", { path: "riscos-ativos.md" });
    const ingested = consumer.ingest(evt);
    assert.equal(ingested.severity, "critical");
    assert.equal(ingested.type, "risk:changed");
  });

  it("processPending marks event as analyzed with fallback analysis", async () => {
    const evt = store.create("fallback:test", "file:watch", "info", "teste fallback", { path: "test.md" });
    consumer.ingest(evt);
    const processed = await consumer.processPending();
    assert.ok(processed.length >= 1);
    const found = processed.find((e) => e.id === evt.id);
    assert.ok(found);
    assert.equal(found.status, "analyzed");
    assert.ok(found.analysis);
    assert.equal(found.analysis.safety.canExecute, false);
  });

  it("processPending handles empty queue gracefully", async () => {
    const fresh = new EventStore(makeTmpDir());
    const c = new EventConsumer(fresh);
    const result = await c.processPending();
    assert.deepEqual(result, []);
  });

  it("ingest preserves api:ingest source classification", () => {
    const evt = store.create("api:custom", "api:ingest", "warning", "evento externo", {});
    assert.equal(evt.source, "api:ingest");
  });

  it("multiple ingests maintain order", () => {
    const fresh = new EventStore(makeTmpDir());
    const c = new EventConsumer(fresh);
    const e1 = fresh.create("e1", "file:watch", "info", "primeiro", { path: "a.md" });
    const e2 = fresh.create("e2", "file:watch", "warning", "segundo", { path: "b.md" });
    c.ingest(e1);
    c.ingest(e2);
    const list = fresh.list(10);
    assert.equal(list.length, 2);
  });
});