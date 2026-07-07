import { watch, existsSync } from "node:fs";
import { join } from "node:path";
import { isSensitivePath } from "./readers.ts";
import type { WatchEvent } from "./types.ts";
import type { Kernel } from "./kernel/Kernel.ts";

const WATCH_DIRS = [
  ".opencodex/brain",
  ".opencodex/queue",
  ".opencodex/brain/living-os",
  ".opencodex/brain/strategy",
  ".opencodex/brain/agents",
];

const DEBOUNCE_MS = 2000;
const debounceMap = new Map<string, number>();

export function watchSources(
  root: string,
  onEvent: (evt: WatchEvent) => void = () => {},
  kernel?: Kernel,
): () => void {
  const watchers: ReturnType<typeof watch>[] = [];
  for (const dir of WATCH_DIRS) {
    const abs = join(root, dir);
    if (!existsSync(abs)) continue;
    try {
      const w = watch(abs, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        const relPath = join(dir, filename.toString());
        if (isSensitivePath(relPath)) return;

        const now = Date.now();
        const key = eventType + ":" + relPath;
        const last = debounceMap.get(key);
        if (last && now - last < DEBOUNCE_MS) return;
        debounceMap.set(key, now);

        if (kernel) {
          kernel.events.emit("work:file-changed", { path: relPath, kind: eventType, ts: new Date().toISOString() });
        }
        onEvent({
          ts: new Date().toISOString(),
          path: relPath,
          kind: eventType,
          sensitive: false,
        });
      });
      watchers.push(w);
    } catch {
      // fs.watch recursive pode n\u00E3o ser suportado em alguns sistemas Windows
    }
  }
  return () => watchers.forEach((w) => w.close());
}