import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WheelSpinResult, WheelStateView } from '../../models/api/api.model';
import { WheelLog } from '../../models/game/game-state.model';
import { ApiService } from '../api/api.service';

export { WHEEL_SEGMENTS, WHEEL_SPIN_PRICE } from '../../utils/game-rules.util';

/** Client for /api/games/wheel. The server picks the segment and pays the reward. */
@Injectable({ providedIn: 'root' })
export class WheelService {
  readonly log$ = new BehaviorSubject<WheelLog[]>([]);
  readonly freeToday$ = new BehaviorSubject<boolean>(false);

  constructor(private readonly api: ApiService) {}

  async load(): Promise<void> {
    this.set(await this.api.game<WheelStateView>('wheel', 'state'));
  }

  /** Winnings held until api.commit(), after the wheel stops. */
  async spin(respin: boolean): Promise<WheelSpinResult | null> {
    const r = await this.api.game<WheelSpinResult>('wheel', 'spin', { respin }, { hold: true });
    return r;
  }

  /** Shows the new history once the wheel has stopped. */
  show(r: WheelSpinResult): void {
    this.set(r.state);
  }

  private set(s: WheelStateView | null): void {
    if (s) { this.log$.next(s.log); this.freeToday$.next(s.freeToday); }
  }
}
