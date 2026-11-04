import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BattleRoom } from '../../models/game/game-state.model';
import { BOT_NAMES } from '../../utils/catalog.data';
import { pick, randInt, uid } from '../../utils/random.util';
import { CatalogService } from '../catalog/catalog.service';
import { StorageService } from '../storage/storage.service';

const KEY = 'mb_battles';

@Injectable({ providedIn: 'root' })
export class BattleService {
  readonly list$: BehaviorSubject<BattleRoom[]>;

  constructor(private readonly storage: StorageService, private readonly catalog: CatalogService) {
    const saved = this.storage.get<BattleRoom[]>(KEY);
    this.list$ = new BehaviorSubject<BattleRoom[]>(saved && saved.length >= 4 ? saved : this.seed());
  }

  cost(b: BattleRoom): number {
    return b.rounds.reduce((s, id) => s + (this.catalog.box(id)?.price ?? 0), 0);
  }

  mode(players: number): string {
    return Array(players).fill('1').join('v');
  }

  generate(live = false): BattleRoom {
    const players = pick([2, 2, 2, 3, 4]);
    const cheap = this.catalog.boxes.filter(b => b.price <= 129);
    return {
      id: uid('b'), players,
      rounds: Array.from({ length: randInt(1, 4) }, () => pick(cheap).id),
      joined: Array.from({ length: live ? players : randInt(1, players - 1) }, () => pick(BOT_NAMES)),
      live
    };
  }

  /** Takes a battle out of the lobby (joined or watched) and back-fills the list. */
  take(id: string): BattleRoom | undefined {
    const list = this.list$.value;
    const b = list.find(x => x.id === id);
    if (b) { this.save([...list.filter(x => x !== b), this.generate(b.live)]); }
    return b;
  }

  private seed(): BattleRoom[] {
    const list = [this.generate(true), this.generate(), this.generate(), this.generate(true), this.generate(), this.generate(), this.generate()];
    this.storage.set(KEY, list);
    return list;
  }

  private save(list: BattleRoom[]): void {
    this.storage.set(KEY, list);
    this.list$.next(list);
  }
}
