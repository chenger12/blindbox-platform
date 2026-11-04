import { AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { ArtService } from '../../../../services/art/art.service';
import { ClawService } from '../../../../services/claw/claw.service';
import { DailyService } from '../../../../services/daily/daily.service';
import { FxService } from '../../../../services/fx/fx.service';
import { InventoryService } from '../../../../services/inventory/inventory.service';
import { ResultService } from '../../../../services/result/result.service';
import { ThemeService } from '../../../../services/theme/theme.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { WalletService } from '../../../../services/wallet/wallet.service';
import { CLAW_CHARS, CLAW_PITY, CLAW_PRICE } from '../../../../utils/catalog.data';
import { pick, rand } from '../../../../utils/random.util';

interface Prize { x: number; y: number; vx: number; vy: number; r: number; k: string; a: number; held?: boolean; }
type ClawState = 'off' | 'ready' | 'down' | 'close' | 'up' | 'toChute' | 'release' | 'end';
const CW = 340;
const CH = 400;
const FLOOR = CH - 14;
const CHX = 74;
const CHTOP = CH - 112;
const TOPY = 34;

@Component({
  selector: 'app-claw-page',
  templateUrl: './claw-page.component.html',
  styleUrl: './claw-page.component.scss'
})
export class ClawPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  readonly price = CLAW_PRICE;
  readonly pityMax = CLAW_PITY;
  timeLeft = 15;
  message: { key: string; params?: Record<string, number>; retry: boolean } | null = { key: 'claw.insert', retry: false };
  holdDir = 0;
  private x = CHX + 40;
  private y = TOPY;
  private st: ClawState = 'off';
  private f = 0;
  private held: Prize | null = null;
  private slipY: number | null = null;
  private time = 0;
  private strong = false;
  private won = false;
  private wait = 0;
  private settle = false;
  private prizes: Prize[] = [];
  private ctx!: CanvasRenderingContext2D;
  private raf = 0;
  private alive = true;
  private lastSec = 15;

  constructor(
    readonly claw: ClawService,
    private readonly wallet: WalletService,
    private readonly inventory: InventoryService,
    private readonly art: ArtService,
    private readonly theme: ThemeService,
    private readonly fx: FxService,
    private readonly results: ResultService,
    private readonly toast: ToastService,
    private readonly daily: DailyService,
    private readonly zone: NgZone
  ) {}

  get playing(): boolean { return this.st !== 'off'; }

  ngAfterViewInit(): void {
    const d = Math.min(2, devicePixelRatio || 1);
    const cv = this.canvas.nativeElement;
    cv.width = CW * d;
    cv.height = CH * d;
    this.ctx = cv.getContext('2d') as CanvasRenderingContext2D;
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
    for (let i = 0; i < 13; i++) { this.spawn(); }
    this.settle = true;
    for (let i = 0; i < 200; i++) { this.physics(); }
    this.settle = false;
    this.zone.runOutsideAngular(() => this.loop());
  }

  ngOnDestroy(): void {
    this.alive = false;
    cancelAnimationFrame(this.raf);
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') { this.dir(-1); }
    else if (e.key === 'ArrowRight') { this.dir(1); }
    else if (e.key === ' ') { e.preventDefault(); this.grab(); }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent): void {
    if ((e.key === 'ArrowLeft' && this.holdDir === -1) || (e.key === 'ArrowRight' && this.holdDir === 1)) { this.dir(0); }
  }

  dir(d: number): void {
    if (d && this.st !== 'ready') { return; }
    this.holdDir = d;
    if (d) { this.fx.tick(); }
  }

  start(): void {
    if (this.st !== 'off') { return; }
    if (!this.wallet.trySpend(CLAW_PRICE)) { return; }
    this.strong = this.claw.powerReady;
    this.won = false;
    this.st = 'ready';
    this.time = 15;
    this.timeLeft = 15;
    this.y = TOPY;
    this.f = 0;
    this.claw.play();
    this.daily.track('games');
    this.message = null;
    this.fx.coin();
    if (this.strong) { this.toast.show('claw.powerActive'); }
  }

  grab(): void {
    if (this.st === 'off') { this.start(); return; }
    if (this.st !== 'ready') { return; }
    this.st = 'down';
    this.holdDir = 0;
    this.fx.whir();
    this.fx.vibrate(20);
  }

  private spawn(): void {
    const k = Math.random() < 0.08 ? 'jin' : pick(CLAW_CHARS.slice(0, 11));
    this.prizes.push({ x: rand(CHX + 40, CW - 30), y: rand(40, 160), vx: 0, vy: 0, r: k === 'jin' ? 25 : rand(22, 27), k, a: rand(-0.5, 0.5) });
  }

  private physics(): void {
    const P = this.prizes;
    for (const p of P) {
      if (p.held) { continue; }
      p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.vx *= 0.98; p.a += p.vx * 0.02;
      if (p.y + p.r > FLOOR) { p.y = FLOOR - p.r; p.vy *= -0.2; p.vx *= 0.85; }
      if (p.x + p.r > CW - 4) { p.x = CW - 4 - p.r; p.vx *= -0.4; }
      if (p.x - p.r < 4) { p.x = 4 + p.r; p.vx *= -0.4; }
      if (p.y > CHTOP) {
        if (p.x > CHX + 3 && p.x - p.r < CHX + 6) { p.x = CHX + 6 + p.r; p.vx = Math.abs(p.vx) * 0.4; }
        else if (p.x <= CHX + 3 && p.x + p.r > CHX) { p.x = CHX - p.r; p.vx = -Math.abs(p.vx) * 0.4; }
      }
      for (const cx of [CHX, CHX + 6]) {
        const dx = p.x - cx; const dy = p.y - CHTOP; const d = Math.hypot(dx, dy);
        if (d < p.r && d > 0 && p.y < CHTOP + p.r) { const o = p.r - d; p.x += dx / d * o; p.y += dy / d * o; p.vx += dx / d * 0.6; }
      }
    }
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < P.length; i++) {
        for (let j = i + 1; j < P.length; j++) {
          const a = P[i]; const b = P[j];
          if (a.held || b.held) { continue; }
          const dx = b.x - a.x; const dy = b.y - a.y; const d = Math.hypot(dx, dy); const m = a.r + b.r - 4;
          if (d < m && d > 0) {
            const nx = dx / d; const ny = dy / d; const o = (m - d) / 2;
            a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
            const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rv < 0) { const im = -rv * 0.25; a.vx -= im * nx; a.vy -= im * ny; b.vx += im * nx; b.vy += im * ny; }
          }
        }
      }
    }
    for (const p of [...P]) {
      if (!p.held && p.x < CHX && p.y > CHTOP + 20) {
        P.splice(P.indexOf(p), 1);
        if (this.settle || this.st === 'off') { this.spawn(); continue; }
        this.won = true;
        this.zone.run(() => this.win(p));
      }
    }
  }

  private logic(): void {
    if (this.st === 'ready') {
      this.x = Math.max(CHX + 24, Math.min(CW - 24, this.x + this.holdDir * 2.6));
      this.time -= 1 / 60;
      const sec = Math.max(0, Math.ceil(this.time));
      if (sec !== this.lastSec) { this.lastSec = sec; this.zone.run(() => this.timeLeft = sec); }
      if (this.time <= 0) { this.zone.run(() => this.grab()); }
    } else if (this.st === 'down') {
      this.y += 3.2;
      const hit = this.prizes.find(p => Math.abs(p.x - this.x) < p.r * 0.85 && this.y + 30 >= p.y - p.r * 0.4);
      if (hit || this.y >= FLOOR - 40) { this.st = 'close'; this.fx.tick(); }
    } else if (this.st === 'close') {
      this.f = Math.min(1, this.f + 0.05);
      if (this.f >= 1) {
        const tipY = this.y + 30;
        let best: Prize | null = null;
        let bd = 1e9;
        for (const p of this.prizes) { const d = Math.hypot(p.x - this.x, (p.y - tipY) * 0.6); if (d < p.r + 12 && d < bd) { bd = d; best = p; } }
        if (best) {
          const al = 1 - Math.min(1, Math.abs(best.x - this.x) / best.r);
          const chance = this.strong ? 1 : 0.22 + 0.55 * al;
          if (Math.random() < chance) {
            this.held = best; best.held = true;
            this.slipY = !this.strong && Math.random() < 0.4 ? rand(TOPY + 20, best.y - 40) : null;
            this.fx.pop();
          }
        }
        this.st = 'up';
      }
    } else if (this.st === 'up') {
      this.y -= 2.4;
      if (this.held) {
        this.held.x += (this.x - this.held.x) * 0.3;
        this.held.y = this.y + 32 + this.held.r * 0.6;
        if (this.slipY !== null && this.y < this.slipY) {
          const h = this.held; h.held = false; h.vy = 1; h.vx = rand(-1.5, 1.5);
          this.held = null; this.f = 0.5;
          this.fx.fail(); this.fx.vibrate(60);
          this.zone.run(() => this.flashMessage('claw.slipped'));
        }
      }
      if (this.y <= TOPY) { this.y = TOPY; this.st = this.held ? 'toChute' : 'end'; }
    } else if (this.st === 'toChute') {
      this.x -= 2.4;
      if (this.held) { this.held.x = this.x; this.held.y = this.y + 32 + this.held.r * 0.6; }
      if (this.x <= CHX / 2) { this.x = CHX / 2; this.st = 'release'; this.wait = 0; }
    } else if (this.st === 'release') {
      this.f = Math.max(0, this.f - 0.06);
      if (this.held && this.f < 0.6) { this.held.held = false; this.held.vy = 0; this.held.vx = 0; this.held = null; }
      if (++this.wait > 70) { this.st = 'end'; }
    } else if (this.st === 'end') {
      this.f = Math.max(0, this.f - 0.05);
      this.x += (CHX + 40 - this.x) * 0.06;
      if (Math.abs(this.x - (CHX + 40)) < 1) { this.st = 'off'; this.zone.run(() => this.roundOver()); }
    }
  }

  private flashMessage(key: string): void {
    this.message = { key, retry: false };
    setTimeout(() => { if (this.st !== 'off') { this.message = null; } }, 900);
  }

  private async win(p: Prize): Promise<void> {
    const itemId = 'cm_' + p.k;
    const uid = this.inventory.add(itemId, 'claw', 'CLAW');
    this.claw.win();
    this.daily.track('wins');
    setTimeout(() => this.spawn(), 1500);
    await new Promise(r => setTimeout(r, 400));
    const r = await this.results.show({ items: [{ itemId, uid, tier: 'CLAW' }], againLabelKey: 'claw.playAgain' });
    if (r === 'again') { this.start(); }
  }

  private roundOver(): void {
    setTimeout(() => {
      if (this.won) { this.message = { key: 'claw.insert', retry: false }; return; }
      this.claw.miss();
      this.fx.fail();
      const left = CLAW_PITY - this.claw.state.pity;
      this.message = { key: left <= 0 ? 'claw.closePower' : 'claw.close', params: { n: left }, retry: true };
    }, 900);
  }

  private loop(): void {
    if (!this.alive) { return; }
    this.logic();
    this.physics();
    this.draw();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  private draw(): void {
    const x = this.ctx;
    const pal = this.theme.palette('claw');
    x.clearRect(0, 0, CW, CH);
    const g = x.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, pal.clawBackground[0]); g.addColorStop(1, pal.clawBackground[1]);
    x.fillStyle = g; x.fillRect(0, 0, CW, CH);
    x.fillStyle = '#ffffff0a';
    for (let i = 0; i < 12; i++) { for (let j = 0; j < 12; j++) { if ((i + j) % 2 === 0) { x.beginPath(); x.arc(i * 32 + 8, j * 36 + 20, 5, 0, 7); x.fill(); } } }
    x.fillStyle = '#00000055'; x.fillRect(CHX, FLOOR, CW - CHX, 14);
    x.fillStyle = pal.clawAccent; x.fillRect(CHX, FLOOR, CW - CHX, 2);
    x.fillStyle = '#0a0a0b'; x.fillRect(0, CHTOP, CHX, CH - CHTOP);
    x.save(); x.beginPath(); x.rect(0, CHTOP, CHX, CH - CHTOP); x.clip(); x.fillStyle = pal.clawAccent;
    for (let i = -10; i < 10; i++) { x.beginPath(); x.moveTo(i * 16, CHTOP); x.lineTo(i * 16 + 8, CHTOP); x.lineTo(i * 16 + 68, CHTOP + 60); x.lineTo(i * 16 + 60, CHTOP + 60); x.fill(); }
    x.restore();
    x.fillStyle = '#0a0a0b'; x.fillRect(4, CHTOP + 16, CHX - 8, CH - CHTOP - 16);
    x.fillStyle = '#fff'; x.font = 'bold 13px sans-serif'; x.textAlign = 'center'; x.fillText('EXIT', CHX / 2, CHTOP + 46);
    x.font = '20px sans-serif'; x.fillText('⬇', CHX / 2, CHTOP + 76);
    x.fillStyle = pal.clawAccent; x.fillRect(CHX, CHTOP, 6, CH - CHTOP);
    for (const p of this.prizes) {
      const im = this.art.charImage(p.k);
      x.save(); x.translate(p.x, p.y); x.rotate(p.a);
      if (p.k === 'jin') { x.shadowColor = '#ffd84d'; x.shadowBlur = 14; }
      if (im.complete) { x.drawImage(im, -p.r * 1.15, -p.r * 1.15, p.r * 2.3, p.r * 2.3); }
      x.restore();
    }
    x.fillStyle = '#9fb4c9'; x.fillRect(0, 8, CW, 8);
    x.fillStyle = '#d8e4f0'; x.fillRect(this.x - 18, 4, 36, 14);
    x.strokeStyle = '#d8e4f0'; x.lineWidth = 3; x.beginPath(); x.moveTo(this.x, 18); x.lineTo(this.x, this.y); x.stroke();
    const hg = x.createLinearGradient(this.x - 18, 0, this.x + 18, 0);
    hg.addColorStop(0, '#c0ccd8'); hg.addColorStop(0.5, '#fff'); hg.addColorStop(1, '#a8b6c6');
    x.fillStyle = hg; x.beginPath(); x.roundRect(this.x - 18, this.y, 36, 16, 6); x.fill();
    if (this.strong) { x.fillStyle = '#ffd84d'; x.font = '12px sans-serif'; x.fillText('⚡', this.x, this.y + 12); }
    const open = (1 - this.f) * 0.75 + 0.05;
    for (const s of [-1, 1]) {
      x.save(); x.translate(this.x + s * 12, this.y + 14); x.rotate(s * open);
      x.strokeStyle = this.strong ? '#ffd84d' : '#e6eef6'; x.lineWidth = 5; x.lineCap = 'round';
      x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(s * 14, 18, s * 2, 36); x.stroke(); x.restore();
    }
    x.fillStyle = '#ffffff10'; x.beginPath(); x.moveTo(CW * 0.62, 0); x.lineTo(CW * 0.72, 0); x.lineTo(CW * 0.42, CH); x.lineTo(CW * 0.32, CH); x.fill();
  }
}
