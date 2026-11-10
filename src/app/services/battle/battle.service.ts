import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BattleResult } from '../../models/api/api.model';
import { BattleRoom } from '../../models/game/game-state.model';
import { battleCost } from '../../utils/game-rules.util';
import { ApiService } from '../api/api.service';

/** Client for /api/games/battles. The server plays the whole battle; the page replays it. */
@Injectable({ providedIn: 'root' })
export class BattleService {
  readonly list$ = new BehaviorSubject<BattleRoom[]>([]);

  constructor(private readonly api: ApiService) {}

  async load(): Promise<void> {
    const l = await this.api.game<BattleRoom[]>('battles', 'lobby');
    if (l) { this.list$.next(l); }
  }

  cost(b: BattleRoom): number {
    return battleCost(b.rounds);
  }

  mode(players: number): string {
    return Array(players).fill('1').join('v');
  }

  /** Winnings held until api.commit(). */
  join(id: string): Promise<BattleResult | null> { return this.play('join', { id }, true); }
  watch(id: string): Promise<BattleResult | null> { return this.play('watch', { id }, false); }
  create(players: number, rounds: string[]): Promise<BattleResult | null> { return this.play('create', { players, rounds }, true); }

  private async play(action: string, body: unknown, hold: boolean): Promise<BattleResult | null> {
    const r = await this.api.game<BattleResult>('battles', action, body, { hold });
    if (r) { this.list$.next(r.lobby); }
    return r;
  }
}
