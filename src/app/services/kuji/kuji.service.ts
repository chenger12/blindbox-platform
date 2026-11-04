import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { KujiPrize, KujiTier } from '../../models/catalog/catalog.model';
import { KujiBox, KujiState } from '../../models/game/game-state.model';
import { BOT_NAMES, KUJI_BOX_COUNT, KUJI_LAST_ONE, KUJI_PRICE, KUJI_PRIZES, KUJI_TICKETS } from '../../utils/catalog.data';
import { pick, randInt } from '../../utils/random.util';
import { StorageService } from '../storage/storage.service';

const KEY = 'mb_kuji';
export const KUJI_TIERS: KujiTier[] = ['A', 'B', 'C', 'D', 'E'];
export const KUJI_BIG: KujiTier[] = ['A', 'B', 'LAST'];
export const KUJI_RANK: Record<string, number> = { E: 1, D: 2, C: 3, B: 4, A: 5, LAST: 6 };

export interface KujiPull { itemId: string; tier: KujiTier; }

@Injectable({ providedIn: 'root' })
export class KujiService {
  private readonly subject: BehaviorSubject<KujiState>;
  readonly state$;

  constructor(private readonly storage: StorageService) {
    this.subject = new BehaviorSubject<KujiState>(this.storage.get<KujiState>(KEY) ?? this.fresh());
    this.state$ = this.subject.asObservable();
  }

  get state(): KujiState { return this.subject.value; }
  get box(): KujiBox { return this.state.boxes[this.state.current]; }
  get lockActive(): boolean { return this.state.lockBox === this.state.current && this.state.lockUntil > Date.now(); }

  remaining(box: KujiBox = this.box): number {
    return Object.values(box.remaining).reduce((a, b) => a + b, 0);
  }

  tierLeft(tier: KujiTier, box: KujiBox = this.box): { left: number; total: number } {
    const ps = KUJI_PRIZES.filter(p => p.tier === tier);
    return { left: ps.reduce((a, p) => a + box.remaining[p.itemId], 0), total: ps.reduce((a, p) => a + p.quantity, 0) };
  }

  cost(count: number | 'all'): number {
    const rem = this.remaining();
    return count === 'all' ? Math.floor(rem * KUJI_PRICE * 0.9) : count * KUJI_PRICE;
  }

  select(index: number): void {
    this.save({ ...this.state, current: index });
  }

  /** Pulls tickets from the current box. Trial pulls leave the box untouched. */
  pull(count: number | 'all', trial: boolean): { pulls: KujiPull[]; lastOne: boolean } {
    const state = structuredClone(this.state);
    const box = state.boxes[state.current];
    const n = Math.min(count === 'all' ? this.remaining(box) : count, this.remaining(box));
    const pulls: KujiPull[] = [];
    for (let i = 0; i < n; i++) {
      const p = this.drawFrom(box, !trial);
      if (p) { pulls.push({ itemId: p.itemId, tier: p.tier }); }
    }
    let lastOne = false;
    if (!trial) {
      const now = Date.now();
      pulls.forEach(p => box.log.unshift({ user: 'me', itemId: p.itemId, tier: p.tier, at: now, me: true }));
      if (this.remaining(box) === 0) {
        lastOne = true;
        box.lastOneBy = 'me';
        box.log.unshift({ user: 'me', itemId: KUJI_LAST_ONE, tier: 'LAST', at: now, me: true });
      }
      box.log = box.log.slice(0, 40);
      state.lockBox = state.current;
      state.lockUntil = now + 180000;
      this.save(state);
    }
    return { pulls: lastOne ? [...pulls, { itemId: KUJI_LAST_ONE, tier: 'LAST' }] : pulls, lastOne };
  }

  /** A simulated collector pulls from some box (never the one locked to you). */
  botPull(): { user: string; pull: KujiPull; boxNo: number; current: boolean } | null {
    const state = structuredClone(this.state);
    const candidates = state.boxes.filter((b, i) =>
      this.remaining(b) > (i === state.current ? 10 : 2) && !(i === state.current && this.lockActive));
    if (!candidates.length) { return null; }
    const box = pick(candidates);
    const p = this.drawFrom(box, true);
    if (!p) { return null; }
    const user = pick(BOT_NAMES);
    box.log.unshift({ user, itemId: p.itemId, tier: p.tier, at: Date.now() });
    box.log = box.log.slice(0, 40);
    this.save(state);
    return { user, pull: { itemId: p.itemId, tier: p.tier }, boxNo: box.no, current: state.boxes[state.current] === box };
  }

  tierOf(itemId: string): KujiTier {
    return itemId === KUJI_LAST_ONE ? 'LAST' : KUJI_PRIZES.find(p => p.itemId === itemId)?.tier ?? 'E';
  }

  private drawFrom(box: KujiBox, commit: boolean): KujiPrize | null {
    const rem = this.remaining(box);
    if (!rem) { return null; }
    let x = Math.random() * rem;
    for (const p of KUJI_PRIZES) {
      x -= box.remaining[p.itemId];
      if (x < 0) {
        if (commit) { box.remaining[p.itemId]--; }
        return p;
      }
    }
    return null;
  }

  private fresh(): KujiState {
    const pre = [17, 52, 3, 74, 38, 80];
    const boxes: KujiBox[] = Array.from({ length: KUJI_BOX_COUNT }, (_, i) => {
      const remaining: Record<string, number> = {};
      KUJI_PRIZES.forEach(p => remaining[p.itemId] = p.quantity);
      const box: KujiBox = { no: i + 1, remaining, log: [], lastOneBy: null };
      const take = Math.min(pre[i] ?? 0, KUJI_TICKETS);
      for (let j = 0; j < take; j++) {
        const p = this.drawFrom(box, true);
        if (p) { box.log.unshift({ user: pick(BOT_NAMES), itemId: p.itemId, tier: p.tier, at: Date.now() - randInt(1, 600) * 60000 }); }
      }
      if (take >= KUJI_TICKETS) { box.lastOneBy = pick(BOT_NAMES); }
      box.log = box.log.slice(0, 30);
      return box;
    });
    return { boxes, current: 0, lockBox: -1, lockUntil: 0 };
  }

  private save(s: KujiState): void {
    this.storage.set(KEY, s);
    this.subject.next(s);
  }
}
