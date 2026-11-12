import { BoxDef, ItemDef, WeightedBox } from '../models/catalog/catalog.model';
import { WheelSegment } from '../models/game/game-state.model';
import { MissionId } from '../models/user/user.model';
import { BLIND_BOX_PRICE, BOX_RTP, BOXES, ITEMS, KUJI_PRICE } from './catalog.data';

/**
 * Pure game rules shared by the client (to display odds) and the API (to decide outcomes).
 * No Angular, no storage — safe to run on either side.
 */
const ITEM_INDEX = new Map<string, ItemDef>(ITEMS.map(i => [i.id, i]));

export const itemDef = (id: string): ItemDef => ITEM_INDEX.get(id) ?? ITEMS[0];
export const itemValue = (id: string): number => itemDef(id).value;

export const isRareTier = (tier: string | undefined): boolean =>
  tier === 'SR' || tier === 'SECRET' || tier === 'A' || tier === 'B' || tier === 'LAST';

/** Solves weights w = value^-a so the box returns `rtp` of its price on average (default BOX_RTP). */
export function weighBox(b: BoxDef, rtp = BOX_RTP): WeightedBox {
  const values = b.itemIds.map(itemValue);
  const target = b.price * rtp;
  let lo = 0;
  let hi = 12;
  for (let k = 0; k < 60; k++) {
    const a = (lo + hi) / 2;
    let sw = 0;
    let sv = 0;
    values.forEach(v => { const w = Math.pow(v, -a); sw += w; sv += w * v; });
    if (sv / sw > target) { lo = a; } else { hi = a; }
  }
  const a = (lo + hi) / 2;
  const weights = b.itemIds.map(id => ({ itemId: id, weight: Math.pow(itemValue(id), -a) }));
  const topItemIds = [...b.itemIds].sort((x, y) => itemValue(y) - itemValue(x));
  return {
    ...b, weights,
    totalWeight: weights.reduce((s, w) => s + w.weight, 0),
    topItemIds,
    maxValue: itemValue(topItemIds[0])
  };
}

export const WEIGHTED_BOXES: WeightedBox[] = BOXES.map(b => weighBox(b));
export const weightedBox = (id: string): WeightedBox | undefined => WEIGHTED_BOXES.find(b => b.id === id);

/** A box re-weighted at a custom return rate; defaults to the standard weighting. */
export function weightedBoxAt(id: string, rtp?: number): WeightedBox | undefined {
  const base = WEIGHTED_BOXES.find(b => b.id === id);
  if (!base || rtp === undefined || Math.abs(rtp - BOX_RTP) < 1e-4) { return base; }
  return weighBox(base, rtp);
}

export function rollBox(box: WeightedBox): string {
  let x = Math.random() * box.totalWeight;
  for (const w of box.weights) {
    x -= w.weight;
    if (x < 0) { return w.itemId; }
  }
  return box.weights[0].itemId;
}

// ---------------------------------------------------------------------------
// Prices, fees and reward tables (shown by the app, enforced by the API)
// ---------------------------------------------------------------------------

export const levelNeed = (level: number): number => 300 + level * 200;
export const SELL_RATE = 0.8;
export const TOP_UP_COINS = 500;
export const CHECK_IN_REWARDS = [20, 30, 40, 50, 60, 80, 150];
export const MISSIONS: Array<{ id: MissionId; field: 'opened' | 'games' | 'wins'; goal: number; reward: number }> = [
  { id: 'open3', field: 'opened', goal: 3, reward: 50 },
  { id: 'play2', field: 'games', goal: 2, reward: 40 },
  { id: 'win1', field: 'wins', goal: 1, reward: 60 }
];

export const kujiCost = (count: number | 'all', remaining: number): number =>
  count === 'all' ? Math.floor(remaining * KUJI_PRICE * 0.9) : count * KUJI_PRICE;

export const BLIND_BOX_HINT_PRICE = 10;
export const BLIND_BOX_XRAY_PRICE = 30;
export const blindBoxCaseCost = (n: number): number => n > 1 ? Math.floor(n * BLIND_BOX_PRICE * 0.9) : BLIND_BOX_PRICE;

export const battleCost = (rounds: string[]): number => rounds.reduce((s, id) => s + (weightedBox(id)?.price ?? 0), 0);

export const MARKET_FEE = 0.05;
export const SWAP_POST_FEE = 10;

export const WHEEL_SPIN_PRICE = 20;
export const WHEEL_SEGMENTS: WheelSegment[] = [
  { labelKey: '+20', subKey: 'wheel.seg.coins', weight: 22, reward: { coins: 20 } },
  { labelKey: 'wheel.seg.ticket', subKey: 'wheel.seg.gachaX1', weight: 14, reward: { ticket: 1 } },
  { labelKey: '+50', subKey: 'wheel.seg.coins', weight: 18, reward: { coins: 50 } },
  { labelKey: 'wheel.seg.pin', subKey: 'wheel.seg.mystery', weight: 10, reward: { item: true } },
  { labelKey: 'wheel.seg.hint', subKey: 'wheel.seg.cardX1', weight: 20, reward: { hint: 1 } },
  { labelKey: '+188', subKey: 'wheel.seg.coins', weight: 8, reward: { coins: 188 } },
  { labelKey: 'wheel.seg.respin', subKey: 'wheel.seg.free', weight: 6, reward: { again: true } },
  { labelKey: '+888', subKey: 'wheel.seg.jackpot', weight: 2, reward: { coins: 888, big: true } }
];
