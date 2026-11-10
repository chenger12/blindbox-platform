import { BattleResult } from '../../models/api/api.model';
import { BattleRoom } from '../../models/game/game-state.model';
import { BOT_NAMES } from '../../utils/catalog.data';
import { battleCost, itemValue, rollBox, WEIGHTED_BOXES, weightedBox } from '../../utils/game-rules.util';
import { pick, randInt, uid } from '../../utils/random.util';
import { Account, bad, clone, db, GameApi, notFound } from '../core';

const KEY = 'mb_battles';
const MAX_ROUNDS = 5;

function generate(live = false): BattleRoom {
  const players = pick([2, 2, 2, 3, 4]);
  const cheap = WEIGHTED_BOXES.filter(b => b.price <= 129);
  return {
    id: uid('b'), players,
    rounds: Array.from({ length: randInt(1, 4) }, () => pick(cheap).id),
    joined: Array.from({ length: live ? players : randInt(1, players - 1) }, () => pick(BOT_NAMES)),
    live
  };
}

function load(): BattleRoom[] {
  const saved = db.get<BattleRoom[]>(KEY);
  return saved && saved.length >= 4 ? saved : [generate(true), generate(), generate(), generate(true), generate(), generate(), generate()];
}

/** Removes a room from the lobby and back-fills it. */
function take(id: unknown): { room: BattleRoom; lobby: BattleRoom[] } {
  const list = load();
  const room = list.find(x => x.id === id);
  if (!room) { throw notFound('battleGone'); }
  const lobby = [...list.filter(x => x !== room), generate(room.live)];
  db.set(KEY, lobby);
  return { room, lobby };
}

/** Plays the whole battle on the server. `acct` is set when you are player 1. */
function play(room: BattleRoom, lobby: BattleRoom[], acct: Account | null): BattleResult {
  const names = [...(acct ? ['me'] : []), ...room.joined].slice(0, room.players);
  while (names.length < room.players) { names.push(pick(BOT_NAMES.filter(n => !names.includes(n)))); }
  const rolls = room.rounds.map(boxId => {
    const box = weightedBox(boxId);
    if (!box) { throw bad('badBox'); }
    return names.map(() => rollBox(box));
  });
  const totals = names.map((_, p) => rolls.reduce((s, r) => s + itemValue(r[p]), 0));
  const winner = totals.reduce((a, t, i) => t > totals[a] ? i : a, 0);
  const bonus = Math.round(totals.reduce((a, b) => a + b, 0) * 0.1);
  let items: BattleResult['items'] = [];
  if (acct) {
    items = rolls.map(r => ({ itemId: r[0], uid: acct.grant(r[0], 'battle') }));
    acct.gainXp(battleCost(room.rounds));
    if (winner === 0) { acct.credit(bonus); acct.track('wins'); }
  }
  return { room, names, rolls, winner, bonus, items, lobby: clone(lobby) };
}

/** /api/games/battles — box battles: everyone opens the same boxes, highest total wins a 10% bonus. */
export const battlesApi: GameApi = {
  id: 'battles',
  base: 'battles',
  routes: {
    'GET lobby': () => {
      const list = load();
      db.set(KEY, list);
      return list;
    },

    /** body { id } */
    'POST join': ({ acct, body }): BattleResult => {
      const cost = battleCost(load().find(x => x.id === body?.id)?.rounds ?? []);
      acct.charge(cost);
      acct.track('games');
      const { room, lobby } = take(body?.id);
      return play(room, lobby, acct);
    },

    /** Spectate without paying. body { id } */
    'POST watch': ({ body }): BattleResult => {
      const { room, lobby } = take(body?.id);
      return play(room, lobby, null);
    },

    /** body { players: 2-4, rounds: boxId[] (1-5) } */
    'POST create': ({ acct, body }): BattleResult => {
      const players = Number(body?.players);
      const rounds: string[] = Array.isArray(body?.rounds) ? body.rounds.map(String) : [];
      if (![2, 3, 4].includes(players) || !rounds.length || rounds.length > MAX_ROUNDS || rounds.some(id => !weightedBox(id))) {
        throw bad('badBattle');
      }
      acct.charge(battleCost(rounds));
      acct.track('games');
      const room: BattleRoom = { id: uid('mine'), players, rounds, joined: [], live: false };
      return play(room, load(), acct);
    }
  }
};
