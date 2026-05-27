/** Build evenly spaced Y-axis labels for HTML column (bottom → top). */
export function buildYTickLabels(maxValue: number, steps = 4): string[] {
  if (maxValue <= 0) {
    return ["0"];
  }
  const top = Math.ceil(maxValue * 1.08);
  const magnitude = 10 ** Math.floor(Math.log10(top));
  const niceTop = Math.ceil(top / magnitude) * magnitude;
  const step = niceTop / steps;
  return Array.from({ length: steps + 1 }, (_, i) => formatTickNumber(Math.round(step * i)));
}

export function maxFromKeys<T extends Record<string, unknown>>(
  rows: T[],
  keys: (keyof T)[],
): number {
  let max = 0;
  for (const row of rows) {
    for (const key of keys) {
      const n = Number(row[key]);
      if (!Number.isNaN(n)) max = Math.max(max, n);
    }
  }
  return max;
}

function formatTickNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}
