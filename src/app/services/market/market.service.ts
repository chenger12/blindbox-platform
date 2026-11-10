import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MarketBuyResult, MarketStateView, MarketTickResult } from '../../models/api/api.model';
import { randInt } from '../../utils/random.util';
import { ApiService } from '../api/api.service';
import { CatalogService } from '../catalog/catalog.service';
import { FxService } from '../fx/fx.service';
import { ToastService } from '../toast/toast.service';

export { MARKET_FEE } from '../../utils/game-rules.util';

/** Client for /api/games/market. */
@Injectable({ providedIn: 'root' })
export class MarketService {
  private readonly subject = new BehaviorSubject<MarketStateView>({ listings: [], sales: [] });
  readonly state$ = this.subject.asObservable();
  private started = false;

  constructor(
    private readonly api: ApiService,
    private readonly catalog: CatalogService,
    private readonly toast: ToastService,
    private readonly fx: FxService,
    private readonly zone: NgZone
  ) {}

  get state(): MarketStateView { return this.subject.value; }

  async load(): Promise<void> {
    this.set(await this.api.game<MarketStateView>('market', 'state', undefined, { silent: true }));
  }

  /** Returns the bought item id. */
  async buy(id: string): Promise<string | null> {
    const r = await this.api.game<MarketBuyResult>('market', 'buy', { id });
    if (!r) { return null; }
    this.set(r.state);
    this.fx.win();
    return r.item.itemId;
  }

  async list(uid: number, price: number): Promise<boolean> {
    const s = await this.api.game<MarketStateView>('market', 'list', { uid, price });
    this.set(s);
    return !!s;
  }

  async unlist(id: string): Promise<void> {
    this.set(await this.api.game<MarketStateView>('market', 'unlist', { id }));
  }

  /** Background market activity, run by the server: your listings may sell; new listings appear. */
  start(): void {
    if (this.started) { return; }
    this.started = true;
    void this.load();
    const loop = (): void => {
      this.zone.run(() => void this.tick());
      setTimeout(loop, randInt(7000, 13000));
    };
    this.zone.runOutsideAngular(() => setTimeout(loop, 6000));
  }

  private async tick(): Promise<void> {
    const r = await this.api.game<MarketTickResult>('market', 'tick', {}, { silent: true });
    if (!r) { return; }
    this.set(r.state);
    r.sold.forEach(s => this.toast.show('market.sold', { item: this.catalog.name(s.itemId), price: s.price, got: s.got }));
  }

  private set(s: MarketStateView | null): void {
    if (s) { this.subject.next(s); }
  }
}
