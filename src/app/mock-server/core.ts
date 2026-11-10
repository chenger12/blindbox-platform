import { AccountSnapshot } from '../models/api/api.model';
import { GameId } from '../models/theme/theme.model';
import { DailyState, InventoryEntry, ItemSource, LockReason, ValuePoint, WalletState } from '../models/user/user.model';
import { STARTING_COINS } from '../utils/catalog.data';
import { itemValue, levelNeed } from '../utils/game-rules.util';
import { todayKey } from '../utils/random.util';

/**
 * In-browser stand-in for the game server. Everything under src/app/mock-server is
 * "server side": it owns the player's coins, inventory, daily progress and every game's
 * state, and it decides every outcome. The app only talks to it through /api/... HTTP
 * calls, so it can be replaced by a real backend without touching the pages.
 */

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); }
}

export const bad = (code: string): ApiError => new ApiError(400, code);
export const notFound = (code = 'notFound'): ApiError => new ApiError(404, code);

/** The server's "database": localStorage, one key per table. */
export const db = {
  get<T>(key: string): T | undefined {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : undefined;
    } catch {
      return undefined;
    }
  },
  set(key: string, value: unknown): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota or private mode */ }
  }
};

export const clone = <T>(x: T): T => structuredClone(x);

// ---------------------------------------------------------------------------
// Account: wallet + inventory + daily progress
// ---------------------------------------------------------------------------

const WALLET = 'mb_wallet';
const INVENTORY = 'mb_inventory';
const DAILY = 'mb_daily';

interface InvStore { entries: InventoryEntry[]; nextUid: number; history: ValuePoint[]; }
type Card = 'gachaTickets' | 'hintCards' | 'xrayCards' | 'swapTickets';

/** Loaded once per request, mutated by the handler, saved when the request succeeds. */
export class Account {
  readonly wallet: WalletState;
  readonly daily: DailyState;
  private readonly inv: InvStore;
  /** Wallet right after the last payment (see ApiEnvelope.paid). */
  paid?: WalletState;

  constructor() {
    const fresh: WalletState = { coins: STARTING_COINS, xp: 0, level: 1, gachaTickets: 1, hintCards: 2, xrayCards: 1, swapTickets: 3, promoUsed: false };
    this.wallet = { ...fresh, ...(db.get<WalletState>(WALLET) ?? {}) };
    this.daily = Account.rollDay(db.get<DailyState>(DAILY));
    const inv = db.get<InvStore>(INVENTORY);
    this.inv = inv ?? { entries: [], nextUid: 1, history: [] };
    if (!inv) { ['mf_bu', 'mf_cao', 'pj_mint', 'pn_coco'].forEach((id, i) => this.grant(id, 'gift', i === 1 ? 'R' : undefined)); }
  }

  private static rollDay(prev?: DailyState): DailyState {
    const day = todayKey();
    if (prev && prev.day === day) { return prev; }
    return {
      day, freeBoxClaimed: false, freeBoxOpened: false, wheelSpun: false,
      checkInStreak: prev?.checkInStreak ?? 0, lastCheckIn: prev?.lastCheckIn ?? '',
      missions: { opened: 0, games: 0, wins: 0, claimed: [] }
    };
  }

  // coins ------------------------------------------------------------------
  /** Takes coins or fails with 402 noCoins. */
  charge(n: number): void {
    n = Math.round(n);
    if (n <= 0) { return; }
    if (this.wallet.coins < n) { throw new ApiError(402, 'noCoins'); }
    this.wallet.coins -= n;
    this.markPaid();
  }

  credit(n: number): void {
    this.wallet.coins += Math.max(0, Math.round(n));
  }

  /** Pays with one card when the player has it. Returns false when they have none. */
  payWithCard(kind: Card): boolean {
    if (this.wallet[kind] <= 0) { return false; }
    this.wallet[kind]--;
    this.markPaid();
    return true;
  }

  giveCard(kind: Card, n = 1): void {
    this.wallet[kind] = Math.max(0, this.wallet[kind] + n);
  }

  markPaid(): void {
    this.paid = { ...this.wallet };
  }

  gainXp(amount: number): void {
    const w = this.wallet;
    w.xp += Math.round(amount);
    while (w.xp >= levelNeed(w.level)) { w.xp -= levelNeed(w.level); w.level++; w.coins += 100; }
  }

  // inventory --------------------------------------------------------------
  get entries(): InventoryEntry[] { return this.inv.entries; }

  entry(uid: number): InventoryEntry | undefined {
    return this.inv.entries.find(e => e.uid === uid);
  }

  /** Entries the player owns and that are not locked in a listing / swap. */
  requireFree(uids: number[]): InventoryEntry[] {
    const list = [...new Set(uids)].map(u => this.entry(u));
    if (!list.length || list.some(e => !e || e.locked)) { throw bad('itemUnavailable'); }
    return list as InventoryEntry[];
  }

  grant(itemId: string, source: ItemSource, tier?: string): number {
    const uid = this.inv.nextUid++;
    this.inv.entries = [{ uid, itemId, source, tier, createdAt: Date.now() }, ...this.inv.entries];
    this.recordValue();
    return uid;
  }

  removeItems(uids: number[]): void {
    const set = new Set(uids);
    this.inv.entries = this.inv.entries.filter(e => !set.has(e.uid));
    this.recordValue();
  }

  lock(uids: number[], reason: LockReason | null): void {
    const set = new Set(uids);
    this.inv.entries = this.inv.entries.map(e => set.has(e.uid) ? { ...e, locked: reason ?? undefined } : e);
  }

  private recordValue(): void {
    const v = this.inv.entries.reduce((s, e) => s + itemValue(e.itemId), 0);
    this.inv.history = [...this.inv.history, { t: Date.now(), v }].slice(-240);
  }

  // daily ------------------------------------------------------------------
  track(field: 'opened' | 'games' | 'wins', n = 1): void {
    this.daily.missions[field] += n;
  }

  // persistence ------------------------------------------------------------
  save(): void {
    db.set(WALLET, this.wallet);
    db.set(INVENTORY, this.inv);
    db.set(DAILY, this.daily);
  }

  snapshot(): AccountSnapshot {
    return clone({ wallet: this.wallet, inventory: { entries: this.inv.entries, history: this.inv.history }, daily: this.daily });
  }
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

export interface Ctx<B = any> { acct: Account; body: B; }
export type Handler = (ctx: Ctx) => unknown;
/** Keys look like 'GET state' or 'POST pull'. */
export type Routes = Record<string, Handler>;

export interface GameApi { id: GameId; base: string; routes: Routes; }
