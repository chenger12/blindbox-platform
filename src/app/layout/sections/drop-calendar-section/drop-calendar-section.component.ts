import { Component, OnDestroy } from '@angular/core';
import { WeightedBox } from '../../../models/catalog/catalog.model';
import { CatalogService } from '../../../services/catalog/catalog.service';

interface Drop { box: WeightedBox; at: number; }

/** Release schedule: each box restocks at a fixed hour; the next one counts down. */
@Component({
  selector: 'app-drop-calendar-section',
  templateUrl: './drop-calendar-section.component.html',
  styleUrl: './drop-calendar-section.component.scss'
})
export class DropCalendarSectionComponent implements OnDestroy {
  drops: Drop[] = [];
  now = Date.now();
  private readonly timer = setInterval(() => this.now = Date.now(), 1000);

  constructor(catalog: CatalogService) {
    const base = new Date();
    base.setMinutes(0, 0, 0);
    this.drops = catalog.boxes.slice(0, 6).map((box, i) => ({ box, at: base.getTime() + (i * 3 - 2) * 3600000 }));
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  countdown(at: number): string {
    const s = Math.max(0, Math.floor((at - this.now) / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${String(m).padStart(2, '0')}m ${String(s % 60).padStart(2, '0')}s`;
  }

  time(at: number): string {
    return new Date(at).toTimeString().slice(0, 5);
  }
}
