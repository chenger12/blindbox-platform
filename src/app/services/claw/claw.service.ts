import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CLAW_PITY } from '../../utils/catalog.data';
import { StorageService } from '../storage/storage.service';

const KEY = 'mb_claw';
interface ClawState { pity: number; plays: number; }

@Injectable({ providedIn: 'root' })
export class ClawService {
  readonly state$: BehaviorSubject<ClawState>;

  constructor(private readonly storage: StorageService) {
    this.state$ = new BehaviorSubject<ClawState>(this.storage.get<ClawState>(KEY) ?? { pity: 0, plays: 0 });
  }

  get state(): ClawState { return this.state$.value; }
  get powerReady(): boolean { return this.state.pity >= CLAW_PITY; }

  play(): void { this.save({ ...this.state, plays: this.state.plays + 1 }); }
  miss(): void { this.save({ ...this.state, pity: this.state.pity + 1 }); }
  win(): void { this.save({ ...this.state, pity: 0 }); }

  private save(s: ClawState): void {
    this.storage.set(KEY, s);
    this.state$.next(s);
  }
}
