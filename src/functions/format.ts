const UNITS: [label: string, ms: number][] = [
  ["d", 86_400_000],
  ["h", 3_600_000],
  ["m", 60_000],
  ["s", 1_000],
];

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0s";

  const parts: string[] = [];
  let remaining = Math.floor(ms);

  for (const [label, size] of UNITS) {
    const value = Math.floor(remaining / size);
    if (value > 0) parts.push(`${value}${label}`);
    remaining %= size;
  }

  return parts.length > 0 ? parts.join(" ") : "0s";
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)}${units[unit]}`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/** Latency needs sub-second precision, which `formatDuration` floors away. */
export function formatSeconds(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0s";
  return ms < 10_000 ? `${(ms / 1000).toFixed(1)}s` : formatDuration(ms);
}

/** Discord rejects TextDisplay content over 4000 characters. */
export const TEXT_DISPLAY_LIMIT = 4000;
