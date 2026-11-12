import { WheelSpinResult, WheelStateView } from '../../models/api/api.model';
import { WheelLog } from '../../models/game/game-state.model';
import { KUJI_PRIZES } from '../../utils/catalog.data';
import { WHEEL_SEGMENTS, WHEEL_SPIN_PRICE } from '../../utils/game-rules.util';
import { pick, weightedPick } from '../../utils/random.util';
import { Account, bad, db, GameApi, gameOdds } from '../core';

const KEY = 'mb_wheel';
interface WheelStore { log: WheelLog[]; respin: boolean; }

const load = (): WheelStore => {
  const s = db.get<WheelStore>(KEY) ?? db.get<WheelLog[]>('mb_wheel_log');
  return Array.isArray(s) || !s ? { log: Array.isArray(s) ? s : [], respin: false } : s;
};
const view = (s: WheelStore, acct: Account): WheelStateView => ({ log: s.log, freeToday: !acct.daily.wheelSpun, respin: s.respin });

/** /api/games/wheel — lucky wheel: one free spin a day, then paid spins. */
export const wheelApi: GameApi = {
  id: 'wheel',
  base: 'wheel',
  routes: {
    'GET state': ({ acct }) => view(load(), acct),

    /** body { respin?: boolean } — a respin is only allowed right after landing on "spin again". */
    'POST spin': ({ acct, body }): WheelSpinResult => {
      const s = load();
      if (body?.respin) {
        if (!s.respin) { throw bad('noRespin'); }
        s.respin = false;
      } else if (!acct.daily.wheelSpun) {
        acct.daily.wheelSpun = true;
      } else {
        acct.charge(WHEEL_SPIN_PRICE);
      }
      // Segment weights come from the back office (falling back to defaults); each slice's
      // reward is fixed by its index, so players see and get the same odds.
      const tuned = gameOdds('wheel').weights ?? WHEEL_SEGMENTS.map((s, i) => ({ key: String(i), labelKey: s.labelKey, weight: s.weight }));
      const index = Number(weightedPick(tuned).key);
      const r = WHEEL_SEGMENTS[index].reward;
      let item = null;
      if (r.coins) { acct.credit(r.coins); }
      if (r.hint) { acct.giveCard('hintCards', r.hint); }
      if (r.ticket) { acct.giveCard('gachaTickets', r.ticket); }
      if (r.item) {
        const itemId = pick(KUJI_PRIZES.filter(p => p.tier === 'D')).itemId;
        item = { itemId, uid: acct.grant(itemId, 'wheel') };
      }
      if (r.again) { s.respin = true; }
      s.log = [{ index, at: Date.now() }, ...s.log].slice(0, 20);
      db.set(KEY, s);
      return { index, item, state: view(s, acct) };
    }
  }
};
