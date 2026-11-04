import { BoxDef, GachaEntry, ItemDef, KujiPrize, PrizeForm } from '../models/catalog/catalog.model';

/** The 12 regular characters (Prism `uni` is the secret). */
export const K12 = ['gua', 'bu', 'mint', 'coco', 'lan', 'ying', 'ju', 'yun', 'cao', 'bo', 'ye', 'jin'];

const items: ItemDef[] = [];
const add = (id: string, charId: string, form: PrizeForm, value: number, label?: string): void => {
  items.push({ id, charId, form, value, label });
};
K12.forEach(k => {
  add('st_' + k, k, 'sticker', 8);
  add('pn_' + k, k, 'badge', 18);
  add('mf_' + k, k, 'figure', 28);
  add('cm_' + k, k, 'plush', 35);
  add('pj_' + k, k, 'pajama', 45);
  add('as_' + k, k, 'stand', 60);
});
['ye', 'cao', 'bo', 'jin'].forEach(k => add('dx_' + k, k, 'deluxe', 220));
add('gp_jin', 'jin', 'badge', 150, 'item.goldPin');
add('jp_ye', 'ye', 'plush', 520, 'item.jumboPlush');
add('jp_jin', 'jin', 'plush', 750, 'item.jumboPlush');
add('sp_uni', 'uni', 'pajama', 900, 'item.pajamaSecret');
add('sc_uni', 'uni', 'deluxe', 1200, 'item.secretFigure');
add('lp_uni', 'uni', 'plush', 1800, 'item.limitedPlush');
add('bt_jin', 'jin', 'badge', 200, 'item.championPin');

export const ITEMS: ItemDef[] = items;

export const BOXES: BoxDef[] = [
  { id: 'starter', price: 12, colorA: '#7d8aa8', colorB: '#2c3550', tag: 'none', categories: ['budget'],
    itemIds: ['st_gua', 'st_bu', 'st_mint', 'st_coco', 'st_lan', 'st_ying', 'pn_gua', 'pn_bu', 'pn_lan', 'mf_yun', 'mf_bu', 'as_mint'] },
  { id: 'pins', price: 22, colorA: '#3d8bff', colorB: '#16357a', tag: 'none', categories: ['budget'],
    itemIds: [...K12.map(k => 'pn_' + k), 'st_jin', 'st_ye', 'as_ye', 'as_jin', 'gp_jin'] },
  { id: 'pajama', price: 39, colorA: '#7c6cff', colorB: '#2a2070', tag: 'new', categories: ['figures', 'budget'],
    itemIds: [...K12.map(k => 'pj_' + k), 'st_yun', 'st_bo', 'sp_uni'] },
  { id: 'plush', price: 49, colorA: '#ff6fa5', colorB: '#7a1f45', tag: 'hot', categories: ['plush'],
    itemIds: [...K12.map(k => 'cm_' + k), 'st_cao', 'st_ying', 'jp_ye', 'jp_jin'] },
  { id: 'party', price: 69, colorA: '#21c7a8', colorB: '#0d4f49', tag: 'none', categories: ['figures', 'plush'],
    itemIds: ['pn_jin', 'mf_gua', 'mf_bu', 'mf_mint', 'mf_coco', 'mf_lan', 'mf_ju', 'as_ye', 'as_cao', 'as_bo', 'dx_cao', 'dx_bo', 'jp_jin', 'lp_uni'] },
  { id: 'figure', price: 129, colorA: '#a855f7', colorB: '#34145f', tag: 'none', categories: ['figures'],
    itemIds: ['mf_ye', 'mf_cao', 'mf_bo', 'mf_jin', 'as_ye', 'as_jin', 'as_cao', 'dx_ye', 'dx_cao', 'dx_bo', 'dx_jin', 'sc_uni'] },
  { id: 'secret', price: 249, colorA: '#ff4d6d', colorB: '#5e0e1f', tag: 'hot', categories: ['high'],
    itemIds: ['as_ye', 'as_jin', 'dx_ye', 'dx_jin', 'gp_jin', 'jp_ye', 'jp_jin', 'sp_uni', 'sc_uni', 'lp_uni'] },
  { id: 'gold', price: 499, colorA: '#f5b400', colorB: '#5e4100', tag: 'high', categories: ['high'],
    itemIds: ['gp_jin', 'dx_jin', 'dx_ye', 'jp_ye', 'jp_jin', 'sc_uni', 'lp_uni'] }
];

/** Return-to-player target used to solve each box's weights. */
export const BOX_RTP = 0.88;

/** Ichiban kuji: 80 tickets per box, every ticket wins. */
export const KUJI_PRIZES: KujiPrize[] = [
  { itemId: 'jp_jin', tier: 'A', quantity: 2 },
  { itemId: 'dx_ye', tier: 'B', quantity: 1 },
  { itemId: 'dx_cao', tier: 'B', quantity: 1 },
  { itemId: 'dx_bo', tier: 'B', quantity: 1 },
  { itemId: 'as_gua', tier: 'C', quantity: 3 },
  { itemId: 'as_bu', tier: 'C', quantity: 3 },
  { itemId: 'as_mint', tier: 'C', quantity: 3 },
  ...['ye', 'cao', 'bo', 'coco', 'lan', 'ju'].map(k => ({ itemId: 'pn_' + k, tier: 'D' as const, quantity: 4 })),
  ...['gua', 'bu', 'mint', 'ying', 'yun', 'coco'].map(k => ({ itemId: 'st_' + k, tier: 'E' as const, quantity: 7 }))
];
export const KUJI_LAST_ONE = 'lp_uni';
export const KUJI_TICKETS = KUJI_PRIZES.reduce((s, p) => s + p.quantity, 0);
export const KUJI_PRICE = 39;
export const KUJI_BOX_COUNT = 6;

export const GACHA_POOL: GachaEntry[] = [
  ...['gua', 'bu', 'mint', 'coco', 'lan', 'ying'].map(k => ({ itemId: 'mf_' + k, tier: 'N' as const, weight: 11.5 })),
  ...['ju', 'yun', 'cao', 'bo'].map(k => ({ itemId: 'mf_' + k, tier: 'R' as const, weight: 6.5 })),
  ...['ye', 'jin'].map(k => ({ itemId: 'mf_' + k, tier: 'SR' as const, weight: 2.25 })),
  { itemId: 'sc_uni', tier: 'SECRET', weight: 0.5 }
];
export const GACHA_PRICE = 29;
export const GACHA_PRICE_5 = 139;
export const GACHA_PITY = 30;

export const BLIND_BOX_POOL = [...K12.map(k => 'pj_' + k)];
export const BLIND_BOX_SECRET = 'sp_uni';
export const BLIND_BOX_PRICE = 35;

export const CLAW_CHARS = K12;
export const CLAW_PRICE = 30;
export const CLAW_PITY = 8;

export const GROUP_PULL_PRICE = 49;
export const GROUP_PULL_BONUS = 'bt_jin';

export const BOT_NAMES = ['luckyfox', 'kai_draws', 'momo.pulls', 'gachaqueen', 'nightowl22', 'pullordie', 'bobatea', 'leo.collects',
  'mintychip', 'zoe_xo', 'jackpotjay', 'sora.k', 'pixelpete', 'riri', 'dropdaddy', 'weekend.rips', 'ty_collects', 'hypebeastie', 'plushlord', 'ana.unboxes'];

export const PROMO_CODE = 'MENGBOX';
export const STARTING_COINS = 1000;
