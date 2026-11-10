import { Injectable } from '@angular/core';
import { MissionId } from '../../models/user/user.model';
import { ApiService } from '../api/api.service';

/** /api/account — wallet, inventory and daily-reward actions. */
@Injectable({ providedIn: 'root' })
export class AccountService {
  constructor(private readonly api: ApiService) {}

  /** Loads the account at start-up. */
  async load(): Promise<void> {
    await this.api.get<null>('account', { silent: true });
  }

  topUp(): Promise<{ coins: number } | null> {
    return this.api.post('account/top-up');
  }

  /** Sells items back for coins. */
  sell(uids: number[]): Promise<{ n: number; coins: number } | null> {
    return this.api.post('account/sell', { uids });
  }

  redeem(code: string): Promise<{ coins: number } | null> {
    return this.api.post('account/promo', { code });
  }

  checkIn(): Promise<{ coins: number } | null> {
    return this.api.post('account/check-in');
  }

  claimMission(id: MissionId): Promise<{ coins: number } | null> {
    return this.api.post('account/missions/claim', { id });
  }

  claimFreeBox(): Promise<{ boxId: string } | null> {
    return this.api.post('account/free-box');
  }
}
