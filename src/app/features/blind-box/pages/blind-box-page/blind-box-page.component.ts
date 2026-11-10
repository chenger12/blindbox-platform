import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { BlindBoxSlot } from '../../../../models/game/game-state.model';
import { BlindBoxService } from '../../../../services/blind-box/blind-box.service';
import { ApiService } from '../../../../services/api/api.service';
import { FxService } from '../../../../services/fx/fx.service';
import { ResultService } from '../../../../services/result/result.service';
import { ThemeService } from '../../../../services/theme/theme.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { WalletService } from '../../../../services/wallet/wallet.service';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { BLIND_BOX_PRICE, BLIND_BOX_SECRET } from '../../../../utils/catalog.data';
import { BLIND_BOX_HINT_PRICE, BLIND_BOX_XRAY_PRICE, blindBoxCaseCost } from '../../../../utils/game-rules.util';
import { pick, randInt, sleep } from '../../../../utils/random.util';

@Component({
  selector: 'app-blind-box-page',
  templateUrl: './blind-box-page.component.html',
  styleUrl: './blind-box-page.component.scss'
})
export class BlindBoxPageComponent implements OnInit, OnDestroy {
  readonly price = BLIND_BOX_PRICE;
  readonly hintPrice = BLIND_BOX_HINT_PRICE;
  readonly xrayPrice = BLIND_BOX_XRAY_PRICE;
  readonly secret = BLIND_BOX_SECRET;
  busy = false;
  shaking = -1;
  unbox: { color: string; open: boolean } | null = null;
  private unboxResolve: (() => void) | null = null;
  private botTimer?: ReturnType<typeof setTimeout>;

  constructor(
    readonly bb: BlindBoxService,
    readonly wallet: WalletService,
    private readonly api: ApiService,
    private readonly catalog: CatalogService,
    private readonly theme: ThemeService,
    private readonly fx: FxService,
    private readonly toast: ToastService,
    private readonly results: ResultService,
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
    void this.bb.select(i);
    this.fx.pop();
    this.fx.vibrate(15);
  }

  /** Uses a hint card, or pays the hint price — the API decides which style to rule out. */
  async hint(): Promise<void> {
    if (await this.bb.hint(this.bb.state.selected)) { this.fx.tear(); }
  }

  async xray(): Promise<void> {
    const id = await this.bb.xray(this.bb.state.selected);
    if (!id) { return; }
    if (id === BLIND_BOX_SECRET) { this.fx.big(); this.fx.confetti(120, undefined, undefined, 'blindBox'); } else { this.fx.win(); }
  }

  async shake(): Promise<void> {
    const i = this.bb.state.selected;
    this.shaking = i;
    this.fx.whir();
    this.fx.vibrate([30, 40, 30, 40, 30]);
    await Promise.all([this.bb.shake(i), sleep(800)]);
    this.shaking = -1;
  }

  another(): void {
    const s = this.bb.state;
    const open = s.slots.map((_, i) => i).filter(i => !s.slots[i].sold && i !== s.selected);
    if (!open.length) { this.toast.show('blindBox.noOther'); return; }
    void this.bb.select(pick(open));
    this.fx.pop();
  }

  async newCase(): Promise<void> {
    await this.bb.newCase();
    this.fx.whir();
    this.toast.show('blindBox.newCaseToast', { n: this.bb.state.caseNo });
  }

  caseCost(): number {
    return blindBoxCaseCost(this.bb.remaining());
  }

  async buy(all: boolean): Promise<void> {
    if (this.busy) { return; }
    const s = this.bb.state;
    const single = !all && s.selected >= 0;
    if (!all && !single) { return; }
    this.busy = true;
    const color = single ? this.color(s.selected) : '';
    const res = await this.bb.buy(single ? { index: s.selected } : { all: true });
    if (!res) { this.busy = false; return; }
    if (single) { await this.playUnbox(color); }
    this.api.commit();
    const left = this.bb.remaining();
    const r = await this.results.show({ items: res.items, againLabelKey: left ? 'blindBox.pickAnother' : undefined });
    this.busy = false;
    if (!left) { await this.bb.newCase(); this.toast.show('blindBox.soldOutNew'); }
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
        if (!this.busy) { void this.bb.tick(); }
      });
      this.scheduleBot();
    }, randInt(6000, 12000));
  }
}
