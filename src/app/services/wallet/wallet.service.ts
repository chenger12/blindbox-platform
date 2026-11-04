import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WalletState } from '../../models/user/user.model';
import { STARTING_COINS } from '../../utils/catalog.data';
import { FxService } from '../fx/fx.service';
import { StorageService } from '../storage/storage.service';
import { ToastService } from '../toast/toast.service';

const KEY = 'mb_wallet';
export const levelNeed = (level: number): number => 300 + level * 200;

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly subject: BehaviorSubject<WalletState>;
  readonly state$;
  /** Emits when the balance should visibly "bump" (insufficient funds). */
  readonly shake$ = new BehaviorSubject<number>(0);

  constructor(private readonly storage: StorageService, private readonly fx: FxService, private readonly toast: ToastService) {
    const fresh: WalletState = { coins: STARTING_COINS, xp: 0, level: 1, gachaTickets: 1, hintCards: 2, xrayCards: 1, swapTickets: 3, promoUsed: false };
    this.subject = new BehaviorSubject<WalletState>({ ...fresh, ...(this.storage.get<WalletState>(KEY) ?? {}) });
    this.state$ = this.subject.asObservable();
  }

  get state(): WalletState {
    return this.subject.value;
  }

  get coins(): number {
    return this.subject.value.coins;
  }

  patch(p: Partial<WalletState>): void {
    const next = { ...this.subject.value, ...p };
    this.storage.set(KEY, next);
    this.subject.next(next);
  }

  add(n: number, sound = true): void {
    this.patch({ coins: this.coins + n });
    if (n > 0 && sound) { this.fx.coin(); }
  }

  /** Spends coins; on failure shows a toast, shakes the balance and returns false. */
  trySpend(n: number): boolean {
    if (n <= 0) { return true; }
    if (this.coins < n) {
      this.toast.show('toast.noCoins');
      this.fx.vibrate(80);
      this.shake$.next(this.shake$.value + 1);
      return false;
    }
    this.patch({ coins: this.coins - n });
    return true;
  }

  gainXp(amount: number): void {
    let { xp, level, coins } = this.state;
    xp += Math.round(amount);
    let ups = 0;
    while (xp >= levelNeed(level)) { xp -= levelNeed(level); level++; coins += 100; ups++; }
    this.patch({ xp, level, coins });
    if (ups) { this.toast.show('toast.levelUp', { level }); this.fx.win(); }
  }

  useCard(kind: 'gachaTickets' | 'hintCards' | 'xrayCards' | 'swapTickets', delta = -1): void {
    this.patch({ [kind]: Math.max(0, this.state[kind] + delta) } as Partial<WalletState>);
  }

  reset(): void {
    this.storage.remove(KEY);
  }
}
