import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { BlindBoxSlot } from '../../../../models/game/game-state.model';
import { BlindBoxService } from '../../../../services/blind-box/blind-box.service';
import { DailyService } from '../../../../services/daily/daily.service';
import { FxService } from '../../../../services/fx/fx.service';
import { InventoryService } from '../../../../services/inventory/inventory.service';
import { ResultService } from '../../../../services/result/result.service';
import { ThemeService } from '../../../../services/theme/theme.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { WalletService } from '../../../../services/wallet/wallet.service';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { BLIND_BOX_PRICE, BLIND_BOX_SECRET } from '../../../../utils/catalog.data';
import { pick, randInt, sleep } from '../../../../utils/random.util';

const HINT_PRICE = 10;
const XRAY_PRICE = 30;

@Component({
  selector: 'app-blind-box-page',
  templateUrl: './blind-box-page.component.html',
  styleUrl: './blind-box-page.component.scss'
})
export class BlindBoxPageComponent implements OnInit, OnDestroy {
  readonly price = BLIND_BOX_PRICE;
  readonly hintPrice = HINT_PRICE;
  readonly xrayPrice = XRAY_PRICE;
  readonly secret = BLIND_BOX_SECRET;
  busy = false;
  shaking = -1;
  unbox: { color: string; open: boolean } | null = null;
  private unboxResolve: (() => void) | null = null;
  private botTimer?: ReturnType<typeof setTimeout>;

  constructor(
    readonly bb: BlindBoxService,
    readonly wallet: WalletService,
    private readonly inventory: InventoryService,
    private readonly catalog: CatalogService,
    private readonly theme: ThemeService,
    private readonly fx: FxService,
    private readonly toast: ToastService,
    private readonly results: ResultService,
    private readonly daily: DailyService,
    private readonly zone: NgZone
  ) {}

  get theme$() {
    return this.theme.config$;
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => this.scheduleBot());
  }

  ngOnDestroy(): void {
    clearTimeout(this.botTimer);
  }

  color(i: number): string {
    const c = this.theme.palette('blindBox').boxes;
    return c[i % c.length];
  }

  get selected(): BlindBoxSlot | null {
    const s = this.bb.state;
    return s.selected >= 0 && !s.slots[s.selected]?.sold ? s.slots[s.selected] : null;
  }

  styleClass(itemId: string): string {
    const s = this.bb.state;
    if (s.slots.some(x => x.sold && x.itemId === itemId)) { return 'sold'; }
    if (!this.selected) { return ''; }
    const pos = this.bb.possible(s.selected);
    if (!pos.includes(itemId)) { return 'ex'; }
    return pos.length === 1 ? 'only' : '';
  }

  tapSlot(i: number, slot: BlindBoxSlot): void {
    if (slot.sold) {
      this.toast.show(slot.sold === 1 ? 'blindBox.takenByYou' : 'blindBox.takenBy', { n: i + 1, user: slot.by ?? '', item: this.catalog.name(slot.itemId) });
      return;
    }
    this.bb.select(i);
    this.fx.pop();
    this.fx.vibrate(15);
  }

  hint(): void {
    const i = this.bb.state.selected;
    if (!this.wallet.state.hintCards) {
      if (!this.wallet.trySpend(HINT_PRICE)) { return; }
      this.wallet.useCard('hintCards', 1);
    }
    if (this.bb.hint(i) === null) { this.toast.show('blindBox.onlyOne'); return; }
    this.wallet.useCard('hintCards');
    this.fx.tear();
  }

  xray(): void {
    const i = this.bb.state.selected;
    if (!this.wallet.state.xrayCards) {
      if (!this.wallet.trySpend(XRAY_PRICE)) { return; }
      this.wallet.useCard('xrayCards', 1);
    }
    this.wallet.useCard('xrayCards');
    const id = this.bb.xray(i);
    if (id === BLIND_BOX_SECRET) { this.fx.big(); this.fx.confetti(120, undefined, undefined, 'blindBox'); } else { this.fx.win(); }
  }

  async shake(): Promise<void> {
    const i = this.bb.state.selected;
    this.shaking = i;
    this.fx.whir();
    this.fx.vibrate([30, 40, 30, 40, 30]);
    await sleep(800);
    this.shaking = -1;
    this.bb.shake(i);
  }

  another(): void {
    const s = this.bb.state;
    const open = s.slots.map((_, i) => i).filter(i => !s.slots[i].sold && i !== s.selected);
    if (!open.length) { this.toast.show('blindBox.noOther'); return; }
    this.bb.select(pick(open));
    this.fx.pop();
  }

  newCase(): void {
    this.bb.newCase();
    this.fx.whir();
    this.toast.show('blindBox.newCaseToast', { n: this.bb.state.caseNo });
  }

  caseCost(): number {
    return Math.floor(this.bb.remaining() * BLIND_BOX_PRICE * 0.9);
  }

  async buy(all: boolean): Promise<void> {
    if (this.busy) { return; }
    const s = this.bb.state;
    const idx = all ? s.slots.map((_, i) => i).filter(i => !s.slots[i].sold) : [s.selected];
    if (!idx.length || idx[0] < 0) { return; }
    const cost = idx.length > 1 ? Math.floor(idx.length * BLIND_BOX_PRICE * 0.9) : BLIND_BOX_PRICE;
    if (!this.wallet.trySpend(cost)) { return; }
    this.busy = true;
    if (idx.length === 1) { await this.playUnbox(this.color(idx[0])); }
    const got = this.bb.buy(idx);
    const uids = got.map(id => this.inventory.add(id, 'blindBox', id === BLIND_BOX_SECRET ? 'SECRET' : undefined));
    this.wallet.gainXp(cost);
    this.daily.track('games');
    if (got.includes(BLIND_BOX_SECRET)) { this.daily.track('wins'); }
    const left = this.bb.remaining();
    const r = await this.results.show({ items: got.map((itemId, i) => ({ itemId, uid: uids[i], tier: itemId === BLIND_BOX_SECRET ? 'SECRET' : undefined })), againLabelKey: left ? 'blindBox.pickAnother' : undefined });
    this.busy = false;
    if (!left) { this.bb.newCase(); this.toast.show('blindBox.soldOutNew'); }
    if (r === 'again') { this.another(); }
  }

  tapUnbox(): void {
    this.unboxResolve?.();
  }

  private playUnbox(color: string): Promise<void> {
    return new Promise(res => {
      this.unbox = { color, open: false };
      this.unboxResolve = async () => {
        this.unboxResolve = null;
        if (this.unbox) { this.unbox.open = true; }
        this.fx.tear();
        this.fx.vibrate(40);
        await sleep(1100);
        this.unbox = null;
        res();
      };
    });
  }

  private scheduleBot(): void {
    this.botTimer = setTimeout(() => {
      this.zone.run(() => {
        if (!this.busy && Math.random() < 0.5) { this.bb.botBuy(); }
      });
      this.scheduleBot();
    }, randInt(6000, 12000));
  }
}
