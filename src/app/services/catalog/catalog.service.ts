import { Injectable } from '@angular/core';
import { ItemDef, RarityKey, WeightedBox } from '../../models/catalog/catalog.model';
import { ITEMS } from '../../utils/catalog.data';
import { rollBox, WEIGHTED_BOXES } from '../../utils/game-rules.util';
import { I18nService } from '../i18n/i18n.service';

export const RARITIES: Array<{ key: RarityKey; max: number }> = [
  { key: 'common', max: 15 }, { key: 'uncommon', max: 40 }, { key: 'rare', max: 100 },
  { key: 'epic', max: 400 }, { key: 'legendary', max: 1000 }, { key: 'mythic', max: Number.MAX_SAFE_INTEGER }
];

@Injectable({ providedIn: 'root' })
export class CatalogService {
  readonly items = new Map<string, ItemDef>(ITEMS.map(i => [i.id, i]));
  readonly boxes: WeightedBox[] = WEIGHTED_BOXES;

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
    return this.item(rollBox(box));
  }

  expectedValue(box: WeightedBox): number {
    return box.weights.reduce((s, w) => s + this.item(w.itemId).value * w.weight, 0) / box.totalWeight;
  }

  odds(box: WeightedBox, itemId: string): number {
    return (box.weights.find(w => w.itemId === itemId)?.weight ?? 0) / box.totalWeight;
  }
}
