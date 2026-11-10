import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ClawFinishResult, ClawGrabResult, ClawStartResult, ClawStateView } from '../../models/api/api.model';
import { CLAW_PITY } from '../../utils/catalog.data';
import { ApiService } from '../api/api.service';

/** Client for /api/games/claw. The server decides whether the claw grips. */
@Injectable({ providedIn: 'root' })
export class ClawService {
  readonly state$ = new BehaviorSubject<ClawStateView>({ pity: 0, plays: 0 });

  constructor(private readonly api: ApiService) {}

  get state(): ClawStateView { return this.state$.value; }
  get powerReady(): boolean { return this.state.pity >= CLAW_PITY; }

  async load(): Promise<void> {
    this.set(await this.api.game<ClawStateView>('claw', 'state'));
  }

  async start(): Promise<ClawStartResult | null> {
    const r = await this.api.game<ClawStartResult>('claw', 'start', {});
    this.set(r?.state ?? null);
    return r;
  }

  grab(playId: string, align: number): Promise<ClawGrabResult | null> {
    return this.api.game<ClawGrabResult>('claw', 'grab', { playId, align });
  }

  /** prize = character key that dropped into the chute, or null. Winnings held until api.commit(). */
  async finish(playId: string, prize: string | null): Promise<ClawFinishResult | null> {
    const r = await this.api.game<ClawFinishResult>('claw', 'finish', { playId, prize }, { hold: true });
    this.set(r?.state ?? null);
    return r;
  }

  private set(s: ClawStateView | null): void {
    if (s) { this.state$.next(s); }
  }
}
