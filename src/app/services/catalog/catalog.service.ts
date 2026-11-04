import { Injectable } from '@angular/core';
import { BoxDef, ItemDef, RarityKey, WeightedBox } from '../../models/catalog/catalog.model';
import { BOX_RTP, BOXES, ITEMS } from '../../utils/catalog.data';
import { I18nService } from '../i18n/i18n.service';

export const RARITIES: Array<{ key: RarityKey; max: number }> = [
  { key: 'common', max: 15 }, { key: 'uncommon', max: 40 }, { key: 'rare', max: 100 },
  { key: 'epic', max: 400 }, { key: 'legendary', max: 1000 }, { key: 'mythic', max: Number.MAX_SAFE_INTEGER }
];

@Injectable({ providedIn: 'root' })
export class CatalogService {
  readonly items = new Map<string, ItemDef>(ITEMS.map(i => [i.id, i]));
  readonly boxes: WeightedBox[] = BOXES.map(b => this.weigh(b));

  constructor(private readonly i18n: I18nService) {}

  item(id: string): ItemDef {
    return this.items.get(id) ?? ITEMS[0];
  }

  box(id: string): WeightedBox | undefined {
    return this.boxes.find(b => b.id === id);
  }

  name(id: string): string {
    const it = this.item(id);
    const char = this.i18n.t('char.' + it.charId);
    return this.i18n.t(it.label ?? 'form.' + it.form, { char });
  }

  charName(charId: string): string {
    return this.i18n.t('char.' + charId);
  }

  rarity(value: number): RarityKey {
    return (RARITIES.find(r => value < r.max) ?? RARITIES[0]).key;
  }

  rarityIndex(value: number): number {
    return RARITIES.findIndex(r => value < r.max);
  }

  roll(box: WeightedBox): ItemDef {
    let x = Math.random() * box.totalWeight;
    for (const w of box.weights) {
      x -= w.weight;
      if (x < 0) { return this.item(w.itemId); }
    }
    return this.item(box.weights[0].itemId);
  }

  expectedValue(box: WeightedBox): number {
    return box.weights.reduce((s, w) => s + this.item(w.itemId).value * w.weight, 0) / box.totalWeight;
  }

  odds(box: WeightedBox, itemId: string): number {
    return (box.weights.find(w => w.itemId === itemId)?.weight ?? 0) / box.totalWeight;
  }

  /** Solves weights w = value^-a so the box returns BOX_RTP of its price on average. */
  private weigh(b: BoxDef): WeightedBox {
    const values = b.itemIds.map(id => this.item(id).value);
    const target = b.price * BOX_RTP;
    let lo = 0;
    let hi = 12;
    for (let k = 0; k < 60; k++) {
      const a = (lo + hi) / 2;
      let sw = 0;
      let sv = 0;
      values.forEach(v => { const w = Math.pow(v, -a); sw += w; sv += w * v; });
      if (sv / sw > target) { lo = a; } else { hi = a; }
    }
    const a = (lo + hi) / 2;
    const weights = b.itemIds.map(id => ({ itemId: id, weight: Math.pow(this.item(id).value, -a) }));
    const topItemIds = [...b.itemIds].sort((x, y) => this.item(y).value - this.item(x).value);
    return {
      ...b, weights,
      totalWeight: weights.reduce((s, w) => s + w.weight, 0),
      topItemIds,
      maxValue: this.item(topItemIds[0]).value
    };
  }
}
