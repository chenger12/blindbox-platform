import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FeedEntry } from '../../models/user/user.model';
import { BOT_NAMES, GACHA_POOL, KUJI_PRIZES } from '../../utils/catalog.data';
import { pick, randInt, uid, weightedPick } from '../../utils/random.util';
import { CatalogService } from '../catalog/catalog.service';

/** Simulated live activity from other collectors (drops strip, ticker, top pulls). */
@Injectable({ providedIn: 'root' })
export class FeedService {
  private readonly subject = new BehaviorSubject<FeedEntry[]>([]);
  readonly drops$ = this.subject.asObservable();
  readonly openedToday$ = new BehaviorSubject<number>(12483);
  readonly online$ = new BehaviorSubject<number>(1240);
  private started = false;

  constructor(private readonly catalog: CatalogService, private readonly zone: NgZone) {}

  start(): void {
    if (this.started) { return; }
    this.started = true;
    const seed: FeedEntry[] = [];
    for (let i = 0; i < 18; i++) { seed.push(this.botEntry(Date.now() - i * 60000)); }
    this.subject.next(seed);
    const loop = (): void => {
      this.zone.run(() => this.push(this.botEntry()));
      setTimeout(loop, randInt(1600, 3600));
    };
    this.zone.runOutsideAngular(() => setTimeout(loop, 1500));
  }

  push(entry: FeedEntry): void {
    this.subject.next([entry, ...this.subject.value].slice(0, 40));
    this.openedToday$.next(this.openedToday$.value + 1);
    if (Math.random() < 0.3) { this.online$.next(this.online$.value + randInt(-6, 8)); }
  }

  mine(itemId: string, source: string): void {
    this.push({ id: uid('f'), user: 'you', itemId, source, createdAt: Date.now() });
  }

  /** Highest-value drops seen so far, for the "top pulls" section. */
  top(n = 5): FeedEntry[] {
    return [...this.subject.value].sort((a, b) => this.catalog.item(b.itemId).value - this.catalog.item(a.itemId).value).slice(0, n);
  }

  private botEntry(at = Date.now()): FeedEntry {
    const r = Math.random();
    let itemId: string;
    let source: string;
    if (r < 0.55) {
      const box = pick(this.catalog.boxes.filter(b => b.price <= 129 || Math.random() < 0.3));
      let it = this.catalog.roll(box);
      if (it.value < 25 && Math.random() < 0.6) { it = this.catalog.roll(box); }
      itemId = it.id; source = 'box:' + box.id;
    } else if (r < 0.8) {
      itemId = pick(KUJI_PRIZES).itemId; source = 'kuji';
    } else {
      itemId = weightedPick(GACHA_POOL).itemId; source = 'gacha';
    }
    return { id: uid('f'), user: pick(BOT_NAMES), itemId, source, createdAt: at };
  }
}
