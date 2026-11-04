import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Listing, Sale } from '../../models/market/market.model';
import { BOT_NAMES, ITEMS } from '../../utils/catalog.data';
import { pick, rand, randInt, uid } from '../../utils/random.util';
import { CatalogService } from '../catalog/catalog.service';
import { FxService } from '../fx/fx.service';
import { InventoryService } from '../inventory/inventory.service';
import { StorageService } from '../storage/storage.service';
import { ToastService } from '../toast/toast.service';
import { WalletService } from '../wallet/wallet.service';

const KEY = 'mb_market';
export const MARKET_FEE = 0.05;
interface MarketState { listings: Listing[]; sales: Sale[]; }

@Injectable({ providedIn: 'root' })
export class MarketService {
  private readonly subject: BehaviorSubject<MarketState>;
  readonly state$;
  private started = false;

  constructor(
    private readonly storage: StorageService,
    private readonly catalog: CatalogService,
    private readonly inventory: InventoryService,
    private readonly wallet: WalletService,
    private readonly toast: ToastService,
    private readonly fx: FxService,
    private readonly zone: NgZone
  ) {
    this.subject = new BehaviorSubject<MarketState>(this.storage.get<MarketState>(KEY) ?? this.seed());
    this.state$ = this.subject.asObservable();
  }

  get state(): MarketState { return this.subject.value; }

  buy(id: string): string | null {
    const l = this.state.listings.find(x => x.id === id);
    if (!l || l.mine || !this.wallet.trySpend(l.price)) { return null; }
    this.inventory.add(l.itemId, 'market');
    this.save({ listings: this.state.listings.filter(x => x !== l), sales: [{ itemId: l.itemId, price: l.price, createdAt: Date.now() }, ...this.state.sales].slice(0, 30) });
    this.fx.win();
    return l.itemId;
  }

  list(entryUid: number, price: number): void {
    const e = this.inventory.get(entryUid);
    if (!e || e.locked) { return; }
    this.inventory.setLock([entryUid], 'market');
    this.save({ ...this.state, listings: [{ id: uid('m'), itemId: e.itemId, seller: 'you', mine: true, uid: entryUid, price: Math.max(1, Math.round(price)), createdAt: Date.now() }, ...this.state.listings] });
  }

  unlist(id: string): void {
    const l = this.state.listings.find(x => x.id === id);
    if (!l) { return; }
    if (l.uid) { this.inventory.setLock([l.uid], null); }
    this.save({ ...this.state, listings: this.state.listings.filter(x => x !== l) });
  }

  /** Background market activity: your listings may sell; new bot listings appear. */
  start(): void {
    if (this.started) { return; }
    this.started = true;
    const loop = (): void => {
      this.zone.run(() => this.tick());
      setTimeout(loop, randInt(7000, 13000));
    };
    this.zone.runOutsideAngular(() => setTimeout(loop, 6000));
  }

  private tick(): void {
    const mine = this.state.listings.filter(l => l.mine && Date.now() - l.createdAt > 6000);
    if (mine.length) {
      const l = pick(mine);
      const ratio = l.price / this.catalog.item(l.itemId).value;
      const chance = ratio <= 1.1 ? 0.55 : ratio <= 1.4 ? 0.22 : 0.04;
      if (Math.random() < chance) {
        if (l.uid) { this.inventory.remove([l.uid]); }
        const got = Math.round(l.price * (1 - MARKET_FEE));
        this.wallet.add(got);
        this.save({ listings: this.state.listings.filter(x => x !== l), sales: [{ itemId: l.itemId, price: l.price, createdAt: Date.now() }, ...this.state.sales].slice(0, 30) });
        this.toast.show('market.sold', { item: this.catalog.name(l.itemId), price: l.price, got });
      }
    }
    if (Math.random() < 0.35) {
      const listings = [...this.state.listings, this.botListing()];
      if (listings.length > 30) { listings.splice(listings.findIndex(x => !x.mine), 1); }
      this.save({ ...this.state, listings });
    }
  }

  private botListing(): Listing {
    let it = pick(ITEMS);
    if (it.value > 400 && Math.random() < 0.6) { it = pick(ITEMS); }
    return { id: uid('l'), itemId: it.id, seller: pick(BOT_NAMES), price: Math.max(5, Math.round(it.value * rand(0.82, 1.35))), createdAt: Date.now() - randInt(1, 600) * 60000 };
  }

  private seed(): MarketState {
    const s: MarketState = {
      listings: Array.from({ length: 18 }, () => this.botListing()),
      sales: Array.from({ length: 8 }, () => { const l = this.botListing(); return { itemId: l.itemId, price: l.price, createdAt: Date.now() - randInt(1, 300) * 60000 }; })
    };
    this.storage.set(KEY, s);
    return s;
  }

  private save(s: MarketState): void {
    this.storage.set(KEY, s);
    this.subject.next(s);
  }
}
