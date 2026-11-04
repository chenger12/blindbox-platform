import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DailyState, MissionId } from '../../models/user/user.model';
import { todayKey } from '../../utils/random.util';
import { StorageService } from '../storage/storage.service';
import { WalletService } from '../wallet/wallet.service';

const KEY = 'mb_daily';
export const CHECK_IN_REWARDS = [20, 30, 40, 50, 60, 80, 150];
export const MISSIONS: Array<{ id: MissionId; field: 'opened' | 'games' | 'wins'; goal: number; reward: number }> = [
  { id: 'open3', field: 'opened', goal: 3, reward: 50 },
  { id: 'play2', field: 'games', goal: 2, reward: 40 },
  { id: 'win1', field: 'wins', goal: 1, reward: 60 }
];

@Injectable({ providedIn: 'root' })
export class DailyService {
  private readonly subject: BehaviorSubject<DailyState>;
  readonly state$;
  /** Box id whose next open is free (set when the daily free box is claimed). */
  private freePending: string | null = null;

  constructor(private readonly storage: StorageService, private readonly wallet: WalletService) {
    this.subject = new BehaviorSubject<DailyState>(this.fresh(this.storage.get<DailyState>(KEY)));
    this.state$ = this.subject.asObservable();
  }

  get state(): DailyState {
    const s = this.subject.value;
    if (s.day !== todayKey()) { this.save(this.fresh(s)); }
    return this.subject.value;
  }

  get checkedInToday(): boolean {
    return this.state.lastCheckIn === todayKey();
  }

  checkIn(): number {
    const s = this.state;
    if (s.lastCheckIn === todayKey()) { return 0; }
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const streak = s.lastCheckIn === yesterday ? (s.checkInStreak % 7) + 1 : 1;
    const reward = CHECK_IN_REWARDS[streak - 1];
    this.save({ ...s, checkInStreak: streak, lastCheckIn: todayKey() });
    this.wallet.add(reward);
    return reward;
  }

  claimFreeBox(): boolean {
    const s = this.state;
    if (s.freeBoxClaimed) { return false; }
    this.save({ ...s, freeBoxClaimed: true });
    this.freePending = 'starter';
    return true;
  }

  consumeFreeOpen(boxId: string): boolean {
    if (this.freePending !== boxId) { return false; }
    this.freePending = null;
    return true;
  }

  /** Returns true when today's free spin was still available (and consumes it). */
  useFreeSpin(): boolean {
    const s = this.state;
    if (s.wheelSpun) { return false; }
    this.save({ ...s, wheelSpun: true });
    return true;
  }

  track(field: 'opened' | 'games' | 'wins', n = 1): void {
    const s = this.state;
    this.save({ ...s, missions: { ...s.missions, [field]: s.missions[field] + n } });
  }

  claimMission(id: MissionId): number {
    const s = this.state;
    const m = MISSIONS.find(x => x.id === id);
    if (!m || s.missions.claimed.includes(id) || s.missions[m.field] < m.goal) { return 0; }
    this.save({ ...s, missions: { ...s.missions, claimed: [...s.missions.claimed, id] } });
    this.wallet.add(m.reward);
    return m.reward;
  }

  private fresh(prev?: DailyState): DailyState {
    const day = todayKey();
    if (prev && prev.day === day) { return prev; }
    return {
      day, freeBoxClaimed: false, wheelSpun: false,
      checkInStreak: prev?.checkInStreak ?? 0, lastCheckIn: prev?.lastCheckIn ?? '',
      missions: { opened: 0, games: 0, wins: 0, claimed: [] }
    };
  }

  private save(s: DailyState): void {
    this.storage.set(KEY, s);
    this.subject.next(s);
  }
}
