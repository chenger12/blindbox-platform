import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WalletState } from '../../models/user/user.model';
import { FxService } from '../fx/fx.service';
import { ToastService } from '../toast/toast.service';

export { levelNeed } from '../../utils/game-rules.util';

const EMPTY: WalletState = { coins: 0, xp: 0, level: 0, gachaTickets: 0, hintCards: 0, xrayCards: 0, swapTickets: 0, promoUsed: false };

/**
 * The player's coins, level and cards as last reported by the API.
 * Read-only on the client: every change comes from an API answer (see ApiService).
 */
@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly subject = new BehaviorSubject<WalletState>(EMPTY);
  readonly state$ = this.subject.asObservable();
  /** Emits when the balance should visibly "bump" (insufficient funds). */
  readonly shake$ = new BehaviorSubject<number>(0);

  constructor(private readonly fx: FxService, private readonly toast: ToastService) {}

  get state(): WalletState {
    return this.subject.value;
  }

  get coins(): number {
    return this.subject.value.coins;
  }

  sync(next: WalletState): void {
    const prev = this.subject.value;
    this.subject.next(next);
    if (!prev.level) { return; }
    if (next.level > prev.level) { this.toast.show('toast.levelUp', { level: next.level }); this.fx.win(); }
    else if (next.coins > prev.coins) { this.fx.coin(); }
  }

  /** The API refused a payment: tell the player and shake the balance. */
  notEnough(): void {
    this.toast.show('toast.noCoins');
    this.fx.vibrate(80);
    this.shake$.next(this.shake$.value + 1);
  }
}
