import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GachaSpinResult, GachaStateView } from '../../models/api/api.model';
import { isRareTier } from '../../utils/game-rules.util';
import { ApiService } from '../api/api.service';

/** Client for /api/games/gacha. */
@Injectable({ providedIn: 'root' })
export class GachaService {
  readonly pity$ = new BehaviorSubject<number>(0);

  constructor(private readonly api: ApiService) {}

  get pity(): number { return this.pity$.value; }

  static isRare(tier: string | undefined): boolean {
    return isRareTier(tier);
  }

  async load(): Promise<void> {
    const s = await this.api.game<GachaStateView>('gacha', 'state');
    if (s) { this.pity$.next(s.pity); }
  }

  /** The server rolls every capsule up front; the page then animates them. Winnings held until api.commit(). */
  async spin(count: 1 | 5, trial: boolean): Promise<GachaSpinResult | null> {
    const r = await this.api.game<GachaSpinResult>('gacha', 'spin', { count, trial }, { hold: true });
    if (r && !trial) { this.pity$.next(r.pity); }
    return r;
  }
}
