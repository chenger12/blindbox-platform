import { Component, ElementRef, Input, NgZone, OnChanges, Renderer2, ViewChild } from '@angular/core';
import { WeightedBox } from '../../../models/catalog/catalog.model';
import { CatalogService } from '../../../services/catalog/catalog.service';
import { FxService } from '../../../services/fx/fx.service';
import { pick, rand } from '../../../utils/random.util';

const SLOTS = 46;
const WIN_AT = 38;

/** Case-opening reel. Call `spin()` and await it; the winner lands under the marker. */
@Component({
  selector: 'app-reel',
  templateUrl: './reel.component.html',
  styleUrl: './reel.component.scss'
})
export class ReelComponent implements OnChanges {
  @Input({ required: true }) box!: WeightedBox;
  @Input() winner: string | null = null;
  @Input() axis: 'h' | 'v' = 'h';
  @Input() idle = false;
  @ViewChild('track', { static: true }) track!: ElementRef<HTMLElement>;
  @ViewChild('view', { static: true }) view!: ElementRef<HTMLElement>;
  slots: string[] = [];
  winIndex = WIN_AT;
  done = false;

  constructor(
    private readonly catalog: CatalogService,
    private readonly fx: FxService,
    private readonly renderer: Renderer2,
    private readonly zone: NgZone
  ) {}

  ngOnChanges(): void {
    this.done = false;
    this.renderer.removeStyle(this.track.nativeElement, 'transform');
    this.slots = Array.from({ length: this.idle ? 30 : SLOTS }, (_, i) =>
      i === WIN_AT && this.winner && !this.idle ? this.winner
        : Math.random() < 0.16 ? pick(this.box.topItemIds.slice(0, 3)) : this.catalog.roll(this.box).id);
    if (this.idle) { this.slots = [...this.slots, ...this.slots]; }
  }

  spin(duration: number, ticks = true): Promise<void> {
    return new Promise(resolve => {
      const tiles = this.track.nativeElement.children;
      const H = this.axis === 'h';
      const a = tiles[0] as HTMLElement;
      const b = tiles[1] as HTMLElement;
      const step = H ? b.offsetLeft - a.offsetLeft : b.offsetTop - a.offsetTop;
      const size = H ? a.offsetWidth : a.offsetHeight;
      const viewSize = H ? this.view.nativeElement.clientWidth : this.view.nativeElement.clientHeight;
      const center = viewSize / 2 - size / 2;
      const exact = WIN_AT * step - center;
      const end = exact + rand(-size * 0.4, size * 0.4);
      const t0 = performance.now();
      let last = -1;
      const set = (x: number): void => this.renderer.setStyle(this.track.nativeElement, 'transform', H ? `translateX(${-x}px)` : `translateY(${-x}px)`);
      this.zone.runOutsideAngular(() => {
        const frame = (t: number): void => {
          const k = Math.min(1, (t - t0) / duration);
          const x = end * (1 - Math.pow(1 - k, 4.4));
          set(x);
          if (ticks) {
            const idx = Math.floor((x + center + size / 2) / step);
            if (idx !== last) { last = idx; this.fx.tick(); }
          }
          if (k < 1) { requestAnimationFrame(frame); return; }
          this.renderer.addClass(this.track.nativeElement, 'settle');
          set(exact);
          setTimeout(() => this.zone.run(() => {
            this.renderer.removeClass(this.track.nativeElement, 'settle');
            this.done = true;
            resolve();
          }), 420);
        };
        requestAnimationFrame(frame);
      });
    });
  }
}
