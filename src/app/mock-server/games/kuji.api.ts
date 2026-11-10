import { KujiPrize } from '../../models/catalog/catalog.model';
import { KujiPullResult, KujiPullView, KujiTickResult } from '../../models/api/api.model';
import { KujiBox, KujiState } from '../../models/game/game-state.model';
import { BOT_NAMES, KUJI_BOX_COUNT, KUJI_LAST_ONE, KUJI_PRIZES, KUJI_TICKETS } from '../../utils/catalog.data';
import { isRareTier, kujiCost } from '../../utils/game-rules.util';
import { pick, randInt } from '../../utils/random.util';
import { bad, clone, db, GameApi } from '../core';

const KEY = 'mb_kuji';
const LOCK_MS = 180000;

export const kujiRemaining = (box: KujiBox): number => Object.values(box.remaining).reduce((a, b) => a + b, 0);

function drawFrom(box: KujiBox, commit: boolean): KujiPrize | null {
  const rem = kujiRemaining(box);
  if (!rem) { return null; }
  let x = Math.random() * rem;
  for (const p of KUJI_PRIZES) {
    x -= box.remaining[p.itemId];
    if (x < 0) {
      if (commit) { box.remaining[p.itemId]--; }
      return p;
    }
  }
  return null;
}

function fresh(): KujiState {
  const pre = [17, 52, 3, 74, 38, 80];
  const boxes: KujiBox[] = Array.from({ length: KUJI_BOX_COUNT }, (_, i) => {
    const remaining: Record<string, number> = {};
    KUJI_PRIZES.forEach(p => remaining[p.itemId] = p.quantity);
    const box: KujiBox = { no: i + 1, remaining, log: [], lastOneBy: null };
    const take = Math.min(pre[i] ?? 0, KUJI_TICKETS);
    for (let j = 0; j < take; j++) {
      const p = drawFrom(box, true);
      if (p) { box.log.unshift({ user: pick(BOT_NAMES), itemId: p.itemId, tier: p.tier, at: Date.now() - randInt(1, 600) * 60000 }); }
    }
    if (take >= KUJI_TICKETS) { box.lastOneBy = pick(BOT_NAMES); }
    box.log = box.log.slice(0, 30);
    return box;
  });
  return { boxes, current: 0, lockBox: -1, lockUntil: 0 };
}

const load = (): KujiState => db.get<KujiState>(KEY) ?? fresh();
const save = (s: KujiState): KujiState => { db.set(KEY, s); return clone(s); };
const lockActive = (s: KujiState): boolean => s.lockBox === s.current && s.lockUntil > Date.now();

/** /api/games/kuji — Ichiban Kuji: six shared boxes with a fixed ticket pool each. */
export const kujiApi: GameApi = {
  id: 'kuji',
  base: 'kuji',
  routes: {
    'GET state': () => save(load()),

    /** body { index } */
    'POST select': ({ body }) => {
      const s = load();
      const i = Number(body?.index);
      if (!Number.isInteger(i) || !s.boxes[i]) { throw bad('badBox'); }
      s.current = i;
      return save(s);
    },

    /** body { count: 1 | 5 | 10 | 'all', trial?: boolean } */
    'POST pull': ({ acct, body }): KujiPullResult => {
      const s = load();
      const box = s.boxes[s.current];
      const rem = kujiRemaining(box);
      if (!rem) { throw bad('kujiSoldOut'); }
      const trial = !!body?.trial;
      const count: number | 'all' = body?.count === 'all' ? 'all' : Number(body?.count);
      if (!trial && count !== 'all' && ![1, 5, 10].includes(count)) { throw bad('badCount'); }
      const n = trial ? 1 : count === 'all' ? rem : Math.min(count, rem);

      if (trial) {
        const p = drawFrom(clone(box), false);
        return { pulls: p ? [{ itemId: p.itemId, tier: p.tier }] : [], uids: [], lastOne: false, state: clone(s) };
      }

      const cost = kujiCost(count === 'all' ? 'all' : n, rem);
      acct.charge(cost);
      const pulls: KujiPullView[] = [];
      for (let i = 0; i < n; i++) {
        const p = drawFrom(box, true);
        if (p) { pulls.push({ itemId: p.itemId, tier: p.tier }); }
      }
      const now = Date.now();
      pulls.forEach(p => box.log.unshift({ user: 'me', itemId: p.itemId, tier: p.tier, at: now, me: true }));
      let lastOne = false;
      if (kujiRemaining(box) === 0) {
        lastOne = true;
        box.lastOneBy = 'me';
        box.log.unshift({ user: 'me', itemId: KUJI_LAST_ONE, tier: 'LAST', at: now, me: true });
        pulls.push({ itemId: KUJI_LAST_ONE, tier: 'LAST' });
      }
      box.log = box.log.slice(0, 40);
      s.lockBox = s.current;
      s.lockUntil = now + LOCK_MS;

      const uids = pulls.map(p => acct.grant(p.itemId, 'kuji', p.tier));
      acct.gainXp(cost);
      acct.track('games');
      if (pulls.some(p => isRareTier(p.tier))) { acct.track('wins'); }
      return { pulls, uids, lastOne, state: save(s) };
    },

    /** Simulated collectors pull from other boxes (never the one locked to you). */
    'POST tick': (): KujiTickResult => {
      const s = load();
      const candidates = s.boxes.filter((b, i) =>
        kujiRemaining(b) > (i === s.current ? 10 : 2) && !(i === s.current && lockActive(s)));
      if (!candidates.length) { return { state: clone(s), pull: null, current: false }; }
      const box = pick(candidates);
      const p = drawFrom(box, true);
      if (!p) { return { state: clone(s), pull: null, current: false }; }
      box.log.unshift({ user: pick(BOT_NAMES), itemId: p.itemId, tier: p.tier, at: Date.now() });
      box.log = box.log.slice(0, 40);
      const current = s.boxes[s.current] === box;
      return { state: save(s), pull: { itemId: p.itemId, tier: p.tier }, current };
    }
  }
};
