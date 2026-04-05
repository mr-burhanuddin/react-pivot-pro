export function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

export function move<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function areArraysEqual<T>(a: T[], b: T[], compare?: (a: T, b: T) => boolean): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (compare ? !compare(a[i], b[i]) : a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export function reorderByIds<T extends { id: string }>(
  items: T[],
  order: string[],
): T[] {
  if (order.length === 0) {
    return items;
  }

  const rank = new Map<string, number>();
  order.forEach((id, index) => {
    rank.set(id, index);
  });

  return [...items].sort((left, right) => {
    const leftRank = rank.get(left.id);
    const rightRank = rank.get(right.id);
    if (leftRank == null && rightRank == null) return 0;
    if (leftRank == null) return 1;
    if (rightRank == null) return -1;
    return leftRank - rightRank;
  });
}
