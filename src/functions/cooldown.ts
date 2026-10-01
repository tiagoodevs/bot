const buckets = new Map<string, number>();
const MAX_ENTRIES = 10_000;

export function checkCooldown(key: string, ms: number): number {
  if (buckets.size >= MAX_ENTRIES) {
    const cutoff = Date.now() - ms;
    for (const [k, at] of buckets) {
      if (at < cutoff) buckets.delete(k);
    }
  }

  const now = Date.now();
  const readyAt = buckets.get(key) ?? 0;
  const remaining = readyAt - now;

  if (remaining > 0) return remaining;

  buckets.set(key, now + ms);
  return 0;
}
