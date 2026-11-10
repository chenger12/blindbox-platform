import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GroupLobby, GroupPullResult } from '../../models/api/api.model';
import { GroupRoom } from '../../models/game/game-state.model';
import { ApiService } from '../api/api.service';

/** Client for /api/games/group-pull. The server rolls every seat and picks the winner. */
@Injectable({ providedIn: 'root' })
export class GroupPullService {
  readonly loseStreak$ = new BehaviorSubject<number>(0);
  readonly rooms$ = new BehaviorSubject<GroupRoom[]>([]);

  constructor(private readonly api: ApiService) {}

  async load(): Promise<void> {
    const l = await this.api.game<GroupLobby>('group-pull', 'lobby');
    if (l) { this.rooms$.next(l.rooms); this.loseStreak$.next(l.loseStreak); }
  }

  /** Winnings held until api.commit(). */
  async join(room: GroupRoom): Promise<GroupPullResult | null> {
    const r = await this.api.game<GroupPullResult>('group-pull', 'join', { size: room.size, bots: room.bots }, { hold: true });
    if (r) { this.loseStreak$.next(r.loseStreak); }
    return r;
  }
}
