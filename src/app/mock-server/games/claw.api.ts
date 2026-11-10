import { ClawFinishResult, ClawGrabResult, ClawStartResult, ClawStateView } from '../../models/api/api.model';
import { CLAW_CHARS, CLAW_PITY, CLAW_PRICE } from '../../utils/catalog.data';
import { uid } from '../../utils/random.util';
import { bad, db, GameApi } from '../core';

const KEY = 'mb_claw';
/** The claw's grip is decided here; the page only animates it. */
interface ClawPlay { id: string; strong: boolean; grabbed: boolean; canWin: boolean; }
interface ClawStore extends ClawStateView { play?: ClawPlay | null; }

const load = (): ClawStore => ({ pity: 0, plays: 0, ...(db.get<ClawStore>(KEY) ?? {}) });
const view = (s: ClawStore): ClawStateView => ({ pity: s.pity, plays: s.plays });

function current(s: ClawStore, playId: unknown): ClawPlay {
  if (!s.play || s.play.id !== playId) { throw bad('noPlay'); }
  return s.play;
}

/** /api/games/claw — claw machine: skill + a server-side grip roll, guaranteed grip after CLAW_PITY misses. */
export const clawApi: GameApi = {
  id: 'claw',
  base: 'claw',
  routes: {
    'GET state': () => view(load()),

    'POST start': ({ acct }): ClawStartResult => {
      const s = load();
      acct.charge(CLAW_PRICE);
      acct.track('games');
      s.plays++;
      s.play = { id: uid('c'), strong: s.pity >= CLAW_PITY, grabbed: false, canWin: false };
      db.set(KEY, s);
      return { playId: s.play.id, strong: s.play.strong, state: view(s) };
    },

    /** body { playId, align: 0..1 } — how well the claw is centred on the prize. */
    'POST grab': ({ body }): ClawGrabResult => {
      const s = load();
      const play = current(s, body?.playId);
      if (play.grabbed) { throw bad('alreadyGrabbed'); }
      const align = Math.max(0, Math.min(1, Number(body?.align) || 0));
      const grip = Math.random() < (play.strong ? 1 : 0.22 + 0.55 * align);
      const slip = grip && !play.strong && Math.random() < 0.4;
      play.grabbed = true;
      play.canWin = grip && !slip;
      db.set(KEY, s);
      return { grip, slip };
    },

    /** Ends the play. body { playId, prize: character key that reached the chute, or null } */
    'POST finish': ({ acct, body }): ClawFinishResult => {
      const s = load();
      const play = current(s, body?.playId);
      const k = String(body?.prize ?? '');
      const won = play.canWin && (k === 'jin' || CLAW_CHARS.includes(k));
      let item = null;
      if (won) {
        const itemId = 'cm_' + k;
        item = { itemId, tier: 'CLAW', uid: acct.grant(itemId, 'claw', 'CLAW') };
        s.pity = 0;
        acct.track('wins');
      } else {
        s.pity++;
      }
      s.play = null;
      db.set(KEY, s);
      return { won, item, state: view(s) };
    }
  }
};
