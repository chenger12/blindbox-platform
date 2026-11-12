import { BlindBoxActionResult, BlindBoxBuyResult } from '../../models/api/api.model';
import { BlindBoxSlot, BlindBoxState } from '../../models/game/game-state.model';
import { BLIND_BOX_POOL, BLIND_BOX_SECRET, BOT_NAMES } from '../../utils/catalog.data';
import { CHARACTERS } from '../../utils/char-art.util';
import { BLIND_BOX_HINT_PRICE as HINT_PRICE, BLIND_BOX_XRAY_PRICE as XRAY_PRICE, blindBoxCaseCost, itemDef } from '../../utils/game-rules.util';
import { pick, randInt, shuffle } from '../../utils/random.util';
import { Account, bad, clone, db, GameApi, gameOdds } from '../core';

const KEY = 'mb_blind_box';
const STYLES = [...BLIND_BOX_POOL, BLIND_BOX_SECRET];
const EAR_GROUP: Record<string, string> = { cat: 'pointy', bear: 'round', bunny: 'long', uni: 'long', ghost: 'none', frog: 'none', chick: 'none' };
const earOf = (itemId: string): string => EAR_GROUP[CHARACTERS[itemDef(itemId).charId].kind];

function makeCase(prevNo: number): BlindBoxState {
  const slots: BlindBoxSlot[] = shuffle(BLIND_BOX_POOL).map(itemId => ({ itemId, sold: 0, excluded: [], xray: false, shaken: false, log: [] }));
  // Bots grab a few boxes first...
  for (let i = 0, n = randInt(1, 3); i < n; i++) {
    const slot = pick(slots.filter(x => !x.sold));
    slot.sold = 2;
    slot.by = pick(BOT_NAMES);
  }
  // ...then the secret is placed only into a box still open to the player, so the configured
  // chance is the chance the player can actually reach it (display == experience).
  if (Math.random() < (gameOdds('blindBox').secretChance ?? 0.3)) {
    const open = slots.filter(x => !x.sold);
    if (open.length) { pick(open).itemId = BLIND_BOX_SECRET; }
  }
  return { caseNo: prevNo + 1, slots, selected: -1 };
}

const remaining = (s: BlindBoxState): number => s.slots.filter(x => !x.sold).length;

function load(): BlindBoxState {
  const s = db.get<BlindBoxState>(KEY);
  return !s ? makeCase(0) : remaining(s) ? s : makeCase(s.caseNo);
}

/** What the player may see: an unopened box's content stays on the server unless x-rayed. */
function view(s: BlindBoxState): BlindBoxState {
  db.set(KEY, s);
  const v = clone(s);
  v.slots.forEach(x => { if (!x.sold && !x.xray) { x.itemId = ''; } });
  return v;
}

function openSlot(s: BlindBoxState, body: { index?: unknown }): BlindBoxSlot {
  const slot = s.slots[Number(body?.index)];
  if (!slot || slot.sold) { throw bad('slotTaken'); }
  return slot;
}

function candidates(s: BlindBoxState, slot: BlindBoxSlot): string[] {
  const sold = new Set(s.slots.filter(x => x.sold).map(x => x.itemId));
  return STYLES.filter(id => !sold.has(id) && !slot.excluded.includes(id));
}

/** Pays one card if the player has it, otherwise the coin price. */
function payCardOrCoins(acct: Account, card: 'hintCards' | 'xrayCards', price: number): void {
  if (!acct.payWithCard(card)) { acct.charge(price); }
}

/** /api/games/blind-box — a shared case of 12 blind boxes with hint / x-ray / shake tools. */
export const blindBoxApi: GameApi = {
  id: 'blindBox',
  base: 'blind-box',
  routes: {
    'GET state': () => view(load()),

    /** body { index } */
    'POST select': ({ body }) => {
      const s = load();
      openSlot(s, body);
      s.selected = Number(body.index);
      return view(s);
    },

    /** Rules out one wrong style. body { index } */
    'POST hint': ({ acct, body }): BlindBoxActionResult<string> => {
      const s = load();
      const slot = openSlot(s, body);
      const wrong = candidates(s, slot).filter(id => id !== slot.itemId);
      if (slot.xray || !wrong.length) { throw bad('onlyOne'); }
      payCardOrCoins(acct, 'hintCards', HINT_PRICE);
      const x = pick(wrong);
      slot.excluded.push(x);
      slot.log.unshift({ key: 'blindBox.log.hint', itemId: x });
      return { state: view(s), value: x };
    },

    /** Reveals the box. body { index } */
    'POST xray': ({ acct, body }): BlindBoxActionResult<string> => {
      const s = load();
      const slot = openSlot(s, body);
      if (slot.xray) { throw bad('alreadyXrayed'); }
      payCardOrCoins(acct, 'xrayCards', XRAY_PRICE);
      slot.xray = true;
      slot.log.unshift({ key: slot.itemId === BLIND_BOX_SECRET ? 'blindBox.log.xraySecret' : 'blindBox.log.xray', itemId: slot.itemId });
      return { state: view(s), value: slot.itemId };
    },

    /** Free: tells the ear shape, ruling out styles with other ears. body { index } */
    'POST shake': ({ body }): BlindBoxActionResult<string> => {
      const s = load();
      const slot = openSlot(s, body);
      slot.shaken = true;
      const ear = earOf(slot.itemId);
      STYLES.forEach(id => { if (earOf(id) !== ear && !slot.excluded.includes(id)) { slot.excluded.push(id); } });
      slot.log.unshift({ key: slot.itemId === BLIND_BOX_SECRET ? 'blindBox.log.shakeGlow' : 'blindBox.log.shake', ear });
      return { state: view(s), value: ear };
    },

    /** body { index } for one box, or { all: true } for the rest of the case (10% off). */
    'POST buy': ({ acct, body }): BlindBoxBuyResult => {
      const s = load();
      const idx = body?.all ? s.slots.map((_, i) => i).filter(i => !s.slots[i].sold) : [Number(body?.index)];
      idx.forEach(i => openSlot(s, { index: i }));
      const cost = blindBoxCaseCost(idx.length);
      acct.charge(cost);
      const items = idx.map(i => {
        const slot = s.slots[i];
        slot.sold = 1;
        const tier = slot.itemId === BLIND_BOX_SECRET ? 'SECRET' : undefined;
        return { itemId: slot.itemId, tier, uid: acct.grant(slot.itemId, 'blindBox', tier) };
      });
      s.selected = -1;
      acct.gainXp(cost);
      acct.track('games');
      if (items.some(x => x.itemId === BLIND_BOX_SECRET)) { acct.track('wins'); }
      return { state: view(s), items };
    },

    'POST new-case': () => view(makeCase(load().caseNo)),

    /** Simulated shoppers occasionally buy a box (never the one you are looking at). */
    'POST tick': () => {
      const s = load();
      const open = s.slots.map((_, i) => i).filter(i => !s.slots[i].sold && i !== s.selected);
      if (open.length > 2 && Math.random() < 0.5) {
        const i = pick(open);
        s.slots[i].sold = 2;
        s.slots[i].by = pick(BOT_NAMES);
      }
      return view(s);
    }
  }
};
