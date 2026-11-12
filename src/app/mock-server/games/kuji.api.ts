import { KujiPrize } from '../../models/catalog/catalog.model';
import { KujiPullResult, KujiPullView, KujiTickResult } from '../../models/api/api.model';
import { KujiBox, KujiState } from '../../models/game/game-state.model';
import { BOT_NAMES, KUJI_BOX_COUNT, KUJI_LAST_ONE, KUJI_PRIZES } from '../../utils/catalog.data';
import { KujiTier } from '../../models/catalog/catalog.model';
import { isRareTier, kujiCost } from '../../utils/game-rules.util';
import { pick, randInt } from '../../utils/random.util';
import { bad, clone, db, GameApi, gameOdds } from '../core';

const KEY = 'mb_kuji';
const LOCK_MS = 180000;

export const kujiRemaining = (box: KujiBox): number => Object.values(box.remaining).reduce((a, b) => a + b, 0);

/**
 * A fresh box's ticket counts per prize. Default quantities come from the catalog; the back
 * office can set a total per tier, which is spread as evenly as possible over that tier's prizes.
 */
function freshRemaining(): Record<string, number> {
  const remaining: Record<string, number> = {};
  KUJI_PRIZES.forEach(p => remaining[p.itemId] = p.quantity);
  const counts = gameOdds('kuji').tierCounts;
  if (!counts?.length) { return remaining; }
  for (const { key, weight } of counts) {
    const ids = KUJI_PRIZES.filter(p => p.tier === (key as KujiTier)).map(p => p.itemId);
    if (!ids.length) { continue; }
    const total = Math.max(0, Math.round(weight));
    const base = Math.floor(total / ids.length);
    let extra = total - base * ids.length;
    ids.forEach(id => { remaining[id] = base + (extra-- > 0 ? 1 : 0); });
  }
  return remaining;
}

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
  const total = Object.values(freshRemaining()).reduce((a, b) => a + b, 0);
  const boxes: KujiBox[] = Array.from({ length: KUJI_BOX_COUNT }, (_, i) => {
    const box: KujiBox = { no: i + 1, remaining: freshRemaining(), log: [], lastOneBy: null };
    const take = Math.min(pre[i] ?? 0, total);
    for (let j = 0; j < take; j++) {
      const p = drawFrom(box, true);
      if (p) { box.log.unshift({ user: pick(BOT_NAMES), itemId: p.itemId, tier: p.tier, at: Date.now() - randInt(1, 600) * 60000 }); }
    }
    if (take >= total) { box.lastOneBy = pick(BOT_NAMES); }
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
