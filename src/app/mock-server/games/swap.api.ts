import { SwapEvent, SwapResult, SwapStateView } from '../../models/api/api.model';
import { SwapDeal, SwapPost } from '../../models/market/market.model';
import { BOT_NAMES, ITEMS } from '../../utils/catalog.data';
import { itemDef, itemValue, SWAP_POST_FEE } from '../../utils/game-rules.util';
import { pick, randInt, uid } from '../../utils/random.util';
import { Account, bad, clone, db, GameApi, notFound } from '../core';

const KEY = 'mb_swap';
const NOTE_KEYS = Array.from({ length: 10 }, (_, i) => `swap.note${i + 1}`);

function botPost(at = Date.now()): SwapPost {
  const pool = ITEMS.filter(x => x.value < 900 || Math.random() < 0.12);
  const give: string[] = [];
  const n = randInt(1, 3);
  while (give.length < n) { const it = pick(pool).id; if (!give.includes(it)) { give.push(it); } }
  const want = Math.random() < 0.35 ? [] : [pick(pool.filter(x => !give.includes(x.id))).id];
  return { id: uid('p'), author: pick(BOT_NAMES), noteKey: pick(NOTE_KEYS), give, want, interested: randInt(0, 12), status: 'open', createdAt: at, offers: [] };
}

function botDeal(at = Date.now()): SwapDeal {
  const a = pick(ITEMS.filter(x => x.value <= 300));
  const bs = ITEMS.filter(x => x.id !== a.id && x.value >= a.value * 0.6 && x.value <= a.value * 1.6);
  return { a: pick(BOT_NAMES), b: pick(BOT_NAMES), itemA: a.id, itemB: pick(bs.length ? bs : ITEMS).id, createdAt: at };
}

function load(): SwapStateView {
  return db.get<SwapStateView>(KEY) ?? {
    posts: Array.from({ length: 12 }, () => botPost(Date.now() - randInt(3, 1800) * 60000)).sort((a, b) => b.createdAt - a.createdAt),
    deals: Array.from({ length: 10 }, () => botDeal(Date.now() - randInt(5, 2000) * 60000)).sort((a, b) => b.createdAt - a.createdAt),
    blocked: [],
    rulesRead: false
  };
}

const done = (s: SwapStateView, events: SwapEvent[] = [], item?: SwapResult['item']): SwapResult => {
  db.set(KEY, s);
  return { state: clone(s), events, item };
};

function post(s: SwapStateView, id: unknown): SwapPost {
  const p = s.posts.find(x => x.id === id);
  if (!p) { throw notFound('postGone'); }
  return p;
}

/** A simulated collector answers your pending offer on their post. */
function resolveOffer(s: SwapStateView, acct: Account, p: SwapPost): SwapEvent | null {
  const m = p.myOffer;
  if (!m || m.status !== 'pending') { return null; }
  const owned = m.uids.every(u => acct.entry(u));
  const sum = m.itemIds.reduce((a, id) => a + itemValue(id), 0);
  const want = itemValue(m.want);
  const chance = sum >= want * 0.8 ? 0.8 : sum >= want * 0.4 ? 0.35 : 0.08;
  if (owned && p.give.includes(m.want) && Math.random() < chance) {
    m.status = 'accepted';
    acct.removeItems(m.uids);
    const got = { itemId: m.want, uid: acct.grant(m.want, 'swap') };
    p.give = p.give.filter(id => id !== m.want);
    if (!p.give.length) { p.status = 'done'; }
    s.deals = [{ a: 'me', b: p.author, itemA: m.itemIds[0], itemB: m.want, createdAt: Date.now() }, ...s.deals].slice(0, 40);
    return { type: 'accepted', user: p.author, item: got };
  }
  m.status = 'declined';
  acct.lock(m.uids, null);
  return { type: 'declined', user: p.author };
}

/** A simulated collector makes an offer on one of your open posts. */
function botOffer(s: SwapStateView): SwapEvent | null {
  const mine = s.posts.filter(p => p.mine && p.status === 'open' && p.give.length && p.offers.filter(o => o.status === 'pending').length < 3);
  if (!mine.length) { return null; }
  const p = pick(mine);
  const ti = randInt(0, p.give.length - 1);
  const target = p.give[ti];
  const tv = itemValue(target);
  let cand = p.want.length && Math.random() < 0.6 ? p.want : ITEMS.filter(x => x.id !== target && x.value >= tv * 0.6 && x.value <= tv * 1.8).map(x => x.id);
  if (!cand.length) { cand = ITEMS.filter(x => x.value <= tv * 2 && x.id !== target).map(x => x.id); }
  const itemId = pick(cand);
  const from = pick(BOT_NAMES);
  p.offers.unshift({ id: uid('o'), from, itemId, targetItemId: target, targetUid: p.giveUids?.[ti], status: 'pending', createdAt: Date.now() });
  p.interested++;
  return { type: 'offer', user: from, itemId, target };
}

/** /api/games/swap — item-for-item trading board. */
export const swapApi: GameApi = {
  id: 'swap',
  base: 'swap',
  routes: {
    'GET state': () => done(load()),

    'POST rules-read': () => { const s = load(); s.rulesRead = true; return done(s); },

    /** body { user } */
    'POST block': ({ body }) => {
      const s = load();
      const user = String(body?.user ?? '');
      if (user && !s.blocked.includes(user)) { s.blocked.push(user); }
      return done(s);
    },

    'POST refresh': () => {
      const s = load();
      s.posts = [...Array.from({ length: randInt(1, 3) }, () => botPost()), ...s.posts].slice(0, 40);
      return done(s);
    },

    /** Costs a swap ticket, or SWAP_POST_FEE coins. body { uids, want: itemId[], note } */
    'POST create-post': ({ acct, body }) => {
      const s = load();
      const entries = acct.requireFree(Array.isArray(body?.uids) ? body.uids.map(Number) : []);
      const want: string[] = (Array.isArray(body?.want) ? body.want.map(String) : []).filter((id: string) => itemDef(id).id === id);
      if (!acct.payWithCard('swapTickets')) { acct.charge(SWAP_POST_FEE); }
      const note = String(body?.note ?? '').slice(0, 140);
      acct.lock(entries.map(e => e.uid), 'swap');
      s.posts = [{
        id: uid('m'), author: 'me', mine: true, note: note || undefined, noteKey: note ? undefined : 'swap.noteDefault',
        give: entries.map(e => e.itemId), giveUids: entries.map(e => e.uid), want, interested: 0, status: 'open', createdAt: Date.now(), offers: []
      }, ...s.posts];
      return done(s);
    },

    /** body { postId, want: itemId, uids } */
    'POST make-offer': ({ acct, body }) => {
      const s = load();
      const p = post(s, body?.postId);
      if (p.mine || p.status !== 'open' || p.myOffer?.status === 'pending' || !p.give.includes(String(body?.want))) { throw bad('cannotOffer'); }
      const entries = acct.requireFree(Array.isArray(body?.uids) ? body.uids.map(Number) : []);
      p.myOffer = { want: String(body.want), uids: entries.map(e => e.uid), itemIds: entries.map(e => e.itemId), status: 'pending' };
      p.interested++;
      acct.lock(p.myOffer.uids, 'swap');
      return done(s);
    },

    /** body { postId, index } */
    'POST accept-offer': ({ acct, body }) => {
      const s = load();
      const p = post(s, body?.postId);
      const o = p.mine ? p.offers[Number(body?.index)] : undefined;
      if (!o || o.status !== 'pending') { throw bad('offerGone'); }
      if (o.targetUid === undefined || !acct.entry(o.targetUid)) { o.status = 'void'; db.set(KEY, s); throw bad('offerGone'); }
      o.status = 'accepted';
      acct.removeItems([o.targetUid]);
      const gi = p.giveUids?.indexOf(o.targetUid) ?? -1;
      if (gi >= 0) { p.giveUids?.splice(gi, 1); p.give.splice(gi, 1); }
      p.offers.forEach(x => { if (x !== o && x.status === 'pending' && x.targetUid === o.targetUid) { x.status = 'void'; } });
      if (!p.give.length) { p.status = 'done'; }
      const item = { itemId: o.itemId, uid: acct.grant(o.itemId, 'swap') };
      s.deals = [{ a: o.from, b: 'me', itemA: o.itemId, itemB: o.targetItemId, createdAt: Date.now() }, ...s.deals].slice(0, 40);
      return done(s, [], item);
    },

    /** body { postId, index } */
    'POST decline-offer': ({ body }) => {
      const s = load();
      const o = post(s, body?.postId).offers[Number(body?.index)];
      if (o && o.status === 'pending') { o.status = 'declined'; }
      return done(s);
    },

    /** body { postId } */
    'POST unlist': ({ acct, body }) => {
      const s = load();
      const p = post(s, body?.postId);
      if (!p.mine) { throw bad('notYours'); }
      p.status = 'unlisted';
      p.offers.forEach(o => { if (o.status === 'pending') { o.status = 'void'; } });
      acct.lock(p.giveUids ?? [], null);
      return done(s);
    },

    /**
     * Background activity. body { kind: 'resolve' | 'offer' | 'activity' }
     * resolve — collectors answer your pending offers; offer — a collector offers on your post;
     * activity — new posts and deals appear on the board.
     */
    'POST tick': ({ acct, body }) => {
      const s = load();
      const events: SwapEvent[] = [];
      if (body?.kind === 'resolve') {
        s.posts.filter(p => p.myOffer?.status === 'pending').forEach(p => { const e = resolveOffer(s, acct, p); if (e) { events.push(e); } });
      } else if (body?.kind === 'offer') {
        const e = botOffer(s);
        if (e) { events.push(e); }
      } else {
        s.posts = [botPost(), ...s.posts].slice(0, 40);
        if (Math.random() < 0.5) { s.deals = [botDeal(), ...s.deals].slice(0, 40); }
      }
      return done(s, events);
    }
  }
};
