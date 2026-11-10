import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../../services/api/api.service';
import { FxService } from '../../../../services/fx/fx.service';
import { I18nService } from '../../../../services/i18n/i18n.service';
import { ResultService } from '../../../../services/result/result.service';
import { ThemeService } from '../../../../services/theme/theme.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { WHEEL_SEGMENTS, WHEEL_SPIN_PRICE, WheelService } from '../../../../services/wheel/wheel.service';
import { rand } from '../../../../utils/random.util';

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
    private readonly api: ApiService,
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
    return this.wheel.freeToday$.value;
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

  /** The wheel API picks the segment and pays the reward; the canvas only spins to it. */
  async spin(respin = false): Promise<void> {
    if (this.spinning) { return; }
    this.spinning = true;
    const res = await this.wheel.spin(respin);
    if (!res) { this.spinning = false; return; }
    const idx = res.index;
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
    this.api.commit();
    this.wheel.show(res);
    const r = this.segments[idx].reward;
    if (r.coins) {
      this.fx.confetti(r.big ? 220 : 60, undefined, undefined, 'wheel');
      if (r.big) { this.fx.big(); this.toast.show('wheel.jackpot'); } else { this.fx.win(); this.toast.show('wheel.coins', { n: r.coins }); }
    }
    if (r.hint) { this.fx.win(); this.toast.show('wheel.hint'); }
    if (r.ticket) { this.fx.win(); this.toast.show('wheel.ticket'); }
    if (res.item) { await this.results.show({ items: [res.item] }); }
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
