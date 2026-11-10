import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { GachaEntry } from '../../../../models/catalog/catalog.model';
import { ApiService } from '../../../../services/api/api.service';
import { DialogService } from '../../../../services/dialog/dialog.service';
import { FeedService } from '../../../../services/feed/feed.service';
import { FxService } from '../../../../services/fx/fx.service';
import { GachaService } from '../../../../services/gacha/gacha.service';
import { I18nService } from '../../../../services/i18n/i18n.service';
import { InventoryService } from '../../../../services/inventory/inventory.service';
import { ResultService } from '../../../../services/result/result.service';
import { ThemeService } from '../../../../services/theme/theme.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { WalletService } from '../../../../services/wallet/wallet.service';
import { OddsDialogComponent, OddsDialogData } from '../../../../shared/components/odds-dialog/odds-dialog.component';
import { GACHA_PITY, GACHA_POOL, GACHA_PRICE, GACHA_PRICE_5 } from '../../../../utils/catalog.data';
import { pick, rand, sleep } from '../../../../utils/random.util';

interface Capsule { x: number; y: number; vx: number; vy: number; r: number; c: string; a: number; }
interface TrayCap { entry: GachaEntry; color: string; kind: '' | 'gold' | 'holo'; opened: boolean; wob: boolean; }
const W = 268;
const H = 238;

@Component({
  selector: 'app-gacha-page',
  templateUrl: './gacha-page.component.html',
  styleUrl: './gacha-page.component.scss'
})
export class GachaPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  readonly pool = GACHA_POOL;
  readonly pityMax = GACHA_PITY;
  readonly price = GACHA_PRICE;
  readonly price5 = GACHA_PRICE_5;
  tray: TrayCap[] = [];
  knob = 0;
  busy = false;
  private caps: Capsule[] = [];
  private ctx!: CanvasRenderingContext2D;
  private raf = 0;
  private alive = true;
  private trial = false;
  private count = 1;
  private uids: number[] = [];

  constructor(
    readonly gacha: GachaService,
    readonly wallet: WalletService,
    readonly inventory: InventoryService,
    private readonly theme: ThemeService,
    private readonly fx: FxService,
    private readonly results: ResultService,
    private readonly dialogs: DialogService,
    private readonly toast: ToastService,
    private readonly api: ApiService,
    private readonly feed: FeedService,
    private readonly i18n: I18nService,
    private readonly zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    const d = Math.min(2, devicePixelRatio || 1);
    const cv = this.canvas.nativeElement;
    cv.width = W * d;
    cv.height = H * d;
    this.ctx = cv.getContext('2d') as CanvasRenderingContext2D;
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
    for (let i = 0; i < 30; i++) { this.addCap(); }
    this.zone.runOutsideAngular(() => this.loop());
  }

  ngOnDestroy(): void {
    this.alive = false;
    cancelAnimationFrame(this.raf);
  }

  owned(itemId: string): boolean {
    return this.inventory.entries.some(e => e.itemId === itemId && e.source === 'gacha');
  }

  openOdds(): void {
    const groups: Array<GachaEntry['tier']> = ['N', 'R', 'SR', 'SECRET'];
    const data: OddsDialogData = {
      headKeys: ['gacha.oddsRarity', 'gacha.oddsStyles', 'gacha.oddsChance'],
      rows: groups.map(t => { const ps = GACHA_POOL.filter(p => p.tier === t); return { tier: t, left: String(ps.length), odds: ps.reduce((a, p) => a + p.weight, 0).toFixed(1) + '%' }; }),
      noteKeys: ['gacha.oddsNote'], noteParams: { n: GACHA_PITY - 1, m: GACHA_PITY }
    };
    this.dialogs.open(OddsDialogComponent, { title: this.i18n.t('gacha.oddsTitle'), data });
  }

  /** The gacha API rolls every capsule (and charges); the machine then drops them one by one. */
  async spin(n: 1 | 5, trial: boolean): Promise<void> {
    if (this.busy) { return; }
    this.busy = true;
    const r = await this.gacha.spin(n, trial);
    if (!r) { this.busy = false; return; }
    if (r.ticketUsed) { this.toast.show('gacha.usedTicket'); }
    this.trial = trial;
    this.count = n;
    this.uids = r.uids;
    this.tray = [];
    for (const entry of r.entries) {
      await this.turnKnob();
      let low = 0;
      this.caps.forEach((c, j) => { if (c.y > this.caps[low].y) { low = j; } });
      const cap = this.caps.splice(low, 1)[0];
      setTimeout(() => this.addCap(), 1500);
      const kind = entry.tier === 'SECRET' ? 'holo' : entry.tier === 'SR' ? 'gold' : '';
      this.tray.push({ entry, color: cap.c, kind, opened: false, wob: false });
      this.fx.drop();
      if (kind) { this.fx.suspense(); this.fx.vibrate([30, 30, 30]); }
    }
  }

  async open(t: TrayCap, el?: HTMLElement): Promise<void> {
    if (t.opened || t.wob) { return; }
    const rare = GachaService.isRare(t.entry.tier);
    t.wob = true;
    this.fx.tick();
    await sleep(rare ? 900 : 500);
    t.wob = false;
    t.opened = true;
    this.fx.pop();
    if (rare && el) { const r = el.getBoundingClientRect(); this.fx.confetti(80, r.left + r.width / 2, r.top + 30, 'gacha'); }
    if (this.tray.every(x => x.opened)) { await this.finish(); }
  }

  allOpened(): boolean {
    return this.tray.every(t => t.opened || t.wob);
  }

  async openAllIn(trayEl: HTMLElement): Promise<void> {
    const els = Array.from(trayEl.querySelectorAll<HTMLElement>('.cap'));
    for (let i = 0; i < this.tray.length; i++) { void this.open(this.tray[i], els[i]); await sleep(250); }
  }

  private async finish(): Promise<void> {
    await sleep(700);
    const got = this.tray.map(t => t.entry);
    const uids = this.uids;
    if (!this.trial) {
      this.api.commit();
      got.forEach(e => this.feed.mine(e.itemId, 'gacha'));
    }
    const r = await this.results.show({ items: got.map((e, i) => ({ itemId: e.itemId, tier: e.tier, uid: uids[i] })), trial: this.trial, againLabelKey: this.trial ? undefined : 'gacha.spinAgain' });
    this.busy = false;
    this.tray = [];
    if (r === 'again') { void this.spin(this.count as 1 | 5, false); }
    if (r === 'real') { void this.spin(1, false); }
  }

  private async turnKnob(): Promise<void> {
    this.knob += 360;
    for (let i = 0; i < 8; i++) { setTimeout(() => this.fx.tick(), i * 100); }
    this.caps.forEach(c => { c.vy -= rand(4, 10); c.vx += rand(-4, 4); });
    this.fx.vibrate(30);
    await sleep(950);
  }

  private addCap(): void {
    this.caps.push({ x: rand(40, W - 40), y: rand(30, 120), vx: rand(-1, 1), vy: 0, r: 17, c: pick(this.theme.palette('gacha').capsules), a: rand(0, 6.28) });
  }

  private loop(): void {
    if (!this.alive) { return; }
    const caps = this.caps;
    const cx = W / 2;
    const cy = H * 0.5;
    const R = W / 2 - 4;
    for (const c of caps) {
      c.vy += 0.32; c.x += c.vx; c.y += c.vy; c.vx *= 0.995; c.a += c.vx * 0.04;
      if (c.y < cy) {
        const dx = c.x - cx; const dy = c.y - cy; const dd = Math.hypot(dx, dy);
        if (dd > R - c.r) {
          const nx = dx / dd; const ny = dy / dd;
          c.x = cx + nx * (R - c.r); c.y = cy + ny * (R - c.r);
          const vn = c.vx * nx + c.vy * ny;
          if (vn > 0) { c.vx -= 1.5 * vn * nx; c.vy -= 1.5 * vn * ny; }
        }
      }
      if (c.x < c.r + 4) { c.x = c.r + 4; c.vx = Math.abs(c.vx) * 0.6; }
      if (c.x > W - c.r - 4) { c.x = W - c.r - 4; c.vx = -Math.abs(c.vx) * 0.6; }
      if (c.y > H - c.r - 4) { c.y = H - c.r - 4; c.vy = -Math.abs(c.vy) * 0.35; c.vx *= 0.92; }
    }
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < caps.length; i++) {
        for (let j = i + 1; j < caps.length; j++) {
          const a = caps[i]; const b = caps[j];
          const dx = b.x - a.x; const dy = b.y - a.y; const d = Math.hypot(dx, dy); const m = a.r + b.r;
          if (d < m && d > 0) {
            const nx = dx / d; const ny = dy / d; const o = (m - d) / 2;
            a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
            const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rv < 0) { const im = -rv * 0.4; a.vx -= im * nx; a.vy -= im * ny; b.vx += im * nx; b.vy += im * ny; }
          }
        }
      }
    }
    const x = this.ctx;
    x.clearRect(0, 0, W, H);
    for (const c of caps) {
      x.save(); x.translate(c.x, c.y); x.rotate(c.a);
      x.beginPath(); x.arc(0, 0, c.r, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill();
      x.beginPath(); x.arc(0, 0, c.r, Math.PI, 0); x.closePath(); x.fillStyle = c.c; x.fill();
      x.fillStyle = '#0002'; x.fillRect(-c.r, -1.5, c.r * 2, 3);
      x.beginPath(); x.arc(-c.r * 0.35, -c.r * 0.45, c.r * 0.25, 0, Math.PI * 2); x.fillStyle = '#fff9'; x.fill();
      x.lineWidth = 1.5; x.strokeStyle = '#0002'; x.beginPath(); x.arc(0, 0, c.r, 0, Math.PI * 2); x.stroke();
      x.restore();
    }
    this.raf = requestAnimationFrame(() => this.loop());
  }
}
