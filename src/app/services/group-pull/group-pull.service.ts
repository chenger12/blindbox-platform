import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GroupRoom } from '../../models/game/game-state.model';
import { BOT_NAMES } from '../../utils/catalog.data';
import { randInt, shuffle } from '../../utils/random.util';
import { StorageService } from '../storage/storage.service';

const KEY = 'mb_group_pull';

@Injectable({ providedIn: 'root' })
export class GroupPullService {
  readonly loseStreak$: BehaviorSubject<number>;

  constructor(private readonly storage: StorageService) {
    this.loseStreak$ = new BehaviorSubject<number>(this.storage.get<number>(KEY, 0) ?? 0);
  }

  rooms(): GroupRoom[] {
    return [2, 3, 4].map(size => ({ size, bots: shuffle(BOT_NAMES).slice(0, randInt(0, size - 1)) }));
  }

  /** Records a result. Returns true when the consolation ticket was earned. */
  record(won: boolean): boolean {
    let n = won ? 0 : this.loseStreak$.value + 1;
    let bonus = false;
    if (n >= 3) { n = 0; bonus = true; }
    this.storage.set(KEY, n);
    this.loseStreak$.next(n);
    return bonus;
  }
}
