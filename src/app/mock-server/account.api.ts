import { MissionId } from '../models/user/user.model';
import { PROMO_CODE } from '../utils/catalog.data';
import { CHECK_IN_REWARDS, itemValue, MISSIONS, SELL_RATE, TOP_UP_COINS } from '../utils/game-rules.util';
import { todayKey } from '../utils/random.util';
import { bad, Routes } from './core';

/** /api/account — the player's wallet, inventory and daily rewards (not a game, never switched off). */
export const accountRoutes: Routes = {
  'GET ': () => null,

  /** Demo only: free coins. */
  'POST top-up': ({ acct }) => {
    acct.credit(TOP_UP_COINS);
    return { coins: TOP_UP_COINS };
  },

  /** Instant sell back at SELL_RATE of value. body { uids } */
  'POST sell': ({ acct, body }) => {
    const entries = acct.requireFree(Array.isArray(body?.uids) ? body.uids : []);
    const coins = Math.round(entries.reduce((s, e) => s + itemValue(e.itemId), 0) * SELL_RATE);
    acct.removeItems(entries.map(e => e.uid));
    acct.credit(coins);
    return { n: entries.length, coins };
  },

  /** body { code } */
  'POST promo': ({ acct, body }) => {
    const code = String(body?.code ?? '').trim().toUpperCase();
    if (code !== PROMO_CODE || acct.wallet.promoUsed) { throw bad('promoBad'); }
    acct.wallet.promoUsed = true;
    acct.credit(200);
    return { coins: 200 };
  },

  'POST check-in': ({ acct }) => {
    const d = acct.daily;
    if (d.lastCheckIn === todayKey()) { throw bad('alreadyCheckedIn'); }
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    d.checkInStreak = d.lastCheckIn === yesterday ? (d.checkInStreak % 7) + 1 : 1;
    d.lastCheckIn = todayKey();
    const coins = CHECK_IN_REWARDS[d.checkInStreak - 1];
    acct.credit(coins);
    return { coins };
  },

  /** body { id } */
  'POST missions/claim': ({ acct, body }) => {
    const d = acct.daily;
    const m = MISSIONS.find(x => x.id === (body?.id as MissionId));
    if (!m || d.missions.claimed.includes(m.id) || d.missions[m.field] < m.goal) { throw bad('missionNotReady'); }
    d.missions.claimed.push(m.id);
    acct.credit(m.reward);
    return { coins: m.reward };
  },

  /** Unlocks today's free open of the starter box. */
  'POST free-box': ({ acct }) => {
    if (acct.daily.freeBoxClaimed) { throw bad('freeBoxUsed'); }
    acct.daily.freeBoxClaimed = true;
    acct.daily.freeBoxOpened = false;
    return { boxId: 'starter' };
  }
};
