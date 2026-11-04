import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WeightedBox } from '../../../../models/catalog/catalog.model';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { DailyService } from '../../../../services/daily/daily.service';
import { FeedService } from '../../../../services/feed/feed.service';
import { InventoryService } from '../../../../services/inventory/inventory.service';
import { ResultService } from '../../../../services/result/result.service';
import { WalletService } from '../../../../services/wallet/wallet.service';
import { ReelComponent } from '../../../../shared/components/reel/reel.component';
import { percent, sleep } from '../../../../utils/random.util';

@Component({
  selector: 'app-box-detail-page',
  templateUrl: './box-detail-page.component.html',
  styleUrl: './box-detail-page.component.scss'
})
export class BoxDetailPageComponent implements OnInit {
  @ViewChildren(ReelComponent) reels!: QueryList<ReelComponent>;
  box!: WeightedBox;
  odds: Array<{ itemId: string; odds: string }> = [];
  winners: Array<string | null> = [null];
  idle = true;
  busy = false;
  free = false;
  ev = 0;
  readonly counts = [1, 2, 3, 4];
  readonly form: FormGroup<{ count: FormControl<number>; quick: FormControl<boolean> }>;

  constructor(
    fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    readonly catalog: CatalogService,
    private readonly wallet: WalletService,
    private readonly inventory: InventoryService,
    private readonly daily: DailyService,
    private readonly feed: FeedService,
    private readonly results: ResultService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.form = fb.nonNullable.group({ count: [1], quick: [false] });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      const box = this.catalog.box(p.get('id') ?? '');
      if (!box) { void this.router.navigate(['/boxes']); return; }
      this.box = box;
      this.free = this.daily.consumeFreeOpen(box.id);
      this.ev = this.catalog.expectedValue(box);
      this.odds = [...box.weights].sort((a, b) => this.catalog.item(b.itemId).value - this.catalog.item(a.itemId).value)
        .map(w => ({ itemId: w.itemId, odds: percent(w.weight / box.totalWeight) }));
      this.winners = [null];
      this.idle = true;
    });
  }

  get cost(): number {
    return this.free ? 0 : this.box.price * this.form.controls.count.value;
  }

  setCount(n: number): void {
    if (!this.busy) { this.form.controls.count.setValue(n); }
  }

  async open(demo: boolean): Promise<void> {
    if (this.busy) { return; }
    const n = demo || this.free ? 1 : this.form.controls.count.value;
    const cost = demo || this.free ? 0 : this.box.price * n;
    if (cost && !this.wallet.trySpend(cost)) { return; }
    this.busy = true;
    const wins = Array.from({ length: n }, () => this.catalog.roll(this.box).id);
    this.idle = false;
    this.winners = wins;
    this.cdr.detectChanges();
    await sleep(80);
    const quick = this.form.controls.quick.value;
    await Promise.all(this.reels.map((r, i) => r.spin(quick ? 1000 : 4600 + i * 420, i === 0)));
    let uids: number[] = [];
    if (!demo) {
      uids = wins.map(id => this.inventory.add(id, 'box'));
      this.wallet.gainXp(cost);
      this.daily.track('opened', n);
      wins.forEach(id => this.feed.mine(id, 'box:' + this.box.id));
      this.free = false;
    }
    this.busy = false;
    const action = await this.results.show({
      items: wins.map((itemId, i) => ({ itemId, uid: uids[i] })), trial: demo, againLabelKey: 'boxes.openAgain'
    });
    if (action === 'again' || action === 'real') { void this.open(false); }
  }
}
