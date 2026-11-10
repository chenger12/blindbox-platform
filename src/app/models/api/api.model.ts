import { GachaEntry, KujiTier } from '../catalog/catalog.model';
import { BattleRoom, BlindBoxState, GroupRoom, KujiState, WheelLog } from '../game/game-state.model';
import { Listing, Sale, SwapDeal, SwapPost } from '../market/market.model';
import { DailyState, InventoryEntry, ValuePoint, WalletState } from '../user/user.model';

/**
 * Contract between the app and the API (`/api/...`).
 * Every account / game endpoint answers with an ApiEnvelope: the endpoint's own `data`
 * plus the player's account after the action, so coins and inventory never drift.
 * Implemented today by the in-browser mock server (src/app/mock-server); a real server
 * only has to return the same shapes.
 */
export interface AccountSnapshot {
  wallet: WalletState;
  inventory: { entries: InventoryEntry[]; history: ValuePoint[] };
  daily: DailyState;
}

export interface ApiEnvelope<T> {
  data: T;
  account?: AccountSnapshot;
  /** Wallet right after paying, before any winnings — lets the UI show the charge first and the prize after the animation. */
  paid?: WalletState;
}

export interface ApiErrorBody { code: string; }

/** An item granted to the player; `uid` is the inventory entry. */
export interface GrantedItem { itemId: string; uid?: number; tier?: string; }

// boxes ---------------------------------------------------------------------
export interface BoxOpenResult { items: GrantedItem[]; }

// kuji ----------------------------------------------------------------------
export interface KujiPullView { itemId: string; tier: KujiTier; }
export interface KujiPullResult { pulls: KujiPullView[]; uids: number[]; lastOne: boolean; state: KujiState; }
export interface KujiTickResult { state: KujiState; pull: KujiPullView | null; current: boolean; }

// gacha ---------------------------------------------------------------------
export interface GachaStateView { pity: number; }
export interface GachaSpinResult { entries: GachaEntry[]; uids: number[]; pity: number; ticketUsed: boolean; }

// blind box -----------------------------------------------------------------
export interface BlindBoxActionResult<T = null> { state: BlindBoxState; value: T; }
export interface BlindBoxBuyResult { state: BlindBoxState; items: GrantedItem[]; }

// claw ----------------------------------------------------------------------
export interface ClawStateView { pity: number; plays: number; }
export interface ClawStartResult { playId: string; strong: boolean; state: ClawStateView; }
export interface ClawGrabResult { grip: boolean; slip: boolean; }
export interface ClawFinishResult { won: boolean; item: GrantedItem | null; state: ClawStateView; }

// group pull ----------------------------------------------------------------
export interface GroupLobby { rooms: GroupRoom[]; loseStreak: number; }
export interface GroupPullResult {
  names: string[];
  /** rounds[r][seat] */
  rounds: GachaEntry[][];
  winner: number;
  items: GrantedItem[];
  consolation: boolean;
  loseStreak: number;
}

// battles -------------------------------------------------------------------
export interface BattleResult {
  room: BattleRoom;
  names: string[];
  /** rolls[round][player] = itemId */
  rolls: string[][];
  winner: number;
  bonus: number;
  /** Your items, when you played. */
  items: GrantedItem[];
  lobby: BattleRoom[];
}

// market --------------------------------------------------------------------
export interface MarketStateView { listings: Listing[]; sales: Sale[]; }
export interface MarketBuyResult { state: MarketStateView; item: GrantedItem; }
export interface MarketTickResult { state: MarketStateView; sold: Array<{ itemId: string; price: number; got: number }>; }

// swap ----------------------------------------------------------------------
export interface SwapStateView { posts: SwapPost[]; deals: SwapDeal[]; blocked: string[]; rulesRead: boolean; }
export type SwapEvent =
  | { type: 'offer'; user: string; itemId: string; target: string }
  | { type: 'accepted'; user: string; item: GrantedItem }
  | { type: 'declined'; user: string };
export interface SwapResult { state: SwapStateView; events: SwapEvent[]; item?: GrantedItem; }

// wheel ---------------------------------------------------------------------
export interface WheelStateView { log: WheelLog[]; freeToday: boolean; respin: boolean; }
export interface WheelSpinResult { index: number; item: GrantedItem | null; state: WheelStateView; }
