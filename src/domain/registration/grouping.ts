export function groupByLabels<T>(
  items: readonly T[],
  labels: (item: T) => readonly string[],
): [string, T[]][] {
  const result = new Map<string, T[]>();
  for (const item of items)
    for (const label of new Set(labels(item))) {
      const group = result.get(label) ?? [];
      group.push(item);
      result.set(label, group);
    }
  return [...result].sort(([a], [b]) => a.localeCompare(b, 'de-CH'));
}
