import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone } from '@angular/core';
import { pick, rand } from '../../utils/random.util';
import { StorageService } from '../storage/storage.service';
import { ThemeService } from '../theme/theme.service';
import { GameId } from '../../models/theme/theme.model';
import { NativeService } from '../native/native.service';

type Wave = OscillatorType;
interface Particle { x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; c: string; life: number; star: boolean; }
const MUTE_KEY = 'mb_muted';

/** Sound effects, haptics and confetti. Drawing runs outside Angular's zone. */
@Injectable({ providedIn: 'root' })
export class FxService {
  muted: boolean;
  private ctx: AudioContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private parts: Particle[] = [];
  private running = false;

  constructor(
    private readonly zone: NgZone,
    private readonly theme: ThemeService,
    private readonly storage: StorageService,
    private readonly native: NativeService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    this.muted = this.storage.get<boolean>(MUTE_KEY, false) ?? false;
  }

  toggleMute(): void {
    this.muted = !this.muted;
    this.storage.set(MUTE_KEY, this.muted);
    if (!this.muted) { this.coin(); }
  }

  click(): void { this.tone(700, 0.05, 'triangle', 0.06); }
  tick(): void { this.tone(1600, 0.025, 'square', 0.022); }
  pop(): void { this.tone(320, 0.14, 'sine', 0.15, 0, 980); }
  drop(): void { this.tone(600, 0.12, 'sine', 0.1, 0, 180); }
  whir(): void { this.tone(160, 0.6, 'sawtooth', 0.03, 0, 80); }
  suspense(): void { this.tone(180, 0.9, 'sawtooth', 0.035, 0, 900); }
  tear(): void { this.tone(2400, 0.09, 'sawtooth', 0.03, 0, 300); this.tone(1800, 0.07, 'sawtooth', 0.02, 0.05, 250); }
  coin(): void { this.tone(988, 0.08, 'square', 0.045); this.tone(1319, 0.16, 'square', 0.045, 0.08); }
  win(): void { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.09, i * 0.08)); }
  big(): void {
    [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.085, i * 0.07));
    this.tone(2093, 0.8, 'sine', 0.05, 0.5);
  }
  fail(): void { this.tone(420, 0.2, 'triangle', 0.09, 0, 260); this.tone(300, 0.35, 'triangle', 0.09, 0.2, 150); }

  vibrate(pattern: number | number[]): void {
    if (this.native.haptic(pattern)) { return; }
    try { navigator.vibrate?.(pattern); } catch { /* unsupported */ }
  }

  confetti(count = 120, x?: number, y?: number, gameId?: GameId | null): void {
    const colors = this.theme.palette(gameId).confetti;
    const cx = x ?? innerWidth / 2;
    const cy = y ?? innerHeight * 0.4;
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(4, 13);
      this.parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6, r: rand(0, 6), vr: rand(-0.3, 0.3),
        w: rand(6, 11), h: rand(3, 7), c: pick(colors), life: rand(80, 140), star: Math.random() < 0.25 });
    }
    if (!this.running) {
      this.running = true;
      this.zone.runOutsideAngular(() => requestAnimationFrame(() => this.loop()));
    }
  }

  private ensureCanvas(): CanvasRenderingContext2D | null {
    if (!this.canvas) {
      this.canvas = this.document.createElement('canvas');
      this.canvas.className = 'mb-fx-canvas';
      this.document.body.appendChild(this.canvas);
    }
    const dpr = devicePixelRatio || 1;
    if (this.canvas.width !== Math.round(innerWidth * dpr)) {
      this.canvas.width = Math.round(innerWidth * dpr);
      this.canvas.height = Math.round(innerHeight * dpr);
    }
    const ctx = this.canvas.getContext('2d');
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  private loop(): void {
    const ctx = this.ensureCanvas();
    if (!ctx) { this.running = false; return; }
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    this.parts = this.parts.filter(p => p.life-- > 0 && p.y < innerHeight + 40);
    for (const p of this.parts) {
      p.vy += 0.28; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.fillStyle = p.c;
      if (p.star) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) { const rr = i % 2 ? 3 : 7; const a = i * Math.PI / 5; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
      }
      ctx.restore();
    }
    if (this.parts.length) { requestAnimationFrame(() => this.loop()); }
    else { this.running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  private audio(): AudioContext | null {
    if (!this.ctx) {
      try { this.ctx = new AudioContext(); } catch { return null; }
    }
    if (this.ctx.state === 'suspended') { void this.ctx.resume(); }
    return this.ctx;
  }

  private tone(freq: number, dur = 0.1, type: Wave = 'sine', vol = 0.1, delay = 0, freq2?: number): void {
    if (this.muted) { return; }
    const a = this.audio();
    if (!a) { return; }
    const t = a.currentTime + delay;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freq2) { o.frequency.exponentialRampToValueAtTime(freq2, t + dur); }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}
