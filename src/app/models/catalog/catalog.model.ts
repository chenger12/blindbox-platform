export type CharKind = 'cat' | 'bear' | 'bunny' | 'uni' | 'frog' | 'chick' | 'ghost';
export type EyeKind = 'dot' | 'line' | 'shine';
export type Accessory = 'none' | 'crown' | 'bow' | 'moon' | 'star' | 'leaf' | 'cherry';
export type PrizeForm = 'plush' | 'figure' | 'deluxe' | 'stand' | 'badge' | 'sticker' | 'pajama' | 'plain';
export type RarityKey = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type KujiTier = 'A' | 'B' | 'C' | 'D' | 'E' | 'LAST';
export type GachaTier = 'N' | 'R' | 'SR' | 'SECRET';

export interface CharacterDef {
  id: string;
  kind: CharKind;
  body: string;
  shade: string;
  eyes: EyeKind;
  accessory: Accessory;
}

export interface ItemDef {
  id: string;
  charId: string;
  form: PrizeForm;
  value: number;
  label?: string;
  tier?: KujiTier | GachaTier | 'REGULAR' | 'CLAW';
}

export interface BoxDef {
  id: string;
  price: number;
  colorA: string;
  colorB: string;
  tag: 'none' | 'new' | 'hot' | 'high';
  categories: Array<'budget' | 'plush' | 'figures' | 'high'>;
  itemIds: string[];
}

export interface WeightedBox extends BoxDef {
  weights: Array<{ itemId: string; weight: number }>;
  totalWeight: number;
  topItemIds: string[];
  maxValue: number;
}

export interface KujiPrize {
  itemId: string;
  tier: KujiTier;
  quantity: number;
}

export interface GachaEntry {
  itemId: string;
  tier: GachaTier;
  weight: number;
}
