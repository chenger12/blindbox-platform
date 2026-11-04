import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BlindBoxSlot, BlindBoxState } from '../../models/game/game-state.model';
import { BLIND_BOX_POOL, BLIND_BOX_SECRET, BOT_NAMES } from '../../utils/catalog.data';
import { CHARACTERS } from '../../utils/char-art.util';
import { pick, randInt, shuffle } from '../../utils/random.util';
import { CatalogService } from '../catalog/catalog.service';
import { StorageService } from '../storage/storage.service';

const KEY = 'mb_blind_box';
export const EAR_GROUP: Record<string, string> = { cat: 'pointy', bear: 'round', bunny: 'long', uni: 'long', ghost: 'none', frog: 'none', chick: 'none' };

@Injectable({ providedIn: 'root' })
export class BlindBoxService {
  readonly styles = [...BLIND_BOX_POOL, BLIND_BOX_SECRET];
  private readonly subject: BehaviorSubject<BlindBoxState>;
  readonly state$;

  constructor(private readonly storage: StorageService, private readonly catalog: CatalogService) {
    this.subject = new BehaviorSubject<BlindBoxState>(this.storage.get<BlindBoxState>(KEY) ?? this.makeCase(0));
    this.state$ = this.subject.asObservable();
  }

  get state(): BlindBoxState { return this.subject.value; }

  remaining(): number {
    return this.state.slots.filter(s => !s.sold).length;
  }

  newCase(): void {
    this.save(this.makeCase(this.state.caseNo));
  }

  select(i: number): void {
    this.save({ ...this.state, selected: i });
  }

  possible(i: number): string[] {
    const slot = this.state.slots[i];
    if (!slot) { return []; }
    if (slot.xray) { return [slot.itemId]; }
    const sold = new Set(this.state.slots.filter(x => x.sold).map(x => x.itemId));
    return this.styles.filter(id => !sold.has(id) && !slot.excluded.includes(id));
  }

  /** Rules out one wrong style. Returns the excluded item or null when nothing is left to exclude. */
  hint(i: number): string | null {
    const s = structuredClone(this.state);
    const slot = s.slots[i];
    const cand = this.possible(i).filter(id => id !== slot.itemId);
    if (!cand.length) { return null; }
    const x = pick(cand);
    slot.excluded.push(x);
    slot.log.unshift({ key: 'blindBox.log.hint', itemId: x });
    this.save(s);
    return x;
  }

  xray(i: number): string {
    const s = structuredClone(this.state);
    const slot = s.slots[i];
    slot.xray = true;
    slot.log.unshift({ key: slot.itemId === BLIND_BOX_SECRET ? 'blindBox.log.xraySecret' : 'blindBox.log.xray', itemId: slot.itemId });
    this.save(s);
    return slot.itemId;
  }

  shake(i: number): string {
    const s = structuredClone(this.state);
    const slot = s.slots[i];
    slot.shaken = true;
    const ear = this.earOf(slot.itemId);
    this.styles.forEach(id => { if (this.earOf(id) !== ear && !slot.excluded.includes(id)) { slot.excluded.push(id); } });
    slot.log.unshift({ key: slot.itemId === BLIND_BOX_SECRET ? 'blindBox.log.shakeGlow' : 'blindBox.log.shake', ear });
    this.save(s);
    return ear;
  }

  buy(indices: number[]): string[] {
    const s = structuredClone(this.state);
    const got: string[] = [];
    indices.forEach(i => { const slot = s.slots[i]; if (slot && !slot.sold) { slot.sold = 1; got.push(slot.itemId); } });
    s.selected = -1;
    this.save(s);
    return got;
  }

  botBuy(): { user: string; index: number; itemId: string } | null {
    const s = structuredClone(this.state);
    const open = s.slots.map((x, i) => i).filter(i => !s.slots[i].sold && i !== s.selected);
    if (open.length <= 2) { return null; }
    const index = pick(open);
    const user = pick(BOT_NAMES);
    s.slots[index].sold = 2;
    s.slots[index].by = user;
    this.save(s);
    return { user, index, itemId: s.slots[index].itemId };
  }

  earOf(itemId: string): string {
    return EAR_GROUP[CHARACTERS[this.catalog.item(itemId).charId].kind];
  }

  private makeCase(prevNo: number): BlindBoxState {
    const ids = shuffle(BLIND_BOX_POOL);
    if (Math.random() < 0.3) { ids[randInt(0, ids.length - 1)] = BLIND_BOX_SECRET; }
    const slots: BlindBoxSlot[] = ids.map(itemId => ({ itemId, sold: 0, excluded: [], xray: false, shaken: false, log: [] }));
    for (let i = 0, n = randInt(1, 3); i < n; i++) {
      const free = slots.filter(x => !x.sold);
      const slot = pick(free);
      slot.sold = 2;
      slot.by = pick(BOT_NAMES);
    }
    return { caseNo: prevNo + 1, slots, selected: -1 };
  }

  private save(s: BlindBoxState): void {
    this.storage.set(KEY, s);
    this.subject.next(s);
  }
}
