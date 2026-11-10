import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { KujiTier } from '../../models/catalog/catalog.model';
import { KujiPullResult, KujiPullView, KujiTickResult } from '../../models/api/api.model';
import { KujiBox, KujiState } from '../../models/game/game-state.model';
import { KUJI_LAST_ONE, KUJI_PRIZES } from '../../utils/catalog.data';
import { kujiCost } from '../../utils/game-rules.util';
import { ApiService } from '../api/api.service';

export const KUJI_TIERS: KujiTier[] = ['A', 'B', 'C', 'D', 'E'];
export const KUJI_BIG: KujiTier[] = ['A', 'B', 'LAST'];
export const KUJI_RANK: Record<string, number> = { E: 1, D: 2, C: 3, B: 4, A: 5, LAST: 6 };

export type KujiPull = KujiPullView;

const EMPTY: KujiState = { boxes: [{ no: 1, remaining: {}, log: [], lastOneBy: null }], current: 0, lockBox: -1, lockUntil: 0 };

/** Client for /api/games/kuji. Holds the last state the API sent; display helpers only. */
@Injectable({ providedIn: 'root' })
export class KujiService {
  private readonly subject = new BehaviorSubject<KujiState>(EMPTY);
  readonly state$ = this.subject.asObservable();

  constructor(private readonly api: ApiService) {}

  get state(): KujiState { return this.subject.value; }
  get box(): KujiBox { return this.state.boxes[this.state.current]; }
  get lockActive(): boolean { return this.state.lockBox === this.state.current && this.state.lockUntil > Date.now(); }

  async load(): Promise<void> {
    this.set(await this.api.game<KujiState>('kuji', 'state'));
  }

  remaining(box: KujiBox = this.box): number {
    return Object.values(box.remaining).reduce((a, b) => a + b, 0);
  }

  tierLeft(tier: KujiTier, box: KujiBox = this.box): { left: number; total: number } {
    const ps = KUJI_PRIZES.filter(p => p.tier === tier);
    return { left: ps.reduce((a, p) => a + (box.remaining[p.itemId] ?? 0), 0), total: ps.reduce((a, p) => a + p.quantity, 0) };
  }

  cost(count: number | 'all'): number {
    return kujiCost(count, this.remaining());
  }

  async select(index: number): Promise<boolean> {
    const s = await this.api.game<KujiState>('kuji', 'select', { index });
    this.set(s);
    return !!s;
  }

  /** Pulls from the current box; winnings are held until the reveal is done (call api.commit()). */
  async pull(count: number | 'all', trial: boolean): Promise<KujiPullResult | null> {
    const r = await this.api.game<KujiPullResult>('kuji', 'pull', { count, trial }, { hold: true });
    if (r && !trial) { this.set(r.state); }
    return r;
  }

  /** Another collector pulls somewhere (simulated by the server). */
  async botPull(): Promise<KujiTickResult | null> {
    const r = await this.api.game<KujiTickResult>('kuji', 'tick', {}, { silent: true });
    this.set(r?.state ?? null);
    return r;
  }

  tierOf(itemId: string): KujiTier {
    return itemId === KUJI_LAST_ONE ? 'LAST' : KUJI_PRIZES.find(p => p.itemId === itemId)?.tier ?? 'E';
  }

  private set(s: KujiState | null): void {
    if (s) { this.subject.next(s); }
  }
}
