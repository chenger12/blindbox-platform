import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { RarityKey } from '../../../../models/catalog/catalog.model';
import { Listing, Sale } from '../../../../models/market/market.model';
import { CatalogService, RARITIES } from '../../../../services/catalog/catalog.service';
import { DialogService } from '../../../../services/dialog/dialog.service';
import { GameRegistryService } from '../../../../services/game-registry/game-registry.service';
import { MarketService } from '../../../../services/market/market.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { SellDialogComponent, SellDialogData } from '../../../../shared/components/sell-dialog/sell-dialog.component';

type Sort = 'new' | 'low' | 'high';

@Component({
  selector: 'app-market-page',
  templateUrl: './market-page.component.html',
  styleUrl: './market-page.component.scss'
})
export class MarketPageComponent {
  readonly rarities: Array<'all' | RarityKey> = ['all', ...RARITIES.map(r => r.key)];
  readonly form: FormGroup<{ rarity: FormControl<'all' | RarityKey>; sort: FormControl<Sort> }>;
  readonly view$: Observable<{ listings: Listing[]; sales: Sale[] }>;

  constructor(
    fb: FormBuilder,
    readonly market: MarketService,
    readonly registry: GameRegistryService,
    readonly catalog: CatalogService,
    private readonly dialogs: DialogService,
    private readonly toast: ToastService
  ) {
    this.form = fb.nonNullable.group({ rarity: ['all' as 'all' | RarityKey], sort: ['new' as Sort] });
    this.view$ = combineLatest([market.state$, this.form.valueChanges.pipe(startWith(this.form.value))]).pipe(map(([s]) => {
      const { rarity, sort } = this.form.getRawValue();
      const listings = s.listings
        .filter(l => rarity === 'all' || catalog.rarity(catalog.item(l.itemId).value) === rarity)
        .sort(sort === 'low' ? (a, b) => a.price - b.price : sort === 'high' ? (a, b) => b.price - a.price : (a, b) => b.createdAt - a.createdAt);
      return { listings, sales: s.sales.slice(0, 10) };
    }));
  }

  delta(l: Listing): number {
    const v = this.catalog.item(l.itemId).value;
    return Math.round(((l.price - v) / v) * 100);
  }

  buy(l: Listing): void {
    const got = this.market.buy(l.id);
    if (got) { this.toast.show('market.boughtToast', { item: this.catalog.name(got) }); }
  }

  sell(): void {
    this.dialogs.open<SellDialogComponent, SellDialogData>(SellDialogComponent, { data: {} });
  }
}
