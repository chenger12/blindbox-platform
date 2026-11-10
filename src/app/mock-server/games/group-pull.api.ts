import { GachaEntry } from '../../models/catalog/catalog.model';
import { GroupLobby, GroupPullResult } from '../../models/api/api.model';
import { GroupRoom } from '../../models/game/game-state.model';
import { BOT_NAMES, GROUP_PULL_BONUS, GROUP_PULL_PRICE } from '../../utils/catalog.data';
import { itemValue } from '../../utils/game-rules.util';
import { pick, randInt, shuffle } from '../../utils/random.util';
import { bad, db, GameApi } from '../core';
import { rollCapsule } from './gacha.api';

const KEY = 'mb_group_pull';
const ROUNDS = 3;
const SIZES = [2, 3, 4];

const rooms = (): GroupRoom[] => SIZES.map(size => ({ size, bots: shuffle(BOT_NAMES).slice(0, randInt(0, size - 1)) }));

/** /api/games/group-pull — 2-4 players pull 3 capsules each; highest total value takes everything + a bonus. */
export const groupPullApi: GameApi = {
  id: 'groupPull',
  base: 'group-pull',
  routes: {
    'GET lobby': (): GroupLobby => ({ rooms: rooms(), loseStreak: db.get<number>(KEY) ?? 0 }),

    /** body { size, bots: names already seated } */
    'POST join': ({ acct, body }): GroupPullResult => {
      const size = Number(body?.size);
      if (!SIZES.includes(size)) { throw bad('badRoom'); }
      acct.charge(GROUP_PULL_PRICE);
      acct.track('games');

      const seated = (Array.isArray(body?.bots) ? body.bots : []).filter((n: unknown) => BOT_NAMES.includes(String(n))).slice(0, size - 1) as string[];
      const names = ['me', ...seated];
      while (names.length < size) { names.push(pick(BOT_NAMES.filter(n => !names.includes(n)))); }

      const rounds: GachaEntry[][] = Array.from({ length: ROUNDS }, () => names.map(() => rollCapsule()));
      const totals = names.map((_, seat) => rounds.reduce((s, r) => s + itemValue(r[seat].itemId), 0));
      const winner = totals.reduce((a, t, i) => t > totals[a] ? i : a, 0);

      const mine: Array<{ itemId: string; tier?: string }> = rounds.map(r => ({ itemId: r[0].itemId, tier: r[0].tier }));
      if (winner === 0) {
        mine.push({ itemId: GROUP_PULL_BONUS, tier: 'SR' });
        acct.track('wins');
      }
      let streak = winner === 0 ? 0 : (db.get<number>(KEY) ?? 0) + 1;
      const consolation = streak >= 3;
      if (consolation) { streak = 0; acct.giveCard('gachaTickets', 1); }
      db.set(KEY, streak);

      const items = mine.map(m => ({ ...m, uid: acct.grant(m.itemId, 'groupPull', m.tier) }));
      acct.gainXp(GROUP_PULL_PRICE);
      return { names, rounds, winner, items, consolation, loseStreak: streak };
    }
  }
};
