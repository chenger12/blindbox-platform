import { GachaEntry } from '../../models/catalog/catalog.model';
import { GachaSpinResult, GachaStateView } from '../../models/api/api.model';
import { GACHA_PITY, GACHA_POOL, GACHA_PRICE, GACHA_PRICE_5 } from '../../utils/catalog.data';
import { isRareTier } from '../../utils/game-rules.util';
import { pick, weightedPick } from '../../utils/random.util';
import { bad, db, GameApi } from '../core';

const KEY = 'mb_gacha';

/** One capsule from the shared pool (also used by Group Pull). */
export const rollCapsule = (): GachaEntry => weightedPick(GACHA_POOL);

/** /api/games/gacha — capsule machine with a pity counter. */
export const gachaApi: GameApi = {
  id: 'gacha',
  base: 'gacha',
  routes: {
    'GET state': (): GachaStateView => ({ pity: db.get<number>(KEY) ?? 0 }),

    /** body { count: 1 | 5, trial?: boolean } */
    'POST spin': ({ acct, body }): GachaSpinResult => {
      const count = Number(body?.count);
      if (count !== 1 && count !== 5) { throw bad('badCount'); }
      let pity = db.get<number>(KEY) ?? 0;
      if (body?.trial) {
        return { entries: [rollCapsule()], uids: [], pity, ticketUsed: false };
      }
      const price = count === 5 ? GACHA_PRICE_5 : GACHA_PRICE;
      const ticketUsed = count === 1 && acct.payWithCard('gachaTickets');
      if (!ticketUsed) { acct.charge(price); }

      const entries: GachaEntry[] = [];
      for (let i = 0; i < count; i++) {
        const e = pity >= GACHA_PITY - 1 ? pick(GACHA_POOL.filter(x => x.tier === 'SR')) : rollCapsule();
        pity = isRareTier(e.tier) ? 0 : pity + 1;
        entries.push(e);
      }
      db.set(KEY, pity);
      const uids = entries.map(e => acct.grant(e.itemId, 'gacha', e.tier));
      acct.gainXp(price);
      acct.track('games');
      if (entries.some(e => isRareTier(e.tier))) { acct.track('wins'); }
      return { entries, uids, pity, ticketUsed };
    }
  }
};
