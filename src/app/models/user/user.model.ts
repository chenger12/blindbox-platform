export type ItemSource = 'box' | 'kuji' | 'gacha' | 'blindBox' | 'claw' | 'groupPull' | 'battle' | 'market' | 'swap' | 'wheel' | 'gift';
export type LockReason = 'market' | 'swap';

export interface InventoryEntry {
  uid: number;
  itemId: string;
  source: ItemSource;
  createdAt: number;
  tier?: string;
  locked?: LockReason;
}

export interface WalletState {
  coins: number;
  xp: number;
  level: number;
  gachaTickets: number;
  hintCards: number;
  xrayCards: number;
  swapTickets: number;
  promoUsed: boolean;
}

export type MissionId = 'open3' | 'play2' | 'win1';

export interface DailyState {
  day: string;
  freeBoxClaimed: boolean;
  /** The claimed free starter box has been opened. */
  freeBoxOpened?: boolean;
  wheelSpun: boolean;
  checkInStreak: number;
  lastCheckIn: string;
  missions: { opened: number; games: number; wins: number; claimed: MissionId[] };
}

export interface FeedEntry {
  id: string;
  user: string;
  itemId: string;
  source: string;
  createdAt: number;
}

export interface ValuePoint {
  t: number;
  v: number;
}

export interface AdminSession {
  token: string;
  username: string;
}
