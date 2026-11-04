import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WheelLog, WheelSegment } from '../../models/game/game-state.model';
import { weightedPick } from '../../utils/random.util';
import { StorageService } from '../storage/storage.service';

const KEY = 'mb_wheel_log';
export const WHEEL_SPIN_PRICE = 20;
export const WHEEL_SEGMENTS: WheelSegment[] = [
  { labelKey: '+20', subKey: 'wheel.seg.coins', weight: 22, reward: { coins: 20 } },
  { labelKey: 'wheel.seg.ticket', subKey: 'wheel.seg.gachaX1', weight: 14, reward: { ticket: 1 } },
  { labelKey: '+50', subKey: 'wheel.seg.coins', weight: 18, reward: { coins: 50 } },
  { labelKey: 'wheel.seg.pin', subKey: 'wheel.seg.mystery', weight: 10, reward: { item: true } },
  { labelKey: 'wheel.seg.hint', subKey: 'wheel.seg.cardX1', weight: 20, reward: { hint: 1 } },
  { labelKey: '+188', subKey: 'wheel.seg.coins', weight: 8, reward: { coins: 188 } },
  { labelKey: 'wheel.seg.respin', subKey: 'wheel.seg.free', weight: 6, reward: { again: true } },
  { labelKey: '+888', subKey: 'wheel.seg.jackpot', weight: 2, reward: { coins: 888, big: true } }
];

@Injectable({ providedIn: 'root' })
export class WheelService {
  readonly log$: BehaviorSubject<WheelLog[]>;

  constructor(private readonly storage: StorageService) {
    this.log$ = new BehaviorSubject<WheelLog[]>(this.storage.get<WheelLog[]>(KEY, []) ?? []);
  }

  pickIndex(): number {
    return WHEEL_SEGMENTS.indexOf(weightedPick(WHEEL_SEGMENTS));
  }

  record(index: number): void {
    const next = [{ index, at: Date.now() }, ...this.log$.value].slice(0, 20);
    this.storage.set(KEY, next);
    this.log$.next(next);
  }
}
