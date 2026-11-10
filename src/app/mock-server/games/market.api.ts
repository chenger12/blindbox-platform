import { MarketBuyResult, MarketStateView, MarketTickResult } from '../../models/api/api.model';
import { Listing } from '../../models/market/market.model';
import { BOT_NAMES, ITEMS } from '../../utils/catalog.data';
import { itemValue, MARKET_FEE } from '../../utils/game-rules.util';
import { pick, rand, randInt, uid } from '../../utils/random.util';
import { bad, clone, db, GameApi, notFound } from '../core';

const KEY = 'mb_market';

function botListing(): Listing {
  let it = pick(ITEMS);
  if (it.value > 400 && Math.random() < 0.6) { it = pick(ITEMS); }
  return { id: uid('l'), itemId: it.id, seller: pick(BOT_NAMES), price: Math.max(5, Math.round(it.value * rand(0.82, 1.35))), createdAt: Date.now() - randInt(1, 600) * 60000 };
}

function load(): MarketStateView {
  return db.get<MarketStateView>(KEY) ?? {
    listings: Array.from({ length: 18 }, botListing),
    sales: Array.from({ length: 8 }, () => { const l = botListing(); return { itemId: l.itemId, price: l.price, createdAt: Date.now() - randInt(1, 300) * 60000 }; })
  };
}

const save = (s: MarketStateView): MarketStateView => { db.set(KEY, s); return clone(s); };
const recordSale = (s: MarketStateView, l: Listing): void => {
  s.listings = s.listings.filter(x => x.id !== l.id);
  s.sales = [{ itemId: l.itemId, price: l.price, createdAt: Date.now() }, ...s.sales].slice(0, 30);
};

/** /api/games/market — player-to-player marketplace with a 5% seller fee. */
export const marketApi: GameApi = {
  id: 'market',
  base: 'market',
  routes: {
    'GET state': () => save(load()),

    /** body { id } */
    'POST buy': ({ acct, body }): MarketBuyResult => {
      const s = load();
      const l = s.listings.find(x => x.id === body?.id);
      if (!l) { throw notFound('listingGone'); }
      if (l.mine) { throw bad('ownListing'); }
      acct.charge(l.price);
      recordSale(s, l);
      return { state: save(s), item: { itemId: l.itemId, uid: acct.grant(l.itemId, 'market') } };
    },

    /** body { uid, price } */
    'POST list': ({ acct, body }) => {
      const s = load();
      const [e] = acct.requireFree([Number(body?.uid)]);
      const price = Math.max(1, Math.round(Number(body?.price) || 0));
      acct.lock([e.uid], 'market');
      s.listings = [{ id: uid('m'), itemId: e.itemId, seller: 'you', mine: true, uid: e.uid, price, createdAt: Date.now() }, ...s.listings];
      return save(s);
    },

    /** body { id } */
    'POST unlist': ({ acct, body }) => {
      const s = load();
      const l = s.listings.find(x => x.id === body?.id && x.mine);
      if (!l) { throw notFound('listingGone'); }
      if (l.uid) { acct.lock([l.uid], null); }
      s.listings = s.listings.filter(x => x !== l);
      return save(s);
    },

    /** Background activity: your listings may sell, new bot listings appear. */
    'POST tick': ({ acct }): MarketTickResult => {
      const s = load();
      const sold: MarketTickResult['sold'] = [];
      const mine = s.listings.filter(l => l.mine && Date.now() - l.createdAt > 6000);
      if (mine.length) {
        const l = pick(mine);
        const ratio = l.price / itemValue(l.itemId);
        const chance = ratio <= 1.1 ? 0.55 : ratio <= 1.4 ? 0.22 : 0.04;
        if (Math.random() < chance) {
          if (l.uid) { acct.removeItems([l.uid]); }
          const got = Math.round(l.price * (1 - MARKET_FEE));
          acct.credit(got);
          recordSale(s, l);
          sold.push({ itemId: l.itemId, price: l.price, got });
        }
      }
      if (Math.random() < 0.35) {
        s.listings = [...s.listings, botListing()];
        if (s.listings.length > 30) { s.listings.splice(s.listings.findIndex(x => !x.mine), 1); }
      }
      return { state: save(s), sold };
    }
  }
};
