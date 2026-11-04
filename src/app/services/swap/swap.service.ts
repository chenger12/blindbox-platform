import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { SwapDeal, SwapPost } from '../../models/market/market.model';
import { BOT_NAMES, ITEMS } from '../../utils/catalog.data';
import { pick, randInt, uid } from '../../utils/random.util';
import { CatalogService } from '../catalog/catalog.service';
import { FxService } from '../fx/fx.service';
import { InventoryService } from '../inventory/inventory.service';
import { StorageService } from '../storage/storage.service';
import { ToastService } from '../toast/toast.service';
import { WalletService } from '../wallet/wallet.service';

const KEY = 'mb_swap';
export const SWAP_POST_FEE = 10;
export const SWAP_LIFETIME = 3 * 864e5;
const NOTE_KEYS = Array.from({ length: 10 }, (_, i) => `swap.note${i + 1}`);

interface SwapState { posts: SwapPost[]; deals: SwapDeal[]; blocked: string[]; rulesRead: boolean; }

@Injectable({ providedIn: 'root' })
export class SwapService {
  private readonly subject: BehaviorSubject<SwapState>;
  readonly state$;
  /** Item ids received from accepted swaps, so the page can celebrate. */
  readonly received$ = new Subject<string>();
  private started = false;

  constructor(
    private readonly storage: StorageService,
    private readonly catalog: CatalogService,
    private readonly inventory: InventoryService,
    private readonly wallet: WalletService,
    private readonly toast: ToastService,
    private readonly fx: FxService,
    private readonly zone: NgZone
  ) {
    this.subject = new BehaviorSubject<SwapState>(this.storage.get<SwapState>(KEY) ?? this.seed());
    this.state$ = this.subject.asObservable();
  }

  get state(): SwapState { return this.subject.value; }

  markRulesRead(): void { this.save({ ...this.state, rulesRead: true }); }

  block(user: string): void { this.save({ ...this.state, blocked: [...this.state.blocked, user] }); }

  refresh(): void {
    const fresh = Array.from({ length: randInt(1, 3) }, () => this.botPost());
    this.save({ ...this.state, posts: [...fresh, ...this.state.posts].slice(0, 40) });
  }

  createPost(uids: number[], want: string[], note: string): boolean {
    const w = this.wallet.state;
    if (w.swapTickets > 0) { this.wallet.useCard('swapTickets'); }
    else if (!this.wallet.trySpend(SWAP_POST_FEE)) { return false; }
    const give = uids.map(u => this.inventory.get(u)?.itemId).filter((x): x is string => !!x);
    this.inventory.setLock(uids, 'swap');
    const post: SwapPost = { id: uid('m'), author: 'me', mine: true, note: note || undefined, noteKey: note ? undefined : 'swap.noteDefault',
      give, giveUids: uids, want, interested: 0, status: 'open', createdAt: Date.now(), offers: [] };
    this.save({ ...this.state, posts: [post, ...this.state.posts] });
    this.fx.win();
    setTimeout(() => this.zone.run(() => this.botOffer()), randInt(4000, 7000));
    return true;
  }

  makeOffer(postId: string, want: string, uids: number[]): void {
    const s = structuredClone(this.state);
    const p = s.posts.find(x => x.id === postId);
    if (!p) { return; }
    p.myOffer = { want, uids, itemIds: uids.map(u => this.inventory.get(u)?.itemId ?? ''), status: 'pending' };
    p.interested++;
    this.inventory.setLock(uids, 'swap');
    this.save(s);
    this.fx.coin();
    setTimeout(() => this.zone.run(() => this.resolveMyOffer(postId)), randInt(3500, 7000));
  }

  acceptOffer(postId: string, index: number): string | null {
    const s = structuredClone(this.state);
    const p = s.posts.find(x => x.id === postId);
    const o = p?.offers[index];
    if (!p || !o || o.status !== 'pending') { return null; }
    if (o.targetUid === undefined || !this.inventory.get(o.targetUid)) { o.status = 'void'; this.save(s); return null; }
    o.status = 'accepted';
    this.inventory.remove([o.targetUid]);
    const gi = p.giveUids?.indexOf(o.targetUid) ?? -1;
    if (gi >= 0) { p.giveUids?.splice(gi, 1); p.give.splice(gi, 1); }
    p.offers.forEach(x => { if (x !== o && x.status === 'pending' && x.targetUid === o.targetUid) { x.status = 'void'; } });
    if (!p.give.length) { p.status = 'done'; }
    this.inventory.add(o.itemId, 'swap');
    s.deals = [{ a: o.from, b: 'me', itemA: o.itemId, itemB: o.targetItemId, createdAt: Date.now() }, ...s.deals].slice(0, 40);
    this.save(s);
    return o.itemId;
  }

  declineOffer(postId: string, index: number): void {
    const s = structuredClone(this.state);
    const o = s.posts.find(x => x.id === postId)?.offers[index];
    if (o) { o.status = 'declined'; this.save(s); }
  }

  unlist(postId: string): void {
    const s = structuredClone(this.state);
    const p = s.posts.find(x => x.id === postId);
    if (!p) { return; }
    p.status = 'unlisted';
    p.offers.forEach(o => { if (o.status === 'pending') { o.status = 'void'; } });
    this.inventory.setLock(p.giveUids ?? [], null);
    this.save(s);
  }

  start(): void {
    if (this.started) { return; }
    this.started = true;
    this.state.posts.forEach(p => { if (p.myOffer?.status === 'pending') { setTimeout(() => this.zone.run(() => this.resolveMyOffer(p.id)), randInt(2500, 5000)); } });
    const offerLoop = (): void => { this.zone.run(() => this.botOffer()); setTimeout(offerLoop, randInt(15000, 26000)); };
    const postLoop = (): void => { this.zone.run(() => this.botActivity()); setTimeout(postLoop, randInt(9000, 16000)); };
    this.zone.runOutsideAngular(() => { setTimeout(offerLoop, 20000); setTimeout(postLoop, 8000); });
  }

  private resolveMyOffer(postId: string): void {
    const s = structuredClone(this.state);
    const p = s.posts.find(x => x.id === postId);
    const m = p?.myOffer;
    if (!p || !m || m.status !== 'pending') { return; }
    const owned = m.uids.every(u => this.inventory.get(u));
    const sum = m.itemIds.reduce((a, id) => a + this.catalog.item(id).value, 0);
    const want = this.catalog.item(m.want).value;
    const chance = sum >= want * 0.8 ? 0.8 : sum >= want * 0.4 ? 0.35 : 0.08;
    if (owned && p.give.includes(m.want) && Math.random() < chance) {
      m.status = 'accepted';
      this.inventory.remove(m.uids);
      this.inventory.add(m.want, 'swap');
      p.give = p.give.filter(id => id !== m.want);
      if (!p.give.length) { p.status = 'done'; }
      s.deals = [{ a: 'me', b: p.author, itemA: m.itemIds[0], itemB: m.want, createdAt: Date.now() }, ...s.deals].slice(0, 40);
      this.save(s);
      this.toast.show('swap.toastAccepted', { user: p.author });
      this.fx.win();
      this.received$.next(m.want);
    } else {
      m.status = 'declined';
      this.inventory.setLock(m.uids, null);
      this.save(s);
      this.fx.fail();
      this.toast.show('swap.toastDeclined', { user: p.author });
    }
  }

  private botOffer(): void {
    const s = structuredClone(this.state);
    const mine = s.posts.filter(p => p.mine && p.status === 'open' && p.give.length && p.offers.filter(o => o.status === 'pending').length < 3);
    if (!mine.length) { return; }
    const p = pick(mine);
    const ti = randInt(0, p.give.length - 1);
    const target = p.give[ti];
    const tv = this.catalog.item(target).value;
    let cand = p.want.length && Math.random() < 0.6 ? p.want : ITEMS.filter(x => x.id !== target && x.value >= tv * 0.6 && x.value <= tv * 1.8).map(x => x.id);
    if (!cand.length) { cand = ITEMS.filter(x => x.value <= tv * 2 && x.id !== target).map(x => x.id); }
    const itemId = pick(cand);
    const from = pick(BOT_NAMES);
    p.offers.unshift({ id: uid('o'), from, itemId, targetItemId: target, targetUid: p.giveUids?.[ti], status: 'pending', createdAt: Date.now() });
    p.interested++;
    this.save(s);
    this.toast.show('swap.toastOffer', { user: from, item: this.catalog.name(itemId), target: this.catalog.name(target) });
    this.fx.coin();
    this.fx.vibrate(30);
  }

  private botActivity(): void {
    const s = structuredClone(this.state);
    s.posts = [this.botPost(), ...s.posts].slice(0, 40);
    if (Math.random() < 0.5) { s.deals = [this.botDeal(), ...s.deals].slice(0, 40); }
    this.save(s);
  }

  private botPost(at = Date.now()): SwapPost {
    const pool = ITEMS.filter(x => x.value < 900 || Math.random() < 0.12);
    const give: string[] = [];
    const n = randInt(1, 3);
    while (give.length < n) { const it = pick(pool).id; if (!give.includes(it)) { give.push(it); } }
    const want = Math.random() < 0.35 ? [] : [pick(pool.filter(x => !give.includes(x.id))).id];
    return { id: uid('p'), author: pick(BOT_NAMES), noteKey: pick(NOTE_KEYS), give, want, interested: randInt(0, 12), status: 'open', createdAt: at, offers: [] };
  }

  private botDeal(at = Date.now()): SwapDeal {
    const a = pick(ITEMS.filter(x => x.value <= 300));
    const bs = ITEMS.filter(x => x.id !== a.id && x.value >= a.value * 0.6 && x.value <= a.value * 1.6);
    return { a: pick(BOT_NAMES), b: pick(BOT_NAMES), itemA: a.id, itemB: pick(bs.length ? bs : ITEMS).id, createdAt: at };
  }

  private seed(): SwapState {
    const posts = Array.from({ length: 12 }, () => this.botPost(Date.now() - randInt(3, 1800) * 60000)).sort((a, b) => b.createdAt - a.createdAt);
    const deals = Array.from({ length: 10 }, () => this.botDeal(Date.now() - randInt(5, 2000) * 60000)).sort((a, b) => b.createdAt - a.createdAt);
    const s: SwapState = { posts, deals, blocked: [], rulesRead: false };
    this.storage.set(KEY, s);
    return s;
  }

  private save(s: SwapState): void {
    this.storage.set(KEY, s);
    this.subject.next(s);
  }
}
