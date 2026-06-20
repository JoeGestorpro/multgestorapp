import { watch, existsSync } from "node:fs";
import { join } from "node:path";
import { isSensitivePath } from "./readers.ts";
import type { WatchEvent } from "./types.ts";

const WATCH_DIRS = [
  ".opencodex/brain",
  ".opencodex/queue",
  ".opencodex/brain/living-os",
  ".opencodex/brain/strategy",
  ".opencodex/brain/agents",
];

export function watchSources(
  root: string,
  onEvent: (evt: WatchEvent) => void,
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
        onEvent({
          ts: new Date().toISOString(),
          path: relPath,
          kind: eventType,
          sensitive: false,
        });
      });
      watchers.push(w);
    } catch {
      // fs.watch recursive pode não ser suportado em alguns sistemas Windows
    }
  }
  return () => watchers.forEach((w) => w.close());
}
