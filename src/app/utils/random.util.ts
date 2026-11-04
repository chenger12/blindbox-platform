export const rand = (a: number, b: number): number => Math.random() * (b - a) + a;
export const randInt = (a: number, b: number): number => Math.floor(rand(a, b + 1));
export const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];
export const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));
export const todayKey = (): string => new Date().toISOString().slice(0, 10);
export const uid = (prefix = ''): string => prefix + Math.random().toString(36).slice(2, 9);
export const shuffle = <T>(list: T[]): T[] => [...list].sort(() => Math.random() - 0.5);

export function weightedPick<T extends { weight: number }>(list: readonly T[]): T {
  const total = list.reduce((s, x) => s + x.weight, 0);
  let x = Math.random() * total;
  for (const item of list) {
    x -= item.weight;
    if (x < 0) { return item; }
  }
  return list[0];
}

export function percent(p: number): string {
  if (p >= 0.1) { return (p * 100).toFixed(1) + '%'; }
  if (p >= 0.01) { return (p * 100).toFixed(2) + '%'; }
  return (p * 100).toFixed(3) + '%';
}

export function hashSeed(seed: string | number): number {
  let h = 0;
  for (const ch of String(seed)) { h = (h * 31 + ch.charCodeAt(0)) >>> 0; }
  return h;
}
