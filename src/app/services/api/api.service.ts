import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AccountSnapshot, ApiEnvelope, ApiErrorBody } from '../../models/api/api.model';
import { DailyService } from '../daily/daily.service';
import { DataService } from '../data/data.service';
import { InventoryService } from '../inventory/inventory.service';
import { ToastService } from '../toast/toast.service';
import { WalletService } from '../wallet/wallet.service';

export interface CallOptions {
  /**
   * Show only the payment now and keep winnings (coins, items, level-ups) back until
   * commit() — so a prize is not given away before its animation finishes.
   */
  hold?: boolean;
  /** Background call: no error toast, no redirect. */
  silent?: boolean;
}

/** Error codes the API can answer with → message shown to the player. */
const ERROR_TOASTS: Record<string, string> = {
  noCoins: 'toast.noCoins',
  gameDisabled: 'api.gameDisabled',
  onlyOne: 'blindBox.onlyOne',
  kujiSoldOut: 'kuji.soldOutToast',
  promoBad: 'rewards.promoBad',
  itemUnavailable: 'api.itemUnavailable',
  listingGone: 'api.listingGone',
  battleGone: 'api.battleGone',
  offerGone: 'api.offerGone',
  postGone: 'api.offerGone',
  slotTaken: 'api.slotTaken'
};

/**
 * The single gateway from the app to the game APIs (/api/account, /api/games/<game>/...).
 * Keeps the wallet, inventory and daily progress in sync with every answer.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private held: AccountSnapshot | null = null;

  constructor(
    private readonly data: DataService,
    private readonly wallet: WalletService,
    private readonly inventory: InventoryService,
    private readonly daily: DailyService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {
    // Never keep winnings back across pages.
    router.events.pipe(filter(e => e instanceof NavigationStart)).subscribe(() => this.commit());
  }

  /** Resolves with the endpoint's data, or null when the call failed (the player has already been told why). */
  get<T>(path: string, opts: CallOptions = {}): Promise<T | null> {
    return this.run(this.data.get<ApiEnvelope<T>>(path), opts);
  }

  post<T>(path: string, body: unknown = {}, opts: CallOptions = {}): Promise<T | null> {
    return this.run(this.data.post<ApiEnvelope<T>>(path, body), opts);
  }

  /** Shorthand for /api/games/<game>/<action>. */
  game<T>(game: string, action: string, body?: unknown, opts?: CallOptions): Promise<T | null> {
    return body === undefined ? this.get<T>(`games/${game}/${action}`, opts) : this.post<T>(`games/${game}/${action}`, body, opts);
  }

  /** Applies winnings kept back by a `hold` call. */
  commit(): void {
    if (this.held) { this.apply(this.held); }
    this.held = null;
  }

  private async run<T>(req: Observable<ApiEnvelope<T>>, opts: CallOptions): Promise<T | null> {
    try {
      const env = await firstValueFrom(req);
      if (env.account) {
        if (opts.hold) {
          this.commit();
          if (env.paid) { this.wallet.sync(env.paid); }
          this.held = env.account;
        } else if (this.held) {
          this.held = env.account;
        } else {
          this.apply(env.account);
        }
      }
      return env.data;
    } catch (e) {
      this.fail(e, opts);
      return null;
    }
  }

  private apply(a: AccountSnapshot): void {
    this.wallet.sync(a.wallet);
    this.inventory.sync(a.inventory);
    this.daily.sync(a.daily);
  }

  private fail(e: unknown, opts: CallOptions): void {
    const code = e instanceof HttpErrorResponse ? (e.error as ApiErrorBody | null)?.code ?? '' : '';
    if (opts.silent) { return; }
    if (code === 'noCoins') { this.wallet.notEnough(); return; }
    this.toast.show(ERROR_TOASTS[code] ?? 'api.error');
    if (code === 'gameDisabled') { void this.router.navigate(['/']); }
  }
}
