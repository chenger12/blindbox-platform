import { BoxOpenResult } from '../../models/api/api.model';
import { rollBox, weightedBoxAt } from '../../utils/game-rules.util';
import { bad, GameApi, gameOdds, notFound } from '../core';

const STARTER = 'starter';
/** Mystery boxes are re-weighted to the back-office return rate. */
const tunedBox = (id: string) => weightedBoxAt(id, gameOdds('boxes').returnRate);

/** /api/games/boxes — mystery boxes. */
export const boxesApi: GameApi = {
  id: 'boxes',
  base: 'boxes',
  routes: {
    /** body { boxId, count: 1-4, free?: boolean } */
    'POST open': ({ acct, body }): BoxOpenResult => {
      const box = tunedBox(String(body?.boxId));
      if (!box) { throw notFound('boxNotFound'); }
      const free = !!body?.free;
      const n = free ? 1 : Math.min(4, Math.max(1, Math.floor(Number(body?.count) || 1)));
      let cost = 0;
      if (free) {
        const d = acct.daily;
        if (box.id !== STARTER || !d.freeBoxClaimed || d.freeBoxOpened) { throw bad('noFreeBox'); }
        d.freeBoxOpened = true;
      } else {
        cost = box.price * n;
        acct.charge(cost);
      }
      const items = Array.from({ length: n }, () => rollBox(box)).map(itemId => ({ itemId, uid: acct.grant(itemId, 'box') }));
      acct.gainXp(cost);
      acct.track('opened', n);
      return { items };
    },
    /** Free demo spin: shows a real roll, grants nothing. body { boxId } */
    'POST demo': ({ body }): BoxOpenResult => {
      const box = tunedBox(String(body?.boxId));
      if (!box) { throw notFound('boxNotFound'); }
      return { items: [{ itemId: rollBox(box) }] };
    }
  }
};
