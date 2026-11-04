import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InventoryService } from '../../../services/inventory/inventory.service';

interface PortfolioView { value: number; count: number; path: string; area: string; change: number; best: string | null; }

/** Collection value over time, built from real inventory changes (not simulated prices). */
@Component({
  selector: 'app-portfolio-section',
  templateUrl: './portfolio-section.component.html',
  styleUrl: './portfolio-section.component.scss'
})
export class PortfolioSectionComponent {
  readonly view$: Observable<PortfolioView>;

  constructor(private readonly inventory: InventoryService) {
    this.view$ = inventory.entries$.pipe(map(entries => {
      const h = inventory.history.length ? inventory.history : [{ t: Date.now(), v: inventory.value(entries) }];
      const pts = h.length === 1 ? [h[0], { t: h[0].t + 1, v: h[0].v }] : h;
      const max = Math.max(...pts.map(p => p.v), 1);
      const min = Math.min(...pts.map(p => p.v), 0);
      const xs = (i: number): number => (i / (pts.length - 1)) * 300;
      const ys = (v: number): number => 86 - ((v - min) / (max - min || 1)) * 76;
      const path = pts.map((p, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)} ${ys(p.v).toFixed(1)}`).join(' ');
      const first = pts[0].v || 1;
      const best = [...entries].sort((a, b) => inventory.value([b]) - inventory.value([a]))[0]?.itemId ?? null;
      return {
        value: inventory.value(entries), count: entries.length, path, area: `${path} L300 90 L0 90 Z`,
        change: (pts[pts.length - 1].v - first) / first, best
      };
    }));
  }
}
