import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { FxService } from '../../../../services/fx/fx.service';
import { KUJI_BIG, KUJI_RANK, KujiPull } from '../../../../services/kuji/kuji.service';
import { ThemeService } from '../../../../services/theme/theme.service';

export type ShowResult = 'skip' | 'more' | 'ok' | 'again';
type Ball = 'silver' | 'gold' | 'holo';
type Stage = 'machine' | 'zoom' | 'jackpot' | 'bulk' | 'card' | 'suspense' | 'final';
const ORDER: Ball[] = ['silver', 'gold', 'holo'];

/**
 * The kuji draw show: machine → colour tease (may upgrade) → ball zoom →
 * jackpot splash for big prizes → quick card flips → slow reveal of the best card.
 */
@Component({
  selector: 'app-kuji-show',
  templateUrl: './kuji-show.component.html',
  styleUrl: './kuji-show.component.scss'
})
export class KujiShowComponent implements OnInit, OnDestroy {
  @Input({ required: true }) pulls: KujiPull[] = [];
  @Input() trial = false;
  @Input() againKey: string | null = null;
  @Output() finished = new EventEmitter<ShowResult>();

  stage: Stage = 'machine';
  ball: Ball | null = null;
  ballState: 'in' | 'up' | 'pop' | '' = '';
  hintKey = '';
  upgraded = false;
  knob = false;
  quake = false;
  flash = 0;
  card: KujiPull | null = null;
  countLabel = '';
  best!: KujiPull;
  private skipped = false;
  private tapResolve: (() => void) | null = null;
  private btnResolve: ((v: string) => void) | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(readonly theme: ThemeService, private readonly fx: FxService, private readonly catalog: CatalogService) {}

  ngOnInit(): void {
    void this.run();
  }

  ngOnDestroy(): void {
    this.timers.forEach(t => clearTimeout(t));
  }

  rare(p: KujiPull | null): boolean {
    return !!p && KUJI_RANK[p.tier] >= 4;
  }

  value(p: KujiPull): number {
    return this.catalog.item(p.itemId).value;
  }

  tap(): void {
    this.tapResolve?.();
  }

  skip(): void {
    this.skipped = true;
    this.tapResolve?.();
    this.btnResolve?.('skip');
  }

  press(v: string, e: Event): void {
    e.stopPropagation();
    this.fx.click();
    this.btnResolve?.(v);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(res => {
      if (this.skipped) { res(); return; }
      const done = (): void => { clearTimeout(t); this.tapResolve = null; res(); };
      const t = setTimeout(done, ms);
      this.timers.push(t);
      this.tapResolve = done;
    });
  }

  private waitButton(): Promise<string> {
    return new Promise(res => { this.btnResolve = v => { this.btnResolve = null; res(v); }; });
  }

  private doFlash(): void {
    this.flash++;
  }

  private end(v: ShowResult): void {
    this.finished.emit(v);
  }

  private async run(): Promise<void> {
    const n = this.pulls.length;
    const sorted = [...this.pulls].sort((a, b) => KUJI_RANK[a.tier] - KUJI_RANK[b.tier]);
    this.best = sorted[n - 1];
    const color: Ball = KUJI_BIG.includes(this.best.tier) ? 'holo' : this.best.tier === 'C' ? 'gold' : Math.random() < 0.15 ? 'gold' : 'silver';

    // 1. machine
    this.stage = 'machine';
    if (await this.waitButton() === 'skip') { return this.end('skip'); }
    this.knob = true;
    for (let i = 0; i < 9; i++) { this.timers.push(setTimeout(() => this.fx.tick(), i * 110)); }
    this.fx.vibrate(30);
    await this.wait(1050);
    if (this.skipped) { return this.end('skip'); }

    // 2. colour tease, sometimes starting one step lower then upgrading
    const ci = ORDER.indexOf(color);
    const c0 = ci > 0 && Math.random() < 0.55 ? ci - 1 : ci;
    this.ball = ORDER[c0];
    this.ballState = 'in';
    this.hintKey = 'kuji.tease.' + ORDER[c0];
    this.fx.drop();
    await this.wait(1200);
    if (this.skipped) { return this.end('skip'); }
    if (c0 !== ci) {
      this.ballState = 'up';
      this.fx.suspense();
      this.fx.vibrate([20, 30, 20, 30, 20]);
      await this.wait(800);
      if (this.skipped) { return this.end('skip'); }
      this.doFlash();
      this.ball = color;
      this.ballState = 'pop';
      this.upgraded = true;
      this.hintKey = 'kuji.tease.' + color;
      this.fx.big();
      this.fx.vibrate(80);
      await this.wait(1400);
    } else if (color !== 'silver') {
      this.fx.win();
      await this.wait(500);
    }
    if (this.skipped) { return this.end('skip'); }

    // 3. ball zoom
    this.stage = 'zoom';
    this.fx.whir();
    await this.wait(1500);
    if (this.skipped) { return this.end('skip'); }
    this.doFlash();
    this.fx.pop();

    // 4. jackpot splash
    if (KUJI_BIG.includes(this.best.tier)) {
      this.stage = 'jackpot';
      this.quake = true;
      this.timers.push(setTimeout(() => this.quake = false, 1100));
      this.fx.suspense();
      this.timers.push(setTimeout(() => this.fx.big(), 550));
      this.fx.vibrate([80, 40, 160]);
      await this.wait(2600);
      if (this.skipped) { return this.end('skip'); }
      this.doFlash();
    }

    // 5. quick cards, best saved for last
    const quick = n <= 10 ? sorted.slice(0, -1) : [];
    if (n > 10) {
      this.stage = 'bulk';
      this.countLabel = String(n - 1);
      await this.wait(1300);
    }
    for (let i = 0; i < quick.length; i++) {
      if (this.skipped) { return this.end('skip'); }
      this.stage = 'card';
      this.card = quick[i];
      this.countLabel = `${i + 1} / ${n}`;
      this.fx.pop();
      if (this.rare(quick[i])) { this.fx.win(); }
      await this.wait(this.rare(quick[i]) ? 1300 : 700);
    }
    if (this.skipped) { return this.end('skip'); }

    // 6. slow reveal
    if (n > 1 || this.rare(this.best)) {
      this.stage = 'suspense';
      this.fx.suspense();
      this.fx.vibrate([20, 40, 20, 40, 20, 40]);
      await this.wait(1800);
      if (this.skipped) { return this.end('skip'); }
      this.doFlash();
    }
    this.stage = 'final';
    this.card = this.best;
    this.countLabel = n > 1 ? `${n} / ${n}` : '';
    if (this.rare(this.best)) { this.fx.big(); this.fx.confetti(170, undefined, undefined, 'kuji'); } else { this.fx.win(); }
    const v = await this.waitButton();
    this.end(v === 'skip' ? 'skip' : v as ShowResult);
  }
}
