import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { GrantedItem, SwapEvent, SwapResult, SwapStateView } from '../../models/api/api.model';
import { randInt } from '../../utils/random.util';
import { ApiService } from '../api/api.service';
import { CatalogService } from '../catalog/catalog.service';
import { FxService } from '../fx/fx.service';
import { ToastService } from '../toast/toast.service';

export { SWAP_POST_FEE } from '../../utils/game-rules.util';
export const SWAP_LIFETIME = 3 * 864e5;

/** Client for /api/games/swap. Collectors' replies come from the server's tick endpoint. */
@Injectable({ providedIn: 'root' })
export class SwapService {
  private readonly subject = new BehaviorSubject<SwapStateView>({ posts: [], deals: [], blocked: [], rulesRead: true });
  readonly state$ = this.subject.asObservable();
  /** Items received from accepted swaps, so the page can celebrate. */
  readonly received$ = new Subject<GrantedItem>();
  private started = false;

  constructor(
    private readonly api: ApiService,
    private readonly catalog: CatalogService,
    private readonly toast: ToastService,
    private readonly fx: FxService,
    private readonly zone: NgZone
  ) {}

  get state(): SwapStateView { return this.subject.value; }

  async load(): Promise<void> {
    this.apply(await this.api.game<SwapResult>('swap', 'state', undefined, { silent: true }));
  }

  markRulesRead(): void { void this.call('rules-read'); }
  block(user: string): void { void this.call('block', { user }); }
  refresh(): void { void this.call('refresh'); }

  async createPost(uids: number[], want: string[], note: string): Promise<boolean> {
    const ok = await this.call('create-post', { uids, want, note });
    if (ok) {
      this.fx.win();
      this.later(randInt(4000, 7000), 'offer');
    }
    return !!ok;
  }

  async makeOffer(postId: string, want: string, uids: number[]): Promise<boolean> {
    const ok = await this.call('make-offer', { postId, want, uids });
    if (ok) {
      this.fx.coin();
      this.later(randInt(3500, 7000), 'resolve');
    }
    return !!ok;
  }

  /** Returns the item you received. */
  async acceptOffer(postId: string, index: number): Promise<GrantedItem | null> {
    return (await this.call('accept-offer', { postId, index }))?.item ?? null;
  }

  declineOffer(postId: string, index: number): void { void this.call('decline-offer', { postId, index }); }
  unlist(postId: string): void { void this.call('unlist', { postId }); }

  start(): void {
    if (this.started) { return; }
    this.started = true;
    void this.load().then(() => {
      if (this.state.posts.some(p => p.myOffer?.status === 'pending')) { this.later(randInt(2500, 5000), 'resolve'); }
    });
    const offerLoop = (): void => { this.zone.run(() => void this.tick('offer')); setTimeout(offerLoop, randInt(15000, 26000)); };
    const postLoop = (): void => { this.zone.run(() => void this.tick('activity')); setTimeout(postLoop, randInt(9000, 16000)); };
    this.zone.runOutsideAngular(() => { setTimeout(offerLoop, 20000); setTimeout(postLoop, 8000); });
  }

  private later(ms: number, kind: 'offer' | 'resolve'): void {
    setTimeout(() => this.zone.run(() => void this.tick(kind)), ms);
  }

  private async tick(kind: 'offer' | 'resolve' | 'activity'): Promise<void> {
    const r = await this.api.game<SwapResult>('swap', 'tick', { kind }, { silent: true });
    this.apply(r);
    r?.events.forEach(e => this.announce(e));
  }

  private announce(e: SwapEvent): void {
    if (e.type === 'offer') {
      this.toast.show('swap.toastOffer', { user: e.user, item: this.catalog.name(e.itemId), target: this.catalog.name(e.target) });
      this.fx.coin();
      this.fx.vibrate(30);
    } else if (e.type === 'accepted') {
      this.toast.show('swap.toastAccepted', { user: e.user });
      this.fx.win();
      this.received$.next(e.item);
    } else {
      this.fx.fail();
      this.toast.show('swap.toastDeclined', { user: e.user });
    }
  }

  private async call(action: string, body: unknown = {}): Promise<SwapResult | null> {
    const r = await this.api.game<SwapResult>('swap', action, body);
    this.apply(r);
    return r;
  }

  private apply(r: SwapResult | null): void {
    if (r) { this.subject.next(r.state); }
  }
}
