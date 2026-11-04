import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GachaEntry } from '../../models/catalog/catalog.model';
import { GACHA_PITY, GACHA_POOL } from '../../utils/catalog.data';
import { pick, weightedPick } from '../../utils/random.util';
import { StorageService } from '../storage/storage.service';

const KEY = 'mb_gacha';

@Injectable({ providedIn: 'root' })
export class GachaService {
  readonly pity$: BehaviorSubject<number>;

  constructor(private readonly storage: StorageService) {
    this.pity$ = new BehaviorSubject<number>(this.storage.get<number>(KEY, 0) ?? 0);
  }

  get pity(): number { return this.pity$.value; }

  static isRare(tier: string | undefined): boolean {
    return tier === 'SR' || tier === 'SECRET' || tier === 'A' || tier === 'B' || tier === 'LAST';
  }

  roll(trial: boolean): GachaEntry {
    const entry = !trial && this.pity >= GACHA_PITY - 1
      ? pick(GACHA_POOL.filter(x => x.tier === 'SR'))
      : weightedPick(GACHA_POOL);
    if (!trial) {
      const next = GachaService.isRare(entry.tier) ? 0 : this.pity + 1;
      this.storage.set(KEY, next);
      this.pity$.next(next);
    }
    return entry;
  }
}
