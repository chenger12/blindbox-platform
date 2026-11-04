import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { KujiTier } from '../../../../models/catalog/catalog.model';
import { DailyService } from '../../../../services/daily/daily.service';
import { DialogService } from '../../../../services/dialog/dialog.service';
import { FeedService } from '../../../../services/feed/feed.service';
import { I18nService } from '../../../../services/i18n/i18n.service';
import { InventoryService } from '../../../../services/inventory/inventory.service';
import { KUJI_TIERS, KujiPull, KujiService } from '../../../../services/kuji/kuji.service';
import { ResultService } from '../../../../services/result/result.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { WalletService } from '../../../../services/wallet/wallet.service';
import { OddsDialogComponent, OddsDialogData } from '../../../../shared/components/odds-dialog/odds-dialog.component';
import { KUJI_LAST_ONE, KUJI_PRICE, KUJI_PRIZES, KUJI_TICKETS } from '../../../../utils/catalog.data';
import { randInt } from '../../../../utils/random.util';
import { KujiBoxPickerComponent } from '../../components/kuji-box-picker/kuji-box-picker.component';
import { ShowResult } from '../../components/kuji-show/kuji-show.component';

type DrawCount = 0 | 1 | 5 | 10 | 'all';

@Component({
  selector: 'app-kuji-page',
  templateUrl: './kuji-page.component.html',
  styleUrl: './kuji-page.component.scss'
})
export class KujiPageComponent implements OnInit, OnDestroy {
  readonly prizes = KUJI_PRIZES;
  readonly tiers = KUJI_TIERS;
  readonly lastOne = KUJI_LAST_ONE;
  readonly total = KUJI_TICKETS;
  readonly price = KUJI_PRICE;
  readonly draws: DrawCount[] = [1, 5, 10, 'all'];
  tab: 'prizes' | 'log' = 'prizes';
  busy = false;
  flashId: string | null = null;
  lockText = '';
  queue = 0;
  show: { pulls: KujiPull[]; trial: boolean; again: string | null; resolve: (r: ShowResult) => void } | null = null;
  private botTimer?: ReturnType<typeof setTimeout>;
  private lockTimer?: ReturnType<typeof setInterval>;

  constructor(
    readonly kuji: KujiService,
    private readonly wallet: WalletService,
    private readonly inventory: InventoryService,
    private readonly daily: DailyService,
    private readonly feed: FeedService,
    private readonly results: ResultService,
    private readonly dialogs: DialogService,
    private readonly toast: ToastService,
    private readonly i18n: I18nService,
    private readonly zone: NgZone
  ) {}

  ngOnInit(): void {
    this.queue = this.kuji.remaining() < 15 ? randInt(1, 4) : 0;
    this.lockTimer = setInterval(() => this.updateLock(), 1000);
    this.updateLock();
    this.zone.runOutsideAngular(() => this.scheduleBot());
  }

  ngOnDestroy(): void {
    clearTimeout(this.botTimer);
    clearInterval(this.lockTimer);
  }

  left(itemId: string): number {
    return this.kuji.box.remaining[itemId] ?? 0;
  }

  odds(itemId: string): string {
    const rem = this.kuji.remaining();
    return rem ? (this.left(itemId) / rem * 100).toFixed(2) + '%' : '0%';
  }

  quantity(itemId: string): number {
    return KUJI_PRIZES.find(p => p.itemId === itemId)?.quantity ?? 0;
  }

  cost(d: DrawCount): number {
    return d === 0 ? 0 : this.kuji.cost(d);
  }

  disabled(d: DrawCount): boolean {
    const rem = this.kuji.remaining();
    return !rem || this.busy || (typeof d === 'number' && d > rem);
  }

  pickBox(): void {
    this.dialogs.open<KujiBoxPickerComponent, unknown, number>(KujiBoxPickerComponent).afterClosed().subscribe(i => {
      if (i === undefined) { return; }
      this.kuji.select(i);
      this.queue = this.kuji.remaining() < 15 ? randInt(1, 4) : 0;
      this.toast.show('kuji.switched', { n: i + 1 });
    });
  }

  openOdds(): void {
    const rem = this.kuji.remaining();
    const data: OddsDialogData = {
      headKeys: ['kuji.oddsTier', 'kuji.oddsLeft', 'kuji.oddsNow'],
      rows: [
        ...this.tiers.map(t => { const x = this.kuji.tierLeft(t); return { tier: t, left: `${x.left}/${x.total}`, odds: rem ? (x.left / rem * 100).toFixed(2) + '%' : '0%' }; }),
        { tier: 'LAST', left: '', odds: this.i18n.t('kuji.lastGuaranteed') }
      ],
      noteKeys: ['kuji.oddsNote1', 'kuji.oddsNote2']
    };
    this.dialogs.open(OddsDialogComponent, { title: this.i18n.t('kuji.oddsTitle', { n: this.kuji.box.no }), data });
  }

  async draw(d: DrawCount): Promise<void> {
    if (this.busy) { return; }
    const rem = this.kuji.remaining();
    if (!rem) { this.toast.show('kuji.soldOutToast'); return; }
    const trial = d === 0;
    const cost = this.cost(d);
    if (!trial && !this.wallet.trySpend(cost)) { return; }
    this.busy = true;
    const { pulls } = this.kuji.pull(trial ? 1 : d, trial);
    const uids: number[] = [];
    if (!trial) {
      pulls.forEach(p => { uids.push(this.inventory.add(p.itemId, 'kuji', p.tier)); this.feed.mine(p.itemId, 'kuji'); });
      this.wallet.gainXp(cost);
      this.daily.track('games');
      if (pulls.some(p => p.tier === 'A' || p.tier === 'B' || p.tier === 'LAST')) { this.daily.track('wins'); }
    }
    const again = trial || !this.kuji.remaining() ? null : 'kuji.pullAgain';
    let r: ShowResult | 'keep' | 'sell' | 'real' | 'close' = await new Promise<ShowResult>(resolve => this.show = { pulls, trial, again, resolve });
    this.show = null;
    if (r === 'skip' || r === 'more') {
      r = await this.results.show({ items: pulls.map((p, i) => ({ itemId: p.itemId, tier: p.tier, uid: uids[i] })), trial, againLabelKey: again ?? undefined });
    }
    this.busy = false;
    if (r === 'again' || r === 'real' || (trial && r === 'ok')) { void this.draw(d === 'all' || d === 0 ? 1 : d); }
  }

  onShowDone(r: ShowResult): void {
    this.show?.resolve(r);
  }

  private updateLock(): void {
    const s = this.kuji.state;
    if (this.kuji.lockActive) {
      const sec = Math.ceil((s.lockUntil - Date.now()) / 1000);
      this.lockText = this.i18n.t('kuji.locked', { t: `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}` });
    } else {
      this.lockText = this.queue ? this.i18n.t('kuji.queue', { n: this.queue }) : this.i18n.t('kuji.noQueue');
    }
  }

  private scheduleBot(): void {
    this.botTimer = setTimeout(() => {
      this.zone.run(() => {
        if (!this.busy) {
          const r = this.kuji.botPull();
          if (r?.current) {
            this.flashId = r.pull.itemId;
            setTimeout(() => this.flashId = null, 1200);
          }
        }
      });
      this.scheduleBot();
    }, randInt(3500, 7000));
  }

  tierOf(itemId: string): KujiTier {
    return this.kuji.tierOf(itemId);
  }
}
