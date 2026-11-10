import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BlindBoxActionResult, BlindBoxBuyResult } from '../../models/api/api.model';
import { BlindBoxState } from '../../models/game/game-state.model';
import { BLIND_BOX_POOL, BLIND_BOX_SECRET } from '../../utils/catalog.data';
import { ApiService } from '../api/api.service';

const EMPTY: BlindBoxState = { caseNo: 0, slots: [], selected: -1 };

/**
 * Client for /api/games/blind-box. Unopened boxes arrive with an empty itemId —
 * what is inside stays on the server until you x-ray or buy it.
 */
@Injectable({ providedIn: 'root' })
export class BlindBoxService {
  readonly styles = [...BLIND_BOX_POOL, BLIND_BOX_SECRET];
  private readonly subject = new BehaviorSubject<BlindBoxState>(EMPTY);
  readonly state$ = this.subject.asObservable();

  constructor(private readonly api: ApiService) {}

  get state(): BlindBoxState { return this.subject.value; }

  async load(): Promise<void> {
    this.set(await this.api.game<BlindBoxState>('blind-box', 'state'));
  }

  remaining(): number {
    return this.state.slots.filter(s => !s.sold).length;
  }

  /** Styles still possible for box i, from what has been sold and ruled out. */
  possible(i: number): string[] {
    const slot = this.state.slots[i];
    if (!slot) { return []; }
    if (slot.xray) { return [slot.itemId]; }
    const sold = new Set(this.state.slots.filter(x => x.sold).map(x => x.itemId));
    return this.styles.filter(id => !sold.has(id) && !slot.excluded.includes(id));
  }

  async newCase(): Promise<void> {
    this.set(await this.api.game<BlindBoxState>('blind-box', 'new-case', {}));
  }

  async select(index: number): Promise<void> {
    const prev = this.state;
    this.subject.next({ ...prev, selected: index });
    const s = await this.api.game<BlindBoxState>('blind-box', 'select', { index });
    this.subject.next(s ?? prev);
  }

  hint(index: number): Promise<string | null> { return this.action('hint', index); }
  xray(index: number): Promise<string | null> { return this.action('xray', index); }
  shake(index: number): Promise<string | null> { return this.action('shake', index); }

  /** One box, or the whole rest of the case. Winnings held until api.commit(). */
  async buy(target: { index: number } | { all: true }): Promise<BlindBoxBuyResult | null> {
    const r = await this.api.game<BlindBoxBuyResult>('blind-box', 'buy', target, { hold: true });
    this.set(r?.state ?? null);
    return r;
  }

  /** Another shopper may buy a box (simulated by the server). */
  async tick(): Promise<void> {
    this.set(await this.api.game<BlindBoxState>('blind-box', 'tick', {}, { silent: true }));
  }

  private async action(name: string, index: number): Promise<string | null> {
    const r = await this.api.game<BlindBoxActionResult<string>>('blind-box', name, { index });
    this.set(r?.state ?? null);
    return r?.value ?? null;
  }

  private set(s: BlindBoxState | null): void {
    if (s) { this.subject.next(s); }
  }
}
