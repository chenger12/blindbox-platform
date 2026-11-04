import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { DailyService } from '../../../../services/daily/daily.service';
import { FxService } from '../../../../services/fx/fx.service';
import { I18nService } from '../../../../services/i18n/i18n.service';
import { InventoryService } from '../../../../services/inventory/inventory.service';
import { ResultService } from '../../../../services/result/result.service';
import { ThemeService } from '../../../../services/theme/theme.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { WalletService } from '../../../../services/wallet/wallet.service';
import { WHEEL_SEGMENTS, WHEEL_SPIN_PRICE, WheelService } from '../../../../services/wheel/wheel.service';
import { KUJI_PRIZES } from '../../../../utils/catalog.data';
import { pick, rand } from '../../../../utils/random.util';

const R = 140;

@Component({
  selector: 'app-wheel-page',
  templateUrl: './wheel-page.component.html',
  styleUrl: './wheel-page.component.scss'
})
export class WheelPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  readonly segments = WHEEL_SEGMENTS;
  readonly price = WHEEL_SPIN_PRICE;
  readonly lights = Array.from({ length: 20 }, (_, i) => i);
  spinning = false;
  private rot = 0;
  private sub?: Subscription;

  constructor(
    readonly wheel: WheelService,
    readonly daily: DailyService,
    private readonly wallet: WalletService,
    private readonly inventory: InventoryService,
    private readonly theme: ThemeService,
    private readonly fx: FxService,
    private readonly results: ResultService,
    private readonly toast: ToastService,
    private readonly i18n: I18nService,
    private readonly renderer: Renderer2,
    private readonly el: ElementRef<HTMLElement>,
    private readonly zone: NgZone
  ) {}

  get freeToday(): boolean {
    return !this.daily.state.wheelSpun;
  }

  ngAfterViewInit(): void {
    this.sub = this.i18n.lang$.subscribe(() => this.draw());
    void document.fonts?.ready.then(() => this.draw());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  label(key: string): string {
    return this.i18n.t(key);
  }

  async spin(free = false): Promise<void> {
    if (this.spinning) { return; }
    if (!free && !this.daily.useFreeSpin() && !this.wallet.trySpend(WHEEL_SPIN_PRICE)) { return; }
    this.spinning = true;
    const idx = this.wheel.pickIndex();
    const seg = 360 / this.segments.length;
    const target = -(idx * seg) + rand(-seg * 0.35, seg * 0.35);
    const start = this.rot;
    const cur = ((start % 360) + 360) % 360;
    const end = start + 360 * 6 + ((((target - cur) % 360) + 360) % 360);
    const t0 = performance.now();
    let last = Math.floor((start + seg / 2) / seg);
    await new Promise<void>(res => this.zone.runOutsideAngular(() => {
      const f = (t: number): void => {
        const k = Math.min(1, (t - t0) / 4800);
        this.rot = start + (end - start) * (1 - Math.pow(1 - k, 4));
        this.renderer.setStyle(this.canvas.nativeElement, 'transform', `rotate(${this.rot}deg)`);
        const sg = Math.floor((this.rot + seg / 2) / seg);
        if (sg !== last) { last = sg; this.fx.tick(); }
        if (k < 1) { requestAnimationFrame(f); } else { this.zone.run(() => res()); }
      };
      requestAnimationFrame(f);
    }));
    this.spinning = false;
    this.wheel.record(idx);
    const r = this.segments[idx].reward;
    if (r.coins) {
      this.wallet.add(r.coins);
      this.fx.confetti(r.big ? 220 : 60, undefined, undefined, 'wheel');
      if (r.big) { this.fx.big(); this.toast.show('wheel.jackpot'); } else { this.fx.win(); this.toast.show('wheel.coins', { n: r.coins }); }
    }
    if (r.hint) { this.wallet.useCard('hintCards', 1); this.fx.win(); this.toast.show('wheel.hint'); }
    if (r.ticket) { this.wallet.useCard('gachaTickets', 1); this.fx.win(); this.toast.show('wheel.ticket'); }
    if (r.item) {
      const itemId = pick(KUJI_PRIZES.filter(p => p.tier === 'D')).itemId;
      const uid = this.inventory.add(itemId, 'wheel');
      await this.results.show({ items: [{ itemId, uid }] });
    }
    if (r.again) { this.toast.show('wheel.respin'); setTimeout(() => void this.spin(true), 700); }
  }

  private draw(): void {
    const cv = this.canvas.nativeElement;
    const d = Math.min(2, devicePixelRatio || 1);
    cv.width = R * 2 * d;
    cv.height = R * 2 * d;
    const x = cv.getContext('2d');
    if (!x) { return; }
    const pal = this.theme.palette('wheel');
    const font = getComputedStyle(this.el.nativeElement).getPropertyValue('--font-display') || 'sans-serif';
    x.setTransform(d, 0, 0, d, 0, 0);
    x.translate(R, R);
    const seg = Math.PI * 2 / this.segments.length;
    this.segments.forEach((s, i) => {
      const [bg, fg] = pal.wheel[i % pal.wheel.length];
      const a0 = i * seg - Math.PI / 2 - seg / 2;
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, R, a0, a0 + seg); x.closePath();
      x.fillStyle = bg; x.fill(); x.strokeStyle = pal.wheelStroke; x.lineWidth = 2; x.stroke();
      x.save(); x.rotate(a0 + seg / 2 + Math.PI / 2); x.textAlign = 'center'; x.fillStyle = fg;
      x.font = `bold 19px ${font}`; x.fillText(this.i18n.t(s.labelKey), 0, -R + 44);
      x.font = `bold 11px ${font}`; x.fillText(this.i18n.t(s.subKey), 0, -R + 62);
      x.restore();
    });
  }
}
