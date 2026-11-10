import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DailyState } from '../../models/user/user.model';
import { todayKey } from '../../utils/random.util';

export { CHECK_IN_REWARDS, MISSIONS } from '../../utils/game-rules.util';

const EMPTY: DailyState = {
  day: '', freeBoxClaimed: false, freeBoxOpened: false, wheelSpun: false, checkInStreak: 0, lastCheckIn: '',
  missions: { opened: 0, games: 0, wins: 0, claimed: [] }
};

/**
 * Today's check-in, missions and free rewards as last reported by the API.
 * Actions (check in, claim) live in AccountService.
 */
@Injectable({ providedIn: 'root' })
export class DailyService {
  private readonly subject = new BehaviorSubject<DailyState>(EMPTY);
  readonly state$ = this.subject.asObservable();

  get state(): DailyState {
    return this.subject.value;
  }

  get checkedInToday(): boolean {
    return this.state.lastCheckIn === todayKey();
  }

  /** The claimed free starter box is waiting to be opened. */
  get freeBoxReady(): boolean {
    return this.state.freeBoxClaimed && !this.state.freeBoxOpened;
  }

  sync(d: DailyState): void {
    this.subject.next(d);
  }
}
