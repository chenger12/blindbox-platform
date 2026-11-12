import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WeightedBox } from '../../../../models/catalog/catalog.model';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { BoxOpenResult } from '../../../../models/api/api.model';
import { ApiService } from '../../../../services/api/api.service';
import { DailyService } from '../../../../services/daily/daily.service';
import { FeedService } from '../../../../services/feed/feed.service';
import { ResultService } from '../../../../services/result/result.service';
import { ThemeService } from '../../../../services/theme/theme.service';
import { ReelComponent } from '../../../../shared/components/reel/reel.component';
import { weightedBoxAt } from '../../../../utils/game-rules.util';
import { configOdds } from '../../../../utils/odds-defaults.util';
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
    private readonly theme: ThemeService,
    private readonly api: ApiService,
    private readonly daily: DailyService,
    private readonly feed: FeedService,
    private readonly results: ResultService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.form = fb.nonNullable.group({ count: [1], quick: [false] });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      const id = p.get('id') ?? '';
      // Re-weight the box at the back-office return rate so the odds shown match what the server rolls.
      const box = weightedBoxAt(id, configOdds(this.theme.config, 'boxes').returnRate) ?? this.catalog.box(id);
      if (!box) { void this.router.navigate(['/boxes']); return; }
      this.box = box;
      this.free = box.id === 'starter' && this.daily.freeBoxReady;
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

  /** The box API rolls the prizes (and charges); the reels only play the result. */
  async open(demo: boolean): Promise<void> {
    if (this.busy) { return; }
    const n = demo || this.free ? 1 : this.form.controls.count.value;
    this.busy = true;
    const r = demo
      ? await this.api.game<BoxOpenResult>('boxes', 'demo', { boxId: this.box.id })
      : await this.api.game<BoxOpenResult>('boxes', 'open', { boxId: this.box.id, count: n, free: this.free }, { hold: true });
    if (!r) { this.busy = false; return; }
    const wins = r.items.map(x => x.itemId);
    this.idle = false;
    this.winners = wins;
    this.cdr.detectChanges();
    await sleep(80);
    const quick = this.form.controls.quick.value;
    await Promise.all(this.reels.map((reel, i) => reel.spin(quick ? 1000 : 4600 + i * 420, i === 0)));
    if (!demo) {
      this.api.commit();
      wins.forEach(id => this.feed.mine(id, 'box:' + this.box.id));
      this.free = false;
    }
    this.busy = false;
    const action = await this.results.show({ items: r.items, trial: demo, againLabelKey: 'boxes.openAgain' });
    if (action === 'again' || action === 'real') { void this.open(false); }
  }
}
